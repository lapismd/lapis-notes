import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { auditRetiredAiTooling } from "./check-retired-ai-tooling.mjs";

test("Notes no longer seeds or launches the retired shared-AI probes", () => {
  assert.deepEqual(auditRetiredAiTooling(), []);
});

test("retired launchers cannot return under a renamed root command", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "notes-retired-ai-tooling-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const manifest = path.join(root, "package.json");
  writeFileSync(manifest, JSON.stringify({ scripts: { dev: "storybook" } }));
  assert.deepEqual(auditRetiredAiTooling(root), []);
  for (const command of [
    "lapis-ai-controller",
    "tsx scripts/ai-real-host.ts storybook",
    "tsx scripts/ai-real-agent-probe.ts codex-acp",
    "tsx scripts/ai-cross-agent-handoff-probe.ts",
  ]) {
    writeFileSync(manifest, JSON.stringify({ scripts: { dev: command } }));
    assert.equal(auditRetiredAiTooling(root).length, 1, command);
  }
  writeFileSync(manifest, JSON.stringify({ private: true }));
  mkdirSync(path.join(root, "scripts/lib"), { recursive: true });
  writeFileSync(path.join(root, "scripts/lib/ai-controller-fixture.ts"), "");
  assert.match(auditRetiredAiTooling(root)[0], /retired shared-AI launcher/);
});
