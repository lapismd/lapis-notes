import { describe, expect, it, vi } from "vitest";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
import type {
  AgentCapabilities,
  AgentRuntime,
  AgentSession,
} from "../core/types";
import { createMemorySessionStore } from "../sessions/session-store";
import { AiChatController } from "./chat-controller.svelte";

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
    const controller = new AiChatController(new FakeAgentRuntime(), null, [], {
      store,
      request: { agent: "cursor" },
    });
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
});
