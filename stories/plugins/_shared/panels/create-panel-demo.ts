import {
  App,
  FileView,
  installApplicationCompatibility,
  md5,
  MemoryAppDatabase,
  MemoryVaultAdapter,
  TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { BookmarksPlugin, BookmarksViewType } from "@lapis-notes/bookmarks";
import {
  GraphPlugin,
  GraphViewType,
  LocalGraphViewType,
} from "@lapis-notes/graph";
import "@lapis-notes/graph/styles.css";
import { HistoryPlugin, HistoryViewType } from "@lapis-notes/history";
import {
  AiCatalogViewType,
  AiHistoryViewType,
  AiPlugin,
  AiViewType,
} from "@lapis-notes/ai";
import {
  FileExplorerPlugin,
  FileExplorerViewType,
} from "@lapis-notes/file-explorer";
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
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
import { SpellcheckPlugin } from "@lapis-notes/spellcheck";
import { SearchPlugin, SearchViewType } from "@lapis-notes/search";
import { watchMetadata } from "../../../workspace/watch-metadata";

export type PanelDemoKind =
  | "ai-history"
  | "ai-catalog"
  | "ai-chat"
  | "all-properties"
  | "explorer"
  | "file-properties"
  | "outline"
  | "backlinks"
  | "outgoing-links"
  | "search"
  | "graph"
  | "local-graph"
  | "bookmarks"
  | "history"
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
  "ai-history": AiHistoryViewType,
  "ai-catalog": AiCatalogViewType,
  "ai-chat": AiViewType,
  "all-properties": AllPropertiesViewType,
  explorer: FileExplorerViewType,
  "file-properties": FilePropertiesViewType,
  outline: OutlineViewType,
  backlinks: BacklinksViewType,
  "outgoing-links": OutgoingLinksViewType,
  search: SearchViewType,
  graph: GraphViewType,
  "local-graph": LocalGraphViewType,
  bookmarks: BookmarksViewType,
  history: HistoryViewType,
  tags: TagsViewType,
};

export const PANEL_LEAF_META: Record<
  PanelDemoKind,
  { title: string; icon: string; group: string; requiresFile: boolean }
> = {
  "ai-history": {
    title: "AI conversations",
    icon: "history",
    group: "AI",
    requiresFile: true,
  },
  "ai-catalog": {
    title: "Catalog",
    icon: "library",
    group: "AI",
    requiresFile: true,
  },
  "ai-chat": {
    title: "AI chat",
    icon: "bot",
    group: "AI",
    requiresFile: false,
  },
  "all-properties": {
    title: "All properties",
    icon: "archive",
    group: "Properties",
    requiresFile: false,
  },
  explorer: {
    title: "Files",
    icon: "folder-closed",
    group: "Explorer",
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
  graph: {
    title: "Graph",
    icon: "waypoints",
    group: "Graph",
    requiresFile: false,
  },
  "local-graph": {
    title: "Local graph",
    icon: "git-branch-plus",
    group: "Graph",
    requiresFile: true,
  },
  bookmarks: {
    title: "Bookmarks",
    icon: "bookmark",
    group: "Bookmarks",
    requiresFile: false,
  },
  history: {
    title: "History",
    icon: "history",
    group: "History",
    requiresFile: true,
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
  "workspace.fileExplorer.showHiddenFiles": false,
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
      options.sizes ?? children.map(() => 100 / Math.max(children.length, 1)),
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
          sidebarGroup(`${kind}-bottom-group`, meta.group, meta.icon, [
            panel("panel-bottom"),
          ]),
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
          sidebarGroup(`${kind}-sidebar-group`, meta.group, meta.icon, [
            panel("panel-grouped"),
          ]),
        ]),
      ],
      { width: "24rem" },
    ),
    bottom: emptyBottom(),
    floating: [],
    active: "panel-grouped",
  };
}

const HISTORY_WRAP_LINE =
  "History compare wrap probe: " + "word ".repeat(40).trim();

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
          "The unresolved [[Missing graph note]] remains visible in Graph.",
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
          "The unresolved [[Missing graph note]] remains visible in Graph.",
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
    ".obsidian/app.json": JSON.stringify(
      {
        ...PANEL_APP_CONFIGURATION,
        ...(kind === "bookmarks"
          ? { pluginData: { bookmarks: createBookmarksDocument() } }
          : {}),
      },
      null,
      2,
    ),
    ".env": "DEMO=1\n",
    ".obsidian/types.json": JSON.stringify(
      {
        types: {
          title: "text",
          aliases: "aliases",
          tags: "tags",
          owners: "multitext",
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
      'aliases: [Lapis Home, "[[Ideas|Idea inbox]]"]',
      'tags: [demo, markdown, project/alpha, "project alpha"]',
      "owners: [Ada Lovelace, Grace Hopper]",
      "status: ready",
      "priority: high",
      "---",
      "",
      "# **Welcome** to Lapis Notes",
      "",
      "This seed drives focused Markdown panel stories and names Research plainly.",
      "",
      ...welcomeSections,
      ...(kind === "history" ? ["", HISTORY_WRAP_LINE, ""] : []),
    ].join("\n"),
    "Notes/Ideas.markdown": [
      "---",
      "tags: [ideas, demo, project/beta]",
      "owners: [Grace Hopper, Margaret Hamilton]",
      "status: planned",
      "area: research",
      "---",
      "",
      "# Ideas",
      "",
      "## Capture",
      "",
      "Link back to [[Welcome]] and embed ![[Assets/map.png]] from the ideas note.",
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
    "Notes/FilenameOnly.md":
      "# Quiet note\n\nThe body deliberately omits the filename token.\n",
    "Assets/map.png": new Uint8Array([137, 80, 78, 71]).buffer,
    ...(kind === "ai-history" ? createAiHistorySeed() : {}),
    ...(kind === "ai-catalog" ? createAiCatalogSeed() : {}),
    ...(kind === "history" ? createHistorySeed() : {}),
    ...(kind === "bookmarks" ? createBookmarksSeed() : {}),
  };
}

function createBookmarksDocument() {
  return {
    items: [
      {
        type: "file",
        ctime: 1_700_000_000_001,
        path: "Notes/Welcome.md",
        title: "Welcome",
      },
      {
        type: "file",
        ctime: 1_700_000_000_002,
        path: "Notes/Welcome.md",
        subpath: "#Links",
        title: "Welcome links",
      },
      {
        type: "folder",
        ctime: 1_700_000_000_003,
        path: "Notes",
      },
      {
        type: "group",
        ctime: 1_700_000_000_004,
        title: "Reading list",
        items: [],
      },
      {
        type: "search",
        ctime: 1_700_000_000_005,
        query: "Welcome",
        title: "Find Welcome",
      },
      {
        type: "url",
        ctime: 1_700_000_000_006,
        url: "https://example.com",
        title: "Example",
      },
      {
        type: "graph",
        ctime: 1_700_000_000_007,
        title: "Vault graph",
      },
    ],
  };
}

function createBookmarksSeed(): Record<string, string> {
  return {
    ".obsidian/bookmarks.json": JSON.stringify(
      createBookmarksDocument(),
      null,
      2,
    ),
  };
}

function createHistorySeed(): Record<string, string> {
  return {
    ".lapis/ignored.md": "Internal conversation that History must skip.\n",
    ".jj/config": "jj-metadata-should-not-be-snapshotted\n",
  };
}

async function seedHistoryRevisions(app: App): Promise<void> {
  const path = "Notes/Welcome.md";
  const file = app.vault.getFileByPath(path);
  const current =
    file instanceof TFile ? await app.vault.cachedRead(file) : "# Welcome\n";
  const older = `${current}\n\nOlder tracked snapshot.\n${HISTORY_WRAP_LINE}\n`;
  await app.appDatabase.storeFileHistoryRevision({
    path,
    eventType: "baseline",
    createdAt: 1_700_000_000_000,
    contentHash: md5(older),
    content: older,
    maxRevisions: 50,
  });
  await app.appDatabase.storeFileHistoryRevision({
    path,
    eventType: "modify",
    createdAt: 1_700_000_100_000,
    contentHash: md5(current),
    content: current,
    maxRevisions: 50,
  });
}

function createAiCatalogSeed(): Record<string, string> {
  return {
    "Notes/.agents/skills/daily/SKILL.md": [
      "---",
      "name: daily",
      "description: Daily notes",
      "---",
      "",
      "Daily skill body.",
      "",
    ].join("\n"),
    "Notes/.agents/commands/review.md": [
      "---",
      "description: Review the current note for gaps",
      "kind: prompt",
      "---",
      "",
      "Review $ARGUMENTS. Report missing tests first.",
      "",
    ].join("\n"),
  };
}

function createAiHistorySeed(): Record<string, string> {
  return {
    ...conversationSeed({
      scopeDir: "Notes",
      id: "123e4567-e89b-42d3-a456-426614174000",
      title: "Summarize project notes",
      status: "active",
      message: "Summarize the project notes and identify the next milestone.",
      updatedAt: "2026-08-16T11:30:00.000Z",
    }),
    ...conversationSeed({
      scopeDir: "Notes",
      id: "223e4567-e89b-42d3-a456-426614174001",
      title: "Archived planning chat",
      status: "archived",
      message: "Review the planning notes from last week.",
      updatedAt: "2026-08-15T09:00:00.000Z",
    }),
    ...conversationSeed({
      scopeDir: "Projects/Atlas",
      id: "323e4567-e89b-42d3-a456-426614174002",
      title: "Fix parser errors",
      status: "active",
      message: "Find the parser error in the Atlas import pipeline.",
      updatedAt: "2026-08-16T10:00:00.000Z",
    }),
    ...conversationSeed({
      scopeDir: "",
      id: "423e4567-e89b-42d3-a456-426614174003",
      title: "Plan vault release",
      status: "active",
      message: "Draft a release checklist for the whole vault.",
      updatedAt: "2026-08-14T13:00:00.000Z",
    }),
  };
}

function conversationSeed(input: {
  scopeDir: string;
  id: string;
  title: string;
  status: "active" | "archived";
  message: string;
  updatedAt: string;
}): Record<string, string> {
  const scopePrefix = input.scopeDir ? `${input.scopeDir}/` : "";
  const root = `${scopePrefix}.lapis/agents/sessions/${input.id}`;
  return {
    [`${root}/metadata.yaml`]: [
      "schemaVersion: 1",
      `id: ${input.id}`,
      `title: ${JSON.stringify(input.title)}`,
      'createdAt: "2026-08-14T08:00:00.000Z"',
      `updatedAt: ${JSON.stringify(input.updatedAt)}`,
      `status: ${input.status}`,
      "",
    ].join("\n"),
    [`${root}/agents.jsonl`]: "",
    [`${root}/transcript.jsonl`]: `${JSON.stringify({
      schemaVersion: 1,
      id: `message-${input.id}`,
      type: "message",
      role: "user",
      text: input.message,
      createdAt: input.updatedAt,
    })}\n`,
  };
}

function findMarkdownLeaf(app: App): WorkspaceLeaf | null {
  let found: WorkspaceLeaf | null = null;
  app.workspace.iterateRootLeaves((leaf) => {
    if (!found && leaf.view instanceof MarkdownView && leaf.view.file)
      found = leaf;
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
  const disposeApplicationCompatibility = installApplicationCompatibility(app);

  app.plugins.registerCorePlugins([
    { plugin: SourceEditorPlugin, required: true },
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
    { plugin: MarkdownLintPlugin, required: false, enabledByDefault: true },
    { plugin: SpellcheckPlugin, required: false, enabledByDefault: true },
    { plugin: FileExplorerPlugin, required: false, enabledByDefault: true },
    { plugin: SearchPlugin, required: false, enabledByDefault: true },
    {
      plugin: GraphPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
    { plugin: BookmarksPlugin, required: false, enabledByDefault: true },
    { plugin: HistoryPlugin, required: false, enabledByDefault: true },
    {
      plugin: AiPlugin,
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
  const persistedMetadata = await app.metadataCache.queryMetadataPage({
    limit: 100,
  });
  const persistedPaths = new Set(
    persistedMetadata.rows.map((row) => row.file.path),
  );
  for (const expectedPath of [
    "Notes/Welcome.md",
    "Notes/Ideas.markdown",
    "Notes/Research.md",
  ]) {
    if (!persistedPaths.has(expectedPath)) {
      throw new Error(
        `Panel fixture metadata index is missing ${expectedPath}; indexed ${[...persistedPaths].join(", ") || "nothing"}`,
      );
    }
  }
  await app.metadataTypeManager.updateProperties();
  const searchPlugin = app.plugins.plugins.get("search");
  if (searchPlugin instanceof SearchPlugin) {
    await searchPlugin.refreshIndex("storybook-panel-demo");
  }
  const persistedTags = await app.metadataCache.queryFacets({
    kind: "tag",
    limit: 100,
  });
  if (!persistedTags.some((tag) => tag.value === "demo")) {
    throw new Error(
      `Panel fixture metadata facets are incomplete; indexed tags ${persistedTags.map((tag) => String(tag.value)).join(", ") || "nothing"}`,
    );
  }
  if (kind === "history") {
    await seedHistoryRevisions(app);
  }
  const aiPlugin = app.plugins.plugins.get("ai");
  if (aiPlugin instanceof AiPlugin) {
    await aiPlugin.updateSettings({ defaultRuntime: "fake" });
    await aiPlugin.conversationIndex.rebuild();
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
      disposeApplicationCompatibility();
    },
  };
}
