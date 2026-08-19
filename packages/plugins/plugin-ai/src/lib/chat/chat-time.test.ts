import { describe, expect, it } from "vitest";
import type { AiChatItem } from "./chat-items";
import {
  formatChatDateLabel,
  formatChatRelativeAge,
  groupChatItemsByDate,
} from "./chat-time";

describe("chat date grouping", () => {
  const now = new Date("2026-03-16T15:00:00");

  it("labels today, yesterday, and older locale dates", () => {
    expect(formatChatDateLabel("2026-03-16T09:00:00", now)).toBe("Today");
    expect(formatChatDateLabel("2026-03-15T09:00:00", now)).toBe("Yesterday");
    expect(formatChatDateLabel("2026-03-01T09:00:00", now)).toMatch(/2026/);
    expect(formatChatDateLabel("2026-03-01T09:00:00", now)).not.toBe("Today");
    expect(formatChatDateLabel("2026-03-01T09:00:00", now)).not.toBe(
      "Yesterday",
    );
  });

  it("formats compact relative ages for palette rows", () => {
    expect(formatChatRelativeAge("2026-03-16T14:59:30", now)).toBe("now");
    expect(formatChatRelativeAge("2026-03-16T14:57:00", now)).toBe("3m");
    expect(formatChatRelativeAge("2026-03-16T12:00:00", now)).toBe("3h");
    expect(formatChatRelativeAge("2026-03-14T15:00:00", now)).toBe("2d");
    expect(formatChatRelativeAge("2026-03-01T09:00:00", now)).toMatch(/2026/);
  });

  it("inserts a divider when the local calendar day changes", () => {
    const items: AiChatItem[] = [
      {
        id: "older",
        type: "message",
        role: "user",
        text: "last month",
        createdAt: "2026-03-01T09:00:00",
      },
      {
        id: "yesterday",
        type: "message",
        role: "user",
        text: "yesterday",
        createdAt: "2026-03-15T09:00:00",
      },
      {
        id: "today-user",
        type: "message",
        role: "user",
        text: "today",
        createdAt: "2026-03-16T09:00:00",
      },
      {
        id: "today-assistant",
        type: "message",
        role: "assistant",
        text: "reply",
        createdAt: "2026-03-16T09:01:00",
      },
    ];
    const entries = groupChatItemsByDate(items, now);
    const labels = entries
      .filter((entry) => entry.kind === "divider")
      .map((entry) => entry.label);
    expect(labels).toHaveLength(3);
    expect(labels[0]).toMatch(/2026/);
    expect(labels[1]).toBe("Yesterday");
    expect(labels[2]).toBe("Today");
    expect(entries.filter((entry) => entry.kind === "item")).toHaveLength(4);
  });

  it("groups consecutive tools and splits them across date dividers", () => {
    const items: AiChatItem[] = [
      {
        id: "t1",
        type: "tool",
        toolId: "t1",
        name: "read",
        state: "completed",
        input: '{"path":"a.md"}',
        createdAt: "2026-03-16T09:00:00",
      },
      {
        id: "t2",
        type: "tool",
        toolId: "t2",
        name: "edit",
        state: "completed",
        input: '{"path":"a.md"}',
        createdAt: "2026-03-16T09:01:00",
      },
      {
        id: "msg",
        type: "message",
        role: "assistant",
        text: "done",
        createdAt: "2026-03-16T09:02:00",
      },
    ];
    const entries = groupChatItemsByDate(items, now);
    expect(entries.map((entry) => entry.kind)).toEqual([
      "divider",
      "tools",
      "item",
    ]);
    const tools = entries.find((entry) => entry.kind === "tools");
    expect(tools?.kind === "tools" ? tools.items.map((item) => item.id) : []).toEqual(
      ["t1", "t2"],
    );
  });
});
