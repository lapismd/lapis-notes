import { describe, expect, it } from "vitest";
import type { ConversationListEntry } from "../conversations/transcript-store";
import {
  buildConversationHistoryTree,
  conversationHistoryFolderPaths,
} from "./conversation-history-tree";

function entry(
  scopeDir: string,
  conversationId: string,
  title: string,
  updatedAt: string,
): ConversationListEntry {
  return {
    location: { scopeDir, conversationId },
    metadata: {
      schemaVersion: 1,
      id: conversationId,
      title,
      createdAt: updatedAt,
      updatedAt,
      status: "active",
    },
  };
}

describe("conversation history tree", () => {
  it("keeps only conversation-bearing branches and groups chats by scope", () => {
    const folders = buildConversationHistoryTree([
      entry("", "root", "Root chat", "2026-08-14T00:00:00.000Z"),
      entry(
        "Notes/Projects",
        "newer",
        "Newer project chat",
        "2026-08-16T00:00:00.000Z",
      ),
      entry(
        "Notes/Projects",
        "older",
        "Older project chat",
        "2026-08-15T00:00:00.000Z",
      ),
      entry("Archive", "archive", "Archive chat", "2026-08-13T00:00:00.000Z"),
    ]);

    expect(folders.map((folder) => folder.name)).toEqual([
      "Vault root",
      "Archive",
      "Notes",
    ]);
    expect(conversationHistoryFolderPaths(folders)).toEqual([
      "",
      "Archive",
      "Notes",
      "Notes/Projects",
    ]);
    expect(folders.at(-1)?.conversationCount).toBe(2);
    expect(
      folders
        .at(-1)
        ?.children[0]?.conversations.map(
          (conversation) => conversation.metadata?.title,
        ),
    ).toEqual(["Newer project chat", "Older project chat"]);
  });
});
