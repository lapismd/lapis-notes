import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  exportNativeSources,
  restoreNativeSources,
} from "./validation/native-sources.mjs";
import { laneImage } from "./validation/model.mjs";

test("JavaScript aggregate lanes do not require a removed root Cargo lockfile", () => {
  for (const lane of [
    "check",
    "check:all",
    "test",
    "build",
    "spec:check",
    "ci:release",
  ])
    assert.equal(laneImage(lane), "ui");
});

test("explicit native and protocol lanes select the pinned Rust toolchain", () => {
  for (const lane of [
    "validation:rust",
    "build:server:rust",
    "check:protocol",
    "test:rust-core",
  ])
    assert.equal(laneImage(lane), "full");
  for (const lane of [
    "test:storybook",
    "validation:check",
    "check:storybook-parity",
  ])
    assert.equal(laneImage(lane), "ui");
});
test("native sources export only pinned committed bytes, verify transfer and reject traversal", async () => {
  const dir = await mkdtemp(join(tmpdir(), "notes-native-sources-"));
  const repository = join(dir, "source"),
    input = join(dir, "input"),
    output = join(dir, "output");
  const jj = (args) =>
    execFileSync(
      "jj",
      [
        "--config",
        'user.name="Validation"',
        "--config",
        'user.email="validation@localhost"',
        ...args,
      ],
      { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  try {
    await mkdir(repository);
    await mkdir(input);
    await mkdir(output);
    jj(["git", "init", "--colocate", repository]);
    await writeFile(join(repository, "data"), "pinned\n");
    jj(["commit", "-m", "Pinned native source"]);
    const revision = jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"]);
    await writeFile(join(repository, "data"), "unrelated pending work\n");
    const sources = await exportNativeSources(
      repository,
      input,
      { dependency: repository },
      [{ name: "dependency", revision }],
    );
    await restoreNativeSources(sources, input, output);
    assert.equal(
      await readFile(join(output, "dependency/data"), "utf8"),
      "pinned\n",
    );
    assert.equal(sources[0].revision, revision);
    await assert.rejects(
      restoreNativeSources(
        [{ ...sources[0], name: "../escape" }],
        input,
        output,
      ),
      /destination/,
    );
    await writeFile(join(input, sources[0].path), "corrupt");
    await assert.rejects(
      restoreNativeSources(sources, input, output),
      /checksum/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
