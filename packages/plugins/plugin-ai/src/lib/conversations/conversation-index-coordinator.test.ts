import { describe, expect, it, vi } from "vitest";
import {
  ConversationIndexCoordinator,
  conversationLocationFromSourcePath,
} from "./conversation-index-coordinator";

const ID = "123e4567-e89b-42d3-a456-426614174000";

describe("ConversationIndexCoordinator", () => {
  it("parses only complete portable conversation source paths", () => {
    expect(
      conversationLocationFromSourcePath(
        `Projects/Atlas/.lapis/agents/sessions/${ID}/transcript.jsonl`,
      ),
    ).toEqual({ scopeDir: "Projects/Atlas", conversationId: ID });
    expect(
      conversationLocationFromSourcePath(
        `.lapis/agents/sessions/${ID}/metadata.yaml`,
      ),
    ).toEqual({ scopeDir: "", conversationId: ID });
    expect(
      conversationLocationFromSourcePath("Projects/Atlas/notes.md"),
    ).toBeNull();
  });

  it("coalesces owned source writes into one affected-document sync", async () => {
    vi.useFakeTimers();
    try {
      const index = {
        sync: vi.fn(async () => {}),
        delete: vi.fn(async () => {}),
      };
      const coordinator = new ConversationIndexCoordinator(index);
      coordinator.handleVaultChange(
        `Projects/.lapis/agents/sessions/${ID}/transcript.jsonl`,
      );
      coordinator.handleVaultChange(
        `Projects/.lapis/agents/sessions/${ID}/metadata.yaml`,
      );

      await vi.runOnlyPendingTimersAsync();

      expect(index.sync).toHaveBeenCalledOnce();
      expect(index.sync).toHaveBeenCalledWith({
        scopeDir: "Projects",
        conversationId: ID,
      });
      expect(index.delete).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("deletes the old projection and syncs the new scope after a move", async () => {
    const index = {
      sync: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    };
    const coordinator = new ConversationIndexCoordinator(index);
    coordinator.handleVaultChange(
      `B/.lapis/agents/sessions/${ID}`,
      `A/.lapis/agents/sessions/${ID}`,
    );

    await coordinator.flush();

    expect(index.delete).toHaveBeenCalledWith({
      scopeDir: "A",
      conversationId: ID,
    });
    expect(index.sync).toHaveBeenCalledWith({
      scopeDir: "B",
      conversationId: ID,
    });
  });

  it("removes an unavailable projection without starting a global repair", async () => {
    const error = new Error("source incomplete");
    const onError = vi.fn();
    const index = {
      sync: vi.fn(async () => {
        throw error;
      }),
      delete: vi.fn(async () => {}),
    };
    const coordinator = new ConversationIndexCoordinator(index, onError);
    coordinator.handleVaultChange(`.lapis/agents/sessions/${ID}/metadata.yaml`);

    await coordinator.flush();

    expect(onError).toHaveBeenCalledWith(
      "sync",
      { scopeDir: "", conversationId: ID },
      error,
    );
    expect(index.delete).toHaveBeenCalledOnce();
  });
});
