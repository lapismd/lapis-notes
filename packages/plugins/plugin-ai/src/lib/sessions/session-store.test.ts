import { describe, expect, it } from "vitest";
import {
  createMemorySessionStore,
  createPersistedSessionStore,
  createStoredAgentSession,
  interruptPendingInteractions,
} from "./session-store";

describe("session store", () => {
  it("persists runtime-neutral metadata and chat items", async () => {
    const store = createMemorySessionStore();
    const session = createStoredAgentSession({
      id: "s1",
      runtime: "fake",
      runtimeSessionId: "fake-1",
      workspace: "/vault",
      agent: "cursor",
      model: { provider: "cursor", model: "composer-2.5" },
      thinking: "high",
      usage: { used: 12_000, limit: 128_000 },
      items: [{ id: "m1", type: "message", role: "user", text: "hi" }],
    });
    await store.save(session);
    expect(await store.get("s1")).toMatchObject({
      runtime: "fake",
      runtimeSessionId: "fake-1",
      workspace: "/vault",
      agent: "cursor",
      model: { provider: "cursor", model: "composer-2.5" },
      thinking: "high",
      usage: { used: 12_000, limit: 128_000 },
    });
    expect((await store.list())[0]?.items[0]).toMatchObject({ text: "hi" });
    await store.remove("s1");
    expect(await store.get("s1")).toBeUndefined();
  });

  it("writes runtime-neutral sessions through a plugin-data backend", async () => {
    let persisted: ReturnType<typeof createStoredAgentSession>[] = [];
    const store = createPersistedSessionStore({
      async read() {
        return persisted;
      },
      async write(sessions) {
        persisted = sessions;
      },
    });
    await store.save(
      createStoredAgentSession({
        id: "ai:default",
        runtime: "fake",
        runtimeSessionId: "fake-1",
        pendingApprovalId: "p1",
        pendingQuestionId: "q1",
        items: [{ id: "m1", type: "message", role: "user", text: "hi" }],
      }),
    );
    expect(persisted[0]).toMatchObject({
      id: "ai:default",
      pendingApprovalId: "p1",
      pendingQuestionId: "q1",
    });
    expect((await store.get("ai:default"))?.items[0]).toMatchObject({
      text: "hi",
    });
  });

  it("strips vendor approval metadata when cloning sessions", async () => {
    const store = createMemorySessionStore();
    await store.save(
      createStoredAgentSession({
        id: "s1",
        runtime: "acp",
        runtimeSessionId: "acp-1",
        items: [
          {
            id: "a1",
            type: "approval",
            status: "pending",
            request: {
              id: "p1",
              kind: "execute",
              title: "Allow?",
              options: [],
              metadata: { raw: { toolCall: { toolCallId: "tc-1" } } },
            },
          },
        ],
      }),
    );
    const stored = await store.get("s1");
    expect(stored?.items[0]).toMatchObject({
      type: "approval",
      request: { id: "p1", title: "Allow?" },
    });
    expect(
      stored?.items[0] &&
        stored.items[0].type === "approval" &&
        stored.items[0].request.metadata,
    ).toBeUndefined();
  });

  it("settles streaming thinking and running tools when interrupted", () => {
    const items = interruptPendingInteractions([
      {
        id: "think-1",
        type: "thinking",
        text: "Still reasoning",
        state: "streaming",
      },
      {
        id: "tool-1",
        type: "tool",
        toolId: "tool-1",
        name: "notes_search",
        state: "running",
        input: '{"query":"vault"}',
      },
    ]);
    expect(items).toMatchObject([
      { type: "thinking", state: "done" },
      { type: "tool", state: "completed" },
    ]);
  });
});
