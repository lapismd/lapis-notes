import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { sendDirectory } from "./validation/docker.mjs";

test("Docker context transport preserves nested sibling paths beyond USTAR limits", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "lapis-native-context-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const bin = join(root, "bin"),
    input = join(root, "input"),
    archive = join(root, "context.tar");
  await mkdir(bin);
  await mkdir(input);
  const relative =
    Array.from({ length: 5 }, (_, i) => `source-${i}-${"x".repeat(55)}`).join(
      "/",
    ) + "/contract.md";
  const file = join(input, relative);
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, "# Exact native context\n\nUnicode café 📝\n");
  const docker = join(bin, "docker");
  await writeFile(
    docker,
    `#!${process.execPath}\nconst fs=require('node:fs'); const out=fs.createWriteStream(process.env.LAPIS_TRANSFER_ARCHIVE); process.stdin.pipe(out);\n`,
  );
  await chmod(docker, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = bin + ":" + originalPath;
  process.env.LAPIS_TRANSFER_ARCHIVE = archive;
  try {
    await sendDirectory({}, ["build", "-"], input);
  } finally {
    process.env.PATH = originalPath;
    delete process.env.LAPIS_TRANSFER_ARCHIVE;
  }
  assert.deepEqual(
    execFileSync("tar", ["-xOf", archive, "./" + relative]),
    await readFile(file),
  );
});

test("an explicit SSH identity avoids ambient signing agents without changing remote commands", async () => {
  const { sshDockerCommand } = await import("./validation/docker.mjs");
  const { validationConfig } = await import("./validation/model.mjs");
  const file = "/private/identity with spaces";
  const config = validationConfig(
    {},
    { LAPIS_NOTES_VALIDATION_SSH_IDENTITY: file },
  );
  const [command, args] = sshDockerCommand(
    "ssh://owner@host.invalid",
    ["image", "inspect", "lapis-server:rust-local"],
    { identityFile: config.sshIdentityFile, multiplexing: false },
  );
  assert.equal(command, "ssh");
  assert.ok(args.includes("IdentityAgent=none"));
  assert.ok(args.includes("IdentitiesOnly=yes"));
  assert.equal(args[args.indexOf("-i") + 1], file);
  assert.equal(
    args.at(-1),
    "'docker' 'image' 'inspect' 'lapis-server:rust-local'",
  );
  assert.throws(
    () =>
      validationConfig({}, { LAPIS_NOTES_VALIDATION_SSH_IDENTITY: "relative" }),
    /absolute/u,
  );
  assert.throws(
    () =>
      validationConfig(
        {},
        { LAPIS_NOTES_VALIDATION_SSH_IDENTITY: "/unsafe\npath" },
      ),
    /absolute/u,
  );
  assert.equal(validationConfig({}, {}).sshIdentityFile, undefined);
});
