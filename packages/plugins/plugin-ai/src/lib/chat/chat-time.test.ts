import { describe, expect, it } from "vitest";
import type { AiChatItem } from "./chat-items";
import { formatChatDateLabel, groupChatItemsByDate } from "./chat-time";

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
});
