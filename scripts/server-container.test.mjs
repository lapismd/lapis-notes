import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  context,
  repositoryBuildContext,
} from "./server-container/context.mjs";
import { hash } from "./validation/model.mjs";

const jj = (root, args) =>
  execFileSync(
    "jj",
    ["--no-pager", "--config", "signing.behavior=drop", ...args],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  ).trim();

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "lapis-server-container-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = join(directory, "notes");
  await mkdir(join(root, "scripts/validation"), { recursive: true });
  await writeFile(
    join(root, ".gitignore"),
    ".local/\n.env\nnode_modules/\ntarget/\n",
  );
  await writeFile(join(root, "scripts/validation/native-sources.json"), "[]\n");
  const pkg = '{\n "name": "fixture", "private": true\n}\n';
  const lock = "lockfileVersion: '9.0'\n";
  await writeFile(join(root, "package.json"), pkg);
  await writeFile(join(root, "pnpm-lock.yaml"), lock);
  await writeFile(
    join(root, "pnpm-workspace.yaml"),
    'packages: []\noverrides:\n  retained: "2.0.0"\n',
  );
  jj(root, ["git", "init", "--colocate"]);
  return { directory, root, pkg, lock, output: join(directory, "context") };
}

async function archive(
  f,
  identity = { name: "@lapismd/fixture", version: "1.0.0" },
) {
  const folder = join(f.directory, "public/package");
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, "package.json"), JSON.stringify(identity));
  const path = join(f.directory, "public.tgz");
  execFileSync("tar", [
    "-czf",
    path,
    "-C",
    join(f.directory, "public"),
    "package",
  ]);
  return { ...identity, path, sha256: hash(await readFile(path)) };
}

async function manifest(f, entries) {
  const path = join(f.directory, "archives.json");
  await writeFile(path, JSON.stringify(entries));
  return path;
}

test("source context exports the exact tracked revision, keeps ignored data out and drops restored TARs", async (t) => {
  const f = await fixture(t);
  await mkdir(join(f.root, ".local"));
  await writeFile(join(f.root, ".local", "secret"), "private");
  await writeFile(join(f.root, "selected.txt"), "selected source bytes\n");
  const entry = await archive(f);
  const receipt = await context(f.root, f.output, await manifest(f, [entry]));
  assert.equal(
    receipt.source.revision,
    jj(f.root, ["log", "-r", "@", "--no-graph", "-T", "commit_id"]),
  );
  assert.equal(
    receipt.source.sha256,
    hash(
      execFileSync("git", [
        "--git-dir",
        jj(f.root, ["git", "root"]),
        "archive",
        "--format=tar",
        receipt.source.revision,
      ]),
    ),
  );
  assert.equal(
    await readFile(join(f.output, "lapis-notes/selected.txt"), "utf8"),
    "selected source bytes\n",
  );
  await assert.rejects(readFile(join(f.output, "lapis-notes/.local/secret")), {
    code: "ENOENT",
  });
  assert.deepEqual((await readdir(join(f.output, ".qualification"))).sort(), [
    "archives.json",
    "package-0.tgz",
  ]);
  assert.equal(
    hash(await readFile(join(f.output, ".qualification/package-0.tgz"))),
    entry.sha256,
  );
  assert.equal(await readFile(join(f.root, "package.json"), "utf8"), f.pkg);
  assert.equal(await readFile(join(f.root, "pnpm-lock.yaml"), "utf8"), f.lock);
});

test("source context restores the exact pinned sibling rather than its current working copy", async (t) => {
  const f = await fixture(t);
  const sibling = join(f.directory, "native");
  await mkdir(sibling);
  jj(sibling, ["git", "init", "--colocate"]);
  await writeFile(join(sibling, "native.txt"), "qualified\n");
  jj(sibling, ["commit", "-m", "Qualified fixture source"]);
  const revision = jj(sibling, [
    "log",
    "-r",
    "@-",
    "--no-graph",
    "-T",
    "commit_id",
  ]);
  await writeFile(join(sibling, "native.txt"), "unqualified working copy\n");
  const receipt = await context(f.root, f.output, undefined, {
    nativePins: [{ name: "native", revision }],
    sourceRoots: { native: sibling },
  });
  assert.equal(receipt.native.length, 1);
  assert.equal(receipt.native[0].revision, revision);
  assert.equal(
    await readFile(join(f.output, "native/native.txt"), "utf8"),
    "qualified\n",
  );
  assert.deepEqual(await readdir(join(f.output, ".qualification")), [
    "archives.json",
  ]);
});

test("source context refuses private data in an exact pinned sibling", async (t) => {
  const f = await fixture(t);
  const sibling = join(f.directory, "native");
  await mkdir(join(sibling, ".local"), { recursive: true });
  jj(sibling, ["git", "init", "--colocate"]);
  await writeFile(join(sibling, ".local/secret"), "private");
  jj(sibling, ["file", "track", "--include-ignored", "--", ".local/secret"]);
  const revision = jj(sibling, [
    "log",
    "-r",
    "@",
    "--no-graph",
    "-T",
    "commit_id",
  ]);
  await assert.rejects(
    context(f.root, f.output, undefined, {
      nativePins: [{ name: "native", revision }],
      sourceRoots: { native: sibling },
    }),
    /Private\/local files/u,
  );
});

for (const path of [
  ".local/token",
  ".env",
  "node_modules/private",
  "target/private",
]) {
  test(`source context refuses a tracked private root: ${path}`, async (t) => {
    const f = await fixture(t);
    const target = join(f.root, path);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, "private");
    jj(f.root, ["file", "track", "--include-ignored", "--", path]);
    await assert.rejects(context(f.root, f.output), /Private\/local files/u);
  });
}

for (const changed of ["sha256", "name", "version"]) {
  test(`source context refuses an unqualified public archive ${changed}`, async (t) => {
    const f = await fixture(t);
    const entry = await archive(f);
    entry[changed] =
      changed === "sha256"
        ? "0".repeat(64)
        : changed === "name"
          ? "@lapismd/other"
          : "2.0.0";
    await assert.rejects(
      context(f.root, f.output, await manifest(f, [entry])),
      /checksum mismatch|identity mismatch/u,
    );
  });
}

async function installFixture(t) {
  const f = await fixture(t);
  const input = join(f.directory, "qualified");
  await mkdir(input);
  const entry = await archive(f);
  await writeFile(join(input, "package-0.tgz"), await readFile(entry.path));
  entry.path = "package-0.tgz";
  await writeFile(join(input, "archives.json"), JSON.stringify([entry]));
  return { ...f, input, entry };
}

test("qualified container install preserves effective overrides and restores manifest/lock bytes", async (t) => {
  const f = await installFixture(t);
  const { install } = await import("./server-container/install.mjs");
  const calls = [];
  install(f.input, f.root, (command, args, options) => {
    calls.push({ command, args, options });
    const projected = JSON.parse(
      readFileSync(join(options.cwd, "package.json"), "utf8"),
    );
    assert.equal(projected.pnpm.overrides.retained, "2.0.0");
    assert.equal(
      projected.pnpm.overrides[f.entry.name],
      "file:" + join(f.input, f.entry.path),
    );
    writeFileSync(join(options.cwd, "pnpm-lock.yaml"), "temporary");
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, "pnpm");
  assert.ok(calls[0].args.includes("--no-frozen-lockfile"));
  assert.equal(await readFile(join(f.root, "package.json"), "utf8"), f.pkg);
  assert.equal(await readFile(join(f.root, "pnpm-lock.yaml"), "utf8"), f.lock);
});

test("failed qualified container install restores original manifest and lock", async (t) => {
  const f = await installFixture(t);
  const { install } = await import("./server-container/install.mjs");
  assert.throws(
    () =>
      install(f.input, f.root, () => {
        writeFileSync(join(f.root, "pnpm-lock.yaml"), "incomplete install");
        throw Error("dependency install failed");
      }),
    /dependency install failed/u,
  );
  assert.equal(await readFile(join(f.root, "package.json"), "utf8"), f.pkg);
  assert.equal(await readFile(join(f.root, "pnpm-lock.yaml"), "utf8"), f.lock);
});

test("registry-only container install remains frozen and ignores local hooks", async (t) => {
  const f = await fixture(t);
  await writeFile(await manifest(f, []), "[]");
  const { install } = await import("./server-container/install.mjs");
  install(f.directory, f.root, (command, args) => {
    assert.equal(command, "pnpm");
    assert.ok(args.includes("--frozen-lockfile"));
    assert.ok(args.includes("--ignore-pnpmfile"));
    assert.ok(args.includes("--ignore-scripts"));
  });
});

for (const changed of ["sha256", "name", "version", "path"]) {
  test(`qualified container install refuses an invalid archive ${changed} before running pnpm`, async (t) => {
    const f = await installFixture(t);
    const { install } = await import("./server-container/install.mjs");
    f.entry[changed] =
      changed === "sha256"
        ? "0".repeat(64)
        : changed === "path"
          ? "../public.tgz"
          : changed === "name"
            ? "@lapismd/other"
            : "2.0.0";
    await writeFile(join(f.input, "archives.json"), JSON.stringify([f.entry]));
    assert.throws(
      () => install(f.input, f.root, () => assert.fail("pnpm must not run")),
      /Invalid qualified container/u,
    );
    assert.equal(await readFile(join(f.root, "package.json"), "utf8"), f.pkg);
    assert.equal(
      await readFile(join(f.root, "pnpm-lock.yaml"), "utf8"),
      f.lock,
    );
  });
}

test("server image context is the Notes checkout and keeps pinned siblings beside it", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "lapis-server-context-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const output = join(directory, "context");
  await mkdir(join(output, "lapis-notes/crates"), { recursive: true });
  await mkdir(join(output, "jj-store"), { recursive: true });
  await mkdir(join(output, ".qualification"), { recursive: true });
  await writeFile(join(output, "lapis-notes/Cargo.toml"), "[workspace]\n");
  await writeFile(join(output, "jj-store/Cargo.toml"), "[workspace]\n");
  await writeFile(join(output, ".qualification/archives.json"), "[]\n");
  const notes = await repositoryBuildContext(output);
  assert.equal(notes, join(output, "lapis-notes"));
  assert.equal(
    await readFile(join(notes, "Cargo.toml"), "utf8"),
    "[workspace]\n",
  );
  assert.equal(
    await readFile(
      join(notes, ".image-inputs/siblings/jj-store/Cargo.toml"),
      "utf8",
    ),
    "[workspace]\n",
  );
  assert.equal(
    await readFile(join(notes, ".image-inputs/qualification/archives.json"), "utf8"),
    "[]\n",
  );
  assert.deepEqual(await readdir(output), ["lapis-notes"]);
});
