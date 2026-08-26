import {
  Plugin,
  createVaultFileAppTools,
  hasNativeDesktopCapability,
  type App,
  type PluginManifest,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { ComposerTriggerItem } from "@lapismd/design-core/ai/chat";
import { AiView, AiViewType } from "./chat/ai-view";
import AiInventoryResult from "./chat/ai-inventory-result.svelte";
import { LIVE_RUNTIME_UNAVAILABLE_REASON } from "./chat/live-runtime-unavailable";
import { AiCatalogView, AiCatalogViewType } from "./catalog/ai-catalog-view";
import { collectAiCatalog } from "./catalog/inventory";
import type { CatalogGroup, CatalogToolRow } from "./catalog/types";
import { AiHistoryView, AiHistoryViewType } from "./history/ai-history-view";
import type { ConversationLocation } from "./conversations/types";
import { formatFileMention, searchVaultFiles } from "./chat/chat-mentions";
import type { AgentRequest, AgentRuntime } from "./core/types";
import { createHostAgentRuntimes } from "./host/create-host-runtimes";
import { createAgentProcessHost } from "./host/desktop-process-host";
import { resolveAgentWorkspace } from "./host/agent-workspace";
import type { AgentProcessHost } from "./host/process-host";
import { AcpModelProvider } from "./providers/acp-model-provider";
import { ModelProviderRegistry } from "./providers/model-provider";
import { selectAgentRuntime } from "./registry/select-runtime";
import {
  createAgentRuntimeRegistry,
  type AgentRuntimeRegistry,
} from "./registry/runtime-registry";
import { FakeAgentRuntime } from "./runtimes/fake/fake-runtime";
import {
  equalAiPluginData,
  parseAiPluginData,
  serializeAiPluginData,
  type AiPluginData,
} from "./sessions/plugin-data";
import {
  AI_CONVERSATION_PALETTE_PROVIDER_ID,
  AI_CONVERSATION_PALETTE_TAB,
  conversationPaletteItem,
} from "./conversations/conversation-palette";
import { ConversationRepository } from "./conversations/conversation-repository";
import type { CreateConversationInput } from "./conversations/conversation-repository";
import { AiConversationIndex } from "./conversations/conversation-index";
import type { ConversationListEntry } from "./conversations/transcript-store";
import { ConversationScopeResolver } from "./conversations/scope-resolver";
import { revealConversationScope } from "./conversations/reveal-scope";
import { hasHiddenApplicationSegment } from "./conversations/paths";
import { VaultTranscriptStore } from "./conversations/vault-transcript-store";
import { registerAiSettings } from "./settings/register-ai-settings";
import { AiSettingsTab } from "./settings/ai-settings-tab";
import {
  applyAppToolEnablement,
  DEFAULT_AI_SETTINGS,
  mergeAiSettings,
  type AiPluginSettings,
} from "./settings/ai-settings";
import {
  contributingPluginLabel,
  registeredAppToolRefs,
} from "./settings/app-tool-setting-rows";
import { createMcpServerContributionRegistry } from "./tools/mcp-server-registry";
import { AppToolHost } from "./tools/app-tool-host";
import { DesktopAppToolBridge } from "./tools/desktop-app-tool-bridge";
import { SkillRegistry, SkillSnapshotStore } from "./skills/registry";
import { BUNDLED_APP_SKILLS } from "./skills/bundled/research";
import { seedBundledSkills } from "./skills/seed";
import { createSkillAppTools } from "./skills/skill-tools";
import { SlashCommandCatalog } from "./commands/catalog";
import { CommandDiscovery } from "./commands/discovery";
import { SlashCommandRouter } from "./commands/router";
import { seedReservedCommands } from "./commands/seed";
import {
  tryCreateNodeUserAgentsStore,
  type UserAgentsCommandStore,
} from "./commands/user-agents";

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
  readonly mcpServers = createMcpServerContributionRegistry();
  readonly appToolHost: AppToolHost;
  readonly appToolBridge: DesktopAppToolBridge;
  readonly skillRegistry: SkillRegistry;
  readonly skillSnapshots = new SkillSnapshotStore();
  readonly slashCatalog: SlashCommandCatalog;
  readonly slashRouter: SlashCommandRouter;
  userAgents: UserAgentsCommandStore | undefined;
  readonly #settingsListeners = new Set<
    (patch: Partial<AiPluginSettings>) => void
  >();
  readonly #conversationMoveListeners = new Set<
    (oldPath: string, newPath: string) => void
  >();
  #lastFileScope?: string;
  readonly fakeRuntime = new FakeAgentRuntime({
    requireApproval: false,
    trace: "rich",
  });
  readonly scopeResolver = new ConversationScopeResolver();
  readonly conversations: ConversationRepository;
  readonly conversationIndex: AiConversationIndex;
  private conversationIndexTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    app: App,
    pluginManifest: PluginManifest = AI_MANIFEST,
    options: { userAgents?: UserAgentsCommandStore } = {},
  ) {
    super(app, pluginManifest);
    this.userAgents = options.userAgents;
    this.conversations = new ConversationRepository(
      new VaultTranscriptStore(app.vault),
    );
    this.conversationIndex = new AiConversationIndex(
      this.conversations,
      app.appDatabase,
    );
    this.appToolHost = new AppToolHost(app.agentTools, () =>
      this.getSettings(),
    );
    this.appToolBridge = new DesktopAppToolBridge(this.appToolHost);
    this.skillRegistry = new SkillRegistry({
      vault: app.vault,
      appSkills: app.agentSkills,
      bundled: [...BUNDLED_APP_SKILLS],
      extensionRootFor: (pluginId) =>
        this.app.plugins?.plugins.get(pluginId)?.manifest.dir,
    });
    this.slashCatalog = new SlashCommandCatalog(app.agentSlashCommands);
    this.slashCatalog.setFileCommandLoader((scopeDir) =>
      this.refreshFileCommands(scopeDir),
    );
    this.slashRouter = new SlashCommandRouter(
      this.slashCatalog,
      this.skillRegistry,
    );
    this.register(() => {
      void this.appToolBridge
        .close()
        .finally(() => this.appToolHost.close());
    });
    this.processHost = createAgentProcessHost();
    const workspace = this.workspace;
    this.models = new ModelProviderRegistry([
      new AcpModelProvider("codex", { workspace }),
      new AcpModelProvider("cursor", { workspace }),
    ]);
    this.registry = createAgentRuntimeRegistry([
      this.fakeRuntime,
      ...createHostAgentRuntimes(),
    ]);
  }

  get skills(): SkillRegistry {
    return this.skillRegistry;
  }

  skillContext = (): import("./skills/types").SkillDiscoveryContext => {
    const scopeDir = this.createConversationInput().scopeDir;
    return {
      scopeDir,
      availableToolNames: this.app.agentTools.list().map((item) => item.tool.name),
      enabledPluginIds:
        this.app.plugins?.enabledPlugins ?? [this.manifest.id],
    };
  };

  getSettings(): AiPluginSettings {
    return {
      ...this.data.settings,
      defaultModels: { ...this.data.settings.defaultModels },
      disabledAppToolNames: [...this.data.settings.disabledAppToolNames],
      enabledAppToolNames: [...this.data.settings.enabledAppToolNames],
      enabledCommunityToolPluginIds: [
        ...this.data.settings.enabledCommunityToolPluginIds,
      ],
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
    const nextData = {
      ...this.data,
      settings: mergeAiSettings(
        {
          ...this.data.settings,
          ...patch,
          acpAgent,
          defaultModels,
        },
        registeredAppToolRefs(this.app),
      ),
    };
    if (equalAiPluginData(this.data, nextData)) return;
    this.data = nextData;
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

  refreshHostRuntimes(): void {
    for (const runtime of createHostAgentRuntimes()) {
      this.registry.register(runtime);
    }
  }

  liveRuntimeUnavailableReason(): string | null {
    if (hasNativeDesktopCapability("agent-runtime")) return null;
    return LIVE_RUNTIME_UNAVAILABLE_REASON;
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
      .filter((path) => !hasHiddenApplicationSegment(path));
    return [...new Set(["", ...folders])].sort((left, right) =>
      left.localeCompare(right),
    );
  }

  currentConversationScope(): string {
    this.#rememberFileScope();
    return (
      this.#lastFileScope ??
      this.scopeResolver.resolve({
        activeFile: this.app.workspace.getActiveFile(),
      }).scopeDir
    );
  }

  #rememberFileScope(leaf?: WorkspaceLeaf | null): void {
    if (leaf?.view.getViewType() === AiViewType) return;
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    this.#lastFileScope = this.scopeResolver.resolve({
      activeFile: file,
    }).scopeDir;
  }

  currentAiConversation(): ConversationLocation | null {
    const active = this.app.workspace.activeLeaf;
    if (active?.view.getViewType() === AiViewType) {
      const location = conversationLocationFromLeaf(active);
      if (location) return location;
    }
    for (const leaf of this.app.workspace.getLeavesOfType(AiViewType)) {
      const location = conversationLocationFromLeaf(leaf);
      if (location) return location;
    }
    return null;
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
        mcpServers: [
          ...(request.mcpServers ?? []),
          ...this.mcpServers.list(),
        ],
      },
    });
  }

  async refreshFileCommands(
    scopeDir = this.createConversationInput().scopeDir,
  ): Promise<void> {
    const discovered = await new CommandDiscovery({
      vault: this.app.vault,
      userAgents: this.userAgents,
    }).discover(scopeDir);
    this.slashCatalog.replaceFileCommands(
      discovered.commands,
      discovered.overlays,
    );
  }

  async updateBundledSkills(): Promise<void> {
    await seedBundledSkills(this.app.vault, { overwrite: true });
    this.skillRegistry.invalidate();
  }

  async updateReservedCommands(): Promise<void> {
    if (!this.userAgents) return;
    await seedReservedCommands(this.userAgents, { overwrite: true });
    await this.refreshFileCommands();
  }

  async onload(): Promise<void> {
    this.data = parseAiPluginData(await this.loadData());
    if (!this.userAgents && shouldUseHomeUserAgents()) {
      this.userAgents = await tryCreateNodeUserAgentsStore();
    }
    await seedBundledSkills(this.app.vault).catch((error) =>
      this.app.logger.warn("Unable to seed bundled AI skills", error),
    );
    if (this.userAgents) {
      await seedReservedCommands(this.userAgents).catch((error) =>
        this.app.logger.warn("Unable to seed reserved AI commands", error),
      );
    }
    await this.refreshFileCommands();
    this.addSettingTab(new AiSettingsTab(this.app, this));
    registerAiSettings(this);
    for (const tool of createVaultFileAppTools(this.app.vault)) {
      this.registerAgentTool(tool);
    }
    for (const tool of createSkillAppTools({
      registry: this.skillRegistry,
      snapshots: this.skillSnapshots,
      vault: this.app.vault,
    })) {
      this.registerAgentTool(tool);
    }
    this.registerAgentResultView({
      command: "skills",
      component: AiInventoryResult,
    });
    this.registerAgentResultView({
      command: "tools",
      component: AiInventoryResult,
    });
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        for (const listener of this.#conversationMoveListeners) {
          listener(oldPath, file.path);
        }
      }),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        this.#rememberFileScope(leaf);
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
    const invalidateAgents = (file: { path: string }, oldPath?: string) => {
      if (isAgentsPath(file.path) || (oldPath && isAgentsPath(oldPath))) {
        this.skillRegistry.invalidate();
        void this.refreshFileCommands();
      }
    };
    if (this.userAgents?.subscribe) {
      this.register(this.userAgents.subscribe(() => void this.refreshFileCommands()));
    }
    this.addCommand({
      id: "update-bundled-skills",
      name: "Update bundled skills",
      callback: () => void this.updateBundledSkills(),
    });
    this.addCommand({
      id: "update-reserved-commands",
      name: "Update reserved commands",
      callback: () => void this.updateReservedCommands(),
    });
    this.registerEvent(
      this.app.agentSkills.on("changed", () => this.skillRegistry.invalidate()),
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => invalidateAgents(file)),
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => invalidateAgents(file)),
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => invalidateAgents(file)),
    );
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
      this.app.vault.on("rename", (file, oldPath) => {
        invalidateAgents(file, oldPath);
        scheduleConversationIndexRepair(file, oldPath);
      }),
    );
    this.register(() => {
      if (this.conversationIndexTimer)
        clearTimeout(this.conversationIndexTimer);
      this.conversationIndexTimer = undefined;
    });
    this.registerSidebarView(AiViewType, (leaf) => new AiView(leaf, this), {
      side: "right",
      title: "AI",
      icon: "sparkles",
    }, {
      kind: "command",
      command: {
        id: "open-chat",
        name: "Open Chat",
        callback: () => void this.openAiChat(),
      },
    });
    this.addRibbonIcon("sparkles", "Open Chat", () => {
      void this.openAiChat();
    });
    this.registerSidebarView(
      AiHistoryViewType,
      (leaf) => new AiHistoryView(leaf, this),
      {
        side: "right",
        title: "AI conversations",
        icon: "history",
      },
      {
        kind: "command",
        command: {
          id: "open-history",
          name: "Open History",
          callback: () => void this.revealConversationHistory(),
        },
      },
    );
    this.registerSidebarView(
      AiCatalogViewType,
      (leaf) => new AiCatalogView(leaf, this),
      {
        side: "left",
        title: "Catalog",
        icon: "library",
      },
      {
        kind: "command",
        command: {
          id: "open-catalog",
          name: "Open Catalog",
          callback: () => void this.revealAiCatalog(),
        },
      },
    );
    const { controller } = getWorkspaceHostBinding(this.app.workspace);
    this.register(
      controller.commands.registerPaletteProvider({
        id: AI_CONVERSATION_PALETTE_PROVIDER_ID,
        tab: AI_CONVERSATION_PALETTE_TAB,
        emptyQueryLimit: 5,
        search: async (query) => {
          const entries = await this.searchAiConversations(query);
          return entries.map((entry) => ({
            ...conversationPaletteItem(entry),
            run: () => void this.openAiConversation(entry.location),
          }));
        },
      }),
    );
  }

  private async openAiChat(): Promise<void> {
    await this.openAiConversation();
  }

  async openAiConversation(location?: ConversationLocation): Promise<void> {
    const state = location
      ? {
          scopeDir: location.scopeDir,
          conversationId: location.conversationId,
        }
      : {};
    if (location) {
      const existing = this.findMainConversationLeaf(location);
      const target =
        existing ??
        this.findUnboundMainAiLeaf() ??
        this.app.workspace.getLeaf("tab");
      if (!existing) {
        await target.setViewState({ type: AiViewType, state });
      }
      this.app.workspace.activateLeaf(target, {
        focusRootHost: false,
        source: "api",
        operation: "open-conversation",
      });
      await this.app.workspace.revealLeaf(target);
      revealConversationScope(this.app, location.scopeDir);
      return;
    }

    const existing = this.app.workspace.getLeavesOfType(AiViewType)[0];
    const target =
      existing ?? this.app.workspace.ensureSideLeaf(AiViewType, "right");
    if (!existing) await target.setViewState({ type: AiViewType, state });
    this.app.workspace.activateLeaf(target, {
      focusRootHost: false,
      source: "api",
      operation: "open-ai-chat",
    });
    await this.app.workspace.revealLeaf(target);
  }

  async createAiConversation(scopeDir: string): Promise<void> {
    const created = await this.conversations.create(
      this.createConversationInput(scopeDir),
    );
    await this.openAiConversation(created.location);
  }

  async loadAiCatalog(): Promise<CatalogGroup[]> {
    return collectAiCatalog({
      tools: this.app.agentTools.list(),
      commands: this.app.agentSlashCommands.list(),
      registeredSkills: this.app.agentSkills.list(),
      vault: this.app.vault,
      bundled: BUNDLED_APP_SKILLS,
      settings: this.getSettings(),
      pluginLabel: (pluginId) => contributingPluginLabel(this.app, pluginId),
      userAgents: this.userAgents,
      scopeDir: this.createConversationInput().scopeDir,
    });
  }

  async setCatalogToolEnabled(
    tool: CatalogToolRow,
    enabled: boolean,
  ): Promise<void> {
    await this.updateSettings(
      applyAppToolEnablement(
        this.getSettings(),
        { name: tool.name, owner: tool.owner },
        enabled,
        registeredAppToolRefs(this.app),
      ),
    );
  }

  async openCatalogSkill(path: string): Promise<void> {
    await this.app.workspace.openLinkText(path, "");
  }

  async revealAiCatalog(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(AiCatalogViewType)[0];
    const target =
      existing ?? this.app.workspace.ensureSideLeaf(AiCatalogViewType, "left");
    if (!existing) {
      await target.setViewState({ type: AiCatalogViewType, state: {} });
    }
    this.app.workspace.activateLeaf(target, {
      focusRootHost: false,
      source: "api",
      operation: "reveal-ai-catalog",
    });
    await this.app.workspace.revealLeaf(target);
  }

  async revealConversationHistory(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(AiHistoryViewType)[0];
    const target =
      existing ?? this.app.workspace.ensureSideLeaf(AiHistoryViewType, "right");
    if (!existing) {
      await target.setViewState({ type: AiHistoryViewType, state: {} });
    }
    this.app.workspace.activateLeaf(target, {
      focusRootHost: false,
      source: "api",
      operation: "reveal-conversation-history",
    });
    await this.app.workspace.revealLeaf(target);
  }

  private findMainConversationLeaf(
    location: ConversationLocation,
  ): WorkspaceLeaf | null {
    let match: WorkspaceLeaf | null = null;
    this.app.workspace.iterateRootLeaves((leaf) => {
      if (
        !match &&
        leaf.view.getViewType() === AiViewType &&
        sameConversationLocation(conversationLocationFromLeaf(leaf), location)
      ) {
        match = leaf;
      }
    });
    return match;
  }

  private findUnboundMainAiLeaf(): WorkspaceLeaf | null {
    let match: WorkspaceLeaf | null = null;
    this.app.workspace.iterateRootLeaves((leaf) => {
      if (
        !match &&
        leaf.view.getViewType() === AiViewType &&
        conversationLocationFromLeaf(leaf) === null
      ) {
        match = leaf;
      }
    });
    return match;
  }
}

export default AiPlugin;

function shouldUseHomeUserAgents(): boolean {
  if (typeof process !== "undefined") {
    if (process.env.VITEST || process.env.STORYBOOK) return false;
  }
  return hasNativeDesktopCapability("agent-runtime");
}

function isConversationSourcePath(path: string): boolean {
  return /(?:^|\/)\.lapis\/agents\/sessions(?:\/|$)/u.test(path);
}

function isAgentsPath(path: string): boolean {
  return (
    path.startsWith(".agents/") ||
    path.includes("/.agents/skills/") ||
    path.includes("/.agents/user/skills/") ||
    path.includes("/.agents/commands/") ||
    path.endsWith("/.agents/skills") ||
    path.endsWith("/.agents/commands") ||
    path.endsWith("/.agents/user/skills")
  );
}

function conversationLocationFromLeaf(
  leaf: WorkspaceLeaf,
): ConversationLocation | null {
  const state = leaf.getViewState().state;
  return typeof state?.scopeDir === "string" &&
    typeof state.conversationId === "string"
    ? {
        scopeDir: state.scopeDir,
        conversationId: state.conversationId,
      }
    : null;
}

function sameConversationLocation(
  left: ConversationLocation | null,
  right: ConversationLocation,
): boolean {
  return (
    left?.scopeDir === right.scopeDir &&
    left.conversationId === right.conversationId
  );
}
