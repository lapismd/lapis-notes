import { describe, expect, it } from "vitest";
import {
  ConversationRepository,
  deriveConversationTitle,
} from "./conversation-repository";
import { MemoryTranscriptStore } from "./memory-transcript-store";
import { CONVERSATION_SCHEMA_VERSION, type TranscriptEntry } from "./types";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const OTHER_ID = "223e4567-e89b-42d3-a456-426614174000";
const CREATED_AT = "2026-08-16T10:00:00.000Z";

function message(
  id: string,
  role: "user" | "assistant",
  text: string,
  source?: TranscriptEntry["source"],
): TranscriptEntry {
  return {
    schemaVersion: CONVERSATION_SCHEMA_VERSION,
    id,
    type: "message",
    role,
    text,
    createdAt: CREATED_AT,
    source,
  };
}

describe("ConversationRepository", () => {
  it("creates runtime-neutral metadata and derives an 80-code-point title", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const created = await repository.create({
      id: ID,
      scopeDir: "Projects/Atlas",
      launchNotePath: "Projects/Atlas/Notes/launch.md",
      workspacePath: "Agent Workspace",
      now: CREATED_AT,
    });
    expect(created.metadata).toMatchObject({
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: ID,
      status: "active",
      launchContext: { notePath: "Notes/launch.md" },
      workspace: { path: "Agent Workspace" },
    });
    expect(created.metadata).not.toHaveProperty("title");

    const titleSource = `  ${"🙂".repeat(85)}\n ignored`;
    const withTitle = await repository.appendTranscript(
      { scopeDir: "Projects/Atlas", conversationId: ID },
      [message("m1", "user", titleSource)],
    );
    expect([...withTitle.metadata.title!]).toHaveLength(80);
    expect(withTitle.metadata.title).not.toContain("\n");
  });

  it("deduplicates IDs and replay provenance before append", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = { scopeDir: "", conversationId: ID };
    await repository.create({ id: ID, scopeDir: "", now: CREATED_AT });
    const first = message("m1", "user", "one", {
      sessionId: "session",
      runId: "run",
      sequence: 1,
    });
    await repository.appendTranscript(location, [first, first]);
    await repository.appendTranscript(location, [
      message("different-id", "assistant", "duplicate frame", first.source),
      message("m2", "assistant", "two", {
        sessionId: "session",
        runId: "run",
        sequence: 2,
      }),
    ]);

    const reopened = await repository.read(location);
    expect(reopened.transcript.map((entry) => entry.id)).toEqual(["m1", "m2"]);
  });

  it("keeps copied UUIDs independent by including scope in the storage key", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await repository.create({ id: ID, scopeDir: "Folder A", now: CREATED_AT });
    await repository.create({ id: ID, scopeDir: "Folder B", now: CREATED_AT });
    await repository.appendTranscript(
      { scopeDir: "Folder A", conversationId: ID },
      [message("a", "user", "A")],
    );
    await repository.appendTranscript(
      { scopeDir: "Folder B", conversationId: ID },
      [message("b", "user", "B")],
    );

    await expect(repository.list("Folder A")).resolves.toMatchObject([
      { location: { scopeDir: "Folder A", conversationId: ID } },
    ]);
    await expect(repository.list("Folder B")).resolves.toMatchObject([
      { location: { scopeDir: "Folder B", conversationId: ID } },
    ]);
  });

  it("serializes concurrent writes and supports archive and delete", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = { scopeDir: "", conversationId: OTHER_ID };
    await repository.create({ id: OTHER_ID, scopeDir: "", now: CREATED_AT });
    await Promise.all([
      repository.appendTranscript(location, [message("m1", "user", "one")]),
      repository.appendTranscript(location, [
        message("m2", "assistant", "two"),
      ]),
    ]);
    expect((await repository.read(location)).transcript).toHaveLength(2);
    expect((await repository.archive(location)).metadata.status).toBe(
      "archived",
    );
    await repository.delete(location);
    await expect(repository.read(location)).rejects.toThrow(/not found/u);
  });

  it("persists later approval grants and omits an empty list", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = { scopeDir: "", conversationId: ID };
    await repository.create({ id: ID, scopeDir: "", now: CREATED_AT });
    const written = await repository.writeApprovalGrants(location, [
      { name: "lapis-tools-notes_search", decision: "allow-always" },
      { name: "notes_search", decision: "deny-always" },
    ]);
    expect(written.metadata.approvalGrants).toEqual([
      { name: "notes_search", decision: "deny-always" },
    ]);
    const cleared = await repository.writeApprovalGrants(location, []);
    expect(cleared.metadata.approvalGrants).toBeUndefined();
  });

  it("persists pinned and omits the field when cleared", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = { scopeDir: "", conversationId: ID };
    await repository.create({ id: ID, scopeDir: "", now: CREATED_AT });
    const written = await repository.writePinned(location, true);
    expect(written.metadata.pinned).toBe(true);
    const cleared = await repository.writePinned(location, false);
    expect(cleared.metadata.pinned).toBeUndefined();
  });

  it("normalizes title whitespace without persisting placeholders", () => {
    expect(deriveConversationTitle("  first\n\tmessage  ")).toBe(
      "first message",
    );
    expect(deriveConversationTitle(" \n ")).toBeUndefined();
  });
});
