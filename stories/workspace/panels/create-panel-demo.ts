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

export type PanelDemoLayout =
  | "comparison"
  | "middle-top-tabs"
  | "stacked-tabs"
  | "left-sidebar"
  | "right-sidebar"
  | "bottom-panel"
  | "sidebar-group";

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

type DemoLeaf = ReturnType<typeof leaf>;

function sidebarGroup(
  id: string,
  name: string,
  icon: string,
  children: DemoLeaf[],
) {
  return {
    id,
    type: "sidebar-group",
    name,
    icon,
    children,
    collapsed: Object.fromEntries(children.map((child) => [child.id, false])),
    panelSizes: Object.fromEntries(children.map((child) => [child.id, 100])),
  };
}

type DemoTabItem = DemoLeaf | ReturnType<typeof sidebarGroup>;

function tabs(
  id: string,
  children: DemoTabItem[],
  options: { stacked?: boolean; currentTab?: number } = {},
) {
  return {
    id,
    type: "tabs",
    stacked: options.stacked ?? false,
    currentTab: options.currentTab ?? 0,
    children,
  };
}

function split(
  id: string,
  direction: "horizontal" | "vertical",
  children: ReturnType<typeof tabs>[],
  options: { width?: string; sizes?: number[] } = {},
) {
  return {
    id,
    type: "split",
    direction,
    sizes:
      options.sizes ??
      children.map(() => 100 / Math.max(children.length, 1)),
    children,
    ...(options.width ? { width: options.width } : {}),
  };
}

function emptyDock(id: string) {
  return split(id, "vertical", [], { width: "0px" });
}

function emptyBottom() {
  return {
    ...tabs("bottom-panel", []),
    height: "0px",
  };
}

function minimalMain() {
  return split("main", "horizontal", [
    tabs("main-empty-tabs", [
      leaf("main-empty", "Workspace", "file", "empty"),
    ]),
  ]);
}

export function createPanelDemoLayout(
  kind: PanelDemoKind,
  layout: PanelDemoLayout,
): Record<string, unknown> {
  const panelType = PANEL_VIEW_TYPE[kind];
  const panelMeta = PANEL_LEAF_META[kind];
  const panel = (id: string) =>
    leaf(id, panelMeta.title, panelMeta.icon, panelType);

  if (layout === "comparison") {
    return {
      main: split(
        "main",
        "horizontal",
        [
          tabs("main-editor-tabs", [
            leaf("welcome", "Welcome", "file-text", "markdown", {
              file: "Notes/Welcome.md",
              mode: "live-preview",
            }),
          ]),
          tabs("main-panel-tabs", [panel("panel-main")]),
        ],
        { sizes: [55, 45] },
      ),
      left: emptyDock("left"),
      right: split(
        "right",
        "vertical",
        [tabs("right-panel-tabs", [panel("panel-sidebar")])],
        { width: "20rem" },
      ),
      bottom: emptyBottom(),
      floating: [],
      active: "welcome",
    };
  }

  if (layout === "middle-top-tabs") {
    return {
      main: split("main", "horizontal", [
        tabs("main-panel-tabs", [panel("panel-middle")]),
      ]),
      left: emptyDock("left"),
      right: emptyDock("right"),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-middle",
    };
  }

  if (layout === "stacked-tabs") {
    return {
      main: split("main", "horizontal", [
        tabs(
          "main-stacked-tabs",
          [
            leaf("stacked-workspace", "Workspace", "layout-template", "empty"),
            panel("panel-stacked"),
            leaf("stacked-reference", "Reference", "book-open", "empty"),
          ],
          { stacked: true, currentTab: 1 },
        ),
      ]),
      left: emptyDock("left"),
      right: emptyDock("right"),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-stacked",
    };
  }

  if (layout === "left-sidebar") {
    return {
      main: minimalMain(),
      left: split(
        "left",
        "vertical",
        [tabs("left-panel-tabs", [panel("panel-left")])],
        { width: "22rem" },
      ),
      right: emptyDock("right"),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-left",
    };
  }

  if (layout === "right-sidebar") {
    return {
      main: minimalMain(),
      left: emptyDock("left"),
      right: split(
        "right",
        "vertical",
        [tabs("right-panel-tabs", [panel("panel-right")])],
        { width: "22rem" },
      ),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-right",
    };
  }

  if (layout === "bottom-panel") {
    const groupedPanel = panel("panel-bottom");
    return {
      main: minimalMain(),
      left: emptyDock("left"),
      right: emptyDock("right"),
      bottom: {
        ...tabs("bottom-panel", [
          sidebarGroup(
            "all-properties-bottom-group",
            "Properties",
            "archive",
            [groupedPanel],
          ),
        ]),
        height: "22rem",
      },
      floating: [],
      active: groupedPanel.id,
    };
  }

  const groupedPanel = panel("panel-grouped");
  return {
    main: minimalMain(),
    left: emptyDock("left"),
    right: split(
      "right",
      "vertical",
      [
        tabs("right-panel-tabs", [
          sidebarGroup(
            "all-properties-group",
            "Properties",
            "archive",
            [groupedPanel],
          ),
        ]),
      ],
      { width: "24rem" },
    ),
    bottom: emptyBottom(),
    floating: [],
    active: groupedPanel.id,
  };
}

/**
 * Seed a metadata-rich vault plus one persisted workspace layout. The
 * comparison layout remains for the existing panel stories; the All
 * Properties spike selects one real movable surface at a time.
 */
export function createPanelDemoSeed(
  kind: PanelDemoKind,
  layout: PanelDemoLayout = "comparison",
): Record<string, string | ArrayBuffer> {
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
      createPanelDemoLayout(kind, layout),
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

export async function bootPanelDemo(
  kind: PanelDemoKind,
  layout: PanelDemoLayout = "comparison",
): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const previousApp = globalThis.app;
  const adapter = new MemoryVaultAdapter(createPanelDemoSeed(kind, layout), {
    name: `Lapis Panel ${kind} ${layout}`,
    vaultId: `lapis-panel-${kind}-${layout}`,
    clock: 1_700_000_000_000,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase(`lapis-panel-${kind}-${layout}`),
    workspaceShell: {
      application: { name: "Lapis Notes" },
    },
    markdownRenderer: async () => {},
  });

  // LN-MD-012 order: source → markdown → tags (panel host last).
  const corePlugins = [
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
  ];
  if (layout === "comparison") {
    corePlugins.push({ plugin: PanelHostPlugin, required: true });
  }
  app.plugins.registerCorePlugins(corePlugins);

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

  const panelType = PANEL_VIEW_TYPE[kind];
  const markdownLeaf = findMarkdownLeaf(app);
  if (markdownLeaf) {
    app.workspace.setActiveLeaf(markdownLeaf, { focus: true });
  }

  // Retain the existing defensive repair only for the legacy comparison
  // fixtures. Focused placement stories must hydrate their exact seeded shape.
  if (layout === "comparison" && countPanelLeaves(app, panelType) < 2) {
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

  const expectedPanelCount = layout === "comparison" ? 2 : 1;
  const panelCount = countPanelLeaves(app, panelType);
  if (panelCount !== expectedPanelCount) {
    throw new Error(
      `Expected ${expectedPanelCount} ${panelType} panel leaf/leaves for ${layout}, found ${panelCount}`,
    );
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
