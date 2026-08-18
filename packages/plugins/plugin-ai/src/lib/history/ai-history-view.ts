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
  currentAiConversation(): ConversationLocation | null;
  openAiConversation(location: ConversationLocation): Promise<void>;
  createAiConversation(scopeDir: string): Promise<void>;
  listConversationFolders(): string[];
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

  load(): void {
    this.unload();
    this.containerEl.replaceChildren();
    this.containerEl.classList.add("ai-history-view");
    this.component = mount(AiHistoryPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        repository: this.host.conversations,
        getScope: () => this.host.currentConversationScope(),
        getActiveConversation: () => this.host.currentAiConversation(),
        onOpenConversation: (location: ConversationLocation) =>
          this.host.openAiConversation(location),
        onNewConversation: (scopeDir: string) =>
          this.host.createAiConversation(scopeDir),
        listConversationFolders: () => this.host.listConversationFolders(),
        searchAllConversations: (query: string) =>
          this.host.searchAiConversations(query),
      },
    }) as Record<string, unknown>;
  }

  unload(): void {
    if (this.component) void unmount(this.component);
    this.component = null;
  }
}

export { AiHistoryViewType } from "./ai-history-view-type";
