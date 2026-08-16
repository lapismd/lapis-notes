import {
  Plugin,
  hasNativeDesktopCapability,
  type App,
  type PluginManifest,
} from "@lapis-notes/api";
import type { ComposerTriggerItem } from "@lapismd/design-core/ai/chat";
import { AiView, AiViewType } from "./chat/ai-view";
import { AiHistoryView, AiHistoryViewType } from "./history/ai-history-view";
import type { ConversationLocation } from "./conversations/types";
import { formatFileMention, searchVaultFiles } from "./chat/chat-mentions";
import type { AgentRequest, AgentRuntime } from "./core/types";
import { createHostAgentRuntimes } from "./host/create-host-runtimes";
import { createAgentProcessHost } from "./host/desktop-process-host";
import { resolveAgentWorkspace } from "./host/agent-workspace";
import type { AgentProcessHost } from "./host/process-host";
import { CodexModelProvider } from "./providers/codex-model-provider";
import { AcpModelProvider } from "./providers/acp-model-provider";
import { ModelProviderRegistry } from "./providers/model-provider";
import { selectAgentRuntime } from "./registry/select-runtime";
import {
  createAgentRuntimeRegistry,
  type AgentRuntimeRegistry,
} from "./registry/runtime-registry";
import { FakeAgentRuntime } from "./runtimes/fake/fake-runtime";
import {
  parseAiPluginData,
  serializeAiPluginData,
  type AiPluginData,
} from "./sessions/plugin-data";
import { ConversationRepository } from "./conversations/conversation-repository";
import type { CreateConversationInput } from "./conversations/conversation-repository";
import { AiConversationIndex } from "./conversations/conversation-index";
import type { ConversationListEntry } from "./conversations/transcript-store";
import { ConversationScopeResolver } from "./conversations/scope-resolver";
import { VaultTranscriptStore } from "./conversations/vault-transcript-store";
import { registerAiSettings } from "./settings/register-ai-settings";
import { AiSettingsTab } from "./settings/ai-settings-tab";
import {
  DEFAULT_AI_SETTINGS,
  mergeAiSettings,
  type AiPluginSettings,
} from "./settings/ai-settings";
import { createToolContributionRegistry } from "./tools/tool-registry";

const AI_MANIFEST: PluginManifest = {
  id: "ai",
  name: "AI",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description:
    "Provider-agnostic agent chat with ACP and optional native runtimes.",
  author: "Lapis Notes",
};

export class AiPlugin extends Plugin {
  private data: AiPluginData = {
    settings: DEFAULT_AI_SETTINGS,
    source: {},
  };
  readonly processHost: AgentProcessHost;
  readonly registry: AgentRuntimeRegistry;
  readonly models: ModelProviderRegistry;
  readonly tools = createToolContributionRegistry();
  readonly #settingsListeners = new Set<
    (patch: Partial<AiPluginSettings>) => void
  >();
  readonly #conversationMoveListeners = new Set<
    (oldPath: string, newPath: string) => void
  >();
  readonly fakeRuntime = new FakeAgentRuntime({
    requireApproval: false,
    trace: "rich",
  });
  readonly scopeResolver = new ConversationScopeResolver();
  readonly conversations: ConversationRepository;
  readonly conversationIndex: AiConversationIndex;
  private conversationIndexTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(app: App, pluginManifest: PluginManifest = AI_MANIFEST) {
    super(app, pluginManifest);
    this.conversations = new ConversationRepository(
      new VaultTranscriptStore(app.vault),
    );
    this.conversationIndex = new AiConversationIndex(
      this.conversations,
      app.appDatabase,
    );
    this.processHost = createAgentProcessHost();
    const workspace = this.workspace;
    this.models = new ModelProviderRegistry([
      new CodexModelProvider(this.processHost, { cwd: workspace }),
      new AcpModelProvider("cursor", { workspace }),
    ]);
    this.registry = createAgentRuntimeRegistry([
      this.fakeRuntime,
      ...createHostAgentRuntimes(),
    ]);
  }

  getSettings(): AiPluginSettings {
    return {
      ...this.data.settings,
      defaultModels: { ...this.data.settings.defaultModels },
    };
  }

  async updateSettings(patch: Partial<AiPluginSettings>): Promise<void> {
    const acpAgent = patch.acpAgent ?? this.data.settings.acpAgent;
    const defaultModels = {
      ...this.data.settings.defaultModels,
      ...patch.defaultModels,
    };
    if (patch.defaultModel !== undefined) {
      defaultModels[acpAgent] = patch.defaultModel.trim();
    }
    this.data = {
      ...this.data,
      settings: mergeAiSettings({
        ...this.data.settings,
        ...patch,
        acpAgent,
        defaultModels,
      }),
    };
    await this.saveData(serializeAiPluginData(this.data));
    for (const listener of this.#settingsListeners) listener(patch);
  }

  subscribeSettings(
    listener: (patch: Partial<AiPluginSettings>) => void,
  ): () => void {
    this.#settingsListeners.add(listener);
    return () => this.#settingsListeners.delete(listener);
  }

  subscribeConversationMoves(
    listener: (oldPath: string, newPath: string) => void,
  ): () => void {
    this.#conversationMoveListeners.add(listener);
    return () => this.#conversationMoveListeners.delete(listener);
  }

  liveRuntimeUnavailableReason(): string | null {
    if (hasNativeDesktopCapability("agent-runtime")) return null;
    return "Live agent runtimes are available only on the desktop host.";
  }

  get workspace(): string | undefined {
    return resolveAgentWorkspace(this.app.vault.adapter);
  }

  createConversationInput(explicitFolder?: string): CreateConversationInput {
    const activeFile = this.app.workspace.getActiveFile();
    const resolved = this.scopeResolver.resolve({
      explicitFolder,
      activeFile,
    });
    const launchNotePath =
      activeFile &&
      (!resolved.scopeDir ||
        activeFile.path.startsWith(`${resolved.scopeDir}/`))
        ? activeFile.path
        : undefined;
    return {
      scopeDir: resolved.scopeDir,
      launchNotePath,
    };
  }

  listConversationFolders(): string[] {
    const folders = this.app.vault
      .getAllFolders()
      .map((folder) => folder.path.replace(/^\/+|\/+$/gu, ""))
      .filter((path) => {
        const parts = path.split("/");
        return (
          parts[0] !== ".obsidian" &&
          parts[0] !== ".trash" &&
          !parts.includes(".lapis")
        );
      });
    return [...new Set(["", ...folders])].sort((left, right) =>
      left.localeCompare(right),
    );
  }

  currentConversationScope(): string {
    return this.scopeResolver.resolve({
      activeFile: this.app.workspace.getActiveFile(),
    }).scopeDir;
  }

  currentAiConversation(): ConversationLocation | null {
    const state = this.app.workspace
      .getLeavesOfType(AiViewType)[0]
      ?.getViewState().state;
    return typeof state?.scopeDir === "string" &&
      typeof state.conversationId === "string"
      ? {
          scopeDir: state.scopeDir,
          conversationId: state.conversationId,
        }
      : null;
  }

  searchAiConversations(query: string): Promise<ConversationListEntry[]> {
    return this.conversationIndex.search(query);
  }

  searchVaultFiles = async (
    query: string,
    signal: AbortSignal,
  ): Promise<ComposerTriggerItem[]> => {
    if (signal.aborted) return [];
    const files = this.app.vault.getFiles().map((file) => ({
      path: file.path,
      name: file.basename,
    }));
    return searchVaultFiles(files, query).map((file) => ({
      id: file.path,
      label: file.name,
      value: formatFileMention(file.path),
      description: file.path,
    }));
  };

  fallbackRuntime(): AgentRuntime {
    return this.fakeRuntime;
  }

  async selectRuntime(request: AgentRequest): Promise<AgentRuntime> {
    const requestedRuntime = request.metadata?.runtime;
    if (typeof requestedRuntime === "string") {
      const explicit =
        requestedRuntime === "fake"
          ? this.fakeRuntime
          : this.registry.get(requestedRuntime);
      if (explicit && (await explicit.supports(request))) return explicit;
      throw new Error(`Selected runtime ${requestedRuntime} is unavailable.`);
    }
    return selectAgentRuntime({
      registry: this.registry,
      settings: this.data.settings,
      fake: this.fakeRuntime,
      request: {
        ...request,
        tools: [...(request.tools ?? []), ...this.tools.list()],
      },
    });
  }

  async onload(): Promise<void> {
    this.data = parseAiPluginData(await this.loadData());
    this.addSettingTab(new AiSettingsTab(this.app, this));
    registerAiSettings(this);
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        for (const listener of this.#conversationMoveListeners) {
          listener(oldPath, file.path);
        }
      }),
    );
    this.register(
      this.conversations.subscribe((change) => {
        const update =
          change.type === "delete"
            ? this.conversationIndex.delete(change.location)
            : this.conversationIndex.sync(change.location);
        void update.catch((error) =>
          this.app.logger.warn(
            "Unable to update the AI conversation index",
            error,
          ),
        );
      }),
    );
    const scheduleConversationIndexRepair = (
      file: { path: string },
      oldPath?: string,
    ) => {
      if (
        !isConversationSourcePath(file.path) &&
        !(oldPath && isConversationSourcePath(oldPath))
      ) {
        return;
      }
      if (this.conversationIndexTimer)
        clearTimeout(this.conversationIndexTimer);
      this.conversationIndexTimer = setTimeout(() => {
        this.conversationIndexTimer = undefined;
        void this.conversationIndex
          .rebuild()
          .catch((error) =>
            this.app.logger.warn(
              "Unable to rebuild the AI conversation index",
              error,
            ),
          );
      }, 150);
    };
    this.registerEvent(
      this.app.vault.on("create", scheduleConversationIndexRepair),
    );
    this.registerEvent(
      this.app.vault.on("modify", scheduleConversationIndexRepair),
    );
    this.registerEvent(
      this.app.vault.on("delete", scheduleConversationIndexRepair),
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) =>
        scheduleConversationIndexRepair(file, oldPath),
      ),
    );
    this.register(() => {
      if (this.conversationIndexTimer)
        clearTimeout(this.conversationIndexTimer);
      this.conversationIndexTimer = undefined;
    });
    this.app.workspace.onLayoutReady(() => {
      void this.conversationIndex
        .rebuild()
        .catch((error) =>
          this.app.logger.warn(
            "Unable to rebuild the AI conversation index",
            error,
          ),
        );
    });
    this.registerSidebarView(AiViewType, (leaf) => new AiView(leaf, this), {
      side: "right",
      title: "AI",
      icon: "sparkles",
      group: "AI",
      groupTitle: "AI",
    });
    this.registerSidebarView(
      AiHistoryViewType,
      (leaf) => new AiHistoryView(leaf, this),
      {
        side: "right",
        title: "AI conversations",
        icon: "history",
        group: "AI",
        groupTitle: "AI",
      },
    );
    this.addCommand({
      id: "show-ai-conversation-history",
      name: "Show AI conversation history",
      callback: () => void this.revealConversationHistory(),
    });
    this.addCommand({
      id: "open-ai-chat",
      name: "Open AI chat",
      callback: () => void this.openAiChat(),
    });
  }

  private async openAiChat(): Promise<void> {
    await this.openAiConversation();
  }

  async openAiConversation(location?: ConversationLocation): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(AiViewType)[0];
    const state = location
      ? {
          scopeDir: location.scopeDir,
          conversationId: location.conversationId,
        }
      : {};
    const target =
      existing ??
      this.app.workspace.getLeavesOfType(AiHistoryViewType)[0] ??
      this.app.workspace.getRightLeaf(false);
    if (target) {
      await target.setViewState({ type: AiViewType, state });
      this.app.workspace.revealLeaf(target);
      return;
    }
  }

  async createAiConversation(scopeDir: string): Promise<void> {
    const created = await this.conversations.create(
      this.createConversationInput(scopeDir),
    );
    await this.openAiConversation(created.location);
  }

  async revealConversationHistory(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(AiHistoryViewType)[0];
    const target =
      existing ??
      this.app.workspace.getLeavesOfType(AiViewType)[0] ??
      this.app.workspace.getRightLeaf(false);
    if (!target) return;
    if (!existing) {
      await target.setViewState({ type: AiHistoryViewType, state: {} });
    }
    this.app.workspace.revealLeaf(target);
  }
}

export default AiPlugin;

function isConversationSourcePath(path: string): boolean {
  return /(?:^|\/)\.lapis\/agents\/sessions(?:\/|$)/u.test(path);
}
