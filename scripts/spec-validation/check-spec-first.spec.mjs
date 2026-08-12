import assert from "node:assert/strict";
import test from "node:test";

import { classifySpecFirstChanges } from "./check-spec-first.mjs";

test("spec tooling and discovery configuration require governance", () => {
  for (const file of [
    "scripts/spec-validation/index.mjs",
    "scripts/spec-validation/index.spec.mjs",
    "scripts/spec-validation/spec-search.mjs",
    ".qmd/index.yml",
    ".gitignore",
  ]) {
    const result = classifySpecFirstChanges([file]);
    assert.equal(result.ok, false);
    assert.deepEqual(result.missingChapters, [
      "spec/src/spec-governance.md",
    ]);
  }
});

test("the governance chapter satisfies validator changes", () => {
  const result = classifySpecFirstChanges([
    "scripts/spec-validation/SUMMARY.mjs",
    "spec/src/spec-governance.md",
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.missingChapters, []);
});

test("diagnostic providers require the Problems and package contracts", () => {
  const languageService = classifySpecFirstChanges([
    "packages/language-service/src/index.ts",
  ]);
  assert.deepEqual(languageService.missingChapters, [
    "spec/src/packages.md",
    "spec/src/workspace-shell/panels/problems.md",
  ]);

  const markdownlint = classifySpecFirstChanges([
    "packages/plugins/plugin-markdown-lint/src/plugin.ts",
  ]);
  assert.deepEqual(markdownlint.missingChapters, [
    "spec/src/editor-demo.md",
    "spec/src/packages.md",
    "spec/src/workspace-shell/panels/problems.md",
  ]);

  const apiBridge = classifySpecFirstChanges([
    "packages/api/src/lib/diagnostics/index.ts",
  ]);
  assert.deepEqual(apiBridge.missingChapters, [
    "spec/src/architecture.md",
    "spec/src/packages.md",
    "spec/src/workspace-shell/panels/problems.md",
  ]);
});
