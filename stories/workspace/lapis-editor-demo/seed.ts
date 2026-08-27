import loftBoardingMarkdown from "./fixtures/loft-boarding.md?raw";

export type LapisEditorDemoScenario =
  | "ready"
  | "markdown-frontmatter"
  | "markdown-authoring"
  | "markdown-problems"
  | "markdown-spellcheck"
  | "markdown-lint-loft-boarding"
  | "same-file-split"
  | "explorer-mutations"
  | "editor-settings"
  | "loading-plugins"
  | "startup-failure"
  | "explorer-opening-vault";

const OPEN_MARKDOWN_SCENARIOS = new Set<LapisEditorDemoScenario>([
  "editor-settings",
  "markdown-frontmatter",
  "markdown-authoring",
  "markdown-problems",
  "markdown-spellcheck",
  "markdown-lint-loft-boarding",
]);

function openMarkdownLeaf(scenario: LapisEditorDemoScenario) {
  if (scenario === "markdown-lint-loft-boarding") {
    return {
      id: "loft-boarding",
      title: "Loft boarding",
      file: "Notes/Loft boarding.md",
      mode: "source",
    };
  }
  if (scenario === "markdown-spellcheck") {
    return {
      id: "spelling",
      title: "Spelling",
      file: "Notes/Spelling.md",
      mode: "source",
    };
  }
  return {
    id: "welcome",
    title: "Welcome",
    file: "Notes/Welcome.md",
    mode: "live-preview",
  };
}

const APP_CONFIGURATION = {
  "editor.alwaysFocusNewTabs": false,
  "editor.display.showLineNumbers": true,
  "editor.display.foldIndent": true,
  "editor.display.wrapLines": true,
  "editor.display.showIndentationGuides": true,
  "editor.behaviour.spellCheck": true,
  "editor.behaviour.indentUsingTabs": true,
  "editor.behaviour.indentVisualWidth": 4,
  "editor.defaultViewForNewTabs": "editing",
  "editor.defaultEditingMode": "live-preview",
  "markdown.mira.plugins.mermaid.enabled": true,
  "markdown.mira.plugins.ai.enabled": false,
  "markdown.mira.editor.toolbar.enabled": false,
  "markdown.mira.editor.selectionToolbar.enabled": true,
  "markdown.mira.editor.blockToolbar.enabled": false,
  "markdown.mira.editor.doodleDividers.enabled": false,
  "markdown.mira.frontmatter.defaultOpen": false,
  "markdown.mira.features.outline-navigation": true,
  "markdown.mira.features.slash-commands": true,
  "markdown.mira.features.block-controls": true,
  "markdown.mira.features.headings": true,
  "markdown.mira.features.formatting": true,
  "markdown.mira.features.tables": true,
  "markdown.mira.features.images": true,
  "appearence.interface.showInlineTitle": true,
  "appearence.interface.showTabTitleBar": true,
  "workspace.fileExplorer.autoRevealCurrentFile": true,
  "workspace.fileExplorer.showHiddenFiles": false,
  pluginData: {
    "demo-preserved-data": {
      lastOpened: "Notes/Welcome.md",
    },
  },
};

function leaf(
  id: string,
  title: string,
  icon: string,
  type: string,
  state: Record<string, unknown> = {},
) {
  return {
    id,
    type: "leaf",
    state: { type, state, icon, title },
  };
}

function tabs(id: string, children: ReturnType<typeof leaf>[]) {
  return {
    id,
    type: "tabs",
    stacked: false,
    currentTab: 0,
    children,
  };
}

function workspaceLayout(scenario: LapisEditorDemoScenario) {
  const markdownLeaf = openMarkdownLeaf(scenario);
  const main =
    scenario === "same-file-split"
      ? {
          id: "main",
          type: "split",
          direction: "horizontal",
          sizes: [50, 50],
          children: [
            tabs("main-left-tabs", [
              leaf("welcome-left", "Welcome", "file-text", "markdown", {
                file: "Notes/Welcome.md",
              }),
            ]),
            tabs("main-right-tabs", [
              leaf("welcome-right", "Welcome", "file-text", "markdown", {
                file: "Notes/Welcome.md",
              }),
            ]),
          ],
        }
      : OPEN_MARKDOWN_SCENARIOS.has(scenario)
        ? {
            id: "main",
            type: "split",
            direction: "vertical",
            sizes: [100],
            children: [
              tabs("main-tabs", [
                leaf(
                  markdownLeaf.id,
                  markdownLeaf.title,
                  "file-text",
                  "markdown",
                  {
                    file: markdownLeaf.file,
                    mode: markdownLeaf.mode,
                  },
                ),
              ]),
            ],
          }
        : {
            id: "main",
            type: "split",
            direction: "vertical",
            sizes: [100],
            children: [
              tabs("main-tabs", [
                leaf("landing", "New tab", "file-plus", "lapis-landing"),
              ]),
            ],
          };

  return {
    main,
    left: {
      id: "left",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        tabs("left-tabs", [
          leaf("file-explorer", "Files", "folder-closed", "file-explorer"),
        ]),
      ],
      width: "18rem",
    },
    right: {
      id: "right",
      type: "split",
      direction: "vertical",
      sizes: [],
      children: [],
      width: "0px",
    },
    bottom: {
      ...tabs("bottom-panel", []),
      height: "0px",
    },
    floating: [],
    active:
      scenario === "same-file-split"
        ? "welcome-left"
        : OPEN_MARKDOWN_SCENARIOS.has(scenario)
          ? markdownLeaf.id
          : "landing",
  };
}

export function createLapisEditorDemoSeed(
  scenario: LapisEditorDemoScenario,
): Record<string, string | ArrayBuffer> {
  return {
    ".obsidian/app.json": JSON.stringify(APP_CONFIGURATION, null, 2),
    ".obsidian/types.json": JSON.stringify(
      {
        types: {
          title: "text",
          tags: "tags",
          status: "text",
        },
      },
      null,
      2,
    ),
    ".obsidian/workspace.json": JSON.stringify(
      workspaceLayout(scenario),
      null,
      2,
    ),
    ".env": "DEMO=1\n",
    "Notes/Welcome.md": [
      "---",
      "title: Welcome",
      "tags:",
      "  - demo",
      "  - markdown",
      "status: ready",
      "---",
      "",
      "# Welcome to Lapis Notes",
      ...(scenario === "markdown-problems"
        ? ["", "##missing heading space"]
        : []),
      "",
      "| Feature | State |",
      "| --- | --- |",
      "| Tables | Editable |",
      "| Images | Pasteable |",
      "",
      "First draggable block.",
      "",
      "Second draggable block.",
      "",
      "This Storybook demo uses the real workspace, editor, and vault APIs.",
      "",
      "See also [[Ideas]] and #project/alpha.",
      "",
      "- Edit this note in Mira live preview",
      "- Open another file from Explorer",
      "- Change Markdown / Mira settings without reloading",
      "",
      "## Portable authoring",
      "",
      "### Nested authoring details",
      "",
      "Select this authoring text and use the contextual toolbar.",
      "",
      "<!-- mira-divider:v1:00000008 -->",
      "---",
      "",
      "```mermaid",
      "flowchart LR",
      "  A[Source] --> B[Live preview]",
      "  B --> C[Reading]",
      "```",
      "",
    ].join("\n"),
    "Notes/Loft boarding.md": loftBoardingMarkdown,
    "Notes/Spelling.md": [
      "# Spelling",
      "",
      "This sentense has a mispelled word.",
      "",
    ].join("\n"),
    "Notes/Ideas.markdown": [
      "---",
      "tags: [ideas, demo]",
      "status: planned",
      "---",
      "",
      "# Ideas",
      "",
      "## Capture",
      "",
      "Link back to [[Welcome]] from the ideas note.",
      "",
      "## Next",
      "",
      "Use Outline, Properties, Tags, and Backlinks panels.",
      "",
    ].join("\n"),
    "Notes/Reference/shortcuts.txt": [
      "Command palette: Mod+P",
      "Split the active pane from the tab menu.",
      "",
    ].join("\n"),
    "Projects/lapis.data": JSON.stringify(
      {
        name: "Lapis Notes",
        milestone: "Source editor demo",
        ready: true,
      },
      null,
      2,
    ),
    "Projects/settings.json": JSON.stringify(
      {
        theme: "lapis",
        editor: { mode: "source", indentWidth: 4 },
      },
      null,
      2,
    ),
    "Projects/config.yaml": [
      "name: Lapis Notes",
      "features:",
      "  sourceEditor: true",
      "  formats:",
      "    - yaml",
      "    - yml",
      "",
    ].join("\n"),
    "README.text": "Files, editors, and settings all run inside Storybook.\n",
    "Assets/pixel.bin": new Uint8Array([0x4c, 0x41, 0x50, 0x49, 0x53]).buffer,
  };
}
