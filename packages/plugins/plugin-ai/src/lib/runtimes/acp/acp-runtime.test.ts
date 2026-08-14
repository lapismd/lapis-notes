import { describe, expect, it, vi } from "vitest";
import { AsyncEventQueue } from "../../core/event-queue";
import type { AgentEvent } from "../../core/types";
import {
  AcpAgentRuntime,
  type AcpBackendSession,
  type AcpRuntimeBackend,
} from "./acp-runtime";
import type { AcpRuntimeEventLike } from "./acp-event-mapper";

class MemoryAcpBackend implements AcpRuntimeBackend {
  async available(): Promise<boolean> {
    return true;
  }

  async start(input: {
    onPermissionRequest(
      request: { requestId: string; title: string },
    ): Promise<{ outcome: string }>;
  }): Promise<AcpBackendSession> {
    const events = new AsyncEventQueue<AcpRuntimeEventLike>();
    return {
      id: "acp-1",
      events: () => events,
      async prompt(text) {
        events.push({ type: "text_delta", text });
        const decision = await input.onPermissionRequest({
          requestId: "perm-1",
          title: "Allow write?",
        });
        events.push({ type: "status", text: `decision:${decision.outcome}` });
        events.push({ type: "done", stopReason: "end" });
      },
      async cancel() {
        events.push({ type: "done", stopReason: "cancelled" });
      },
      async close() {
        events.close();
      },
    };
  }
}

describe("AcpAgentRuntime", () => {
  it("maps permission requests through respondToApproval", async () => {
    const runtime = new AcpAgentRuntime(new MemoryAcpBackend());
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
    await session.respondToApproval(request.request.id, "allow-once");
    await send;
    await consume;
    await session.close();
    expect(events.map((event) => event.type)).toContain("permission.request");
    expect(events).toEqual(
      expect.arrayContaining([
        { type: "status", status: "decision:allow_once" },
      ]),
    );
  });
});
