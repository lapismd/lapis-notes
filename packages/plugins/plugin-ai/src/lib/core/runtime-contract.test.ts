import { describe, expect, it, vi } from "vitest";
import { createAgentRuntimeRegistry } from "../registry/runtime-registry";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
import type { AgentEvent, AgentRuntime } from "./types";

async function collectUntilComplete(runtime: AgentRuntime, prompt: string) {
  const session = await runtime.start({ prompt: "" });
  const events: AgentEvent[] = [];
  const consume = (async () => {
    for await (const event of session.events()) {
      events.push(event);
      if (event.type === "completed" || event.type === "error") break;
    }
  })();
  await session.send(prompt);
  await consume;
  await session.close();
  return { session, events };
}

describe("agent runtime contract", () => {
  it("registers and selects a compatible runtime", async () => {
    const fake = new FakeAgentRuntime();
    const registry = createAgentRuntimeRegistry();
    registry.register(fake);
    expect(registry.get("fake")).toBe(fake);
    const selected = await registry.select({ prompt: "hello" });
    expect(selected.id).toBe("fake");
  });

  it("reports capabilities and streams a completed turn", async () => {
    const runtime = new FakeAgentRuntime();
    expect(runtime.capabilities().approvals.supported).toBe(true);
    expect(await runtime.supports({ prompt: "hi" })).toBe(true);
    const { events } = await collectUntilComplete(runtime, "hello");
    expect(events).toEqual([
      { type: "text", text: "hello" },
      { type: "completed", result: { prompt: "hello" } },
    ]);
  });

  it("blocks on approval and resumes after respondToApproval", async () => {
    const runtime = new FakeAgentRuntime({ requireApproval: true });
    const session = await runtime.start({ prompt: "" });
    const events: AgentEvent[] = [];
    const consume = (async () => {
      for await (const event of session.events()) {
        events.push(event);
        if (event.type === "completed") break;
      }
    })();
    const send = session.send("needs approval");
    await vi.waitFor(() => {
      expect(events.some((event) => event.type === "permission.request")).toBe(
        true,
      );
    });
    const request = events.find((event) => event.type === "permission.request");
    if (request?.type !== "permission.request") {
      throw new Error("Expected a permission request");
    }
    await session.respondToApproval(request.request.id, "allow-once");
    await send;
    await consume;
    await session.close();
    expect(events.map((event) => event.type)).toEqual([
      "text",
      "permission.request",
      "status",
      "completed",
    ]);
  });

  it("cancels and cleans up a session", async () => {
    const runtime = new FakeAgentRuntime();
    const session = await runtime.start({ prompt: "" });
    await session.cancel?.();
    await session.close();
    expect(runtime.sessions[0]?.cancelled).toBe(true);
    expect(runtime.sessions[0]?.closed).toBe(true);
  });

  it("resumes a stored fake session id", async () => {
    const runtime = new FakeAgentRuntime();
    const first = await runtime.start({ prompt: "" });
    const resumed = await runtime.resume?.(first.id);
    expect(resumed?.id).toBe(first.id);
    await first.close();
    await expect(runtime.resume?.(first.id)).rejects.toThrow(
      /Unknown fake session/,
    );
  });

  it("streams a rich Fake turn with thinking, a tool, and Markdown", async () => {
    const runtime = new FakeAgentRuntime({ trace: "rich" });
    const { events } = await collectUntilComplete(runtime, "Summarize");
    expect(events.map((event) => event.type)).toEqual([
      "thinking",
      "tool.start",
      "tool.end",
      "text",
      "status",
      "status",
      "usage",
      "completed",
    ]);
    expect(events[0]).toMatchObject({
      type: "thinking",
      text: "I will read the mentioned note, then summarize it.",
    });
    expect(events[3]).toMatchObject({
      type: "text",
      text: expect.stringContaining("## Summary"),
    });
    expect(events[6]).toEqual({
      type: "usage",
      usage: { used: 12_920, limit: 128_000 },
    });
  });

  it("rejects unsupported policy-amendment requests on Fake", async () => {
    const runtime = new FakeAgentRuntime();
    expect(
      await runtime.supports({
        prompt: "x",
        requirePolicyAmendments: true,
      }),
    ).toBe(false);
  });
});
