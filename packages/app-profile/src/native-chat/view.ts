import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import NativeChat from "./NativeChat.svelte";
import type { NativeChatSession } from "./session";
import type { NativeChatNavigation } from "./navigation";

export class NativeChatView extends View {
  #component?: ReturnType<typeof mount>;
  #selection?: string;
  #scope?: string;
  #disposed = new Set<Promise<void>>();
  constructor(
    leaf: WorkspaceLeaf,
    readonly session: NativeChatSession,
    readonly views: Set<NativeChatView>,
    readonly type = "ai",
    readonly navigation?: NativeChatNavigation,
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
    const state = super.getState();
    const selection =
      this.#selection ??
      (typeof state.conversationId === "string"
        ? state.conversationId
        : undefined);
    return {
      ...state,
      scopeDir:
        this.#scope ??
        (typeof state.scopeDir === "string" ? state.scopeDir : ""),
      conversationId: selection?.startsWith("draft:") ? undefined : selection,
    };
  }
  onload(): void {
    this.views.add(this);
    const state = super.getState();
    this.#scope = typeof state.scopeDir === "string" ? state.scopeDir : "";
    this.#component = mount(NativeChat, {
      target: this.containerEl,
      props: {
        session: this.session,
        initialSession:
          typeof state.conversationId === "string"
            ? state.conversationId
            : undefined,
        screen: this.type === "ai" ? "chat" : "history",
        initialScope: this.#scope,
        onHistory: this.navigation
          ? () => this.navigation!.history()
          : undefined,
        onConversation: this.navigation
          ? (location) => this.navigation!.chat(location)
          : undefined,
        onSelection: (id: string, scope: string) => {
          this.#selection = id;
          this.#scope = scope;
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
