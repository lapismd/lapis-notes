import { describe, expect, it, vi } from "vitest";
import { AsyncEventQueue } from "../../core/event-queue";
import type {
  AgentProcessHandle,
  AgentProcessHost,
  AgentProcessMessage,
} from "../../host/process-host";
import { UnavailableAgentProcessHost } from "../../host/process-host";
import { CodexNativeRuntime } from "./codex-runtime";

class MemoryProcessHandle implements AgentProcessHandle {
  readonly id = "proc-1";
  readonly #messages = new AsyncEventQueue<AgentProcessMessage>();
  readonly writes: string[] = [];

  messages(): AsyncIterable<AgentProcessMessage> {
    return this.#messages;
  }

  async write(data: string): Promise<void> {
    this.writes.push(data);
    const message = JSON.parse(data) as { id?: number; method?: string };
    if (message.id === undefined || !message.method) return;
    const result =
      message.method === "thread/start" || message.method === "thread/resume"
        ? { thread: { id: "thread-1", sessionId: "session-1" } }
        : message.method === "turn/start"
          ? { turn: { id: "turn-1" } }
          : {};
    this.emit(`${JSON.stringify({ id: message.id, result })}\n`);
  }

  async kill(): Promise<void> {
    this.#messages.close();
  }

  emit(data: string): void {
    this.#messages.push({ type: "stdout", data });
  }
}

class MemoryProcessHost implements AgentProcessHost {
  readonly available = true;
  readonly handle = new MemoryProcessHandle();

  async spawn(): Promise<AgentProcessHandle> {
    return this.handle;
  }
}

describe("CodexNativeRuntime", () => {
  it("supports only policy-amendment requests on an available host", async () => {
    const runtime = new CodexNativeRuntime(new MemoryProcessHost());
    expect(runtime.capabilities().approvals.policyAmendments).toBe(true);
    expect(await runtime.supports({ prompt: "hi" })).toBe(true);
    expect(
      await runtime.supports({ prompt: "hi", requirePolicyAmendments: true }),
    ).toBe(true);
    expect(
      await new CodexNativeRuntime(new UnavailableAgentProcessHost()).supports({
        prompt: "hi",
        requirePolicyAmendments: true,
      }),
    ).toBe(false);
  });

  it("maps requestApproval lines into ApprovalRequest and respondToApproval", async () => {
    const host = new MemoryProcessHost();
    const runtime = new CodexNativeRuntime(host);
    const session = await runtime.start({
      prompt: "",
      requirePolicyAmendments: true,
    });
    const events: Array<{ type: string }> = [];
    const consume = (async () => {
      for await (const event of session.events()) {
        events.push(event);
        if (event.type === "completed") break;
      }
    })();
    expect(session.id).toBe("thread-1");
    await session.send("hello");
    expect(
      host.handle.writes.some((line) => line.includes('"turn/start"')),
    ).toBe(true);
    host.handle.emit(
      `${JSON.stringify({
        id: "a1",
        method: "item/commandExecution/requestApproval",
        params: { itemId: "tool-1", reason: "Run ls", command: "ls" },
      })}\n`,
    );
    await vi.waitFor(() => {
      expect(events.some((event) => event.type === "permission.request")).toBe(
        true,
      );
    });
    await session.respondToApproval("a1", "allow-once");
    expect(
      host.handle.writes.some(
        (line) => line.includes('"id":"a1"') && line.includes('"accept"'),
      ),
    ).toBe(true);
    host.handle.emit(
      `${JSON.stringify({
        method: "item/reasoning/textDelta",
        params: { delta: "Checking" },
      })}\n`,
    );
    host.handle.emit(
      `${JSON.stringify({
        method: "turn/completed",
        params: { turn: { id: "turn-1", status: "completed" } },
      })}\n`,
    );
    await consume;
    expect(events.some((event) => event.type === "thinking")).toBe(true);
    await session.close();
  });

  it("resumes the stored thread with its provider context", async () => {
    const host = new MemoryProcessHost();
    const runtime = new CodexNativeRuntime(host);
    const session = await runtime.resume?.("thread-stored", {
      workspace: "/vault",
      agent: "codex",
      model: { provider: "codex", model: "gpt-test" },
      thinking: "high",
    });
    expect(session?.id).toBe("thread-1");
    expect(
      host.handle.writes.some((line) => line.includes('"thread/resume"')),
    ).toBe(true);
    await session?.close();
  });
});
