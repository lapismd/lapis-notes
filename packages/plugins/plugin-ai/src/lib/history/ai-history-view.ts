import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { ConversationRepository } from "../conversations/conversation-repository";
import type { ConversationLocation } from "../conversations/types";
import type { ConversationListEntry } from "../conversations/transcript-store";
import AiHistoryPanel from "./ai-history-panel.svelte";
import { AiHistoryViewType } from "./ai-history-view-type";

export type AiHistoryViewHost = {
  conversations: ConversationRepository;
  currentConversationScope(): string;
  openAiConversation(location: ConversationLocation): Promise<void>;
  createAiConversation(scopeDir: string): Promise<void>;
  searchAiConversations(query: string): Promise<ConversationListEntry[]>;
};

export class AiHistoryView extends View {
  private component: Record<string, unknown> | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly host: AiHistoryViewHost,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return AiHistoryViewType;
  }

  getDisplayText(): string {
    return "AI conversations";
  }

  getIcon(): string {
    return "history";
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.containerEl.classList.add("ai-history-view");
    this.component = mount(AiHistoryPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        repository: this.host.conversations,
        getScope: () => this.host.currentConversationScope(),
        onOpenConversation: (location: ConversationLocation) =>
          this.host.openAiConversation(location),
        onNewConversation: (scopeDir: string) =>
          this.host.createAiConversation(scopeDir),
        searchAllConversations: (query: string) =>
          this.host.searchAiConversations(query),
      },
    }) as Record<string, unknown>;
  }

  onunload(): void {
    if (this.component) void unmount(this.component);
    this.component = null;
  }
}

export { AiHistoryViewType } from "./ai-history-view-type";
