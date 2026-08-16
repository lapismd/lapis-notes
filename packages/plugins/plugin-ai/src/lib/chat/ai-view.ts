import {
  View,
  type ViewStateResult,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import type { ComposerSearchSource } from "@lapismd/design-core/ai/chat";
import { mount, unmount } from "svelte";
import type {
  AgentRequest,
  AgentRuntime,
  ModelRef,
  ToolContribution,
} from "../core/types";
import type {
  ConversationRepository,
  CreateConversationInput,
} from "../conversations/conversation-repository";
import type { ConversationLocation } from "../conversations/types";
import type { AiPluginSettings } from "../settings/ai-settings";
import { ACP_AGENT_IDS } from "../settings/acp-agents";
import AiChatPanel from "./ai-chat-panel.svelte";
import { AiViewType } from "./ai-view-type";
export { AiViewType } from "./ai-view-type";

export type AiViewHost = {
  selectRuntime(request: AgentRequest): Promise<AgentRuntime>;
  fallbackRuntime(): AgentRuntime;
  liveRuntimeUnavailableReason(): string | null;
  tools: { list(): ToolContribution[] };
  conversations: ConversationRepository;
  createConversationInput(explicitFolder?: string): CreateConversationInput;
  listConversationFolders(): string[];
  revealConversationHistory(): Promise<void>;
  subscribeConversationMoves?(
    listener: (oldPath: string, newPath: string) => void,
  ): () => void;
  searchVaultFiles: ComposerSearchSource;
  getSettings(): AiPluginSettings;
  updateSettings(patch: Partial<AiPluginSettings>): Promise<void>;
  subscribeSettings?(
    listener: (patch: Partial<AiPluginSettings>) => void,
  ): () => void;
  models: { listModels(provider: string): Promise<ModelRef[]> };
  workspace?: string;
};

export class AiView extends View {
  private component: Record<string, unknown> | null = null;
  private disposed = false;
  private mountGeneration = 0;
  private readonly host: AiViewHost;

  constructor(leaf: WorkspaceLeaf, host: AiViewHost) {
    super(leaf);
    this.host = host;
  }

  getViewType(): string {
    return AiViewType;
  }

  getDisplayText(): string {
    return "AI";
  }

  getIcon(): string {
    return "sparkles";
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.disposed = false;
    this.mountGeneration += 1;
    void this.mountPanel(this.mountGeneration);
  }

  onunload(): void {
    this.disposed = true;
    this.mountGeneration += 1;
    if (this.component) void unmount(this.component);
    this.component = null;
  }

  async setState(
    state: Record<string, unknown>,
    result?: ViewStateResult,
  ): Promise<void> {
    const previous = conversationLocationFromState(this.getState());
    await super.setState(state, result);
    const next = conversationLocationFromState(state);
    if (this.component && !sameLocation(previous, next)) {
      this.mountGeneration += 1;
      const generation = this.mountGeneration;
      await unmount(this.component);
      this.component = null;
      if (!this.disposed) await this.mountPanel(generation);
    }
  }

  private async mountPanel(generation: number): Promise<void> {
    const tools = this.host.tools.list();
    const initialLocation = conversationLocationFromState(this.getState());
    let settings = this.host.getSettings();
    if (initialLocation) {
      try {
        const snapshot = await this.host.conversations.read(initialLocation);
        const binding = snapshot.agents.find(
          (record) =>
            record.type === "binding.created" &&
            record.id === snapshot.metadata.activeAgentBindingId,
        );
        if (binding?.type === "binding.created") {
          const agent = binding.agent === "cursor" ? "cursor" : "codex";
          settings = {
            ...settings,
            acpAgent: agent,
            defaultRuntime:
              binding.runtime === "codex-native"
                ? "codex-native"
                : binding.runtime === "fake"
                  ? "fake"
                  : "acp",
            defaultModel: binding.model?.model ?? settings.defaultModels[agent],
            thinking: binding.thinking ?? settings.thinking,
          };
        }
      } catch {
        // The controller reports an unavailable conversation after mounting.
      }
    }
    let models: ModelRef[] = [];
    let modelCatalogError: string | null = null;
    try {
      const catalogs = await Promise.allSettled(
        ACP_AGENT_IDS.map((agent) => this.host.models.listModels(agent)),
      );
      models = catalogs.flatMap((catalog) =>
        catalog.status === "fulfilled" ? catalog.value : [],
      );
      const selectedCatalog =
        catalogs[ACP_AGENT_IDS.indexOf(settings.acpAgent)];
      if (selectedCatalog?.status === "rejected") throw selectedCatalog.reason;
      if (
        !initialLocation &&
        models.length > 0 &&
        !models.some((model) => model.model === settings.defaultModel)
      ) {
        const model = (models.find((entry) => entry.isDefault) ?? models[0])!;
        await this.host.updateSettings({ defaultModel: model.model });
        settings = this.host.getSettings();
      }
    } catch (error) {
      modelCatalogError =
        error instanceof Error ? error.message : String(error);
    }
    let runtime: AgentRuntime;
    let unavailableReason = this.host.liveRuntimeUnavailableReason();
    try {
      runtime = await this.host.selectRuntime({
        prompt: "",
        tools,
        agent: settings.acpAgent,
        model: { provider: settings.acpAgent, model: settings.defaultModel },
        thinking: settings.thinking,
        metadata:
          settings.defaultRuntime === "auto"
            ? undefined
            : { runtime: settings.defaultRuntime },
      });
    } catch (error) {
      runtime = this.host.fallbackRuntime();
      unavailableReason =
        error instanceof Error ? error.message : String(error);
    }
    if (
      this.disposed ||
      this.component ||
      generation !== this.mountGeneration
    ) {
      return;
    }
    this.component = mount(AiChatPanel, {
      target: this.containerEl,
      props: {
        runtime,
        selectRuntime: (request: AgentRequest) =>
          this.host.selectRuntime(request),
        unavailableReason,
        tools,
        workspace: this.host.workspace,
        repository: this.host.conversations,
        initialLocation,
        createConversation: (explicitFolder?: string) =>
          this.host.createConversationInput(explicitFolder),
        onRevealHistory: () => this.host.revealConversationHistory(),
        subscribeConversationMoves: this.host.subscribeConversationMoves?.bind(
          this.host,
        ),
        onConversationLocationChange: (
          location: ConversationLocation | null,
        ) => {
          this.persistLocationHint(location);
        },
        fileSearch: this.host.searchVaultFiles,
        models,
        modelCatalogError,
        settings,
        onSettingsChange: (patch) => this.host.updateSettings(patch),
      },
    }) as Record<string, unknown>;
  }

  private persistLocationHint(location: ConversationLocation | null): void {
    const state = { ...this.getState() };
    if (location) {
      state.scopeDir = location.scopeDir;
      state.conversationId = location.conversationId;
    } else {
      delete state.scopeDir;
      delete state.conversationId;
    }
    void super.setState(state);
  }
}

function conversationLocationFromState(
  state: Record<string, unknown>,
): ConversationLocation | null {
  return typeof state.scopeDir === "string" &&
    typeof state.conversationId === "string"
    ? {
        scopeDir: state.scopeDir,
        conversationId: state.conversationId,
      }
    : null;
}

function sameLocation(
  left: ConversationLocation | null,
  right: ConversationLocation | null,
): boolean {
  return (
    left?.scopeDir === right?.scopeDir &&
    left?.conversationId === right?.conversationId
  );
}
