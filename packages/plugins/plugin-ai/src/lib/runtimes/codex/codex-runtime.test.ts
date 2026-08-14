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
    expect(await runtime.supports({ prompt: "hi" })).toBe(false);
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
    host.handle.emit(
      `${JSON.stringify({
        method: "turn/requestApproval",
        params: { id: "a1", kind: "command", reason: "Run ls", command: "ls" },
      })}\n`,
    );
    await vi.waitFor(() => {
      expect(events.some((event) => event.type === "permission.request")).toBe(
        true,
      );
    });
    await session.respondToApproval("a1", "allow-once");
    expect(host.handle.writes.some((line) => line.includes("turn/respond"))).toBe(
      true,
    );
    host.handle.emit(`${JSON.stringify({ method: "turn/completed", params: {} })}\n`);
    await consume;
    await session.close();
  });
});
