import { describe, expect, it, vi } from "vitest";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
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
});
