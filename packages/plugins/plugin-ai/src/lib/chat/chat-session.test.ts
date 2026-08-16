import { describe, expect, it } from "vitest";
import { DEFAULT_APPROVAL_OPTIONS } from "../core/types";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
import { createStoredAgentSession } from "../sessions/session-store";
import { applyStoredSessionResumePolicy, chatSessionId } from "./chat-session";

const pendingItems = [
  {
    id: "p1",
    type: "approval" as const,
    status: "pending" as const,
    request: {
      id: "p1",
      kind: "execute" as const,
      title: "Allow?",
      options: DEFAULT_APPROVAL_OPTIONS,
    },
  },
];

describe("stored chat session resume policy", () => {
  it("isolates provider sessions within one workspace", () => {
    expect(chatSessionId("vault", "acp", "codex")).toBe("ai:vault:acp:codex");
    expect(chatSessionId("vault", "acp", "cursor")).toBe("ai:vault:acp:cursor");
  });
  it("keeps pending approvals only when the runtime actually resumed", () => {
    const stored = createStoredAgentSession({
      id: "ai:default",
      runtime: "fake",
      runtimeSessionId: "fake-1",
      items: pendingItems,
      pendingApprovalId: "p1",
    });
    const resumed = applyStoredSessionResumePolicy({
      stored,
      runtime: new FakeAgentRuntime(),
      resumed: true,
    });
    expect(resumed.pendingApprovalId).toBe("p1");
    expect(resumed.items[0]).toMatchObject({ status: "pending" });
  });

  it("interrupts pending approvals when resume is unavailable", () => {
    const stored = createStoredAgentSession({
      id: "ai:default",
      runtime: "fake",
      runtimeSessionId: "fake-1",
      items: pendingItems,
      pendingApprovalId: "p1",
    });
    const restored = applyStoredSessionResumePolicy({
      stored,
      runtime: new FakeAgentRuntime({ resumeSupported: false }),
      resumed: false,
    });
    expect(restored.interrupted).toBe(true);
    expect(restored.pendingApprovalId).toBeUndefined();
    expect(restored.items[0]).toMatchObject({ status: "cancelled" });
  });
});
