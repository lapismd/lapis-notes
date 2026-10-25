import { AgentHistoryController } from "@lapismd/agent-ui";
import type { AgentUiController } from "@lapismd/agent-ui/core";
import type { NativeChatLocation } from "./navigation";

/** The public History screen retains its own selection while the App opens chats. */
export class NativeChatHistory extends AgentHistoryController {
  constructor(
    owner: () => AgentUiController,
    readonly open: (location: NativeChatLocation) => Promise<void>,
  ) {
    super(owner);
  }
  override get entries() {
    return super.entries.filter(
      (entry) => !entry.location.conversationId.startsWith("draft:"),
    );
  }
  override async openConversation(location: {
    scopeDir: string;
    conversationId: string;
  }) {
    await this.open(location);
  }
  override async newConversation() {
    await this.open({ scopeDir: this.selectedScope });
  }
}
