import {
  App,
  FileView,
  MemoryAppDatabase,
  MemoryVaultAdapter,
  Plugin,
  type PluginManifest,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { MarkdownPlugin, MarkdownView } from "@lapis-notes/markdown";
import { TagsDemoPlugin } from "../lapis-editor-demo/tags-plugin";
import { SourceEditorDemoPlugin } from "../lapis-editor-demo/source-editor-plugin";
import { watchMetadata } from "../watch-metadata";

export type PanelDemoKind =
  | "all-properties"
  | "file-properties"
  | "outline"
  | "backlinks"
  | "outgoing-links"
  | "tags";

const PANEL_VIEW_TYPE: Record<PanelDemoKind, string> = {
  "all-properties": "all-properties",
  "file-properties": "file:properties",
  outline: "file:outline",
  backlinks: "file:backlinks",
  "outgoing-links": "file:outgoing-links",
  tags: "tags",
};

const PANEL_LEAF_META: Record<
  PanelDemoKind,
  { title: string; icon: string }
> = {
  "all-properties": { title: "All properties", icon: "archive" },
  "file-properties": { title: "File properties", icon: "info" },
  outline: { title: "Outline", icon: "list" },
  backlinks: { title: "Backlinks", icon: "link-2" },
  "outgoing-links": { title: "Outgoing links", icon: "links" },
  tags: { title: "Tags", icon: "tags" },
};

const PANEL_APP_CONFIGURATION = {
  "editor.display.showLineNumbers": true,
  "editor.defaultViewForNewTabs": "editing",
  "editor.defaultEditingMode": "live-preview",
  "markdown.mira.plugins.mermaid.enabled": true,
  "markdown.mira.plugins.ai.enabled": false,
  "appearence.interface.showInlineTitle": true,
  "appearence.interface.showTabTitleBar": true,
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

/**
 * Seed vault + layout:
 * - No left sidebar (width 0)
 * - Main horizontal split: Markdown (Mira) | panel leaf
 * - Right sidebar: same panel leaf for surface comparison
 */
export function createPanelDemoSeed(
  kind: PanelDemoKind,
): Record<string, string | ArrayBuffer> {
  const panelType = PANEL_VIEW_TYPE[kind];
  const panelMeta = PANEL_LEAF_META[kind];

  return {
    ".obsidian/app.json": JSON.stringify(PANEL_APP_CONFIGURATION, null, 2),
    ".obsidian/types.json": JSON.stringify(
      {
        types: {
          title: "text",
          tags: "tags",
          status: "text",
          priority: "text",
          area: "text",
        },
      },
      null,
      2,
    ),
    ".obsidian/workspace.json": JSON.stringify(
      {
        main: {
          id: "main",
          type: "split",
          direction: "horizontal",
          sizes: [55, 45],
          children: [
            tabs("main-editor-tabs", [
              leaf("welcome", "Welcome", "file-text", "markdown", {
                file: "Notes/Welcome.md",
                mode: "live-preview",
              }),
            ]),
            tabs("main-panel-tabs", [
              leaf(
                "panel-main",
                panelMeta.title,
                panelMeta.icon,
                panelType,
              ),
            ]),
          ],
        },
        left: {
          id: "left",
          type: "split",
          direction: "vertical",
          sizes: [100],
          children: [],
          width: "0px",
        },
        right: {
          id: "right",
          type: "split",
          direction: "vertical",
          sizes: [100],
          children: [
            tabs("right-panel-tabs", [
              leaf(
                "panel-sidebar",
                panelMeta.title,
                panelMeta.icon,
                panelType,
              ),
            ]),
          ],
          width: "20rem",
        },
        bottom: {
          ...tabs("bottom-panel", []),
          height: "0px",
        },
        floating: [],
        active: "welcome",
      },
      null,
      2,
    ),
    "Notes/Welcome.md": [
      "---",
      "title: Welcome",
      "tags:",
      "  - demo",
      "  - markdown",
      "status: ready",
      "priority: high",
      "---",
      "",
      "# Welcome to Lapis Notes",
      "",
      "This seed drives Markdown panel Storybook stories.",
      "",
      "## Links",
      "",
      "See also [[Ideas]] and #project/alpha.",
      "",
      "## Checklist",
      "",
      "- Properties, Outline, Tags",
      "- Backlinks and outgoing links",
      "",
    ].join("\n"),
    "Notes/Ideas.markdown": [
      "---",
      "tags: [ideas, demo]",
      "area: research",
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
  };
}

class PanelHostPlugin extends Plugin {
  constructor(app: App) {
    super(app, {
      id: "lapis-panel-host",
      name: "Panel host",
      author: "Lapis Notes",
      version: "0.0.1",
      minAppVersion: "0.0.1",
      description:
        "Keeps the seeded Markdown leaf active so file-scoped panels resolve.",
    } satisfies PluginManifest);
  }

  async onload(): Promise<void> {
    const markdownLeaf = findMarkdownLeaf(this.app);
    if (markdownLeaf) {
      this.app.workspace.setActiveLeaf(markdownLeaf, { focus: true });
      return;
    }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: "markdown",
      state: { file: "Notes/Welcome.md", mode: "live-preview" },
    });
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }
}

function findMarkdownLeaf(app: App): WorkspaceLeaf | null {
  let found: WorkspaceLeaf | null = null;
  app.workspace.iterateRootLeaves((leaf) => {
    if (!found && leaf.view instanceof MarkdownView && leaf.view.file) {
      found = leaf;
    }
  });
  if (found) return found;
  app.workspace.iterateRootLeaves((leaf) => {
    if (!found && leaf.view instanceof FileView && leaf.view.file) {
      found = leaf;
    }
  });
  return found;
}

function countPanelLeaves(app: App, panelType: string): number {
  let count = 0;
  app.workspace.iterateAllLeaves((leaf) => {
    if (leaf.view?.getViewType?.() === panelType) {
      count += 1;
    }
  });
  return count;
}

export async function bootPanelDemo(kind: PanelDemoKind): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const previousApp = globalThis.app;
  const adapter = new MemoryVaultAdapter(createPanelDemoSeed(kind), {
    name: `Lapis Panel ${kind}`,
    vaultId: `lapis-panel-${kind}`,
    clock: 1_700_000_000_000,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase(`lapis-panel-${kind}`),
    workspaceShell: {
      application: { name: "Lapis Notes" },
    },
    markdownRenderer: async () => {},
  });

  // LN-MD-012 order: source → markdown → tags (panel host last).
  app.plugins.registerCorePlugins([
    { plugin: SourceEditorDemoPlugin, required: true },
    {
      plugin: MarkdownPlugin,
      required: false,
      enabledByDefault: true,
    },
    {
      plugin: TagsDemoPlugin,
      required: false,
      enabledByDefault: true,
    },
    { plugin: PanelHostPlugin, required: true },
  ]);

  globalThis.app = app;
  await app.vault.load();
  await app.configuration.load();
  await app.plugins.loadPlugins({
    communityPlugins: "disabled",
    optionalCorePlugins: "configured",
  });
  const stopWatchingMetadata = watchMetadata(app);
  await app.metadataCache.load();
  await app.workspace.loadLayout();

  app.workspace.leftSplit.collapse();
  app.workspace.rightSplit.expand();

  const panelType = PANEL_VIEW_TYPE[kind];
  const markdownLeaf = findMarkdownLeaf(app);
  if (markdownLeaf) {
    app.workspace.setActiveLeaf(markdownLeaf, { focus: true });
  }

  // Ensure both comparison surfaces have the panel view.
  if (countPanelLeaves(app, panelType) < 2) {
    const right =
      app.workspace.getRightLeaf(false) ?? app.workspace.getLeaf(true);
    await right.setViewState({ type: panelType });
    app.workspace.revealLeaf(right);

    if (markdownLeaf && countPanelLeaves(app, panelType) < 2) {
      const mainPanel = app.workspace.createLeafBySplit(
        markdownLeaf,
        "horizontal",
      );
      await mainPanel.setViewState({ type: panelType });
    }
  }

  if (markdownLeaf) {
    app.workspace.setActiveLeaf(markdownLeaf, { focus: false });
  }

  return {
    app,
    dispose: async () => {
      stopWatchingMetadata();
      for (const plugin of [...app.plugins.corePlugins].reverse()) {
        await plugin.disable().catch(() => undefined);
      }
      await app.workspace.disposeWorkspaceHost();
      if (globalThis.app === app) {
        globalThis.app = previousApp;
      }
    },
  };
}
