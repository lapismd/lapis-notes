import { View, type WorkspaceLeaf } from "@lapis-notes/api";
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

  private async mountPanel(generation: number): Promise<void> {
    const tools = this.host.tools.list();
    let settings = this.host.getSettings();
    let models: ModelRef[] = [];
    let modelCatalogError: string | null = null;
    try {
      models = await this.host.models.listModels(settings.acpAgent);
      if (
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
        unavailableReason,
        tools,
        workspace: this.host.workspace,
        repository: this.host.conversations,
        initialLocation: conversationLocationFromState(this.getState()),
        createConversation: (explicitFolder?: string) =>
          this.host.createConversationInput(explicitFolder),
        conversationFolders: this.host.listConversationFolders(),
        subscribeConversationMoves: this.host.subscribeConversationMoves?.bind(
          this.host,
        ),
        onConversationLocationChange: (
          location: ConversationLocation | null,
        ) => {
          const state = { ...this.getState() };
          if (location) {
            state.scopeDir = location.scopeDir;
            state.conversationId = location.conversationId;
          } else {
            delete state.scopeDir;
            delete state.conversationId;
          }
          void this.setState(state);
        },
        fileSearch: this.host.searchVaultFiles,
        models,
        modelCatalogError,
        settings,
        onSettingsChange: (patch) => this.host.updateSettings(patch),
      },
    }) as Record<string, unknown>;
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
