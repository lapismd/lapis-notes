import { describe, expect, it } from "vitest";
import { DEFAULT_APPROVAL_OPTIONS } from "../core/types";
import {
  applyAgentEventToChatItems,
  markApprovalResponse,
  markQuestionResponse,
} from "./chat-trace";

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

  it("keeps one streaming thinking item while tokens continue", () => {
    let items = applyAgentEventToChatItems([], {
      type: "thinking",
      text: "First ",
    });
    items = applyAgentEventToChatItems(items, {
      type: "thinking",
      text: "second",
    });
    expect(items).toMatchObject([
      { type: "thinking", text: "First second", state: "streaming" },
    ]);
  });

  it("settles streaming thinking when later text or a tool arrives", () => {
    let items = applyAgentEventToChatItems([], {
      type: "thinking",
      text: "Planning",
    });
    items = applyAgentEventToChatItems(items, {
      type: "text",
      text: "Here is the answer.",
    });
    expect(items).toMatchObject([
      { type: "thinking", state: "done" },
      { type: "message", text: "Here is the answer." },
    ]);

    items = applyAgentEventToChatItems([], {
      type: "thinking",
      text: "Looking up notes",
    });
    items = applyAgentEventToChatItems(items, {
      type: "tool.start",
      id: "t1",
      name: "notes_search",
      input: { query: "vault" },
    });
    expect(items).toMatchObject([
      { type: "thinking", state: "done" },
      { type: "tool", name: "notes_search", state: "running" },
    ]);
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

  it("tracks an agent question without storing its answer values", () => {
    const items = applyAgentEventToChatItems([], {
      type: "question.request",
      request: {
        id: "q1",
        title: "Agent needs input",
        questions: [
          {
            id: "secret",
            header: "Secret",
            prompt: "Enter the token",
            allowOther: false,
            secret: true,
          },
        ],
      },
    });
    expect(items[0]).toMatchObject({
      id: "question-q1",
      type: "question",
      status: "pending",
    });
    expect(markQuestionResponse(items, "q1")[0]).toEqual(
      expect.objectContaining({ status: "answered" }),
    );
    expect(JSON.stringify(markQuestionResponse(items, "q1"))).not.toContain(
      "token-value",
    );
  });

  it("coalesces repeated tool starts and keeps approval item keys distinct", () => {
    let items = applyAgentEventToChatItems([], {
      type: "tool.start",
      id: "exec-1",
      name: "curl -I",
      input: { command: "curl -I https://example.com" },
    });
    items = applyAgentEventToChatItems(items, {
      type: "tool.start",
      id: "exec-1",
      name: "curl -I https://example.com",
    });
    items = applyAgentEventToChatItems(items, {
      type: "permission.request",
      request: {
        id: "exec-1",
        kind: "network",
        title: "Allow network?",
        options: DEFAULT_APPROVAL_OPTIONS,
      },
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: "exec-1",
      type: "tool",
      name: "curl -I https://example.com",
      input: '{"command":"curl -I https://example.com"}',
    });
    expect(items[1]).toMatchObject({
      id: "approval-exec-1",
      type: "approval",
      request: { id: "exec-1" },
    });
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  });

  it("keeps application-tool name and input when ACP later sends a generic title", () => {
    let items = applyAgentEventToChatItems([], {
      type: "tool.start",
      id: "bridge-1",
      name: "notes_search",
      server: "lapis-tools",
      input: { query: "vault tools" },
    });
    items = applyAgentEventToChatItems(items, {
      type: "tool.start",
      id: "acp-1",
      name: "tool call",
      input: {},
    });
    items = applyAgentEventToChatItems(items, {
      type: "tool.end",
      id: "acp-1",
      name: "tool call",
      input: {},
      output: { totalMatches: 3, truncated: false },
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "tool",
      name: "notes_search",
      server: "lapis-tools",
      input: '{"query":"vault tools"}',
      output: '{"totalMatches":3,"truncated":false}',
      state: "completed",
    });
  });

  it("pairs a later application-tool start onto a generic ACP tool item", () => {
    let items = applyAgentEventToChatItems([], {
      type: "tool.start",
      id: "acp-1",
      name: "tool call",
    });
    items = applyAgentEventToChatItems(items, {
      type: "tool.start",
      id: "bridge-1",
      name: "notes_list",
      server: "lapis-tools",
      input: { path: "" },
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "tool",
      name: "notes_list",
      server: "lapis-tools",
      input: '{"path":""}',
    });
  });

  it("fills missing tool input from a completed event", () => {
    let items = applyAgentEventToChatItems([], {
      type: "tool.start",
      id: "t1",
      name: "read",
    });
    items = applyAgentEventToChatItems(items, {
      type: "tool.end",
      id: "t1",
      name: "read",
      input: { path: "Notes/alpha.md" },
      output: { text: "ok" },
    });
    expect(items[0]).toMatchObject({
      type: "tool",
      input: '{"path":"Notes/alpha.md"}',
      output: '{"text":"ok"}',
      state: "completed",
    });
  });

  it("keeps provider bookkeeping statuses out of the transcript", () => {
    let items = applyAgentEventToChatItems([], {
      type: "status",
      status: "usage updated: 25645/258400",
    });
    items = applyAgentEventToChatItems(items, {
      type: "status",
      status: "session updated",
    });
    items = applyAgentEventToChatItems(items, {
      type: "status",
      status: "available commands updated (75)",
    });
    expect(items).toEqual([]);

    items = applyAgentEventToChatItems(items, {
      type: "status",
      status: "cancelled",
    });
    expect(items).toMatchObject([{ type: "status", text: "cancelled" }]);
  });
});
