import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import type { ComposerSearchSource } from "@lapismd/design-core/ai/chat";
import { mount, unmount } from "svelte";
import type { AgentRequest, AgentRuntime, ModelRef, ToolContribution } from "../core/types";
import type { AgentSessionStore } from "../sessions/session-store";
import type { AiPluginSettings } from "../settings/ai-settings";
import AiChatPanel from "./ai-chat-panel.svelte";
import { AiViewType } from "./ai-view-type";

export { AiViewType } from "./ai-view-type";

export type AiViewHost = {
  selectRuntime(request: AgentRequest): Promise<AgentRuntime>;
  liveRuntimeUnavailableReason(): string | null;
  tools: { list(): ToolContribution[] };
  sessionStore: AgentSessionStore;
  searchVaultFiles: ComposerSearchSource;
  getSettings(): AiPluginSettings;
  updateSettings(patch: Partial<AiPluginSettings>): Promise<void>;
  models: { listModels(): Promise<ModelRef[]> };
  workspace?: string;
};

export class AiView extends View {
  private component: Record<string, unknown> | null = null;
  private disposed = false;
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
    void this.mountPanel();
  }

  onunload(): void {
    this.disposed = true;
    if (this.component) void unmount(this.component);
    this.component = null;
  }

  private async mountPanel(): Promise<void> {
    const tools = this.host.tools.list();
    const settings = this.host.getSettings();
    const [runtime, models] = await Promise.all([
      this.host.selectRuntime({
        prompt: "",
        tools,
        model: { provider: "codex", model: settings.defaultModel },
        thinking: settings.thinking,
      }),
      this.host.models.listModels().catch(() => []),
    ]);
    if (this.disposed || this.component) return;
    this.component = mount(AiChatPanel, {
      target: this.containerEl,
      props: {
        runtime,
        unavailableReason: this.host.liveRuntimeUnavailableReason(),
        tools,
        workspace: this.host.workspace,
        sessionStore: this.host.sessionStore,
        fileSearch: this.host.searchVaultFiles,
        models,
        settings,
        onSettingsChange: (patch) => this.host.updateSettings(patch),
      },
    }) as Record<string, unknown>;
  }
}
