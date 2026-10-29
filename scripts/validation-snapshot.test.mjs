import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

test("a full-image snapshot omits a Cargo lock the tree does not track", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "notes-snapshot-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const jj = (args) =>
    execFileSync(
      "jj",
      [
        "--no-pager",
        "--config",
        'user.name="Validation"',
        "--config",
        'user.email="validation@localhost"',
        ...args,
      ],
      { cwd: directory, encoding: "utf8" },
    ).trim();
  const { snapshotFileIfPresent } = await import("./validation/source.mjs");
  jj(["git", "init", "--colocate", directory]);
  await writeFile(join(directory, "pnpm-lock.yaml"), "lockfile: 9.0\n");
  jj(["commit", "-m", "Notes without a Cargo lock"]);
  const revision = jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"]);
  assert.equal(
    snapshotFileIfPresent(directory, revision, "Cargo.lock"),
    undefined,
  );
  assert.equal(
    snapshotFileIfPresent(directory, revision, "pnpm-lock.yaml").toString(),
    "lockfile: 9.0\n",
  );
});
