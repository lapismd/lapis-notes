import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { test } from "node:test";
import {
  initialize,
  nativePins,
  outputs,
} from "./server-container/ci-sources.mjs";

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "lapis-native-ci-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = join(directory, "lapis-notes");
  await mkdir(join(root, "scripts/validation"), { recursive: true });
  const pins = [
    "lapis-ai",
    "jj-store",
    "agent-redaction",
    "lapis-plugins",
    "lapis-plugin-docs",
    "lapis-plugin-tasks",
  ].map((name, index) => ({ name, revision: String(index + 1).repeat(40) }));
  const pinPath = join(root, "scripts/validation/native-sources.json");
  const source = JSON.stringify(pins) + "\n";
  await writeFile(pinPath, source);
  return {
    directory,
    root,
    pins,
    pinPath,
    source,
    environment: { GITHUB_SHA: "a".repeat(40) },
  };
}

test("native CI derives every checkout output from the single immutable pin manifest", async (t) => {
  const f = await fixture(t);
  const target = join(f.directory, "outputs");
  await outputs(f.root, { GITHUB_OUTPUT: target });
  assert.equal(
    await readFile(target, "utf8"),
    f.pins
      .map((pin) => `${pin.name.replaceAll("-", "_")}=${pin.revision}\n`)
      .join(""),
  );
  assert.equal(await readFile(f.pinPath, "utf8"), f.source);
});

test("native CI checks all exact source identities before initializing credential-free JJ exports", async (t) => {
  const f = await fixture(t);
  const calls = [];
  await initialize(f.root, f.environment, (command, args, options) => {
    calls.push({ command, args, options });
    if (command === "git") {
      assert.deepEqual(args, ["rev-parse", "HEAD"]);
      return basename(options.cwd) === "lapis-notes"
        ? f.environment.GITHUB_SHA
        : f.pins.find((pin) => pin.name === basename(options.cwd)).revision;
    }
    assert.equal(command, "jj");
    assert.deepEqual(args, [
      "--no-pager",
      "--config",
      "signing.behavior=drop",
      "git",
      "init",
      "--colocate",
    ]);
  });
  assert.deepEqual(
    calls.map((call) => call.command),
    [...Array(7).fill("git"), ...Array(7).fill("jj")],
  );
  assert.deepEqual(
    calls.slice(1, 7).map((call) => call.options.cwd),
    f.pins.map((pin) => join(dirname(f.root), pin.name)),
  );
  assert.deepEqual(
    JSON.parse(
      await readFile(join(f.root, ".local/validation/config.json"), "utf8"),
    ),
    { cpus: 4, memoryGiB: 12, shmGiB: 2 },
  );
  assert.equal(await readFile(f.pinPath, "utf8"), f.source);
});

test("native CI rejects a mismatched sibling without branch fallback or any initialization", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    initialize(f.root, f.environment, (command, args, options) => {
      assert.equal(
        command,
        "git",
        "mismatch must stop before JJ initialization",
      );
      return options.cwd === f.root ? f.environment.GITHUB_SHA : "f".repeat(40);
    }),
    /must be checked out.*push the pinned commit.*sibling-repository read access/u,
  );
  await assert.rejects(
    readFile(join(f.root, ".local/validation/config.json")),
    { code: "ENOENT" },
  );
});

test("native CI rejects missing exact workflow and output identities", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    initialize(f.root, {}, () => assert.fail("must not invoke a tool")),
    /GITHUB_SHA/u,
  );
  await assert.rejects(outputs(f.root, {}), /GITHUB_OUTPUT/u);
});

test("native CI rejects duplicate, unsafe, incomplete and mutable source pins", async (t) => {
  const f = await fixture(t);
  for (const change of [
    (pins) => pins.slice(1),
    (pins) => [pins[0], pins[0], ...pins.slice(2)],
    (pins) => [{ ...pins[0], name: "../secret" }, ...pins.slice(1)],
    (pins) => [{ ...pins[0], revision: "main" }, ...pins.slice(1)],
  ]) {
    await writeFile(f.pinPath, JSON.stringify(change(f.pins)));
    await assert.rejects(
      nativePins(f.root),
      /six distinct native sources with immutable commit pins/u,
    );
  }
});
