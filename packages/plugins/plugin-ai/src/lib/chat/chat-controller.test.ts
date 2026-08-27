import { describe, expect, it, vi } from "vitest";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
import type {
  AgentCapabilities,
  AgentEvent,
  AgentRequest,
  AgentRuntime,
  AgentSession,
} from "../core/types";
import { createMemorySessionStore } from "../sessions/session-store";
import {
  ConversationRepository,
  type CreateConversationInput,
} from "../conversations/conversation-repository";
import { MemoryTranscriptStore } from "../conversations/memory-transcript-store";
import { transcriptEntryHash } from "../conversations/hashes";
import {
  CONVERSATION_SCHEMA_VERSION,
  type AgentBindingRecord,
  type ConversationLocation,
  type TranscriptEntry,
} from "../conversations/types";
import { AiChatController } from "./chat-controller.svelte";
import type {
  AppToolBridgeCoordinator,
  AppToolBridgeEvent,
} from "../tools/desktop-app-tool-bridge";

describe("AiChatController", () => {
  it("passes typed memory recall without polluting the authored transcript", async () => {
    const runtime = new FakeAgentRuntime();
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const memoryRecall = {
      recall: vi.fn(async () => [
        {
          kind: "memory-recall" as const,
          id: "memory:writing-headings:2",
          content: "Use compact headings.\nProvenance: conversation/message",
          metadata: {
            memoryId: "writing-headings",
            revision: 2,
            scope: "project" as const,
          },
        },
      ]),
    };
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({ scopeDir: "Projects/Atlas" }),
      memoryRecall,
    });

    await controller.submit("Draft the release note");
    await vi.waitFor(() => expect(controller.busy).toBe(false));

    expect(runtime.sessions[0]?.prompts).toEqual(["Draft the release note"]);
    expect(runtime.sessions[0]?.contextBlocks[0]).toMatchObject([
      {
        kind: "memory-recall",
        id: "memory:writing-headings:2",
      },
    ]);
    const snapshot = await repository.read(controller.location!);
    expect(snapshot.transcript).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "message",
          role: "user",
          text: "Draft the release note",
        }),
      ]),
    );
    expect(JSON.stringify(snapshot.transcript)).not.toContain(
      "Use compact headings",
    );
    expect(JSON.stringify(snapshot.transcript)).not.toContain("memory-recall");
    await controller.close();
  });

  it("sends model and thinking on the agent request and stamps createdAt", async () => {
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime);
    await controller.submit("Summarize this note", {
      model: { provider: "codex", model: "gpt-5.6-sol" },
      thinking: "high",
    });
    await vi.waitFor(() => {
      expect(controller.busy).toBe(false);
    });
    expect(runtime.lastRequest).toMatchObject({
      model: { provider: "codex", model: "gpt-5.6-sol" },
      thinking: "high",
    });
    expect(controller.items[0]).toMatchObject({
      type: "message",
      role: "user",
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    await controller.close();
  });

  it("clears busy immediately when runtime cancel hangs", async () => {
    let releaseLate!: (event: AgentEvent) => void;
    const lateEvent = new Promise<AgentEvent>((resolve) => {
      releaseLate = resolve;
    });
    let sawCancel = false;
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "hanging-cancel",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "hang-1",
          async *events() {
            yield { type: "text" as const, text: "working" };
            yield await lateEvent;
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async cancel() {
            sawCancel = true;
            await new Promise(() => {});
          },
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime);
    await controller.submit("keep going");
    await vi.waitFor(() => expect(controller.busy).toBe(true));
    await vi.waitFor(() =>
      expect(JSON.stringify(controller.items)).toContain("working"),
    );
    const cancelling = controller.cancel();
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(sawCancel).toBe(true);
    releaseLate({ type: "text", text: "should stay hidden" });
    await expect(
      Promise.race([
        cancelling,
        new Promise((resolve) => setTimeout(resolve, 50)),
      ]),
    ).resolves.toBeUndefined();
    expect(JSON.stringify(controller.items)).not.toContain(
      "should stay hidden",
    );
    expect(controller.busy).toBe(false);
    expect(controller.items.some((item) => item.type === "status")).toBe(false);
    await controller.close();
  });

  it("settles leftover spinners immediately and posts a cancelled notice after cancel confirms", async () => {
    let releaseCancel!: () => void;
    const cancelGate = new Promise<void>((resolve) => {
      releaseCancel = resolve;
    });
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "confirm-cancel",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "confirm-1",
          async *events() {
            yield { type: "thinking" as const, text: "Planning" };
            yield {
              type: "tool.start" as const,
              id: "t1",
              name: "notes_search",
              input: { query: "vault" },
            };
            await new Promise(() => {});
          },
          async send() {},
          async respondToApproval() {},
          async cancel() {
            await cancelGate;
          },
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime);
    await controller.submit("search the vault");
    await vi.waitFor(() => {
      expect(controller.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "thinking", state: "done" }),
          expect.objectContaining({ type: "tool", state: "running" }),
        ]),
      );
    });
    const cancelling = controller.cancel();
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "thinking", state: "done" }),
        expect.objectContaining({ type: "tool", state: "completed" }),
      ]),
    );
    expect(
      controller.items.some(
        (item) =>
          item.type === "status" && item.text === "Agent turn cancelled",
      ),
    ).toBe(false);
    releaseCancel();
    await cancelling;
    await vi.waitFor(() =>
      expect(controller.items.at(-1)).toMatchObject({
        type: "status",
        text: "Agent turn cancelled",
      }),
    );
    await controller.close();
  });

  it("shows the user message before conversation create and session start finish", async () => {
    let releaseCreate!: () => void;
    const createGate = new Promise<void>((resolve) => {
      releaseCreate = resolve;
    });
    let releaseStart!: () => void;
    const startGate = new Promise<void>((resolve) => {
      releaseStart = resolve;
    });
    const innerRuntime = new FakeAgentRuntime();
    const runtime: AgentRuntime = {
      id: "gated-start",
      capabilities: () => innerRuntime.capabilities(),
      supports: (request) => innerRuntime.supports(request),
      async start(request) {
        await startGate;
        return innerRuntime.start(request);
      },
    };
    class GatedCreateRepository extends ConversationRepository {
      override async create(input: CreateConversationInput) {
        await createGate;
        return super.create(input);
      }
    }
    const repository = new GatedCreateRepository(new MemoryTranscriptStore());
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({ scopeDir: "Notes" }),
    });
    const submitting = controller.submit("hello from a new chat");
    await vi.waitFor(() => {
      expect(controller.items[0]).toMatchObject({
        type: "message",
        role: "user",
        text: "hello from a new chat",
      });
      expect(controller.busy).toBe(true);
    });
    releaseCreate();
    releaseStart();
    await submitting;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.close();
  });

  it("does not send after cancel during session start", async () => {
    let sendCount = 0;
    let releaseStart!: () => void;
    const startGate = new Promise<void>((resolve) => {
      releaseStart = resolve;
    });
    const innerRuntime = new FakeAgentRuntime();
    const runtime: AgentRuntime = {
      id: "cancel-during-start",
      capabilities: () => innerRuntime.capabilities(),
      supports: (request) => innerRuntime.supports(request),
      async start(request) {
        await startGate;
        const session = await innerRuntime.start(request);
        return {
          id: session.id,
          events: () => session.events(),
          async send(text) {
            sendCount += 1;
            await session.send(text);
          },
          respondToApproval: (requestId, optionId) =>
            session.respondToApproval(requestId, optionId),
          cancel: () => session.cancel?.() ?? Promise.resolve(),
          close: () => session.close(),
        };
      },
    };
    const controller = new AiChatController(runtime);
    const submitting = controller.submit("stop before send");
    await vi.waitFor(() => {
      expect(controller.busy).toBe(true);
      expect(controller.items[0]).toMatchObject({
        role: "user",
        text: "stop before send",
      });
    });
    await controller.cancel();
    expect(controller.busy).toBe(false);
    releaseStart();
    await submitting;
    expect(sendCount).toBe(0);
    expect(controller.busy).toBe(false);
    await controller.close();
  });

  it("restores stored timestamps", async () => {
    const store = createMemorySessionStore();
    await store.save({
      id: "ai:default",
      runtime: "fake",
      runtimeSessionId: "fake-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      usage: { used: 8_000, limit: 128_000 },
      items: [
        {
          id: "user-1",
          type: "message",
          role: "user",
          text: "hi",
          createdAt: "2026-01-01T12:00:00.000Z",
        },
      ],
    });
    const controller = new AiChatController(
      new FakeAgentRuntime({ resumeSupported: false }),
      null,
      [],
      { store },
    );
    await controller.restore();
    expect(controller.items[0]).toMatchObject({
      createdAt: "2026-01-01T12:00:00.000Z",
    });
    expect(controller.usage).toEqual({ used: 8_000, limit: 128_000 });
    await controller.close();
  });

  it("restores transcript before a slow runtime resume completes", async () => {
    const store = createMemorySessionStore([
      {
        id: "ai:default:resuming:codex",
        runtime: "resuming",
        runtimeSessionId: "remote-1",
        agent: "codex",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        items: [
          {
            id: "m1",
            type: "message",
            role: "assistant",
            text: "Previously saved response",
          },
        ],
      },
    ]);
    let finishResume!: (session: AgentSession) => void;
    const resume = new Promise<AgentSession>((resolve) => {
      finishResume = resolve;
    });
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "resuming",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        throw new Error("not used");
      },
      async resume() {
        return resume;
      },
    };
    const controller = new AiChatController(runtime, null, [], {
      store,
      request: { agent: "codex" },
    });
    const restoring = controller.restore();
    await vi.waitFor(() => {
      expect(controller.items[0]).toMatchObject({
        text: "Previously saved response",
      });
    });
    finishResume({
      id: "remote-1",
      async *events() {},
      async send() {},
      async respondToApproval() {},
      async close() {},
    });
    await restoring;
    await controller.close();
  });

  it("tracks usage events without rendering provider bookkeeping", async () => {
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "usage",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "usage-1",
          async *events() {
            yield { type: "status" as const, status: "session updated" };
            yield {
              type: "usage" as const,
              usage: { used: 32_000, limit: 128_000 },
            };
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime);
    await controller.submit("check usage");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.usage).toEqual({ used: 32_000, limit: 128_000 });
    expect(controller.items.some((item) => item.type === "status")).toBe(false);
    await controller.close();
  });

  it("merges mention and drawer attachments on the agent request", async () => {
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime);
    await controller.submit("See @Notes/alpha.md", {
      metadata: { attachments: ["Notes/alpha.md", "Notes/beta.md"] },
    });
    await vi.waitFor(() => {
      expect(controller.busy).toBe(false);
    });
    expect(runtime.lastRequest?.metadata?.attachments).toEqual([
      "Notes/alpha.md",
      "Notes/beta.md",
    ]);
    await controller.close();
  });

  it("responds to agent questions without persisting answer values", async () => {
    const store = createMemorySessionStore();
    const controller = new AiChatController(
      new FakeAgentRuntime({ requireQuestion: true }),
      null,
      [],
      { store },
    );
    const sending = controller.submit("Ask me first");
    await vi.waitFor(() => {
      expect(controller.items.at(-1)).toMatchObject({
        type: "question",
        status: "pending",
      });
    });
    const question = controller.items.at(-1);
    if (question?.type !== "question") {
      throw new Error("Expected pending question");
    }
    await controller.respondToQuestion(question.request.id, {
      approach: ["super-secret-answer"],
    });
    await sending;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.items.at(-1)).toMatchObject({
      type: "question",
      status: "answered",
    });
    expect(JSON.stringify(await store.list())).not.toContain(
      "super-secret-answer",
    );
    await controller.close();
  });

  it("does not resume a legacy Codex chat after switching to Cursor", async () => {
    const store = createMemorySessionStore([
      {
        id: "ai:default",
        runtime: "fake",
        runtimeSessionId: "fake-legacy",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        items: [
          { id: "m1", type: "message", role: "assistant", text: "Codex chat" },
        ],
      },
    ]);
    const controller = new AiChatController(
      new FakeAgentRuntime({ trace: "rich" }),
      null,
      [],
      {
        store,
        request: { agent: "cursor" },
      },
    );
    await controller.restore();
    expect(controller.items).toEqual([]);
    expect(controller.sessionId).toBe("ai:default:fake:cursor");
    await controller.close();
  });

  it("renders stream failures and starts a fresh session on retry", async () => {
    let starts = 0;
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "failing",
      capabilities: (): AgentCapabilities => capabilities,
      async supports() {
        return true;
      },
      async start(): Promise<AgentSession> {
        starts += 1;
        return {
          id: `failing-${starts}`,
          async *events() {
            await Promise.resolve();
            throw new Error("provider stream failed");
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime);
    await controller.submit("first");
    await vi.waitFor(() => {
      expect(controller.items.at(-1)).toMatchObject({
        type: "error",
        text: "provider stream failed",
      });
      expect(controller.busy).toBe(false);
    });
    await controller.submit("retry");
    await vi.waitFor(() => expect(starts).toBe(2));
    await controller.close();
  });

  it("persists production chats to a folder-scoped conversation and restores offline", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const controller = new AiChatController(
      new FakeAgentRuntime({ trace: "rich" }),
      null,
      [],
      {
        repository,
        createConversation: () => ({
          id,
          scopeDir: "Projects/Atlas",
          launchNotePath: "Projects/Atlas/note.md",
        }),
        request: { agent: "codex", thinking: "medium" },
      },
    );

    await controller.submit("Persist this response");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.location).toEqual({
      scopeDir: "Projects/Atlas",
      conversationId: id,
    });
    await vi.waitFor(async () => {
      const persisted = await repository.read(controller.location!);
      expect(persisted.agents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "usage.updated" }),
        ]),
      );
    });
    const durable = await repository.read(controller.location!);
    expect(durable.metadata.title).toBe("Persist this response");
    expect(durable.agents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "binding.created",
          runtime: "fake",
          agent: "codex",
        }),
        expect.objectContaining({ type: "usage.updated" }),
      ]),
    );
    expect(durable.transcript).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "message", role: "user" }),
        expect.objectContaining({ type: "message", role: "assistant" }),
        expect.objectContaining({ type: "tool" }),
      ]),
    );

    const offline = new AiChatController(
      new FakeAgentRuntime({ resumeSupported: false }),
      null,
      [],
      { repository, location: controller.location },
    );
    await offline.restore();
    expect(offline.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "message", role: "user" }),
        expect.objectContaining({ type: "message", role: "assistant" }),
      ]),
    );
    await controller.close();
    await offline.close();
  });

  it("streams in memory and clears busy before terminal persistence", async () => {
    let releaseCompletion!: () => void;
    const completionGate = new Promise<void>((resolve) => {
      releaseCompletion = resolve;
    });
    let releaseTerminalWrite!: () => void;
    const terminalWriteGate = new Promise<void>((resolve) => {
      releaseTerminalWrite = resolve;
    });
    let terminalWriteStarted = false;
    let durableWriteAttempts = 0;
    let assistantWriteAttempts = 0;
    class GatedTerminalRepository extends ConversationRepository {
      override async appendAgentRecords(
        location: ConversationLocation,
        records: AgentBindingRecord[],
      ) {
        durableWriteAttempts += 1;
        return super.appendAgentRecords(location, records);
      }

      override async appendTranscript(
        location: ConversationLocation,
        entries: TranscriptEntry[],
      ) {
        durableWriteAttempts += 1;
        if (
          entries.some(
            (entry) => entry.type === "message" && entry.role === "assistant",
          )
        ) {
          assistantWriteAttempts += 1;
          terminalWriteStarted = true;
          await terminalWriteGate;
        }
        return super.appendTranscript(location, entries);
      }
    }
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "gated-terminal-write",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "gated-terminal-session",
          async *events() {
            yield { type: "text" as const, text: "Streamed response" };
            await completionGate;
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const repository = new GatedTerminalRepository(new MemoryTranscriptStore());
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
    });

    await controller.submit("Show streaming");
    await vi.waitFor(() =>
      expect(JSON.stringify(controller.items)).toContain("Streamed response"),
    );
    expect(controller.busy).toBe(true);
    expect(durableWriteAttempts).toBe(0);
    expect(assistantWriteAttempts).toBe(0);

    releaseCompletion();
    await vi.waitFor(() => expect(terminalWriteStarted).toBe(true));
    expect(controller.busy).toBe(false);

    releaseTerminalWrite();
    await vi.waitFor(async () => {
      expect(
        JSON.stringify(await repository.read(controller.location!)),
      ).toContain("Streamed response");
    });
    await controller.close();
  });

  it("renders local conversation data before a delayed native resume", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    await repository.create({
      id: location.conversationId,
      scopeDir: "",
      now: "2026-08-16T00:00:00.000Z",
    });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "binding-1",
        type: "binding.created",
        createdAt: "2026-08-16T00:00:00.000Z",
        runtime: "delayed",
        agent: "codex",
        nativeSessionId: "native-1",
      },
    ]);
    const assistantEntry: TranscriptEntry = {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "m1",
      type: "message",
      role: "assistant",
      text: "Available locally",
      createdAt: "2026-08-16T00:00:00.000Z",
      agentBindingId: "binding-1",
    };
    await repository.appendTranscript(location, [assistantEntry]);
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "context-1",
        type: "binding.context.updated",
        createdAt: "2026-08-16T00:00:01.000Z",
        agentBindingId: "binding-1",
        throughEntryId: assistantEntry.id,
        throughEntryHash: await transcriptEntryHash(assistantEntry),
        cause: "native-turn",
      },
    ]);
    let finishResume!: (session: AgentSession) => void;
    const resume = new Promise<AgentSession>((resolve) => {
      finishResume = resolve;
    });
    const runtime: AgentRuntime = {
      id: "delayed",
      capabilities: () => new FakeAgentRuntime().capabilities(),
      async supports() {
        return true;
      },
      async start() {
        throw new Error("not used");
      },
      async resume() {
        return resume;
      },
    };
    const controller = new AiChatController(runtime, null, [], {
      repository,
      location,
      request: { agent: "codex" },
    });
    const restoring = controller.restore();
    await vi.waitFor(() => {
      expect(controller.items[0]).toMatchObject({ text: "Available locally" });
    });
    finishResume({
      id: "native-1",
      async *events() {},
      async send() {},
      async respondToApproval() {},
      async close() {},
    });
    await restoring;
    await controller.close();
  });

  it("replaces a legacy binding without a verified cursor on its next turn", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    await repository.create({ ...location, id: location.conversationId });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: 2,
        id: "legacy-binding",
        type: "binding.created",
        createdAt: "2026-08-16T00:00:00.000Z",
        runtime: "legacy-runtime",
        agent: "codex",
        nativeSessionId: "legacy-native",
      },
    ]);
    await repository.appendTranscript(location, [
      {
        schemaVersion: 2,
        id: "legacy-message",
        type: "message",
        role: "assistant",
        text: "Legacy local evidence",
        createdAt: "2026-08-16T00:00:01.000Z",
        agentBindingId: "legacy-binding",
      },
    ]);
    const resumable = createResumableRuntime("legacy-runtime");
    const controller = new AiChatController(resumable.runtime, null, [], {
      repository,
      location,
      request: { agent: "codex" },
    });

    await controller.restore();
    expect(resumable.resumes()).toBe(0);
    await controller.submit("continue", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(location)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(2);
    });

    const snapshot = await repository.read(location);
    expect(resumable.starts()).toBe(1);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(2);
    expect(snapshot.transcript).toContainEqual(
      expect.objectContaining({
        type: "agent.switch",
        fromBindingId: "legacy-binding",
        handoffMode: "full",
      }),
    );
    await controller.close();
  });

  it("records final usage in the binding log without transcript pollution", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const capabilities = new FakeAgentRuntime().capabilities();
    const runtime: AgentRuntime = {
      id: "usage-local",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "usage-native",
          async *events() {
            yield { type: "usage" as const, usage: { used: 12, limit: 100 } };
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({ id, scopeDir: "" }),
    });
    await controller.submit("usage");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.find(
          (record) => record.type === "usage.updated",
        ),
      ).toMatchObject({
        type: "usage.updated",
        usage: { used: 12, limit: 100 },
      });
    });
    const snapshot = await repository.read(controller.location!);
    expect(JSON.stringify(snapshot.transcript)).not.toContain("usage.updated");
    await controller.close();
  });

  it("configures the model in place without changing conversation or binding", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      request: {
        agent: "codex",
        model: { provider: "codex", model: "first" },
      },
    });
    await controller.submit("first", {
      agent: "codex",
      model: { provider: "codex", model: "first" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("second", {
      agent: "codex",
      model: { provider: "codex", model: "second" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(1);
    });

    const snapshot = await repository.read(controller.location!);
    expect(runtime.sessions).toHaveLength(1);
    expect(runtime.sessions[0]?.configurations).toEqual([
      { model: { provider: "codex", model: "second" } },
    ]);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(1);
    expect(snapshot.agents).toContainEqual(
      expect.objectContaining({ type: "binding.config.updated" }),
    );
    expect(snapshot.transcript).toContainEqual(
      expect.objectContaining({ type: "agent.config" }),
    );
    expect(snapshot.transcript).not.toContainEqual(
      expect.objectContaining({ type: "agent.switch" }),
    );
    await controller.close();
  });

  it("replaces the binding with a full handoff when configuration is unsupported", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      request: {
        agent: "codex",
        model: { provider: "codex", model: "first" },
      },
    });
    await controller.submit("first evidence", {
      agent: "codex",
      model: { provider: "codex", model: "first" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    runtime.sessions[0]!.configure = async () => ({
      model: { status: "unsupported", reason: "not mutable" },
    });

    await controller.submit("second", {
      agent: "codex",
      model: { provider: "codex", model: "second" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(2);
    });

    expect(runtime.sessions).toHaveLength(2);
    expect(runtime.sessions[1]?.contextBlocks[0]?.[0]).toMatchObject({
      kind: "conversation-handoff",
      metadata: { projectionMode: "full" },
      content: expect.stringContaining("first evidence"),
    });
    const snapshot = await repository.read(controller.location!);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(2);
    expect(snapshot.transcript).toContainEqual(
      expect.objectContaining({ type: "agent.switch" }),
    );
    await controller.close();
  });

  it("does not persist an in-place configuration until the prompt is accepted", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const runtime = new FakeAgentRuntime();
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      request: {
        agent: "codex",
        model: { provider: "codex", model: "first" },
      },
    });
    await controller.submit("first", {
      agent: "codex",
      model: { provider: "codex", model: "first" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const activeBefore = (await repository.read(controller.location!)).metadata
      .activeAgentBindingId;
    runtime.sessions[0]!.send = async () => {
      throw new Error("provider rejected configured turn");
    };

    await controller.submit("second", {
      agent: "codex",
      model: { provider: "codex", model: "second" },
    });

    expect(controller.error).toBe("provider rejected configured turn");
    const snapshot = await repository.read(controller.location!);
    expect(snapshot.metadata.activeAgentBindingId).toBe(activeBefore);
    expect(snapshot.agents).not.toContainEqual(
      expect.objectContaining({ type: "binding.config.updated" }),
    );
    expect(snapshot.transcript).not.toContainEqual(
      expect.objectContaining({ type: "agent.config" }),
    );
    await controller.close();
  });

  it("preallocates the binding for app tools and persists it at the turn boundary", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const requests: AgentRequest[] = [];
    const capabilities = {
      ...new FakeAgentRuntime().capabilities(),
      resume: false,
    };
    const runtime: AgentRuntime = {
      id: "acp",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start(request) {
        requests.push(request);
        return {
          id: `native-${requests.length}`,
          async *events() {
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const prepared: string[] = [];
    const closed: string[] = [];
    let listener: ((event: AppToolBridgeEvent) => void) | undefined;
    const appToolBridge: AppToolBridgeCoordinator = {
      async prepare(input) {
        prepared.push(input.agentBindingId);
        return {
          conversationId: input.conversationId,
          agentBindingId: input.agentBindingId,
          scopeDir: input.scopeDir,
          tools: [
            {
              registrationId: "registration-1",
              ownerPluginId: "markdown",
              name: "notes_read",
              description: "Read a note",
              inputSchema: { type: "object" },
              effect: "read",
            },
          ],
          bridgeId: `bridge-${prepared.length}`,
          status: "available",
        };
      },
      async closeBinding(bindingId) {
        closed.push(bindingId);
      },
      respondToApproval: vi.fn(() => true),
      subscribe(next) {
        listener = next;
        return () => {
          listener = undefined;
        };
      },
      async close() {},
    };
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "Projects/Atlas",
        launchNotePath: "Projects/Atlas/launch.md",
      }),
      request: {
        agent: "codex",
        model: { provider: "codex", model: "first" },
      },
      appToolBridge,
    });

    await controller.submit("first", {
      agent: "codex",
      model: { provider: "codex", model: "first" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).metadata
          .activeAgentBindingId,
      ).toBe(requests[0]?.appToolSession?.agentBindingId);
    });
    const first = await repository.read(controller.location!);
    expect(requests[0]?.appToolSession).toMatchObject({
      agentBindingId: first.metadata.activeAgentBindingId,
      bridgeId: "bridge-1",
    });

    await controller.submit("second", {
      agent: "codex",
      model: { provider: "codex", model: "second" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).metadata
          .activeAgentBindingId,
      ).toBe(prepared[1]);
    });
    const second = await repository.read(controller.location!);
    expect(prepared).toHaveLength(2);
    expect(prepared[1]).toBe(second.metadata.activeAgentBindingId);
    expect(prepared[1]).not.toBe(prepared[0]);
    expect(closed).toContain(prepared[0]!);
    expect(requests[1]?.appToolSession?.tools.map((tool) => tool.name)).toEqual(
      ["notes_read"],
    );
    expect(requests[1]?.metadata?.availableAppTools).toEqual(["notes_read"]);
    expect(listener).toBeTypeOf("function");
    await controller.close();
  });

  it("cancels a restored pending interaction when native resume is unavailable", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "Projects/Atlas",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    await repository.create({ ...location, id: location.conversationId });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "binding-1",
        type: "binding.created",
        createdAt: "2026-08-16T00:00:00.000Z",
        runtime: "fake",
        agent: "codex",
        nativeSessionId: "native-1",
      },
    ]);
    await repository.appendTranscript(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "question-1:request",
        type: "question.request",
        createdAt: "2026-08-16T00:00:01.000Z",
        agentBindingId: "binding-1",
        requestId: "question-1",
        title: "Choose an approach",
        questions: [
          {
            id: "approach",
            header: "Approach",
            prompt: "Which approach?",
            allowOther: false,
            secret: false,
          },
        ],
      },
    ]);

    const controller = new AiChatController(
      new FakeAgentRuntime({ resumeSupported: false }),
      null,
      [],
      { repository, location },
    );
    await controller.restore();
    expect(controller.items).toContainEqual(
      expect.objectContaining({ type: "question", status: "cancelled" }),
    );
    const snapshot = await repository.read(location);
    expect(snapshot.transcript).toContainEqual(
      expect.objectContaining({
        type: "cancelled",
        requestId: "question-1",
        interactionType: "question",
      }),
    );
    await controller.close();
  });

  it("archives, reopens, relocates, and deletes one scoped conversation", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "Projects/Atlas",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    await repository.create({ ...location, id: location.conversationId });
    const states: Array<typeof location | null> = [];
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
      onLocationChange: (next) => states.push(next ? { ...next } : null),
    });

    await controller.openConversation(location);
    expect(controller.conversationStatus).toBe("active");
    expect(controller.location).toEqual(location);
    await controller.archiveCurrent();
    expect((await repository.read(location)).metadata.status).toBe("archived");
    expect(controller.conversationStatus).toBe("archived");
    expect(controller.location).toEqual(location);
    await controller.archiveCurrent(false);
    expect(controller.conversationStatus).toBe("active");
    expect(controller.location).toEqual(location);

    controller.relocateScope("Projects", "Archive/Projects");
    expect(controller.location?.scopeDir).toBe("Archive/Projects/Atlas");
    expect(states.at(-1)?.scopeDir).toBe("Archive/Projects/Atlas");

    // The memory store does not receive a vault rename event, so move the
    // locator back before exercising source deletion.
    controller.relocateScope("Archive/Projects", "Projects");
    await controller.deleteCurrent();
    await expect(repository.read(location)).rejects.toThrow(
      "Conversation not found",
    );
    expect(controller.location).toBeNull();
    expect(controller.conversationStatus).toBeNull();
    expect(states.at(-1)).toBeNull();
  });

  it("releases an unreadable conversation and keeps a later send visible", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const missing = {
      scopeDir: "",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
      location: missing,
      createConversation: () => ({
        scopeDir: "Notes",
        id: "223e4567-e89b-42d3-a456-426614174000",
      }),
    });
    await controller.restore();
    expect(controller.error).toMatch(/Conversation not found/u);
    expect(controller.location).toBeNull();
    expect(controller.items).toEqual([]);

    const sending = controller.submit("hello after missing metadata");
    await vi.waitFor(() => {
      expect(controller.items[0]).toMatchObject({
        type: "message",
        role: "user",
        text: "hello after missing metadata",
      });
    });
    await sending;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(controller.items[0]).toMatchObject({
      type: "message",
      role: "user",
      text: "hello after missing metadata",
    });
    expect(controller.items.some((item) => item.type === "error")).toBe(false);
    expect(controller.location).toEqual({
      scopeDir: "Notes",
      conversationId: "223e4567-e89b-42d3-a456-426614174000",
    });
    const snapshot = await repository.read(controller.location!);
    expect(snapshot.transcript).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "message",
          role: "user",
          text: "hello after missing metadata",
        }),
      ]),
    );
    await controller.close();
  });

  it("starts a scoped new conversation with a new id", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const first = {
      scopeDir: "Projects/Atlas",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    const nextId = "223e4567-e89b-42d3-a456-426614174000";
    await repository.create({ ...first, id: first.conversationId });
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      repository,
      createConversation: () => ({
        id: nextId,
        scopeDir: "Projects/Atlas",
      }),
    });
    await controller.openConversation(first);
    await controller.newConversation({
      id: nextId,
      scopeDir: "Projects/Atlas",
    });
    expect(controller.location).toEqual({
      scopeDir: "Projects/Atlas",
      conversationId: nextId,
    });
    expect(controller.conversationStatus).toBe("active");
  });

  it("switches agents through a prepared runtime and passes bounded local handoff", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const codex = new FakeAgentRuntime({ id: "acp-codex", trace: "rich" });
    const cursor = new FakeAgentRuntime({ id: "acp-cursor" });
    const controller = new AiChatController(codex, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      selectRuntime: async (request) =>
        request.agent === "cursor" ? cursor : codex,
      request: { agent: "codex" },
      memoryRecall: {
        recall: async () => [
          {
            kind: "memory-recall",
            id: "memory:handoff-order:1",
            content: "Use the app-owned transcript.",
            metadata: {
              memoryId: "handoff-order",
              revision: 1,
              scope: "workspace",
            },
          },
        ],
      },
    });

    await controller.submit("Inspect the project", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("Continue in Cursor", { agent: "cursor" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(2);
    });

    expect(cursor.lastRequest?.metadata?.contextHandoff).toBeUndefined();
    expect(cursor.sessions[0]?.contextBlocks[0]?.[0]).toMatchObject({
      kind: "conversation-handoff",
      content: expect.stringContaining("Inspect the project"),
      metadata: { projectionMode: "full" },
    });
    expect(
      cursor.sessions[0]?.contextBlocks[0]?.map((block) => block.kind),
    ).toEqual(["conversation-handoff", "memory-recall"]);
    const snapshot = await repository.read(controller.location!);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(2);
    expect(snapshot.metadata.activeAgentBindingId).toBe(
      snapshot.agents.find(
        (record) =>
          record.type === "binding.created" && record.agent === "cursor",
      )?.id,
    );
    await controller.close();
  });

  it("keeps the previous binding active when target preparation fails", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const codex = new FakeAgentRuntime({ id: "acp-codex" });
    const failing: AgentRuntime = {
      id: "acp-cursor",
      capabilities: () => codex.capabilities(),
      async supports() {
        return true;
      },
      async start() {
        throw new Error("Cursor failed to start");
      },
    };
    const controller = new AiChatController(codex, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      selectRuntime: async (request) =>
        request.agent === "cursor" ? failing : codex,
      request: { agent: "codex" },
    });
    await controller.submit("first", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const before = await repository.read(controller.location!);
    await controller.submit("switch", { agent: "cursor" });
    expect(controller.error).toBe("Cursor failed to start");
    const after = await repository.read(controller.location!);
    expect(after.metadata.activeAgentBindingId).toBe(
      before.metadata.activeAgentBindingId,
    );
    expect(
      after.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(1);
    await controller.close();
  });

  it("keeps the previous binding active when the prepared target rejects the prompt", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const codex = new FakeAgentRuntime({ id: "acp-codex" });
    const failing: AgentRuntime = {
      id: "acp-cursor",
      capabilities: () => codex.capabilities(),
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "cursor-prepared",
          async *events() {},
          async send() {
            throw new Error("Cursor rejected the prompt");
          },
          async respondToApproval() {},
          async close() {},
        };
      },
    };
    const controller = new AiChatController(codex, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      selectRuntime: async (request) =>
        request.agent === "cursor" ? failing : codex,
      request: { agent: "codex" },
    });
    await controller.submit("first", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const before = await repository.read(controller.location!);

    await controller.submit("switch", { agent: "cursor" });

    expect(controller.error).toBe("Cursor rejected the prompt");
    const after = await repository.read(controller.location!);
    expect(after.metadata.activeAgentBindingId).toBe(
      before.metadata.activeAgentBindingId,
    );
    expect(
      after.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(1);
    expect(after.transcript).not.toContainEqual(
      expect.objectContaining({ type: "agent.switch", toAgent: "cursor" }),
    );
    await controller.close();
  });

  it("resumes the original binding with only the verified switch-back delta", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const codex = new FakeAgentRuntime({ id: "acp-codex" });
    const cursor = new FakeAgentRuntime({ id: "acp-cursor" });
    const controller = new AiChatController(codex, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      selectRuntime: async (request) =>
        request.agent === "cursor" ? cursor : codex,
      request: { agent: "codex" },
    });

    await controller.submit("codex one", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("cursor one", { agent: "cursor" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("codex again", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).agents.filter(
          (record) => record.type === "binding.created",
        ),
      ).toHaveLength(2);
    });

    const beforeActivation = await repository.read(controller.location!);
    const codexBinding = beforeActivation.agents.find(
      (record) => record.type === "binding.created" && record.agent === "codex",
    );
    await vi.waitFor(async () => {
      expect(
        (await repository.read(controller.location!)).metadata
          .activeAgentBindingId,
      ).toBe(codexBinding?.id);
    });
    const snapshot = await repository.read(controller.location!);
    expect(snapshot.metadata.activeAgentBindingId).toBe(codexBinding?.id);
    expect(codex.sessions).toHaveLength(2);
    expect(codex.sessions[1]?.id).toBe(codex.sessions[0]?.id);
    expect(codex.sessions[1]?.contextBlocks[0]?.[0]).toMatchObject({
      kind: "conversation-handoff",
      metadata: { projectionMode: "delta" },
      content: expect.stringContaining("cursor one"),
    });
    expect(codex.sessions[1]?.contextBlocks[0]?.[0]?.content).not.toContain(
      "codex one",
    );
    await controller.submit("codex stays", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(codex.sessions[1]?.contextBlocks[1]).toEqual([]);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(2);
    expect(
      snapshot.transcript.filter((entry) => entry.type === "agent.switch"),
    ).toHaveLength(2);
    await controller.close();
  });

  it("attributes late events to their producing binding without changing the active UI", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    let releaseLate!: (event: AgentEvent) => void;
    const lateEvent = new Promise<AgentEvent>((resolve) => {
      releaseLate = resolve;
    });
    const capabilities = new FakeAgentRuntime().capabilities();
    const codex: AgentRuntime = {
      id: "acp-codex",
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        return {
          id: "codex-native-session",
          async *events() {
            yield await lateEvent;
            yield { type: "completed" as const };
          },
          async send() {},
          async respondToApproval() {},
          async cancel() {},
          async close() {},
        };
      },
    };
    const cursor = createResumableRuntime("acp-cursor").runtime;
    const controller = new AiChatController(codex, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      selectRuntime: async (request) =>
        request.agent === "cursor" ? cursor : codex,
      request: { agent: "codex" },
    });

    await controller.submit("start codex", { agent: "codex" });
    await controller.cancelAndSwitch({ agent: "cursor" });
    releaseLate({ type: "text", text: "late codex output" });
    await vi.waitFor(async () => {
      expect(
        JSON.stringify(
          (await repository.read(controller.location!)).transcript,
        ),
      ).toContain("late codex output");
    });
    expect(JSON.stringify(controller.items)).not.toContain("late codex output");
    const snapshot = await repository.read(controller.location!);
    const codexBindingId = snapshot.agents.find(
      (record) => record.type === "binding.created" && record.agent === "codex",
    )?.id;
    expect(
      snapshot.transcript.find(
        (entry) =>
          entry.type === "message" && entry.text === "late codex output",
      )?.agentBindingId,
    ).toBe(codexBindingId);
    await controller.close();
  });

  it("persists runtime allow-always in conversation metadata and skips the next drawer", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    const runtime = new FakeAgentRuntime({ requireApproval: true });
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: location.conversationId,
        scopeDir: location.scopeDir,
      }),
    });
    const firstTurn = controller.submit("first tool call");
    await vi.waitFor(() => {
      expect(pendingApprovals(controller)).toHaveLength(1);
    });
    const first = pendingApprovals(controller)[0];
    await controller.respondToApproval(first.request.id, "allow-always");
    await firstTurn;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(
      (await repository.read(controller.location!)).metadata.approvalGrants,
    ).toEqual([{ name: "fake.echo", decision: "allow-always" }]);

    await controller.submit("second tool call");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(runtime.sessions[0]?.prompts).toEqual([
      "first tool call",
      "second tool call",
    ]);
    expect(pendingApprovals(controller)).toHaveLength(0);

    await controller.close();
    const restoredRuntime = new FakeAgentRuntime({ requireApproval: true });
    const restored = new AiChatController(restoredRuntime, null, [], {
      repository,
      location: controller.location,
    });
    await restored.restore();
    await restored.submit("restored tool call");
    await vi.waitFor(() => expect(restored.busy).toBe(false));
    expect(restoredRuntime.sessions[0]?.prompts).toEqual([
      "restored tool call",
    ]);
    expect(pendingApprovals(restored)).toHaveLength(0);
    await restored.close();
  });

  it("does not persist allow-once, so the next matching request stays pending", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const controller = new AiChatController(
      new FakeAgentRuntime({ requireApproval: true }),
      null,
      [],
      {
        repository,
        createConversation: () => ({
          id: "123e4567-e89b-42d3-a456-426614174000",
          scopeDir: "",
        }),
      },
    );
    const firstTurn = controller.submit("once");
    await vi.waitFor(() => {
      expect(pendingApprovals(controller)).toHaveLength(1);
    });
    await controller.respondToApproval(
      pendingApprovals(controller)[0].request.id,
      "allow-once",
    );
    await firstTurn;
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(
      (await repository.read(controller.location!)).metadata.approvalGrants,
    ).toBeUndefined();
    const secondTurn = controller.submit("again");
    await vi.waitFor(() => {
      expect(pendingApprovals(controller)).toHaveLength(1);
    });
    await controller.respondToApproval(
      pendingApprovals(controller)[0].request.id,
      "allow-once",
    );
    await secondTurn;
    await controller.close();
  });
});

function pendingApprovals(controller: AiChatController) {
  return controller.items.filter(
    (
      item,
    ): item is Extract<
      (typeof controller.items)[number],
      { type: "approval" }
    > => item.type === "approval" && item.status === "pending",
  );
}

function createResumableRuntime(id: string): {
  runtime: AgentRuntime;
  starts: () => number;
  resumes: () => number;
} {
  let startCount = 0;
  let resumeCount = 0;
  const capabilities = new FakeAgentRuntime().capabilities();
  const session = (sessionId: string): AgentSession => ({
    id: sessionId,
    async *events() {},
    async send() {},
    async respondToApproval() {},
    async close() {},
  });
  return {
    runtime: {
      id,
      capabilities: () => capabilities,
      async supports() {
        return true;
      },
      async start() {
        startCount += 1;
        return session(`${id}-${startCount}`);
      },
      async resume(sessionId) {
        resumeCount += 1;
        return session(sessionId);
      },
    },
    starts: () => startCount,
    resumes: () => resumeCount,
  };
}
