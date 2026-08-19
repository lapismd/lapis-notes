import { describe, expect, it } from "vitest";
import { MAX_CONVERSATION_APPROVAL_GRANTS } from "./approval-grants";
import { CONVERSATION_SCHEMA_VERSION } from "./types";
import { validateConversationMetadata } from "./validation";

const BASE = {
  schemaVersion: CONVERSATION_SCHEMA_VERSION,
  id: "123e4567-e89b-42d3-a456-426614174000",
  createdAt: "2026-08-19T12:00:00.000Z",
  updatedAt: "2026-08-19T12:00:00.000Z",
  status: "active" as const,
};

describe("validateConversationMetadata", () => {
  it("keeps normalized approval grants and drops generic identities", () => {
    expect(
      validateConversationMetadata({
        ...BASE,
        approvalGrants: [
          {
            name: "lapis-tools-notes_search: notes_search",
            decision: "allow-always",
          },
          { name: "acp_tool", decision: "allow-always" },
        ],
      }).approvalGrants,
    ).toEqual([{ name: "notes_search", decision: "allow-always" }]);
  });

  it("rejects a non-array or oversized approval grant list", () => {
    expect(() =>
      validateConversationMetadata({ ...BASE, approvalGrants: {} }),
    ).toThrow(/approvalGrants must be an array/u);
    expect(() =>
      validateConversationMetadata({
        ...BASE,
        approvalGrants: Array.from(
          { length: MAX_CONVERSATION_APPROVAL_GRANTS + 1 },
          (_, index) => ({
            name: `tool-${index}`,
            decision: "allow-always",
          }),
        ),
      }),
    ).toThrow(/exceeds the stored limit/u);
  });
});
