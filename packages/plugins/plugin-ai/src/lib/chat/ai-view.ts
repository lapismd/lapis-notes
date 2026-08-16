import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import type { ComposerSearchSource } from "@lapismd/design-core/ai/chat";
import { mount, unmount } from "svelte";
import type {
  AgentRequest,
  AgentRuntime,
  ModelRef,
  ToolContribution,
} from "../core/types";
import type { AgentSessionStore } from "../sessions/session-store";
import type { AiPluginSettings } from "../settings/ai-settings";
import AiChatPanel from "./ai-chat-panel.svelte";
import { AiViewType } from "./ai-view-type";
export { AiViewType } from "./ai-view-type";

export type AiViewHost = {
  selectRuntime(request: AgentRequest): Promise<AgentRuntime>;
  fallbackRuntime(): AgentRuntime;
  liveRuntimeUnavailableReason(): string | null;
  tools: { list(): ToolContribution[] };
  sessionStore: AgentSessionStore;
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
  private unsubscribeSettings: (() => void) | undefined;
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
    this.unsubscribeSettings = this.host.subscribeSettings?.((patch) => {
      if (patch.acpAgent !== undefined || patch.defaultRuntime !== undefined) {
        void this.remountPanel();
      }
    });
    this.mountGeneration += 1;
    void this.mountPanel(this.mountGeneration);
  }

  onunload(): void {
    this.disposed = true;
    this.mountGeneration += 1;
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = undefined;
    if (this.component) void unmount(this.component);
    this.component = null;
  }

  private async remountPanel(): Promise<void> {
    this.mountGeneration += 1;
    const generation = this.mountGeneration;
    if (this.component) await unmount(this.component);
    this.component = null;
    if (!this.disposed) await this.mountPanel(generation);
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
        sessionStore: this.host.sessionStore,
        fileSearch: this.host.searchVaultFiles,
        models,
        modelCatalogError,
        settings,
        onSettingsChange: (patch) => this.host.updateSettings(patch),
      },
    }) as Record<string, unknown>;
  }
}
