import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import NativeChat from "./NativeChat.svelte";
import type { NativeChatSession } from "./session";

export class NativeChatView extends View {
  #component?: ReturnType<typeof mount>;
  #selection?: string;
  #disposed = new Set<Promise<void>>();
  constructor(
    leaf: WorkspaceLeaf,
    readonly session: NativeChatSession,
    readonly views: Set<NativeChatView>,
    readonly type = "ai",
  ) {
    super(leaf);
  }
  getViewType(): string {
    return this.type;
  }
  getDisplayText(): string {
    return this.type === "ai" ? "AI" : "AI conversations";
  }
  getIcon(): string {
    return this.type === "ai" ? "sparkles" : "history";
  }
  protected async onOpen(): Promise<void> {}
  protected async onClose(): Promise<void> {
    await this.close();
  }
  getState(): Record<string, unknown> {
    return {
      ...super.getState(),
      conversationId: this.#selection?.startsWith("draft:")
        ? undefined
        : this.#selection,
    };
  }
  onload(): void {
    this.views.add(this);
    const state = super.getState();
    this.#component = mount(NativeChat, {
      target: this.containerEl,
      props: {
        session: this.session,
        initialSession:
          typeof state.conversationId === "string"
            ? state.conversationId
            : undefined,
        screen: this.type === "ai" ? "chat" : "history",
        onSelection: (id: string) => {
          this.#selection = id;
          this.app.workspace.requestSaveLayout();
        },
        onDispose: (pending: Promise<void>) => {
          this.#disposed.add(pending);
          void pending
            .finally(() => this.#disposed.delete(pending))
            .catch(() => {});
        },
      },
    });
  }
  async close(): Promise<void> {
    const component = this.#component;
    this.#component = undefined;
    if (component) await unmount(component);
    await Promise.all([...this.#disposed]);
    this.views.delete(this);
  }
  async onunload(): Promise<void> {
    await this.close();
  }
}
