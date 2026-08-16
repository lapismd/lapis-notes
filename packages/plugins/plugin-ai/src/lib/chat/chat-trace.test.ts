import { describe, expect, it } from "vitest";
import { DEFAULT_APPROVAL_OPTIONS } from "../core/types";
import { applyAgentEventToChatItems, markApprovalResponse } from "./chat-trace";

describe("chat trace", () => {
  it("appends text, tools, and approval items", () => {
    let items = applyAgentEventToChatItems([], {
      type: "text",
      text: "Hello",
    });
    items = applyAgentEventToChatItems(items, { type: "text", text: " world" });
    items = applyAgentEventToChatItems(items, {
      type: "tool.start",
      id: "t1",
      name: "read",
      input: { path: "Notes/alpha.md" },
    });
    items = applyAgentEventToChatItems(items, {
      type: "permission.request",
      request: {
        id: "p1",
        kind: "execute",
        title: "Allow?",
        options: DEFAULT_APPROVAL_OPTIONS,
      },
    });
    expect(items[0]).toMatchObject({
      type: "message",
      role: "assistant",
      text: "Hello world",
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    expect(items[1]).toMatchObject({
      type: "tool",
      toolId: "t1",
      input: '{"path":"Notes/alpha.md"}',
    });
    expect(markApprovalResponse(items, "p1", "deny-once")[2]).toMatchObject({
      type: "approval",
      status: "rejected",
    });
  });

  it("settles visible thinking when a turn fails", () => {
    let items = applyAgentEventToChatItems([], {
      type: "thinking",
      text: "Checking",
    });
    items = applyAgentEventToChatItems(items, {
      type: "error",
      error: new Error("failed"),
    });
    expect(items).toMatchObject([
      { type: "thinking", state: "done" },
      { type: "error", text: "failed" },
    ]);
  });
});
