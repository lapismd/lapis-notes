import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { describe, expect, it, vi } from "vitest";
import { ConversationRepository } from "./conversation-repository";
import {
  AI_CONVERSATION_SEARCH_PROVIDER_ID,
  AiConversationIndex,
  conversationIndexPath,
} from "./conversation-index";
import { MemoryTranscriptStore } from "./memory-transcript-store";
import { CONVERSATION_SCHEMA_VERSION } from "./types";

describe("AiConversationIndex", () => {
  it("projects searchable semantics without tool output or interactions", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const database = new MemoryAppDatabase("ai-index");
    const index = new AiConversationIndex(repository, database);
    const snapshot = await repository.create({
      id: "123e4567-e89b-42d3-a456-426614174000",
      scopeDir: "Projects/Atlas",
    });
    await repository.appendTranscript(snapshot.location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "u1",
        type: "message",
        role: "user",
        text: "Refactor the parser",
        createdAt: "2026-08-16T00:00:00.000Z",
      },
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "t1",
        type: "tool",
        toolId: "tool-1",
        name: "shell",
        state: "completed",
        input: "pnpm test",
        output: "private output",
        createdAt: "2026-08-16T00:00:01.000Z",
      },
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "q1",
        type: "question.request",
        requestId: "q1",
        title: "Secret question",
        questions: [],
        createdAt: "2026-08-16T00:00:02.000Z",
      },
    ]);

    await index.sync(snapshot.location);
    const document = await database.getSearchDocument(
      conversationIndexPath(snapshot.location),
    );
    expect(document).toMatchObject({
      sourceProviderId: AI_CONVERSATION_SEARCH_PROVIDER_ID,
      content: expect.stringContaining("pnpm test"),
    });
    expect(document?.content).not.toContain("private output");
    expect(document?.content).not.toContain("Secret question");
    await expect(index.search("parser")).resolves.toMatchObject([
      {
        location: snapshot.location,
        preview: expect.stringContaining("parser"),
      },
    ]);
  });

  it("lists empty-query recents from portable conversation files", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const database = new MemoryAppDatabase("ai-index-recents");
    const index = new AiConversationIndex(repository, database);
    const snapshot = await repository.create({
      id: "123e4567-e89b-42d3-a456-426614174000",
      scopeDir: "Projects/Atlas",
    });
    const listSearchDocuments = vi.spyOn(database, "listSearchDocuments");

    await expect(index.search("", 5)).resolves.toMatchObject([
      { location: snapshot.location },
    ]);
    expect(listSearchDocuments).not.toHaveBeenCalled();
  });

  it("rebuilds copied scopes independently and removes stale derived state", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const database = new MemoryAppDatabase("ai-index-rebuild");
    const index = new AiConversationIndex(repository, database);
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const first = await repository.create({ id, scopeDir: "A" });
    const copied = await repository.create({ id, scopeDir: "B" });
    await database.upsertSearchDocument({
      path: "ai-conversation/stale/id",
      sourceProviderId: AI_CONVERSATION_SEARCH_PROVIDER_ID,
      name: "stale",
      extension: "ai-conversation",
      checksum: "stale",
      content: "stale",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
    });

    const rebuildSearchIndex = vi.spyOn(database, "rebuildSearchIndex");
    await index.rebuild();
    expect(
      await database.getSearchDocument(conversationIndexPath(first.location)),
    ).toBeDefined();
    expect(
      await database.getSearchDocument(conversationIndexPath(copied.location)),
    ).toBeDefined();
    expect(
      await database.getSearchDocument("ai-conversation/stale/id"),
    ).toBeUndefined();
    expect(rebuildSearchIndex).not.toHaveBeenCalled();
  });

  it("does not rewrite an unchanged conversation projection", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const database = new MemoryAppDatabase("ai-index-unchanged");
    const index = new AiConversationIndex(repository, database);
    const snapshot = await repository.create({
      id: "123e4567-e89b-42d3-a456-426614174000",
      scopeDir: "Projects/Atlas",
    });
    const upsert = vi.spyOn(database, "upsertSearchDocument");

    await index.sync(snapshot.location);
    await index.sync(snapshot.location);

    expect(upsert).toHaveBeenCalledOnce();
  });
});
