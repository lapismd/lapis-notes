import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Resolve the actual native caller's dependency rather than a hoisted copy.
const controllerRoot = realpathSync(
  fileURLToPath(
    new URL("../node_modules/@lapismd/ai-controller", import.meta.url),
  ),
);
const controllerRequire = createRequire(
  path.join(controllerRoot, "package.json"),
);
const llamaRequire = createRequire(controllerRequire.resolve("node-llama-cpp"));
const { simpleGit } = llamaRequire("simple-git");

async function fixture(run) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "notes-git-security-"),
  );
  try {
    const git = simpleGit(directory);
    await git.init(true);
    await run({ directory, git });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("native Git caller retains object-option clone and removeRemote APIs", async () => {
  await fixture(async ({ directory }) => {
    const destination = path.join(directory, "clone");
    await simpleGit({}).clone(directory, destination, { "--quiet": null });
    const clone = simpleGit(destination);
    assert.equal((await clone.getRemotes()).length, 1);
    await clone.removeRemote("origin");
    assert.deepEqual(await clone.getRemotes(), []);
  });
});

for (const option of ["--receive-p", "--exe"]) {
  test(`native Git caller rejects abbreviated unsafe push option ${option}`, async () => {
    await fixture(async ({ directory, git }) => {
      await assert.rejects(
        git.push(directory, "HEAD", { [option]: "false" }),
        /unsafe|not permitted|not allowed|unsupported/i,
      );
    });
  });
}
