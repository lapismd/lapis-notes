import { describe, expect, it } from "vitest";
import {
  approvalGrantIdentity,
  canonicalizeApprovalToolName,
  MAX_CONVERSATION_APPROVAL_GRANTS,
  normalizeApprovalGrants,
  persistentDecisionForRequest,
  persistentDecisionFromOption,
  upsertApprovalGrant,
} from "./approval-grants";

describe("approval grants", () => {
  it("normalizes MCP and lapis-tools titles to one identity", () => {
    expect(canonicalizeApprovalToolName("notes_search")).toBe("notes_search");
    expect(canonicalizeApprovalToolName("lapis-tools-notes_search")).toBe(
      "notes_search",
    );
    expect(
      canonicalizeApprovalToolName("lapis-tools-notes_search: notes_search"),
    ).toBe("notes_search");
    expect(canonicalizeApprovalToolName("Allow notes_search?")).toBe(
      "notes_search",
    );
    expect(canonicalizeApprovalToolName("fake.echo")).toBe("fake.echo");
    expect(canonicalizeApprovalToolName("acp_tool")).toBeUndefined();
    expect(canonicalizeApprovalToolName("MCP: tool")).toBeUndefined();
    expect(canonicalizeApprovalToolName("tool call")).toBeUndefined();
  });

  it("prefers a concrete tool input name over a generic title", () => {
    expect(
      approvalGrantIdentity({
        title: "MCP: tool",
        tool: { name: "acp_tool", input: { name: "notes_search" } },
      }),
    ).toBe("notes_search");
  });

  it("answers a later request from the stored grant and caps the list", () => {
    expect(persistentDecisionFromOption("allow_always")).toBe("allow-always");
    expect(persistentDecisionFromOption("allow-once")).toBeUndefined();
    const grants = upsertApprovalGrant([], "notes_search", "allow-always");
    expect(
      persistentDecisionForRequest(grants, {
        title: "lapis-tools-notes_search: notes_search",
        tool: { name: "lapis-tools-notes_search" },
      }),
    ).toBe("allow-always");
    const overflow = Array.from(
      { length: MAX_CONVERSATION_APPROVAL_GRANTS + 1 },
      (_, index) => ({
        name: `tool-${index}`,
        decision: "allow-always" as const,
      }),
    );
    const normalized = normalizeApprovalGrants(overflow);
    expect(normalized).toHaveLength(MAX_CONVERSATION_APPROVAL_GRANTS);
    expect(normalized[0]?.name).toBe("tool-1");
    expect(
      normalizeApprovalGrants([
        { name: "notes_search", decision: "allow-always" },
        { name: "notes_search", decision: "deny-always" },
      ]),
    ).toEqual([{ name: "notes_search", decision: "deny-always" }]);
  });
});
