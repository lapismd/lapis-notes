import {
  App,
  FileView,
  MemoryAppDatabase,
  MemoryVaultAdapter,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import {
  AllPropertiesViewType,
  BacklinksViewType,
  FilePropertiesViewType,
  MarkdownPlugin,
  MarkdownView,
  OutlineViewType,
  OutgoingLinksViewType,
  TagsViewType,
} from "@lapis-notes/markdown";
import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
import { RolesPlugin } from "@lapis-notes/roles";
import { SearchPlugin, SearchViewType } from "@lapis-notes/search";
import { SourceEditorDemoPlugin } from "../lapis-editor-demo/source-editor-plugin";
import { watchMetadata } from "../watch-metadata";

export type PanelDemoKind =
  | "all-properties"
  | "file-properties"
  | "outline"
  | "backlinks"
  | "outgoing-links"
  | "search"
  | "tags";

export type PanelDemoLayout =
  | "middle-top-tabs"
  | "stacked-tabs"
  | "left-sidebar"
  | "right-sidebar"
  | "bottom-panel"
  | "sidebar-group";

export const PANEL_DEMO_LAYOUTS: PanelDemoLayout[] = [
  "middle-top-tabs",
  "stacked-tabs",
  "left-sidebar",
  "right-sidebar",
  "bottom-panel",
  "sidebar-group",
];

export const PANEL_VIEW_TYPE: Record<PanelDemoKind, string> = {
  "all-properties": AllPropertiesViewType,
  "file-properties": FilePropertiesViewType,
  outline: OutlineViewType,
  backlinks: BacklinksViewType,
  "outgoing-links": OutgoingLinksViewType,
  search: SearchViewType,
  tags: TagsViewType,
};

export const PANEL_LEAF_META: Record<
  PanelDemoKind,
  { title: string; icon: string; group: string; requiresFile: boolean }
> = {
  "all-properties": {
    title: "All properties",
    icon: "archive",
    group: "Properties",
    requiresFile: false,
  },
  "file-properties": {
    title: "File properties",
    icon: "info",
    group: "Properties",
    requiresFile: true,
  },
  outline: {
    title: "Outline",
    icon: "list",
    group: "Outline",
    requiresFile: true,
  },
  backlinks: {
    title: "Backlinks",
    icon: "link-2",
    group: "Links",
    requiresFile: true,
  },
  "outgoing-links": {
    title: "Outgoing links",
    icon: "external-link",
    group: "Links",
    requiresFile: true,
  },
  search: {
    title: "Search",
    icon: "search",
    group: "Search",
    requiresFile: false,
  },
  tags: {
    title: "Tags",
    icon: "tags",
    group: "Tags",
    requiresFile: false,
  },
};

const PANEL_APP_CONFIGURATION = {
  "editor.display.showLineNumbers": true,
  "editor.defaultViewForNewTabs": "editing",
  "editor.defaultEditingMode": "live-preview",
  "markdown.mira.plugins.mermaid.enabled": true,
  "markdown.mira.plugins.ai.enabled": false,
  "outline.autoScrollToCurrentSection": false,
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
  return { id, type: "leaf", state: { type, state, icon, title } };
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
  return { ...tabs("bottom-panel", []), height: "0px" };
}

function emptyWorkspaceTabs(id = "main-empty-tabs") {
  return tabs(id, [leaf("main-empty", "Workspace", "file", "empty")]);
}

function markdownTabs(id = "main-document-tabs") {
  return tabs(id, [
    leaf("welcome", "Welcome", "file-text", "markdown", {
      file: "Notes/Welcome.md",
      mode: "live-preview",
    }),
  ]);
}

function mainContext(requiresFile: boolean) {
  return split("main", "horizontal", [
    requiresFile ? markdownTabs() : emptyWorkspaceTabs(),
  ]);
}

export function panelLayoutMarker(
  kind: PanelDemoKind,
  layout: PanelDemoLayout,
): string {
  if (layout === "stacked-tabs") return "main-stacked-tabs";
  if (layout === "bottom-panel") return `${kind}-bottom-group`;
  if (layout === "sidebar-group") return `${kind}-sidebar-group`;
  return {
    "middle-top-tabs": "panel-middle",
    "left-sidebar": "panel-left",
    "right-sidebar": "panel-right",
  }[layout];
}

export function createPanelDemoLayout(
  kind: PanelDemoKind,
  layout: PanelDemoLayout,
): Record<string, unknown> {
  const panelType = PANEL_VIEW_TYPE[kind];
  const meta = PANEL_LEAF_META[kind];
  const panel = (id: string) => leaf(id, meta.title, meta.icon, panelType);
  const contextTabs = () =>
    meta.requiresFile ? markdownTabs() : emptyWorkspaceTabs();

  if (layout === "middle-top-tabs") {
    const panelTabs = tabs("main-panel-tabs", [panel("panel-middle")]);
    return {
      main: split(
        "main",
        "horizontal",
        meta.requiresFile ? [contextTabs(), panelTabs] : [panelTabs],
        { sizes: meta.requiresFile ? [35, 65] : undefined },
      ),
      left: emptyDock("left"),
      right: emptyDock("right"),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-middle",
    };
  }

  if (layout === "stacked-tabs") {
    const panelTabs = tabs(
      "main-stacked-tabs",
      [
        leaf("stacked-workspace", "Workspace", "layout-template", "empty"),
        panel("panel-stacked"),
        leaf("stacked-reference", "Reference", "book-open", "empty"),
      ],
      { stacked: true, currentTab: 1 },
    );
    return {
      main: split(
        "main",
        "horizontal",
        meta.requiresFile ? [contextTabs(), panelTabs] : [panelTabs],
        { sizes: meta.requiresFile ? [35, 65] : undefined },
      ),
      left: emptyDock("left"),
      right: emptyDock("right"),
      bottom: emptyBottom(),
      floating: [],
      active: "panel-stacked",
    };
  }

  if (layout === "left-sidebar") {
    return {
      main: mainContext(meta.requiresFile),
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
      main: mainContext(meta.requiresFile),
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
    return {
      main: mainContext(meta.requiresFile),
      left: emptyDock("left"),
      right: emptyDock("right"),
      bottom: {
        ...tabs("bottom-panel", [
          sidebarGroup(
            `${kind}-bottom-group`,
            meta.group,
            meta.icon,
            [panel("panel-bottom")],
          ),
        ]),
        height: "22rem",
      },
      floating: [],
      active: "panel-bottom",
    };
  }

  return {
    main: mainContext(meta.requiresFile),
    left: emptyDock("left"),
    right: split(
      "right",
      "vertical",
      [
        tabs("right-panel-tabs", [
          sidebarGroup(
            `${kind}-sidebar-group`,
            meta.group,
            meta.icon,
            [panel("panel-grouped")],
          ),
        ]),
      ],
      { width: "24rem" },
    ),
    bottom: emptyBottom(),
    floating: [],
    active: "panel-grouped",
  };
}

export function createPanelDemoSeed(
  kind: PanelDemoKind,
  layout: PanelDemoLayout,
): Record<string, string | ArrayBuffer> {
  const welcomeSections =
    kind === "outline"
      ? [
          "## Links",
          "",
          "See [[Ideas]] and ![[Ideas]] while #project/alpha stays searchable.",
          "",
          "### Link details",
          "",
          "The nested heading proves disclosure and search behavior.",
          "",
          "#### Basic links",
          "",
          "A leaf child demonstrates parent-label alignment.",
          "",
          "#### Rich links",
          "",
          "##### Aliases and labels",
          "",
          "##### Embedded notes",
          "",
          "### Related notes",
          "",
          "## Checklist",
          "",
          "- Properties, Outline, Tags",
          "- Backlinks and outgoing links",
          "",
          "## Reference",
          "",
          "### Commands",
          "",
          "### Settings",
          "",
          "#### Editor behavior",
          "",
          "#### Appearance",
          "",
        ]
      : [
          "## Links",
          "",
          "See [[Ideas]] and ![[Ideas]] while #project/alpha stays searchable.",
          "",
          "### Link details",
          "",
          "The nested heading proves disclosure and search behavior.",
          "",
          "## Checklist",
          "",
          "- Properties, Outline, Tags",
          "- Backlinks and outgoing links",
          "",
        ];

  return {
    ".obsidian/app.json": JSON.stringify(PANEL_APP_CONFIGURATION, null, 2),
    ".obsidian/types.json": JSON.stringify(
      {
        types: {
          title: "text",
          aliases: "aliases",
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
      "aliases: [Lapis Home]",
      "tags: [demo, markdown, project/alpha]",
      "status: ready",
      "priority: high",
      "---",
      "",
      "# **Welcome** to Lapis Notes",
      "",
      "This seed drives focused Markdown panel stories and names Research plainly.",
      "",
      ...welcomeSections,
    ].join("\n"),
    "Notes/Ideas.markdown": [
      "---",
      "tags: [ideas, demo, project/beta]",
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
      "Lapis Home also appears as an exact alias mention.",
      "",
    ].join("\n"),
    "Notes/Research.md": [
      "---",
      "tags: [research, project/alpha]",
      "---",
      "",
      "# Research",
      "",
      "Welcome appears here without a link for unlinked backlink coverage.",
      "",
      "## Sources",
      "",
      "Review the project notes.",
      "",
    ].join("\n"),
  };
}

function findMarkdownLeaf(app: App): WorkspaceLeaf | null {
  let found: WorkspaceLeaf | null = null;
  app.workspace.iterateRootLeaves((leaf) => {
    if (!found && leaf.view instanceof MarkdownView && leaf.view.file) found = leaf;
  });
  if (found) return found;
  app.workspace.iterateRootLeaves((leaf) => {
    if (!found && leaf.view instanceof FileView && leaf.view.file) found = leaf;
  });
  return found;
}

function countPanelLeaves(app: App, panelType: string): number {
  let count = 0;
  app.workspace.iterateAllLeaves((leaf) => {
    if (leaf.view?.getViewType?.() === panelType) count += 1;
  });
  return count;
}

export async function bootPanelDemo(
  kind: PanelDemoKind,
  layout: PanelDemoLayout,
): Promise<{ app: App; dispose: () => Promise<void> }> {
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
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });

  app.plugins.registerCorePlugins([
    { plugin: SourceEditorDemoPlugin, required: true },
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
    { plugin: MarkdownLintPlugin, required: false, enabledByDefault: true },
    { plugin: SearchPlugin, required: true },
    { plugin: RolesPlugin, required: false, enabledByDefault: true },
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
  const searchPlugin = app.plugins.plugins.get("search");
  if (searchPlugin instanceof SearchPlugin) {
    await searchPlugin.refreshIndex("storybook-panel-demo");
  }
  await app.workspace.loadLayout();

  const panelType = PANEL_VIEW_TYPE[kind];
  const panelCount = countPanelLeaves(app, panelType);
  if (panelCount !== 1) {
    throw new Error(
      `Expected one ${panelType} panel leaf for ${layout}, found ${panelCount}`,
    );
  }

  const markdownLeaf = findMarkdownLeaf(app);
  if (PANEL_LEAF_META[kind].requiresFile && !markdownLeaf) {
    throw new Error(`Missing Markdown context leaf for ${kind} ${layout}`);
  }
  if (markdownLeaf) app.workspace.setActiveLeaf(markdownLeaf, { focus: false });

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
