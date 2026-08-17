import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  aiRealHostSeed,
  assertSafeAiSmokeReset,
  seedAiRealHostWorkspace,
} from "./ai-real-host-fixture.mjs";

test("the real-host seed opens AI beside a deterministic note", () => {
  const seed = aiRealHostSeed("codex-native");
  assert.match(seed[".obsidian/ai.json"], /"codex-native"/u);
  assert.match(seed[".obsidian/workspace.json"], /"type": "ai"/u);
  assert.match(seed[".obsidian/ai.json"], /"appToolsEnabled": true/u);
  assert.match(seed["Notes/Agent Smoke.md"], /lapis-smoke-ready/u);
  assert.match(seed["Notes/Bridge Search.md"], /bridge-search-token/u);
  assert.match(seed["Notes/Patch Target.md"], /status: draft/u);
});

test("seeding preserves agent edits and portable conversations", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lapis-ai-seed-"));
  try {
    await seedAiRealHostWorkspace(root);
    await writeFile(path.join(root, "src/fixture.ts"), "user edit\n", "utf8");
    await seedAiRealHostWorkspace(root);
    assert.equal(
      await readFile(path.join(root, "src/fixture.ts"), "utf8"),
      "user edit\n",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reset is confined to the repository tmp directory", () => {
  assert.equal(
    assertSafeAiSmokeReset("/repo", "/repo/tmp/ai-real-host/workspace"),
    "/repo/tmp/ai-real-host/workspace",
  );
  assert.throws(() => assertSafeAiSmokeReset("/repo", "/repo"));
  assert.throws(() => assertSafeAiSmokeReset("/repo", "/other/workspace"));
});
