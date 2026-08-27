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
  lastPrompt = "";
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
    const recordPrompt = (text: string) => {
      this.lastPrompt = text;
    };
    return {
      id: "acp-1",
      events: () => events,
      async prompt(text) {
        recordPrompt(text);
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

  it("prepends path-free skill activation instructions on the first prompt", async () => {
    const backend = new MemoryAcpBackend();
    const runtime = new AcpAgentRuntime(backend);
    const session = await runtime.start({
      prompt: "",
      skillActivations: [
        {
          skillId: "folder:research-notes",
          skillName: "research-notes",
          version: "1",
          source: "user",
          arguments: "authentication",
          instructions: "Use notes_search then read.",
        },
      ],
    });
    const consume = (async () => {
      for await (const event of session.events()) {
        if (event.type === "permission.request") {
          await session.respondToApproval(event.request.id, "allow-once");
        }
        if (event.type === "completed") break;
      }
    })();
    await session.send("authentication");
    await consume;
    expect(backend.lastPrompt).toContain("<skill_activation");
    expect(backend.lastPrompt).toContain("Use notes_search then read.");
    expect(backend.lastPrompt).toContain("authentication");
    expect(backend.lastPrompt).not.toContain(".agents/skills");
    await session.close();
  });

  it("serializes typed memory context separately from the user prompt contract", async () => {
    const backend = new MemoryAcpBackend();
    const runtime = new AcpAgentRuntime(backend);
    const session = await runtime.start({ prompt: "" });
    const consume = (async () => {
      for await (const event of session.events()) {
        if (event.type === "permission.request") {
          await session.respondToApproval(event.request.id, "allow-once");
        }
        if (event.type === "completed") break;
      }
    })();
    await session.send("Draft the note", {
      contextBlocks: [
        {
          kind: "memory-recall",
          id: "memory:headings:2",
          content: "Use compact headings.",
          metadata: {
            memoryId: "headings",
            revision: 2,
            scope: "project",
          },
        },
      ],
    });
    await consume;

    expect(backend.lastPrompt).toContain(
      '<lapis-context kind="memory-recall" id="memory:headings:2">',
    );
    expect(backend.lastPrompt).toContain("Use compact headings.");
    expect(backend.lastPrompt).toContain("<lapis-user-prompt>\n\nDraft the note");
    await session.close();
  });
});
