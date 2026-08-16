import {
  App,
  installApplicationCompatibility,
  MemoryAppDatabase,
  MemoryVaultAdapter,
} from "@lapis-notes/api";
import { BasesPlugin } from "@lapis-notes/bases";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SearchPlugin } from "@lapis-notes/search";
import { watchMetadata } from "../../../workspace/watch-metadata";
import { createBasesViewsSeed } from "../bases-views-fixture";

export const BASES_EDITOR_SHELL_CONFIGURATION = {
  "appearence.interface.showTabTitleBar": true,
  "workspace.fileExplorer.autoRevealCurrentFile": true,
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

export function createBasesEditorShellLayout() {
  return {
    main: {
      id: "main",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        tabs("main-tabs", [
          leaf("projects-base", "Projects", "database", "bases", {
            file: "Bases/Projects.base",
            mode: "preview",
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
      width: "17rem",
    },
    right: {
      id: "right",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        tabs("right-tabs", [
          leaf("search", "Search", "search", "search", {
            query: "Aurora",
          }),
        ]),
      ],
      width: "0px",
    },
    bottom: {
      ...tabs("bottom-panel", []),
      height: "0px",
    },
    floating: [],
    active: "projects-base",
  };
}

export function createBasesEditorShellSeed(): Record<
  string,
  string | ArrayBuffer
> {
  return {
    ...createBasesViewsSeed(),
    ".obsidian/app.json": JSON.stringify(
      BASES_EDITOR_SHELL_CONFIGURATION,
      null,
      2,
    ),
    ".obsidian/workspace.json": JSON.stringify(
      createBasesEditorShellLayout(),
      null,
      2,
    ),
  };
}

export async function bootBasesEditorShellDemo(): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const adapter = new MemoryVaultAdapter(createBasesEditorShellSeed(), {
    name: "Lapis Bases Editor Shell",
    vaultId: "lapis-bases-editor-shell",
    clock: 1_700_000_000_000,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("lapis-bases-editor-shell"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });
  const disposeApplicationCompatibility = installApplicationCompatibility(app);

  app.plugins.registerCorePlugins([
    {
      plugin: MarkdownPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
    {
      plugin: FileExplorerPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
    {
      plugin: SearchPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
    {
      plugin: BasesPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
  ]);

  await app.vault.load();
  await app.configuration.load();
  await app.plugins.loadPlugins({
    communityPlugins: "disabled",
    optionalCorePlugins: "configured",
  });
  const stopWatchingMetadata = watchMetadata(app);
  await app.metadataCache.load();

  const searchPlugin = app.plugins.plugins.get("search");
  if (searchPlugin instanceof SearchPlugin) {
    await searchPlugin.refreshIndex("bases-editor-shell");
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
      disposeApplicationCompatibility();
    },
  };
}
