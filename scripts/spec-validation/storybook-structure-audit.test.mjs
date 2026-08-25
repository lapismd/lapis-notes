import assert from "node:assert/strict";
import test from "node:test";

import {
  auditPluginPanels,
  auditStorybookStructure,
} from "./storybook-structure-audit.mjs";

const family = {
  kind: "fixture",
  plugin: "Fixture",
  panel: "Panel",
  commandId: "fixture:open-panel",
  commandToken: 'id: "open-panel"',
  sourceFile: "src/plugin.ts",
  storyFile: "stories/plugins/fixture/panels/Panel.stories.ts",
};

const placements = [
  { exportName: "MiddleTopTabs", title: "Middle (Top Tabs)" },
  { exportName: "LeftSidebar", title: "Left Sidebar" },
];

function audit(files, families = [family]) {
  return auditPluginPanels({
    families,
    placements,
    readOptional(file) {
      return files.get(file) ?? null;
    },
  });
}

const validStory = `
export default {
  title: "Plugins/Fixture/Panels/Panel",
  tags: ["visual-pending", "test"],
};
export const MiddleTopTabs = {};
export const LeftSidebar = {};
`;

test("accepts a mapped command panel with every required placement", () => {
  const findings = audit(
    new Map([
      [family.sourceFile, 'const command = { id: "open-panel" };'],
      [family.storyFile, validStory],
    ]),
  );

  assert.deepEqual(findings, []);
});

test("rejects missing stories and stale command mappings", () => {
  const findings = audit(
    new Map([[family.sourceFile, "const commands = [];"]]),
  );

  assert.deepEqual(
    findings.map((entry) => entry.code),
    ["STORYBOOK-PANEL-COMMAND-STALE", "STORYBOOK-PANEL-SOURCE-MISSING"],
  );
});

test("rejects the wrong taxonomy, missing placements, and absent visual status", () => {
  const findings = audit(
    new Map([
      [family.sourceFile, 'const command = { id: "open-panel" };'],
      [
        family.storyFile,
        'export default { title: "Workspace/Panels/Fixture" };\nexport const MiddleTopTabs = {};',
      ],
    ]),
  );

  assert.deepEqual(
    findings.map((entry) => entry.code),
    [
      "STORYBOOK-PANEL-TITLE",
      "STORYBOOK-PANEL-PLACEMENT-MISSING",
      "STORYBOOK-PANEL-VISUAL-STATUS",
    ],
  );
});

test("rejects duplicate command and story mappings", () => {
  const duplicate = { ...family, kind: "duplicate" };
  const findings = audit(
    new Map([
      [family.sourceFile, 'const command = { id: "open-panel" };'],
      [family.storyFile, validStory],
    ]),
    [family, duplicate],
  );

  assert.deepEqual(
    findings.map((entry) => entry.code),
    ["STORYBOOK-PANEL-MAPPING-DUPLICATE", "STORYBOOK-PANEL-MAPPING-DUPLICATE"],
  );
});

const shellStory = (plugin) => `
export default { title: "Plugins/${plugin}/Shell", tags: ["visual-pending"] };
export const Desktop = {};
export const Mobile = {};
`;
const shellDemo = `
body.sb-main-fullscreen { height: 100vh; overflow: hidden; padding: 0 !important; }
.workspace-shell-demo > [data-ui-component="lapis-workspace-shell"] { height: 100%; }
.workspace-shell-docs-canvas { height: 700px; }
`;
const shellRuntime = `
FileExplorerPlugin; SearchPlugin;
const left = { width: "17rem" };
const right = { width: "0px" };
`;
const panelDemo = `
body.sb-main-fullscreen { width: 100vw; height: 100vh; overflow: hidden; padding: 0 !important; }
.panel-demo-docs-canvas { height: 700px; }
`;
const panelHelper = `
viewport.clientWidth; viewport.clientHeight;
getComputedStyle(storyRoot).padding;
getComputedStyle(storyRoot).overflow;
`;
const workspaceDemo = `
{ plugin: MarkdownPlugin, required: false, enabledByDefault: true }
{ plugin: MarkdownLintPlugin, required: false, enabledByDefault: true }
{ plugin: FileExplorerPlugin, required: false, enabledByDefault: true }
{ plugin: SearchPlugin, required: false, enabledByDefault: true }
{ plugin: GraphPlugin, required: false, enabledByDefault: true }
{ plugin: BookmarksPlugin, required: false, enabledByDefault: true }
{ plugin: HistoryPlugin, required: false, enabledByDefault: true }
{ plugin: WordCountPlugin, required: false, enabledByDefault: true }
{ plugin: BasesPlugin, required: false, enabledByDefault: true }
{ plugin: AiPlugin, required: false, enabledByDefault: true }
defaultRuntime: "fake"
`;
const workspaceStory = `
export const PersistedDesktop = { args: { loadBundledPlugins: true } };
export const Mobile = { args: { loadBundledPlugins: true } };
{ id: "markdown", enabled: true }
{ id: "lapis-markdown-lint", enabled: true }
{ id: "lapis-file-explorer", enabled: true }
{ id: "search", enabled: true }
{ id: "lapis-graph", enabled: true }
{ id: "bookmarks", enabled: true }
{ id: "history", enabled: true }
{ id: "wordcount", enabled: true }
{ id: "bases", enabled: true }
{ id: "ai", enabled: true }
`;
const aiStateStoryNames = [
  "PermissionRequested",
  "PermissionAccepted",
  "QuestionAsked",
  "QuestionAnswered",
  "ToolRunning",
  "SuccessfulToolCall",
  "FailedToolCall",
  "ValidationAndEmptyState",
  "FailedMessageAndRetry",
  "AgentTrace",
];
const aiStateStories = aiStateStoryNames
  .map(
    (name) => `
export const ${name} = {
  parameters: {
    ...workspaceCatalogParameters("fixture-${name}"),
    docs: { source: { code: "example" } },
    visualDelta: { images: ["/visual-baselines/${name}.png"] },
  },
  play: async () => {},
};`,
  )
  .join("\n");

function validStructureFiles() {
  return new Map([
    ["stories/plugins/_shared/panels/PanelDemo.svelte", panelDemo],
    ["stories/plugins/_shared/panels/panel-story-helpers.ts", panelHelper],
    ["stories/plugins/ai/shell/Shell.stories.ts", shellStory("AI")],
    ["stories/plugins/ai/shell/ShellDemo.svelte", shellDemo],
    ["stories/plugins/ai/shell/create-shell-demo.ts", shellRuntime],
    ["stories/plugins/ai/AiChat.stories.ts", aiStateStories],
    ["stories/plugins/bases/shell/Shell.stories.ts", shellStory("Bases")],
    ["stories/plugins/bases/shell/ShellDemo.svelte", shellDemo],
    ["stories/plugins/bases/shell/create-shell-demo.ts", shellRuntime],
    ["stories/plugins/history/shell/Shell.stories.ts", shellStory("History")],
    ["stories/plugins/history/shell/ShellDemo.svelte", shellDemo],
    ["stories/plugins/history/shell/create-shell-demo.ts", shellRuntime],
    ["stories/workspace/WorkspaceShellDemo.svelte", workspaceDemo],
    ["stories/workspace/WorkspaceShell.stories.ts", workspaceStory],
    [
      ".storybook/preview.ts",
      'const parameters = { options: { storySort: { order: ["Specification", []] } } };',
    ],
  ]);
}

function auditStructure(files, trackedFiles = [...files.keys()]) {
  return auditStorybookStructure({
    trackedFiles,
    families: [],
    placements: [],
    readOptional(file) {
      return files.get(file) ?? null;
    },
  });
}

test("accepts canonical full-canvas panels, plugin shells, and persisted inventory", () => {
  assert.deepEqual(auditStructure(validStructureFiles()), []);
});

test("rejects legacy workspace plugin paths and external Roles catalog coupling", () => {
  const files = validStructureFiles();
  files.set(
    "stories/workspace/plugins/Roles.stories.ts",
    'import "@lapis-notes/lapis-plugin-cv-roles"; export default { title: "Workspace/Plugins/Roles" };',
  );
  const codes = auditStructure(files).map((entry) => entry.code);
  assert.ok(codes.includes("STORYBOOK-TAXONOMY-LEGACY"));
  assert.ok(codes.includes("STORYBOOK-EXTERNAL-PLUGIN"));
});

test("rejects external Terminal catalog coupling", () => {
  const files = validStructureFiles();
  files.set(
    "stories/plugins/terminal/Panel.stories.ts",
    'import "@lapis-notes/lapis-plugin-terminal"; export default { title: "Plugins/Terminal/Panel" };',
  );
  const codes = auditStructure(files).map((entry) => entry.code);
  assert.ok(codes.includes("STORYBOOK-EXTERNAL-PLUGIN"));
});

test("rejects incomplete plugin shell variants, composition, visual status, and geometry", () => {
  const files = validStructureFiles();
  files.set(
    "stories/plugins/ai/shell/Shell.stories.ts",
    'export default { title: "Plugins/AI/Workspace" }; export const Desktop = {};',
  );
  files.set("stories/plugins/ai/shell/ShellDemo.svelte", "<main />");
  files.set("stories/plugins/ai/shell/create-shell-demo.ts", "AiPlugin;");
  const codes = auditStructure(files).map((entry) => entry.code);
  for (const code of [
    "STORYBOOK-SHELL-TITLE",
    "STORYBOOK-SHELL-VARIANT-MISSING",
    "STORYBOOK-SHELL-VISUAL-STATUS",
    "STORYBOOK-SHELL-COMPOSITION",
    "STORYBOOK-SHELL-GEOMETRY",
  ]) {
    assert.ok(codes.includes(code));
  }
});

test("rejects a missing canonical shell source", () => {
  const files = validStructureFiles();
  files.delete("stories/plugins/bases/shell/ShellDemo.svelte");
  assert.ok(
    auditStructure(files).some(
      (entry) => entry.code === "STORYBOOK-SHELL-SOURCE-MISSING",
    ),
  );
});

test("rejects preview and Docs panel geometry regressions", () => {
  const files = validStructureFiles();
  files.set(
    "stories/plugins/_shared/panels/PanelDemo.svelte",
    ".panel-demo { min-height: 36rem; }",
  );
  assert.ok(
    auditStructure(files).some(
      (entry) => entry.code === "STORYBOOK-PANEL-GEOMETRY",
    ),
  );
});

test("rejects an incomplete persisted Workspace plugin inventory", () => {
  const files = validStructureFiles();
  files.set(
    "stories/workspace/WorkspaceShellDemo.svelte",
    workspaceDemo.replace(
      "{ plugin: AiPlugin, required: false, enabledByDefault: true }",
      "",
    ),
  );
  assert.ok(
    auditStructure(files).some(
      (entry) => entry.code === "STORYBOOK-WORKSPACE-INVENTORY",
    ),
  );
});

test("rejects a missing or incompletely governed AI interaction state", () => {
  const files = validStructureFiles();
  files.set(
    "stories/plugins/ai/AiChat.stories.ts",
    aiStateStories
      .replace(/export const FailedToolCall[\s\S]*?(?=\nexport const )/, "")
      .replace("play: async () => {},", ""),
  );
  const findings = auditStructure(files).filter(
    (entry) => entry.code === "STORYBOOK-AI-STATE-MATRIX",
  );
  assert.ok(findings.length >= 2);
  assert.ok(findings.some((entry) => entry.message.includes("FailedToolCall")));
  assert.ok(findings.some((entry) => entry.message.includes("play:")));
});

test("requires Specification to be the first Storybook menu item", () => {
  const files = validStructureFiles();
  files.set(
    ".storybook/preview.ts",
    'const parameters = { options: { storySort: { order: ["Plugins", "Specification"] } } };',
  );
  assert.ok(
    auditStructure(files).some(
      (entry) => entry.code === "STORYBOOK-SPECIFICATION-ORDER",
    ),
  );
});
