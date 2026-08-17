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
import { ConversationRepository } from "../conversations/conversation-repository";
import { MemoryTranscriptStore } from "../conversations/memory-transcript-store";
import { CONVERSATION_SCHEMA_VERSION } from "../conversations/types";
import { AiChatController } from "./chat-controller.svelte";
import type {
  AppToolBridgeCoordinator,
  AppToolBridgeEvent,
} from "../tools/desktop-app-tool-bridge";

describe("AiChatController", () => {
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
    await repository.appendTranscript(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "m1",
        type: "message",
        role: "assistant",
        text: "Available locally",
        createdAt: "2026-08-16T00:00:00.000Z",
        agentBindingId: "binding-1",
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
        (await repository.read(controller.location!)).agents.at(-1),
      ).toMatchObject({
        type: "usage.updated",
        usage: { used: 12, limit: 100 },
      });
    });
    const snapshot = await repository.read(controller.location!);
    expect(JSON.stringify(snapshot.transcript)).not.toContain("usage.updated");
    await controller.close();
  });

  it("switches model at the next turn boundary without changing conversation", async () => {
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

    const snapshot = await repository.read(controller.location!);
    expect(runtime.sessions).toHaveLength(2);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(2);
    expect(snapshot.transcript).toContainEqual(
      expect.objectContaining({ type: "agent.switch" }),
    );
    await controller.close();
  });

  it("preallocates the persisted binding for app tools and replaces it on switch", async () => {
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
    const second = await repository.read(controller.location!);
    expect(prepared).toHaveLength(2);
    expect(prepared[1]).toBe(second.metadata.activeAgentBindingId);
    expect(prepared[1]).not.toBe(prepared[0]);
    expect(closed).toContain(prepared[0]!);
    expect(requests[1]?.appToolSession?.tools.map((tool) => tool.name)).toEqual([
      "notes_read",
    ]);
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
    await controller.archiveCurrent();
    expect((await repository.read(location)).metadata.status).toBe("archived");

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
    expect(states.at(-1)).toBeNull();
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
    });

    await controller.submit("Inspect the project", { agent: "codex" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("Continue in Cursor", { agent: "cursor" });
    await vi.waitFor(() => expect(controller.busy).toBe(false));

    expect(cursor.lastRequest?.metadata?.contextHandoff).toMatchObject({
      text: expect.stringContaining("User: Inspect the project"),
      throughEntryId: expect.any(String),
    });
    expect(
      JSON.stringify(cursor.lastRequest?.metadata?.contextHandoff),
    ).not.toContain("heading: Notes");
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

  it("creates a fresh binding and snapshot when switching back", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const codex = createResumableRuntime("acp-codex");
    const cursor = createResumableRuntime("acp-cursor");
    const controller = new AiChatController(codex.runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "",
      }),
      selectRuntime: async (request) =>
        request.agent === "cursor" ? cursor.runtime : codex.runtime,
      request: { agent: "codex" },
    });

    await controller.submit("codex one", { agent: "codex" });
    await controller.submit("cursor one", { agent: "cursor" });
    await controller.submit("codex again", { agent: "codex" });

    const snapshot = await repository.read(controller.location!);
    expect(codex.starts()).toBe(2);
    expect(codex.resumes()).toBe(0);
    expect(
      snapshot.agents.filter((record) => record.type === "binding.created"),
    ).toHaveLength(3);
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
    const before = await repository.read(controller.location!);
    const codexBindingId = before.metadata.activeAgentBindingId;
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
    expect(
      snapshot.transcript.find(
        (entry) =>
          entry.type === "message" && entry.text === "late codex output",
      )?.agentBindingId,
    ).toBe(codexBindingId);
    await controller.close();
  });
});

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
