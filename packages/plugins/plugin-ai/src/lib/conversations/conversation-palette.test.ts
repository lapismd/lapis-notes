import { describe, expect, it } from "vitest";
import {
  AI_CONVERSATION_PALETTE_TAB,
  conversationPaletteItem,
} from "./conversation-palette";
import type { ConversationListEntry } from "./transcript-store";
import { CONVERSATION_SCHEMA_VERSION } from "./types";

function entry(
  overrides: Partial<ConversationListEntry> = {},
): ConversationListEntry {
  return {
    location: { scopeDir: "Notes", conversationId: "abc" },
    metadata: {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "abc",
      title: "Draft reply",
      createdAt: "2026-03-16T09:00:00",
      updatedAt: "2026-03-16T14:00:00",
      status: "active",
    },
    ...overrides,
  };
}

describe("conversationPaletteItem", () => {
  const now = new Date("2026-03-16T15:00:00");

  it("declares the Agents tab", () => {
    expect(AI_CONVERSATION_PALETTE_TAB).toEqual({
      id: "agents",
      label: "Agents",
      order: 10,
    });
  });

  it("groups recents by date label and uses the stored title", () => {
    const item = conversationPaletteItem(entry(), now);
    expect(item.title).toBe("Draft reply");
    expect(item.group).toBe("Today");
    expect(item.trailing).toBe("1h");
    expect(item.tab).toBe("agents");
    expect(item.subtitle).toBe("Notes");
  });

  it("falls back to preview and Agents when metadata is missing", () => {
    const item = conversationPaletteItem(
      {
        location: { scopeDir: "", conversationId: "xyz" },
        preview: "Continue the loft notes",
      },
      now,
    );
    expect(item.title).toBe("Continue the loft notes");
    expect(item.group).toBe("Agents");
    expect(item.subtitle).toBe("Continue the loft notes");
  });
});
