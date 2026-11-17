import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { auditRetiredAiCatalog } from "./check-retired-ai-catalog.mjs";

test("shared-AI catalog, bridge and root package edges are absent", () => {
  assert.deepEqual(auditRetiredAiCatalog(), []);
});

test("catalog audit rejects retired imports and inputs while preserving native AI and file-tools", (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "notes-retired-ai-catalog-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "stories"));
  writeFileSync(path.join(root, "package.json"), '{"private":true}');
  writeFileSync(
    path.join(root, "stories/active.ts"),
    'import "@lapismd/ai/tauri"; import "@lapismd/ai-host/file-tools"; import "@lapismd/mira-plugin-ai";',
  );
  assert.deepEqual(auditRetiredAiCatalog(root), []);
  for (const [file, source] of [
    ["stories/retired.css", '@import "@lapis-notes/ai/styles.css";'],
    ["stories/retired.mdx", 'import Demo from "../ai/AiChatDemo.svelte";'],
    ["stories/retired.ts", 'import "@lapismd/ai-controller/client";'],
    ["turbo.json", '{"globalEnv":["LAPIS_AGENT_RUNTIME_TOKEN"]}'],
    ["package.json", '{"devDependencies":{"@lapis-notes/ai":"^0.1.15"}}'],
  ]) {
    writeFileSync(path.join(root, file), source);
    assert.ok(
      auditRetiredAiCatalog(root).some((error) => error.startsWith(file + ":")),
      file,
    );
    if (file === "package.json")
      writeFileSync(path.join(root, file), '{"private":true}');
    else rmSync(path.join(root, file));
  }
});
