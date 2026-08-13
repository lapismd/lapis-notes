import {
  App,
  MemoryAppDatabase,
  MemoryVaultAdapter,
} from "@lapis-notes/api";
import { CvPlugin } from "@lapis-notes/cv";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SearchPlugin } from "@lapis-notes/search";
import sampleCvYaml from "../lib/form/sample-cv.fixture.yml?raw";

const APP_CONFIGURATION = {
  "editor.display.showLineNumbers": true,
  "editor.defaultViewForNewTabs": "editing",
  "workspace.fileExplorer.autoRevealCurrentFile": true,
};

const SHELL_NOTE = `---
tags:
  - cv-plugin-shell
---

# Plugin shell note

Search should find this Markdown file and must not index sample.cv.yml.
`;

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

function workspaceLayout() {
  return {
    main: {
      id: "main",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        tabs("main-tabs", [
          leaf("sample-cv", "sample", "file-text", "cv", {
            file: "sample.cv.yml",
          }),
        ]),
      ],
    },
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
      width: "16rem",
    },
    right: {
      id: "right",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        tabs("right-tabs", [
          leaf("search", "Search", "search", "search"),
        ]),
      ],
      width: "20rem",
    },
    bottom: {
      ...tabs("bottom-panel", []),
      height: "0px",
    },
    floating: [],
    active: "sample-cv",
  };
}

export function createCvPluginShellSeed(): Record<string, string> {
  return {
    ".obsidian/app.json": JSON.stringify(APP_CONFIGURATION, null, 2),
    ".obsidian/workspace.json": JSON.stringify(workspaceLayout(), null, 2),
    "sample.cv.yml": sampleCvYaml,
    "Notes/Welcome.md": SHELL_NOTE,
  };
}

export async function bootCvPluginShellDemo(): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const previousApp = globalThis.app;
  const adapter = new MemoryVaultAdapter(createCvPluginShellSeed(), {
    name: "Lapis CV Plugin Shell",
    vaultId: "lapis-cv-plugin-shell",
    clock: 1_700_000_000_000,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("lapis-cv-plugin-shell"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });

  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: true },
    { plugin: FileExplorerPlugin, required: true },
    { plugin: SearchPlugin, required: true },
    { plugin: CvPlugin, required: false, enabledByDefault: true },
  ]);

  globalThis.app = app;
  await app.vault.load();
  await app.configuration.load();
  await app.plugins.loadPlugins({
    communityPlugins: "disabled",
    optionalCorePlugins: "configured",
  });
  const stopWatchingMetadata = app.metadataTypeManager.trackChanges();
  await app.metadataCache.load();
  const searchPlugin = app.plugins.plugins.get("search");
  if (searchPlugin instanceof SearchPlugin) {
    await searchPlugin.refreshIndex("cv-plugin-shell");
  }
  await app.workspace.loadLayout();

  return {
    app,
    dispose: async () => {
      stopWatchingMetadata();
      for (const plugin of [...app.plugins.corePlugins].reverse()) {
        await plugin.disable().catch(() => undefined);
      }
      await app.workspace.disposeWorkspaceHost();
      if (globalThis.app === app) globalThis.app = previousApp;
    },
  };
}
