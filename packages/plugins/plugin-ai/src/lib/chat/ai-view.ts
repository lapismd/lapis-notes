import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { AgentRequest, AgentRuntime, ToolContribution } from "../core/types";
import AiChatPanel from "./ai-chat-panel.svelte";
import { AiViewType } from "./ai-view-type";

export { AiViewType } from "./ai-view-type";

export type AiViewHost = {
  selectRuntime(request: AgentRequest): Promise<AgentRuntime>;
  liveRuntimeUnavailableReason(): string | null;
  tools: { list(): ToolContribution[] };
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
    const runtime = await this.host.selectRuntime({ prompt: "", tools });
    if (this.disposed || this.component) return;
    this.component = mount(AiChatPanel, {
      target: this.containerEl,
      props: {
        runtime,
        unavailableReason: this.host.liveRuntimeUnavailableReason(),
        tools,
      },
    }) as Record<string, unknown>;
  }
}
