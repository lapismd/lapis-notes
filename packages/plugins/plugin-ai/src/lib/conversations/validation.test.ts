import { describe, expect, it } from "vitest";
import { MAX_CONVERSATION_APPROVAL_GRANTS } from "./approval-grants";
import { CONVERSATION_SCHEMA_VERSION } from "./types";
import {
  validateAgentBindingRecord,
  validateConversationMetadata,
  validateTranscriptEntry,
} from "./validation";

const BASE = {
  schemaVersion: CONVERSATION_SCHEMA_VERSION,
  id: "123e4567-e89b-42d3-a456-426614174000",
  createdAt: "2026-08-19T12:00:00.000Z",
  updatedAt: "2026-08-19T12:00:00.000Z",
  status: "active" as const,
};

describe("validateConversationMetadata", () => {
  it("accepts legacy v1 and v2 alongside current v3 without rewriting", () => {
    expect(
      validateConversationMetadata({ ...BASE, schemaVersion: 1 }),
    ).toMatchObject({
      schemaVersion: 1,
    });
    expect(validateConversationMetadata(BASE)).toMatchObject({
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
    });
    expect(
      validateConversationMetadata({ ...BASE, schemaVersion: 2 }),
    ).toMatchObject({
      schemaVersion: 2,
    });
    expect(
      validateTranscriptEntry({
        schemaVersion: 1,
        id: "legacy-message",
        type: "message",
        role: "user",
        text: "Legacy evidence",
        createdAt: "2026-08-19T12:00:00.000Z",
      }),
    ).toMatchObject({ schemaVersion: 1, type: "message" });
  });

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

  it("keeps pinned true and omits an explicit false", () => {
    expect(validateConversationMetadata({ ...BASE, pinned: true }).pinned).toBe(
      true,
    );
    expect(
      validateConversationMetadata({ ...BASE, pinned: false }).pinned,
    ).toBeUndefined();
  });

  it("rejects a non-boolean pinned flag", () => {
    expect(() =>
      validateConversationMetadata({ ...BASE, pinned: "yes" }),
    ).toThrow(/pinned must be a boolean/u);
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

describe("conversation schema v3 records", () => {
  const createdAt = "2026-08-19T12:00:00.000Z";
  const hash = "a".repeat(64);

  it("accepts append-only binding context, configuration, and summary records", () => {
    expect(
      validateAgentBindingRecord({
        schemaVersion: 3,
        id: "context-1",
        type: "binding.context.updated",
        createdAt,
        agentBindingId: "binding-1",
        throughEntryId: "message-1",
        throughEntryHash: hash,
        cause: "handoff",
        handoffId: "handoff-1",
        projectionMode: "delta",
        omittedEntryCount: 2,
      }),
    ).toMatchObject({ type: "binding.context.updated" });
    expect(
      validateAgentBindingRecord({
        schemaVersion: 3,
        id: "config-1",
        type: "binding.config.updated",
        createdAt,
        agentBindingId: "binding-1",
        model: { provider: "codex", model: "gpt-5.6-sol" },
        thinking: "high",
      }),
    ).toMatchObject({ type: "binding.config.updated" });
    expect(
      validateAgentBindingRecord({
        schemaVersion: 3,
        id: "summary-1",
        type: "handoff.summary.created",
        createdAt,
        conversationId: BASE.id,
        fromEntryId: "message-1",
        throughEntryId: "message-2",
        sourceHash: hash,
        summary: "The owner chose the local database.",
        processor: { runtime: "acp", agent: "codex", model: "pinned" },
        estimatedTokens: 9,
      }),
    ).toMatchObject({ type: "handoff.summary.created" });
    expect(
      validateTranscriptEntry({
        schemaVersion: 3,
        id: "agent-config-1",
        type: "agent.config",
        createdAt,
        agentBindingId: "binding-1",
        model: { provider: "codex", model: "gpt-5.6-sol" },
      }),
    ).toMatchObject({ type: "agent.config" });
  });

  it("rejects legacy versions and malformed hashes or processor identities", () => {
    const context = {
      schemaVersion: 3,
      id: "context-1",
      type: "binding.context.updated",
      createdAt,
      agentBindingId: "binding-1",
      throughEntryId: "message-1",
      throughEntryHash: hash,
      cause: "native-turn",
    };
    expect(() =>
      validateAgentBindingRecord({ ...context, schemaVersion: 2 }),
    ).toThrow(/requires schema version 3/u);
    expect(() =>
      validateAgentBindingRecord({ ...context, throughEntryHash: "changed" }),
    ).toThrow(/throughEntryHash is invalid/u);
    expect(() =>
      validateAgentBindingRecord({
        schemaVersion: 3,
        id: "summary-1",
        type: "handoff.summary.created",
        createdAt,
        conversationId: BASE.id,
        fromEntryId: "message-1",
        throughEntryId: "message-2",
        sourceHash: hash,
        summary: "Summary",
        processor: { runtime: "acp" },
        estimatedTokens: 2,
      }),
    ).toThrow(/processor.agent/u);
  });
});
