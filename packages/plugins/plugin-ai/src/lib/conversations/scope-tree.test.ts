import { describe, expect, it } from "vitest";
import { CONVERSATION_SCHEMA_VERSION } from "./types";
import type { ConversationListEntry } from "./transcript-store";
import {
  conversationsInScopeTree,
  formatDirectoryContextLabel,
  relativeScopeLabel,
  scopeDepthFromContext,
} from "./scope-tree";

const ID_A = "123e4567-e89b-42d3-a456-426614174000";
const ID_B = "223e4567-e89b-42d3-a456-426614174000";
const ID_C = "323e4567-e89b-42d3-a456-426614174000";
const ID_D = "423e4567-e89b-42d3-a456-426614174000";

function entry(
  scopeDir: string,
  id: string,
  options: {
    status?: "active" | "archived";
    updatedAt?: string;
    title?: string;
    unavailableReason?: string;
  } = {},
): ConversationListEntry {
  return {
    location: { scopeDir, conversationId: id },
    unavailableReason: options.unavailableReason,
    metadata: {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id,
      createdAt: "2026-08-19T10:00:00.000Z",
      updatedAt: options.updatedAt ?? "2026-08-19T10:00:00.000Z",
      status: options.status ?? "active",
      title: options.title,
    },
  };
}

describe("conversationsInScopeTree", () => {
  const catalog = [
    entry("", ID_A, { title: "Root", updatedAt: "2026-08-19T09:00:00.000Z" }),
    entry("Projects", ID_B, {
      title: "Projects chat",
      updatedAt: "2026-08-19T11:00:00.000Z",
    }),
    entry("Projects/Atlas", ID_C, {
      title: "Atlas",
      updatedAt: "2026-08-19T12:00:00.000Z",
    }),
    entry("Notes", ID_D, { title: "Notes" }),
  ];

  it("includes descendants and sorts by depth then recency", () => {
    expect(
      conversationsInScopeTree(catalog, "Projects").map(
        (item) => item.metadata?.title,
      ),
    ).toEqual(["Projects chat", "Atlas"]);
    expect(scopeDepthFromContext("Projects", "Projects")).toBe(0);
    expect(scopeDepthFromContext("Projects", "Projects/Atlas")).toBe(1);
  });

  it("omits archived and unavailable entries", () => {
    const mixed = [
      entry("Projects", ID_B, { title: "Active" }),
      entry("Projects/Atlas", ID_C, { title: "Old", status: "archived" }),
      entry("Projects/Beta", ID_D, {
        title: "Broken",
        unavailableReason: "unreadable",
      }),
    ];
    expect(
      conversationsInScopeTree(mixed, "Projects").map(
        (item) => item.metadata?.title,
      ),
    ).toEqual(["Active"]);
  });

  it("lists the whole vault from root and labels vault root", () => {
    expect(
      conversationsInScopeTree(catalog, "").map((item) => item.location.scopeDir),
    ).toEqual(["", "Projects", "Notes", "Projects/Atlas"]);
    expect(formatDirectoryContextLabel("")).toBe("Vault");
    expect(relativeScopeLabel("Projects", "Projects/Atlas")).toBe("Atlas");
    expect(relativeScopeLabel("Projects", "Projects")).toBe("Projects");
  });
});
