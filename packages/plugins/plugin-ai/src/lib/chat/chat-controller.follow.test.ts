import { describe, expect, it } from "vitest";
import { ConversationRepository } from "../conversations/conversation-repository";
import { MemoryTranscriptStore } from "../conversations/memory-transcript-store";
import { CONVERSATION_SCHEMA_VERSION, type TranscriptEntry } from "../conversations/types";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
import { AiChatController } from "./chat-controller.svelte";

const ID_A = "123e4567-e89b-42d3-a456-426614174000";
const ID_B = "223e4567-e89b-42d3-a456-426614174000";
const ID_C = "323e4567-e89b-42d3-a456-426614174000";

function userMessage(id: string, text: string): TranscriptEntry {
  return {
    schemaVersion: CONVERSATION_SCHEMA_VERSION,
    id,
    type: "message",
    role: "user",
    text,
    createdAt: "2026-08-19T10:00:00.000Z",
  };
}

async function seed(
  repository: ConversationRepository,
  scopeDir: string,
  id: string,
  title: string,
) {
  const created = await repository.create({
    id,
    scopeDir,
    now: "2026-08-19T10:00:00.000Z",
  });
  await repository.appendTranscript(created.location, [
    userMessage(`m-${id}`, title),
  ]);
  return created.location;
}

describe("AiChatController directory follow", () => {
  it("opens the only conversation in a scope tree", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = await seed(repository, "Projects", ID_A, "Only chat");
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
    });
    await controller.followDirectoryScope("Projects");
    expect(controller.location).toEqual(location);
    expect(controller.pickerEntries).toEqual([]);
    expect(controller.items[0]).toMatchObject({ text: "Only chat" });
    await controller.close();
  });

  it("shows a picker when two or more descendant chats exist", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await seed(repository, "Projects", ID_A, "Near");
    await seed(repository, "Projects/Atlas", ID_B, "Far");
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
    });
    await controller.followDirectoryScope("Projects");
    expect(controller.location).toBeNull();
    expect(controller.pickerEntries.map((entry) => entry.metadata?.title)).toEqual(
      ["Near", "Far"],
    );
    await controller.close();
  });

  it("clears to empty when the scope tree has no active chats", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await seed(repository, "Notes", ID_A, "Notes chat");
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
      location: { scopeDir: "Notes", conversationId: ID_A },
    });
    await controller.restore();
    await controller.followDirectoryScope("Projects");
    expect(controller.location).toBeNull();
    expect(controller.items).toEqual([]);
    expect(controller.pickerEntries).toEqual([]);
    expect(controller.directoryContext).toBe("Projects");
    await controller.close();
  });

  it("does not follow a pinned conversation until it is unpinned", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const pinned = await seed(repository, "Notes", ID_A, "Pinned");
    await seed(repository, "Projects", ID_B, "Other");
    await seed(repository, "Projects/Atlas", ID_C, "Deep");
    await repository.writePinned(pinned, true);
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
      location: pinned,
    });
    await controller.restore();
    expect(controller.conversationPinned).toBe(true);
    await controller.followDirectoryScope("Projects");
    expect(controller.location).toEqual(pinned);
    await controller.setPinned(false);
    expect(controller.conversationPinned).toBe(false);
    expect(controller.pickerEntries).toHaveLength(2);
    expect(controller.location).toBeNull();
    await controller.close();
  });

  it("does not follow while busy", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = await seed(repository, "Notes", ID_A, "Busy");
    await seed(repository, "Projects", ID_B, "Other");
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
      location,
    });
    await controller.restore();
    controller.busy = true;
    await controller.followDirectoryScope("Projects");
    expect(controller.location).toEqual(location);
    controller.busy = false;
    await controller.close();
  });
});
