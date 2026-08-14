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
    assert.deepEqual(result.missingChapters, ["spec/src/spec-governance.md"]);
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

  const desktopNative = classifySpecFirstChanges([
    "packages/api/src/lib/storage/desktop-native.ts",
  ]);
  assert.deepEqual(desktopNative.missingChapters, [
    "spec/src/architecture.md",
    "spec/src/desktop-host.md",
    "spec/src/packages.md",
  ]);
  assert.ok(!desktopNative.missingChapters.includes("spec/src/app-database.md"));

  const web = classifySpecFirstChanges(["packages/web/src/main.ts"]);
  assert.deepEqual(web.missingChapters, [
    "spec/src/architecture.md",
    "spec/src/packages.md",
    "spec/src/web-host.md",
  ]);
});

test("API plugin lifecycle changes require the plugin model", () => {
  for (const file of [
    "packages/api/src/lib/plugin.ts",
    "packages/api/src/lib/plugin-manager.ts",
    "packages/api/src/lib/workspace.svelte.ts",
    "packages/api/src/lib/context.svelte.ts",
  ]) {
    const result = classifySpecFirstChanges([file]);
    assert.deepEqual(result.missingChapters, [
      "spec/src/architecture.md",
      "spec/src/packages.md",
      "spec/src/plugin-model.md",
      ...(file.endsWith("/plugin.ts")
        ? ["spec/src/workspace-shell/panels/problems.md"]
        : []),
    ]);
  }
});

test("Roles consumer stories require host and catalog contracts", () => {
  for (const file of [
    "stories/workspace/plugins/roles-plugin-shell/RolesPluginShell.stories.svelte",
    "stories/workspace/plugins/RolesWorkspace.stories.ts",
  ]) {
    const result = classifySpecFirstChanges([file]);
    assert.deepEqual(result.missingChapters, [
      "spec/src/roles-plugin.md",
      "spec/src/storybook-catalog.md",
    ]);
  }
});

test("AI implementation and stories require their canonical contracts", () => {
  const packageChange = classifySpecFirstChanges([
    "packages/plugins/plugin-ai/src/lib/ai-plugin.ts",
  ]);
  assert.deepEqual(packageChange.missingChapters, [
    "spec/src/ai-plugin.md",
    "spec/src/architecture.md",
    "spec/src/packages.md",
  ]);

  const storyChange = classifySpecFirstChanges([
    "stories/plugins/ai/AiChat.stories.ts",
  ]);
  assert.deepEqual(storyChange.missingChapters, [
    "spec/src/ai-plugin.md",
    "spec/src/storybook-catalog.md",
  ]);
});

test("Bases implementation and stories require their canonical contracts", () => {
  const packageChange = classifySpecFirstChanges([
    "packages/plugins/plugin-bases/src/lib/bases-plugin.ts",
  ]);
  assert.deepEqual(packageChange.missingChapters, [
    "spec/src/architecture.md",
    "spec/src/bases-plugin.md",
    "spec/src/packages.md",
  ]);

  for (const file of [
    "stories/plugins/bases/BasesViews.stories.ts",
    "stories/workspace/plugins/bases/BasesFileView.stories.ts",
  ]) {
    const storyChange = classifySpecFirstChanges([file]);
    assert.deepEqual(storyChange.missingChapters, [
      "spec/src/bases-plugin.md",
      "spec/src/storybook-catalog.md",
    ]);
  }
});
