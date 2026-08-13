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

test("desktop host changes require desktop, package, and architecture contracts", () => {
  const desktop = classifySpecFirstChanges([
    "packages/desktop-electron/src/main.ts",
  ]);
  assert.deepEqual(desktop.missingChapters, [
    "spec/src/architecture.md",
    "spec/src/desktop-host.md",
    "spec/src/packages.md",
  ]);

  const nativeMarkdown = classifySpecFirstChanges([
    "packages/language-service/src/markdownlint/runtime.ts",
  ]);
  assert.deepEqual(nativeMarkdown.missingChapters, [
    "spec/src/desktop-host.md",
    "spec/src/packages.md",
    "spec/src/workspace-shell/panels/problems.md",
  ]);
});

test("database and web changes require their canonical host chapters", () => {
  const database = classifySpecFirstChanges([
    "packages/api/src/lib/storage/app-database.ts",
  ]);
  assert.deepEqual(database.missingChapters, [
    "spec/src/app-database.md",
    "spec/src/architecture.md",
    "spec/src/packages.md",
  ]);

  const web = classifySpecFirstChanges(["packages/web/src/main.ts"]);
  assert.deepEqual(web.missingChapters, [
    "spec/src/architecture.md",
    "spec/src/packages.md",
    "spec/src/web-host.md",
  ]);
});

test("CV plugin changes require cv, package, and architecture contracts", () => {
  const result = classifySpecFirstChanges([
    "packages/plugins/plugin-cv/src/lib/index.ts",
  ]);
  assert.deepEqual(result.missingChapters, [
    "spec/src/architecture.md",
    "spec/src/cv-plugin.md",
    "spec/src/packages.md",
  ]);
});

test("CV package stories additionally require the Storybook catalog", () => {
  for (const file of [
    "packages/plugins/plugin-cv/.storybook/main.ts",
    "packages/plugins/plugin-cv/src/stories/CvWorkspace.stories.svelte",
  ]) {
    const result = classifySpecFirstChanges([file]);
    assert.deepEqual(result.missingChapters, [
      "spec/src/architecture.md",
      "spec/src/cv-plugin.md",
      "spec/src/packages.md",
      "spec/src/storybook-catalog.md",
    ]);
  }
});
