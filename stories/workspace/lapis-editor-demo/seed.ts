export type LapisEditorDemoScenario =
  | "ready"
  | "same-file-split"
  | "explorer-mutations"
  | "editor-settings"
  | "loading-plugins"
  | "startup-failure"
  | "explorer-opening-vault";

const APP_CONFIGURATION = {
  "editor.display.showLineNumbers": true,
  "editor.display.foldIndent": true,
  "editor.display.wrapLines": true,
  "editor.display.showIndentationGuides": true,
  "editor.behaviour.spellCheck": true,
  "editor.behaviour.indentUsingTabs": true,
  "editor.behaviour.indentVisualWidth": 4,
  "appearence.interface.showInlineTitle": true,
  "appearence.interface.showTabTitleBar": true,
  "workspace.fileExplorer.autoRevealCurrentFile": true,
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
      : scenario === "editor-settings"
        ? {
            id: "main",
            type: "split",
            direction: "vertical",
            sizes: [100],
            children: [
              tabs("main-tabs", [
                leaf("welcome", "Welcome", "file-text", "markdown", {
                  file: "Notes/Welcome.md",
                }),
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
        : scenario === "editor-settings"
          ? "welcome"
          : "landing",
  };
}

export function createLapisEditorDemoSeed(
  scenario: LapisEditorDemoScenario,
): Record<string, string | ArrayBuffer> {
  return {
    ".obsidian/app.json": JSON.stringify(APP_CONFIGURATION, null, 2),
    ".obsidian/workspace.json": JSON.stringify(
      workspaceLayout(scenario),
      null,
      2,
    ),
    "Notes/Welcome.md": [
      "# Welcome to Lapis Notes",
      "",
      "This Storybook demo uses the real workspace, editor, and vault APIs.",
      "",
      "- Edit this note in source mode",
      "- Open another file from Explorer",
      "- Change editor settings without reloading",
      "",
    ].join("\n"),
    "Notes/Ideas.markdown": [
      "# Ideas",
      "",
      "The Markdown view intentionally has no preview policy in this slice.",
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
    "README.text": "Files, editors, and settings all run inside Storybook.\n",
    "Assets/pixel.bin": new Uint8Array([0x4c, 0x41, 0x50, 0x49, 0x53]).buffer,
  };
}
