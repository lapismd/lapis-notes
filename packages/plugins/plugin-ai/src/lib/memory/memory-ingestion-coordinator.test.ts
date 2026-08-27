import { describe, expect, it, vi } from "vitest";
import { ConversationRepository } from "../conversations/conversation-repository";
import { MemoryTranscriptStore } from "../conversations/memory-transcript-store";
import { CONVERSATION_SCHEMA_VERSION } from "../conversations/types";
import { MemoryIngestionCoordinator } from "./memory-ingestion-coordinator";
import type { MemoryService } from "./types";

function createService(): MemoryService {
  return {
    search: vi.fn(async () => []),
    get: vi.fn(async () => ({
      ref: "episode:none:none",
      corpus: "episodic" as const,
      status: "missing" as const,
      evidenceMessages: [],
    })),
    ingestConversation: vi.fn(async () => undefined),
    previewConsolidation: vi.fn(async (scope) => ({
      scope,
      candidateIds: [],
      proposals: 0,
    })),
    consolidate: vi.fn(async (scope) => ({
      scope,
      candidateIds: [],
      proposals: 0,
      written: 0,
      needsReview: 0,
    })),
    rebuild: vi.fn(async () => ({
      conversations: 0,
      episodes: 0,
      skipped: 0,
      inconsistent: 0,
    })),
    previewForgetConversation: vi.fn(async (location) => ({
      conversationId: location.conversationId,
      episodeRefs: [],
      candidateIds: [],
      memoryIds: [],
    })),
    forgetConversation: vi.fn(async (location) => ({
      conversationId: location.conversationId,
      episodeRefs: [],
      candidateIds: [],
      memoryIds: [],
      exclusionPath: "",
      retracted: 0,
      needsReview: 0,
    })),
  };
}

describe("MemoryIngestionCoordinator", () => {
  it("waits for a terminal durable entry before repository-driven ingestion", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const memory = createService();
    const coordinator = new MemoryIngestionCoordinator(
      repository,
      memory,
      undefined,
      60_000,
    );
    const snapshot = await repository.create({
      id: "123e4567-e89b-42d3-a456-426614174000",
      scopeDir: "Projects/Atlas",
      now: "2026-08-27T12:00:00.000Z",
    });
    await repository.appendTranscript(snapshot.location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "user-1",
        type: "message",
        role: "user",
        text: "Remember the Atlas format",
        createdAt: "2026-08-27T12:00:01.000Z",
      },
    ]);

    await coordinator.flush();
    expect(memory.ingestConversation).not.toHaveBeenCalled();

    await repository.appendTranscript(snapshot.location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "assistant-1",
        type: "message",
        role: "assistant",
        text: "Understood.",
        createdAt: "2026-08-27T12:00:02.000Z",
      },
    ]);
    await coordinator.flush();

    expect(memory.ingestConversation).toHaveBeenCalledOnce();
    expect(memory.ingestConversation).toHaveBeenCalledWith(snapshot.location);
    coordinator.dispose();
  });

  it("ingests externally changed transcripts without a terminal marker", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const memory = createService();
    const coordinator = new MemoryIngestionCoordinator(
      repository,
      memory,
      undefined,
      60_000,
    );
    const location = {
      scopeDir: "Projects/Atlas",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };

    coordinator.handleVaultChange(
      "Projects/Atlas/.lapis/agents/sessions/123e4567-e89b-42d3-a456-426614174000/transcript.jsonl",
    );
    await coordinator.flush();

    expect(memory.ingestConversation).toHaveBeenCalledWith(location);
    coordinator.dispose();
  });
});
