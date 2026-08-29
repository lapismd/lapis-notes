import {
  App,
  installApplicationCompatibility,
  MemoryAppDatabase,
  MemoryVaultAdapter,
} from "@lapis-notes/api";
import { AiJsonlViewType, AiPlugin, AiViewType } from "@lapis-notes/ai";
import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SourceEditorPlugin } from "@lapis-notes/source-editor";
import { SearchPlugin } from "@lapis-notes/search";
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
  | "follow-scope"
  | "agent-switching"
  | "recovery"
  | "jsonl-preview"
  | "community-tools"
  | "reload-resume";

export const LOCAL_CONVERSATION_ID = "123e4567-e89b-42d3-a456-426614174000";
export const FOLLOW_NEAR_CONVERSATION_ID =
  "523e4567-e89b-42d3-a456-426614174004";
export const FOLLOW_FAR_CONVERSATION_ID =
  "623e4567-e89b-42d3-a456-426614174005";
const ARCHIVED_CONVERSATION_ID = "223e4567-e89b-42d3-a456-426614174001";
const RECOVERY_CONVERSATION_ID = "323e4567-e89b-42d3-a456-426614174002";
export const LIVE_HOST_VAULT_ID = "lapis-ai-live-host";
export const LIVE_HOST_RELOAD_CONVERSATION_ID =
  "423e4567-e89b-42d3-a456-426614174003";
export const LIVE_HOST_RELOAD_ASSISTANT_TEXT =
  "The durable live response remains available offline.";

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
}, scenario: AiWorkspaceScenario = "default") {
  const jsonlPath = `Notes/.lapis/agents/sessions/${LOCAL_CONVERSATION_ID}/transcript.jsonl`;
  const mainLeaf =
    scenario === "jsonl-preview"
      ? leaf(
          "ai-jsonl-preview",
          "transcript.jsonl",
          "messages-square",
          AiJsonlViewType,
          { file: jsonlPath },
        )
      : leaf("ai-chat", "AI", "sparkles", AiViewType, initialLocation);
  return {
    main: split("main", "horizontal", [
      tabs("main-tabs", [mainLeaf]),
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
    active: mainLeaf.id,
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
        : scenario === "reload-resume"
          ? {
              scopeDir: "Notes",
              conversationId: LIVE_HOST_RELOAD_CONVERSATION_ID,
            }
          : undefined;
  return {
    ".obsidian/app.json": JSON.stringify(AI_WORKSPACE_CONFIGURATION, null, 2),
    ".obsidian/workspace.json": JSON.stringify(
      createAiWorkspaceLayout(initialLocation, scenario),
      null,
      2,
    ),
    ".obsidian/ai.json": JSON.stringify(pluginData, null, 2),
    "Notes/Welcome.md": "# Welcome\n\nAsk the AI chat in the workspace.\n",
    "Notes/alpha.md": "# Alpha\n\nTODO: summarize this note.\n",
    ...(scenario === "follow-scope"
      ? {
          "Projects/work.md": "# Work\n\nActive project note.\n",
          "Projects/Atlas/note.md": "# Atlas\n\nNested project note.\n",
          ...conversationFiles({
            scopeDir: "Projects",
            id: FOLLOW_NEAR_CONVERSATION_ID,
            title: "Near folder chat",
            status: "active",
            bindings: [binding("binding-near", "codex", "gpt-5.6-sol")],
            activeBindingId: "binding-near",
            transcript: [
              message("near-user", "user", "Stay in Projects", "binding-near"),
              message(
                "near-assistant",
                "assistant",
                "The near folder chat is open.",
                "binding-near",
              ),
            ],
          }),
          ...conversationFiles({
            scopeDir: "Projects/Atlas",
            id: FOLLOW_FAR_CONVERSATION_ID,
            title: "Atlas folder chat",
            status: "active",
            bindings: [binding("binding-far", "codex", "gpt-5.6-sol")],
            activeBindingId: "binding-far",
            transcript: [
              message("far-user", "user", "Stay in Atlas", "binding-far"),
              message(
                "far-assistant",
                "assistant",
                "The deeper Atlas chat is open.",
                "binding-far",
              ),
            ],
          }),
        }
      : scenario === "default" ||
          scenario === "community-tools" ||
          scenario === "reload-resume"
        ? {}
        : createConversationScenarioSeed(scenario)),
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
  const storageKey = portableConversationStorageKey(vaultId);
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
  const communityToolRegistration =
    scenario === "community-tools"
      ? app.agentTools.register(
          {
            pluginId: "story-community",
            source: "community",
            provenance: "community",
          },
          {
            name: "story_word_count",
            description: "Count words in a scoped note.",
            inputSchema: { type: "object" },
            outputSchema: { type: "object" },
            effect: "read",
            execute: async () => ({
              content: [{ type: "text", text: "42 words" }],
              structuredContent: { words: 42 },
            }),
          },
        )
      : undefined;

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
  if (scenario === "local-conversations" || scenario === "follow-scope") {
    const activeNote = app.vault.getFileByPath(
      scenario === "follow-scope" ? "Projects/work.md" : "Notes/Welcome.md",
    );
    const aiLeaf = app.workspace.getLeavesOfType(AiViewType)[0];
    if (activeNote && aiLeaf) {
      const noteLeaf = app.workspace.getLeaf("tab");
      await noteLeaf.openFile(activeNote);
      app.workspace.activateLeaf(noteLeaf, { saveLayout: false });
      app.workspace.getActiveFile();
      const aiPlugin = app.plugins.plugins.get("ai");
      if (aiPlugin instanceof AiPlugin) aiPlugin.currentConversationScope();
      app.workspace.activateLeaf(aiLeaf, { saveLayout: false });
      if (scenario !== "follow-scope") noteLeaf.close();
    }
  }

  return {
    app,
    dispose: async () => {
      communityToolRegistration?.dispose();
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
          ? [
              binding("binding-cursor", "cursor", "composer-2.5"),
              {
                schemaVersion: 3,
                type: "binding.context.updated",
                id: "context-codex-before-cursor",
                createdAt: "2026-08-16T09:01:30.000Z",
                agentBindingId: "binding-codex",
                throughEntryId: "assistant-1",
                throughEntryHash: "a".repeat(64),
                cause: "native-turn",
              },
              {
                schemaVersion: 3,
                type: "binding.context.updated",
                id: "context-cursor-before-codex",
                createdAt: "2026-08-16T09:03:30.000Z",
                agentBindingId: "binding-cursor",
                throughEntryId: "assistant-2",
                throughEntryHash: "b".repeat(64),
                cause: "handoff",
                handoffId: "handoff-codex-to-cursor",
                projectionMode: "full",
                omittedEntryCount: 0,
              },
              {
                schemaVersion: 3,
                type: "binding.config.updated",
                id: "config-codex-model",
                createdAt: "2026-08-16T09:04:30.000Z",
                agentBindingId: "binding-codex",
                model: { provider: "codex", model: "gpt-5.6-terra" },
              },
              {
                schemaVersion: 3,
                type: "binding.context.updated",
                id: "context-codex-after-cursor",
                createdAt: "2026-08-16T09:06:30.000Z",
                agentBindingId: "binding-codex",
                throughEntryId: "assistant-3",
                throughEntryHash: "c".repeat(64),
                cause: "handoff",
                handoffId: "handoff-cursor-to-codex",
                projectionMode: "delta",
                omittedEntryCount: 0,
              },
            ]
          : []),
      ],
      activeBindingId: "binding-codex",
      transcript:
        scenario === "jsonl-preview"
          ? [
              message(
                "preview-user",
                "user",
                "Summarize the preview log",
                "binding-codex",
              ),
              {
                schemaVersion: 1,
                id: "preview-thinking",
                type: "thinking.summary",
                kind: "summary",
                text: "I inspected the indexed project notes.",
                createdAt: "2026-08-16T09:01:30.000Z",
                agentBindingId: "binding-codex",
              },
              {
                schemaVersion: 1,
                id: "preview-tool",
                type: "tool",
                toolId: "preview-notes-search",
                name: "notes_search",
                state: "completed",
                input: JSON.stringify({ query: "project" }),
                output: JSON.stringify({ results: ["Notes/alpha.md"] }),
                createdAt: "2026-08-16T09:01:45.000Z",
                agentBindingId: "binding-codex",
              },
              message(
                "preview-assistant",
                "assistant",
                "Preview **rendering** is ready.",
                "binding-codex",
              ),
            ]
          : scenario === "agent-switching"
          ? [
              message("user-1", "user", "Review the note", "binding-codex"),
              message(
                "assistant-1",
                "assistant",
                "Codex reviewed the project note.",
                "binding-codex",
              ),
              {
                schemaVersion: 3,
                id: "switch-1",
                type: "agent.switch",
                createdAt: "2026-08-16T09:02:00.000Z",
                agentBindingId: "binding-cursor",
                fromBindingId: "binding-codex",
                toBindingId: "binding-cursor",
                handoffId: "handoff-codex-to-cursor",
                handoffMode: "full",
                handoffThroughEntryId: "assistant-1",
                omittedEntryCount: 0,
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
              {
                schemaVersion: 3,
                id: "switch-2",
                type: "agent.switch",
                createdAt: "2026-08-16T09:04:00.000Z",
                agentBindingId: "binding-codex",
                fromBindingId: "binding-cursor",
                toBindingId: "binding-codex",
                handoffId: "handoff-cursor-to-codex",
                handoffMode: "delta",
                handoffThroughEntryId: "assistant-2",
                omittedEntryCount: 0,
              },
              {
                schemaVersion: 3,
                id: "agent-config-1",
                type: "agent.config",
                createdAt: "2026-08-16T09:04:30.000Z",
                agentBindingId: "binding-codex",
                model: { provider: "codex", model: "gpt-5.6-terra" },
              },
              message(
                "user-3",
                "user",
                "Finish back in Codex",
                "binding-codex",
              ),
              message(
                "assistant-3",
                "assistant",
                "Codex resumed its original binding with the Cursor delta.",
                "binding-codex",
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
        {
          schemaVersion: 3,
          type: "binding.context.updated",
          id: "context-recovery",
          createdAt: "2026-08-16T10:01:30.000Z",
          agentBindingId: "binding-recovery",
          throughEntryId: "recovery-assistant",
          throughEntryHash: "c".repeat(64),
          cause: "native-turn",
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
  scopeDir?: string;
  status: "active" | "archived";
  bindings: Array<Record<string, unknown>>;
  activeBindingId: string;
  transcript: Array<Record<string, unknown>>;
  usage?: { used: number; limit: number };
  malformedFinalLine?: boolean;
}): Record<string, string> {
  const root = [
    input.scopeDir ?? "Notes",
    ".lapis",
    "agents",
    "sessions",
    input.id,
  ]
    .filter(Boolean)
    .join("/");
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

export function portableConversationStorageKey(vaultId: string): string {
  return `lapis-ai-story:${vaultId}:portable-conversations`;
}

export function isPortableConversationFile(path: string): boolean {
  return /(?:^|\/)\.lapis\/agents\/sessions\/[0-9a-f-]+\/(?:metadata\.yaml|agents\.jsonl|transcript\.jsonl)$/u.test(
    path,
  );
}

export function createLiveHostReloadConversationFiles(): Record<
  string,
  string
> {
  return conversationFiles({
    id: LIVE_HOST_RELOAD_CONVERSATION_ID,
    title: "Reloaded live conversation",
    status: "active",
    bindings: [binding("binding-live-reload", "codex", "gpt-5.6-sol")],
    activeBindingId: "binding-live-reload",
    transcript: [
      message(
        "live-reload-user",
        "user",
        "Continue the restored live conversation",
        "binding-live-reload",
      ),
      message(
        "live-reload-assistant",
        "assistant",
        LIVE_HOST_RELOAD_ASSISTANT_TEXT,
        "binding-live-reload",
      ),
    ],
    usage: { used: 12_920, limit: 128_000 },
  });
}

export function seedPortableConversationStorage(
  vaultId: string,
  files: Record<string, string>,
): void {
  if (typeof localStorage === "undefined") return;
  const portableFiles = Object.fromEntries(
    Object.entries(files).filter(([path, data]) => {
      return isPortableConversationFile(path) && typeof data === "string";
    }),
  );
  localStorage.setItem(
    portableConversationStorageKey(vaultId),
    JSON.stringify(portableFiles),
  );
}

export function readPortableConversationStorage(
  vaultId: string,
): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  const storedVaultData = localStorage.getItem(
    portableConversationStorageKey(vaultId),
  );
  if (!storedVaultData) return {};
  try {
    const parsed = JSON.parse(storedVaultData);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          isPortableConversationFile(entry[0]) && typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}
