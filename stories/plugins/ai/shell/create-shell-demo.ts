import {
  App,
  installApplicationCompatibility,
  MemoryAppDatabase,
  MemoryVaultAdapter,
} from "@lapis-notes/api";
import { AiPlugin, AiViewType } from "@lapis-notes/ai";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SearchPlugin } from "@lapis-notes/search";
import { SourceEditorDemoPlugin } from "../../../workspace/lapis-editor-demo/source-editor-plugin";
import { watchMetadata } from "../../../workspace/watch-metadata";

export const AI_WORKSPACE_CONFIGURATION = {
  "appearence.interface.showTabTitleBar": true,
};

export type AiWorkspaceDemoOptions = {
  defaultRuntime?: "fake" | "acp";
  vaultId?: string;
  persistVaultData?: boolean;
  scenario?: AiWorkspaceScenario;
  modelCatalogGate?: Promise<void>;
};

export type AiWorkspaceScenario =
  | "default"
  | "initializing"
  | "local-conversations"
  | "agent-switching"
  | "recovery";

export const LOCAL_CONVERSATION_ID = "123e4567-e89b-42d3-a456-426614174000";
const ARCHIVED_CONVERSATION_ID = "223e4567-e89b-42d3-a456-426614174001";
const RECOVERY_CONVERSATION_ID = "323e4567-e89b-42d3-a456-426614174002";

export { isLiveAgentAttachConfigured } from "../live-agent-attach";

export function createAiWorkspacePluginData(
  defaultRuntime: "fake" | "acp" = "fake",
) {
  return {
    settings: {
      defaultRuntime,
      acpAgent: "codex",
      defaultModel: "gpt-5.6-sol",
      thinking: "medium",
    },
  };
}

export const AI_WORKSPACE_PLUGIN_DATA = createAiWorkspacePluginData("fake");

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

function split(
  id: string,
  direction: "horizontal" | "vertical",
  children: unknown[],
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    type: "split",
    direction,
    sizes: children.length > 0 ? [100] : [],
    children,
    ...extra,
  };
}

export function createAiWorkspaceLayout(initialLocation?: {
  scopeDir: string;
  conversationId: string;
}) {
  return {
    main: split("main", "horizontal", [
      tabs("main-tabs", [
        leaf("ai-chat", "AI", "sparkles", "ai", initialLocation),
      ]),
    ]),
    left: split(
      "left",
      "vertical",
      [
        tabs("left-panel-tabs", [
          leaf("file-explorer", "Files", "folder-closed", "file-explorer"),
        ]),
      ],
      { width: "17rem" },
    ),
    right: split(
      "right",
      "vertical",
      [
        tabs("right-panel-tabs", [
          leaf("search", "Search", "search", "search", { query: "TODO" }),
        ]),
      ],
      { width: "0px" },
    ),
    bottom: { ...tabs("bottom-panel", []), height: "0px" },
    floating: [],
    active: "ai-chat",
  };
}

export function createAiWorkspaceSeed(
  pluginData = AI_WORKSPACE_PLUGIN_DATA,
  scenario: AiWorkspaceScenario = "default",
): Record<string, string> {
  const initialLocation =
    scenario === "agent-switching"
      ? { scopeDir: "Notes", conversationId: LOCAL_CONVERSATION_ID }
      : scenario === "recovery"
        ? { scopeDir: "Notes", conversationId: RECOVERY_CONVERSATION_ID }
        : undefined;
  return {
    ".obsidian/app.json": JSON.stringify(AI_WORKSPACE_CONFIGURATION, null, 2),
    ".obsidian/workspace.json": JSON.stringify(
      createAiWorkspaceLayout(initialLocation),
      null,
      2,
    ),
    ".obsidian/ai.json": JSON.stringify(pluginData, null, 2),
    "Notes/Welcome.md": "# Welcome\n\nAsk the AI chat in the workspace.\n",
    "Notes/alpha.md": "# Alpha\n\nTODO: summarize this note.\n",
    ...(scenario === "default" ? {} : createConversationScenarioSeed(scenario)),
  };
}

export async function bootAiWorkspaceDemo(
  options: AiWorkspaceDemoOptions = {},
): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const defaultRuntime = options.defaultRuntime ?? "fake";
  const vaultId = options.vaultId ?? "lapis-ai-workspace";
  const scenario = options.scenario ?? "default";
  const seed = createAiWorkspaceSeed(
    createAiWorkspacePluginData(defaultRuntime),
    scenario,
  );
  const storageKey = `lapis-ai-story:${vaultId}:portable-conversations`;
  let persistedFiles: Record<string, string> = {};
  if (options.persistVaultData && typeof localStorage !== "undefined") {
    const storedVaultData = localStorage.getItem(storageKey);
    if (storedVaultData) {
      try {
        const parsed = JSON.parse(storedVaultData);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          persistedFiles = Object.fromEntries(
            Object.entries(parsed).filter(
              (entry): entry is [string, string] =>
                isPortableConversationFile(entry[0]) &&
                typeof entry[1] === "string",
            ),
          );
          Object.assign(seed, persistedFiles);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }
  const adapter = new MemoryVaultAdapter(seed, {
    name: "Lapis AI Workspace",
    vaultId,
    clock: 1_700_000_000_000,
  });
  const persistPortableFiles = () => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(persistedFiles));
  };
  if (options.persistVaultData && typeof localStorage !== "undefined") {
    adapter.onWrite = (path, data) => {
      if (isPortableConversationFile(path)) {
        persistedFiles[path] = data;
        persistPortableFiles();
      }
    };
  }
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("lapis-ai-workspace"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });

  app.plugins.registerCorePlugins([
    { plugin: SourceEditorDemoPlugin, required: true },
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
      plugin: AiPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
  ]);

  const releaseApplicationCompatibility = installApplicationCompatibility(app);
  await app.vault.load();
  await app.configuration.load();
  await app.plugins.loadPlugins({
    communityPlugins: "disabled",
    optionalCorePlugins: "configured",
  });
  const stopWatchingMetadata = watchMetadata(app);
  if (options.modelCatalogGate) {
    const aiPlugin = app.plugins.plugins.get("ai");
    if (aiPlugin instanceof AiPlugin) {
      const listModels = aiPlugin.models.listModels.bind(aiPlugin.models);
      aiPlugin.models.listModels = async (provider) => {
        await options.modelCatalogGate;
        return listModels(provider);
      };
    }
  }
  const deleteRef = app.vault.on("delete", (file) => {
    if (!options.persistVaultData) return;
    for (const path of Object.keys(persistedFiles)) {
      if (path === file.path || path.startsWith(`${file.path}/`)) {
        delete persistedFiles[path];
      }
    }
    persistPortableFiles();
  });
  const renameRef = app.vault.on("rename", (_file, oldPath) => {
    if (!options.persistVaultData) return;
    for (const path of Object.keys(persistedFiles)) {
      if (path === oldPath || path.startsWith(`${oldPath}/`)) {
        delete persistedFiles[path];
      }
    }
    persistPortableFiles();
  });
  await app.metadataCache.load();
  const searchPlugin = app.plugins.plugins.get("search");
  if (searchPlugin instanceof SearchPlugin) {
    await searchPlugin.refreshIndex("ai-shell");
  }
  await app.workspace.loadLayout();
  if (scenario === "local-conversations") {
    const activeNote = app.vault.getFileByPath("Notes/Welcome.md");
    const aiLeaf = app.workspace.getLeavesOfType(AiViewType)[0];
    if (activeNote && aiLeaf) {
      const noteLeaf = app.workspace.getLeaf("tab");
      await noteLeaf.openFile(activeNote);
      app.workspace.activateLeaf(noteLeaf, { saveLayout: false });
      app.workspace.getActiveFile();
      app.workspace.activateLeaf(aiLeaf, { saveLayout: false });
      noteLeaf.close();
    }
  }

  return {
    app,
    dispose: async () => {
      stopWatchingMetadata();
      app.vault.offref(deleteRef);
      app.vault.offref(renameRef);
      for (const plugin of [...app.plugins.corePlugins].reverse()) {
        await plugin.disable().catch(() => undefined);
      }
      await app.workspace.disposeWorkspaceHost();
      releaseApplicationCompatibility();
    },
  };
}

function createConversationScenarioSeed(
  scenario: Exclude<AiWorkspaceScenario, "default">,
): Record<string, string> {
  const seeded = {
    ...conversationFiles({
      id: LOCAL_CONVERSATION_ID,
      title: "Summarize project notes",
      status: "active",
      bindings: [
        binding("binding-codex", "codex", "gpt-5.6-sol"),
        ...(scenario === "agent-switching"
          ? [binding("binding-cursor", "cursor", "composer-2.5")]
          : []),
      ],
      activeBindingId:
        scenario === "agent-switching" ? "binding-cursor" : "binding-codex",
      transcript:
        scenario === "agent-switching"
          ? [
              message("user-1", "user", "Review the note", "binding-codex"),
              message(
                "assistant-1",
                "assistant",
                "Codex reviewed the project note.",
                "binding-codex",
              ),
              {
                schemaVersion: 1,
                id: "switch-1",
                type: "agent.switch",
                createdAt: "2026-08-16T09:02:00.000Z",
                agentBindingId: "binding-cursor",
                fromBindingId: "binding-codex",
                toBindingId: "binding-cursor",
              },
              message(
                "user-2",
                "user",
                "Continue with Cursor",
                "binding-cursor",
              ),
              message(
                "assistant-2",
                "assistant",
                "Cursor continued in the same local conversation.",
                "binding-cursor",
              ),
            ]
          : [
              message(
                "user-1",
                "user",
                "Summarize the project",
                "binding-codex",
              ),
              message(
                "assistant-1",
                "assistant",
                "The project has one welcome note and one TODO.",
                "binding-codex",
              ),
            ],
      usage: { used: 12_920, limit: 128_000 },
    }),
    ...conversationFiles({
      id: ARCHIVED_CONVERSATION_ID,
      title: "Archived planning chat",
      status: "archived",
      bindings: [binding("binding-archived", "codex", "gpt-5.6-sol")],
      activeBindingId: "binding-archived",
      transcript: [
        message("archived-user", "user", "Old plan", "binding-archived"),
        message(
          "archived-assistant",
          "assistant",
          "This conversation is archived.",
          "binding-archived",
        ),
      ],
    }),
  };
  if (scenario !== "recovery") return seeded;
  return {
    ...seeded,
    ...conversationFiles({
      id: RECOVERY_CONVERSATION_ID,
      title: "Interrupted local task",
      status: "active",
      bindings: [
        {
          ...binding("binding-recovery", "codex", "gpt-5.6-sol"),
          nativeSessionId: "missing-fake-session",
        },
      ],
      activeBindingId: "binding-recovery",
      transcript: [
        message(
          "recovery-user",
          "user",
          "Finish the interrupted task",
          "binding-recovery",
        ),
        message(
          "recovery-assistant",
          "assistant",
          "The durable response remains available offline.",
          "binding-recovery",
        ),
        {
          schemaVersion: 1,
          id: "recovery-error",
          type: "error",
          createdAt: "2026-08-16T10:02:00.000Z",
          agentBindingId: "binding-recovery",
          message: "Agent host restarted before the turn completed.",
          retryable: true,
        },
      ],
      malformedFinalLine: true,
    }),
  };
}

function conversationFiles(input: {
  id: string;
  title: string;
  status: "active" | "archived";
  bindings: Array<Record<string, unknown>>;
  activeBindingId: string;
  transcript: Array<Record<string, unknown>>;
  usage?: { used: number; limit: number };
  malformedFinalLine?: boolean;
}): Record<string, string> {
  const root = `Notes/.lapis/agents/sessions/${input.id}`;
  const agents = [
    ...input.bindings,
    ...(input.usage
      ? [
          {
            schemaVersion: 1,
            type: "usage.updated",
            id: `usage-${input.id}`,
            createdAt: "2026-08-16T09:03:00.000Z",
            agentBindingId: input.activeBindingId,
            usage: input.usage,
          },
        ]
      : []),
  ];
  const transcript = input.transcript
    .map((entry) => JSON.stringify(entry))
    .join("\n");
  return {
    [`${root}/metadata.yaml`]: [
      "schemaVersion: 1",
      `id: ${input.id}`,
      `title: ${JSON.stringify(input.title)}`,
      'createdAt: "2026-08-16T09:00:00.000Z"',
      'updatedAt: "2026-08-16T10:03:00.000Z"',
      `activeAgentBindingId: ${input.activeBindingId}`,
      `status: ${input.status}`,
      "",
    ].join("\n"),
    [`${root}/agents.jsonl`]: `${agents.map((entry) => JSON.stringify(entry)).join("\n")}\n`,
    [`${root}/transcript.jsonl`]: `${transcript}\n${
      input.malformedFinalLine ? '{"schemaVersion":1,"type":"message"' : ""
    }`,
  };
}

function binding(id: string, agent: "codex" | "cursor", model: string) {
  return {
    schemaVersion: 1,
    type: "binding.created",
    id,
    createdAt: "2026-08-16T09:00:00.000Z",
    runtime: "fake",
    agent,
    model: { provider: agent, model },
    thinking: "medium",
  };
}

function message(
  id: string,
  role: "user" | "assistant",
  text: string,
  agentBindingId: string,
) {
  return {
    schemaVersion: 1,
    id,
    type: "message",
    role,
    text,
    createdAt: "2026-08-16T09:01:00.000Z",
    agentBindingId,
  };
}

function isPortableConversationFile(path: string): boolean {
  return /(?:^|\/)\.lapis\/agents\/sessions\/[0-9a-f-]+\/(?:metadata\.yaml|agents\.jsonl|transcript\.jsonl)$/u.test(
    path,
  );
}
