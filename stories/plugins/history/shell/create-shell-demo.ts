import {
  App,
  installApplicationCompatibility,
  md5,
  MemoryAppDatabase,
  MemoryVaultAdapter,
} from "@lapis-notes/api";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { HistoryPlugin } from "@lapis-notes/history";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import { SearchPlugin } from "@lapis-notes/search";
import { watchMetadata } from "../../../workspace/watch-metadata";

export const HISTORY_SHELL_CONFIGURATION = {
  "appearence.interface.showTabTitleBar": true,
  "workspace.fileExplorer.autoRevealCurrentFile": true,
};

export const HISTORY_SHELL_PATH = "Notes/Welcome.md";
export const HISTORY_SHELL_SECTIONS = [
  "Overview",
  "Setup",
  "Tasks",
  "Notes",
  "References",
] as const;

function welcomeNote(
  sections: Partial<Record<(typeof HISTORY_SHELL_SECTIONS)[number], string>>,
): string {
  const body = HISTORY_SHELL_SECTIONS.filter((name) => sections[name]).map(
    (name) => `## ${name}\n\n${sections[name]!.trim()}\n`,
  );
  return ["---", "title: Welcome", "---", "", "# Welcome", "", ...body].join(
    "\n",
  );
}

const HISTORY_SHELL_REVISIONS: Array<{
  eventType: "baseline" | "modify";
  createdAt: number;
  content: string;
}> = [
  {
    eventType: "baseline",
    createdAt: 1_700_000_000_000,
    content: welcomeNote({
      Overview:
        "Lapis Notes is a local-first workspace for Markdown notes and daily planning.",
    }),
  },
  {
    eventType: "modify",
    createdAt: 1_700_000_360_000,
    content: welcomeNote({
      Overview:
        "Lapis Notes is a local-first workspace for Markdown notes and daily planning.",
      Setup: "Clone the vault and open it in the desktop host.",
    }),
  },
  {
    eventType: "modify",
    createdAt: 1_700_000_720_000,
    content: welcomeNote({
      Overview:
        "Lapis Notes is a local-first workspace for Markdown notes and daily planning.",
      Setup: "Clone the vault and open it in the desktop host.",
      Tasks: [
        "- [ ] Write the project overview",
        "- [ ] List the first setup steps",
      ].join("\n"),
    }),
  },
  {
    eventType: "modify",
    createdAt: 1_700_001_080_000,
    content: welcomeNote({
      Overview:
        "Lapis Notes is a local-first workspace for Markdown notes, daily planning, and file history.",
      Setup: "Clone the vault and open it in the desktop host.",
      Tasks: [
        "- [x] Write the project overview",
        "- [ ] List the first setup steps",
        "- [ ] Capture meeting notes",
      ].join("\n"),
    }),
  },
  {
    eventType: "modify",
    createdAt: 1_700_001_440_000,
    content: welcomeNote({
      Overview:
        "Lapis Notes is a local-first workspace for Markdown notes, daily planning, and file history.",
      Setup: "Clone the vault and open it in the desktop host.",
      Tasks: [
        "- [x] Write the project overview",
        "- [ ] List the first setup steps",
        "- [ ] Capture meeting notes",
      ].join("\n"),
      Notes:
        "Keep section edits as separate revisions when they land outside the merge window.",
    }),
  },
  {
    eventType: "modify",
    createdAt: 1_700_001_800_000,
    content: welcomeNote({
      Overview:
        "Lapis Notes is a local-first workspace for Markdown notes, daily planning, and file history.",
      Setup:
        "Clone the vault, open it in the desktop host, and enable History.",
      Tasks: [
        "- [x] Write the project overview",
        "- [x] List the first setup steps",
        "- [ ] Capture meeting notes",
        "- [ ] Add references",
      ].join("\n"),
      Notes:
        "Keep section edits as separate revisions when they land outside the merge window.",
      References: [
        "- History plugin specification",
        "- Design Core FileDiff",
      ].join("\n"),
    }),
  },
];

export const HISTORY_SHELL_NOTE =
  HISTORY_SHELL_REVISIONS[HISTORY_SHELL_REVISIONS.length - 1]!.content;

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

export function createHistoryShellLayout() {
  return {
    main: {
      id: "main",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        tabs("main-tabs", [
          leaf("welcome", "Welcome", "file-text", "markdown", {
            file: HISTORY_SHELL_PATH,
            mode: "live-preview",
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
          leaf("history", "History", "history", "history"),
          leaf("search", "Search", "search", "search", {
            query: "Welcome",
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
    active: "welcome",
  };
}

export function createHistoryShellSeed(): Record<string, string | ArrayBuffer> {
  return {
    ".obsidian/app.json": JSON.stringify(HISTORY_SHELL_CONFIGURATION, null, 2),
    ".obsidian/workspace.json": JSON.stringify(
      createHistoryShellLayout(),
      null,
      2,
    ),
    [HISTORY_SHELL_PATH]: HISTORY_SHELL_NOTE,
  };
}

async function seedHistoryRevisions(app: App): Promise<void> {
  for (const revision of HISTORY_SHELL_REVISIONS) {
    await app.appDatabase.storeFileHistoryRevision({
      path: HISTORY_SHELL_PATH,
      eventType: revision.eventType,
      createdAt: revision.createdAt,
      contentHash: md5(revision.content),
      content: revision.content,
      maxRevisions: 50,
    });
  }
}

async function openHistoryCompare(app: App): Promise<void> {
  const plugin = app.plugins.plugins.get("history");
  if (!(plugin instanceof HistoryPlugin)) return;
  const history = await app.appDatabase.getFileHistory(HISTORY_SHELL_PATH);
  const revisions = [...(history?.revisions ?? [])].sort(
    (left, right) => right.createdAt - left.createdAt,
  );
  const newest = revisions[0];
  const oldest = revisions[revisions.length - 1];
  if (!newest || !oldest || newest.revisionId === oldest.revisionId) return;
  await plugin.openHistoryCompareView({
    filePath: HISTORY_SHELL_PATH,
    revisionId: newest.revisionId,
    compareMode: "selected",
    otherRevisionId: oldest.revisionId,
    sourceLeafId: app.workspace.getLeavesOfType("markdown")[0]?.id,
  });
}

export async function bootHistoryShellDemo(): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const adapter = new MemoryVaultAdapter(createHistoryShellSeed(), {
    name: "Lapis History Shell",
    vaultId: "lapis-history-shell",
    clock: 1_700_000_000_000,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("lapis-history-shell"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });
  const disposeApplicationCompatibility = installApplicationCompatibility(app);

  app.plugins.registerCorePlugins([
    { plugin: SourceEditorPlugin, required: true },
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
      plugin: HistoryPlugin,
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
    await searchPlugin.refreshIndex("history-shell");
  }
  await seedHistoryRevisions(app);
  await app.workspace.loadLayout();
  await openHistoryCompare(app);

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
