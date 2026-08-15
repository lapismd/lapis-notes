import { describe, expect, it, vi } from "vitest";
import { AsyncEventQueue } from "../../core/event-queue";
import type { AgentEvent, AgentRequest } from "../../core/types";
import {
  AcpAgentRuntime,
  type AcpBackendSession,
  type AcpRuntimeBackend,
} from "./acp-runtime";
import type { AcpRuntimeEventLike } from "./acp-event-mapper";

class MemoryAcpBackend implements AcpRuntimeBackend {
  lastRequest: AgentRequest | undefined;
  cancelled = false;
  closed = false;

  async available(): Promise<boolean> {
    return true;
  }

  async start(input: {
    request: AgentRequest;
    onPermissionRequest(
      request: { requestId: string; title: string },
    ): Promise<{ outcome: string }>;
  }): Promise<AcpBackendSession> {
    this.lastRequest = input.request;
    const events = new AsyncEventQueue<AcpRuntimeEventLike>();
    return {
      id: "acp-1",
      events: () => events,
      async prompt(text) {
        events.push({
          type: "text_delta",
          text: "thinking",
          stream: "thought",
        });
        events.push({
          type: "tool_call",
          toolCallId: "t1",
          title: "vault.read",
          rawInput: { path: "Notes/alpha.md" },
        });
        events.push({
          type: "tool_call",
          toolCallId: "t1",
          title: "vault.read",
          status: "completed",
          rawOutput: "ok",
        });
        events.push({ type: "text_delta", text });
        await new Promise((resolve) => setTimeout(resolve, 0));
        const decision = await input.onPermissionRequest({
          requestId: "perm-1",
          title: "Allow write?",
        });
        events.push({ type: "status", text: `decision:${decision.outcome}` });
        events.push({ type: "done", stopReason: "end" });
      },
      cancel: async () => {
        this.cancelled = true;
        events.push({ type: "done", stopReason: "cancelled" });
      },
      close: async () => {
        this.closed = true;
        events.close();
      },
    };
  }
}

describe("AcpAgentRuntime", () => {
  it("does not advertise steer until the session implements it", () => {
    const runtime = new AcpAgentRuntime(new MemoryAcpBackend());
    expect(runtime.capabilities().steer).toBe(false);
  });

  it("forwards model and thinking on start", async () => {
    const backend = new MemoryAcpBackend();
    const runtime = new AcpAgentRuntime(backend);
    await runtime.start({
      prompt: "",
      agent: "cursor",
      model: { provider: "cursor", model: "composer-2.5" },
      thinking: "high",
    });
    expect(backend.lastRequest).toMatchObject({
      agent: "cursor",
      model: { provider: "cursor", model: "composer-2.5" },
      thinking: "high",
    });
  });

  it("proves start, stream, tools, approval, cancel, and close", async () => {
    const backend = new MemoryAcpBackend();
    const runtime = new AcpAgentRuntime(backend);
    expect(runtime.capabilities().approvals.interactive).toBe(true);
    const session = await runtime.start({ prompt: "" });
    const events: AgentEvent[] = [];
    const consume = (async () => {
      for await (const event of session.events()) {
        events.push(event);
        if (event.type === "completed") break;
      }
    })();
    const send = session.send("edit");
    await vi.waitFor(() => {
      expect(events.some((event) => event.type === "permission.request")).toBe(
        true,
      );
    });
    const request = events.find((event) => event.type === "permission.request");
    if (request?.type !== "permission.request") {
      throw new Error("Expected permission request");
    }
    expect(request.request.metadata).toBeUndefined();
    await session.respondToApproval(request.request.id, "allow-once");
    await send;
    await consume;
    expect(events.map((event) => event.type)).toEqual([
      "thinking",
      "tool.start",
      "tool.end",
      "text",
      "permission.request",
      "status",
      "completed",
    ]);
    expect(session.cancel).toEqual(expect.any(Function));
    await session.cancel?.();
    await session.close();
    expect(backend.cancelled).toBe(true);
    expect(backend.closed).toBe(true);
  });
});
