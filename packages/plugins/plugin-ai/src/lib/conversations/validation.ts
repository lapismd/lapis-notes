import {
  CONVERSATION_SCHEMA_VERSION,
  type AgentBindingRecord,
  type ConversationMetadata,
  type TranscriptEntry,
} from "./types";
import { assertConversationId, normalizePortableVaultPath } from "./paths";

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(
  value: Record<string, unknown>,
  key: string,
  label: string,
): string {
  if (typeof value[key] !== "string" || !value[key]) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }
  return value[key];
}

function assertSchemaVersion(value: Record<string, unknown>, label: string) {
  if (value.schemaVersion !== CONVERSATION_SCHEMA_VERSION) {
    throw new Error(`${label} uses an unsupported required schema version`);
  }
}

function assertTimestamp(
  value: Record<string, unknown>,
  key: string,
  label: string,
) {
  const timestamp = requiredString(value, key, label);
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error(`${label}.${key} must be an ISO timestamp`);
  }
}

function assertOptionalString(
  value: Record<string, unknown>,
  key: string,
  label: string,
): void {
  if (value[key] != null && typeof value[key] !== "string") {
    throw new Error(`${label}.${key} must be a string`);
  }
}

function assertPortableOptionalPath(value: unknown, label: string): void {
  if (value == null) return;
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  normalizePortableVaultPath(value, { allowRoot: true, label });
}

export function validateConversationMetadata(
  value: unknown,
): ConversationMetadata {
  const data = record(value, "Conversation metadata");
  assertSchemaVersion(data, "Conversation metadata");
  assertConversationId(requiredString(data, "id", "Conversation metadata"));
  assertTimestamp(data, "createdAt", "Conversation metadata");
  assertTimestamp(data, "updatedAt", "Conversation metadata");
  if (data.status !== "active" && data.status !== "archived") {
    throw new Error("Conversation metadata.status is invalid");
  }
  if (data.title != null && typeof data.title !== "string") {
    throw new Error("Conversation metadata.title must be a string");
  }
  if (
    typeof data.title === "string" &&
    (/\r|\n/u.test(data.title) || [...data.title].length > 80)
  ) {
    throw new Error(
      "Conversation metadata.title must be one line of at most 80 code points",
    );
  }
  assertOptionalString(data, "activeAgentBindingId", "Conversation metadata");
  if (data.launchContext != null) {
    const launch = record(data.launchContext, "Conversation launchContext");
    assertPortableOptionalPath(
      launch.notePath,
      "Conversation launchContext.notePath",
    );
  }
  if (data.workspace != null) {
    const workspace = record(data.workspace, "Conversation workspace");
    requiredString(workspace, "path", "Conversation workspace");
    assertPortableOptionalPath(workspace.path, "Conversation workspace.path");
  }
  return data as ConversationMetadata;
}

export function validateAgentBindingRecord(value: unknown): AgentBindingRecord {
  const data = record(value, "Agent record");
  assertSchemaVersion(data, "Agent record");
  requiredString(data, "id", "Agent record");
  assertTimestamp(data, "createdAt", "Agent record");
  if (data.type === "binding.created") {
    requiredString(data, "runtime", "Agent record");
    for (const key of [
      "agent",
      "nativeSessionId",
      "executionHostId",
      "handoffThroughEntryId",
      "replacesBindingId",
    ]) {
      assertOptionalString(data, key, "Agent record");
    }
  } else if (data.type === "usage.updated") {
    requiredString(data, "agentBindingId", "Agent record");
    const usage = record(data.usage, "Agent record usage");
    if (
      typeof usage.used !== "number" ||
      typeof usage.limit !== "number" ||
      !Number.isFinite(usage.used) ||
      !Number.isFinite(usage.limit) ||
      usage.used < 0 ||
      usage.limit <= 0
    ) {
      throw new Error("Agent record usage is invalid");
    }
  } else {
    throw new Error("Agent record type is unsupported");
  }
  return data as AgentBindingRecord;
}

export function validateTranscriptEntry(value: unknown): TranscriptEntry {
  const data = record(value, "Transcript entry");
  assertSchemaVersion(data, "Transcript entry");
  requiredString(data, "id", "Transcript entry");
  assertTimestamp(data, "createdAt", "Transcript entry");
  const types = new Set([
    "message",
    "thinking.summary",
    "tool",
    "approval.request",
    "approval.response",
    "question.request",
    "question.response",
    "agent.switch",
    "system.notice",
    "cancelled",
    "error",
    "command",
    "skill-activation",
  ]);
  if (typeof data.type !== "string" || !types.has(data.type)) {
    throw new Error("Transcript entry type is unsupported");
  }
  if (data.source != null) {
    const source = record(data.source, "Transcript entry source");
    requiredString(source, "sessionId", "Transcript entry source");
    requiredString(source, "runId", "Transcript entry source");
    if (!Number.isSafeInteger(source.sequence) || Number(source.sequence) < 0) {
      throw new Error("Transcript entry source.sequence is invalid");
    }
  }
  switch (data.type) {
    case "message":
      if (data.role !== "user" && data.role !== "assistant") {
        throw new Error("Transcript message role is invalid");
      }
      requiredString(data, "text", "Transcript message");
      break;
    case "thinking.summary":
      requiredString(data, "text", "Transcript thinking summary");
      if (
        data.kind != null &&
        data.kind !== "summary" &&
        data.kind !== "plan"
      ) {
        throw new Error("Transcript thinking summary kind is invalid");
      }
      break;
    case "tool":
      requiredString(data, "toolId", "Transcript tool");
      requiredString(data, "name", "Transcript tool");
      if (
        data.state !== "completed" &&
        data.state !== "error" &&
        data.state !== "cancelled"
      ) {
        throw new Error("Transcript tool state is invalid");
      }
      assertOptionalString(data, "input", "Transcript tool");
      assertOptionalString(data, "output", "Transcript tool");
      break;
    case "approval.request":
      requiredString(data, "requestId", "Transcript approval request");
      requiredString(data, "title", "Transcript approval request");
      if (!Array.isArray(data.options)) {
        throw new Error("Transcript approval request options are invalid");
      }
      if ("metadata" in data) {
        throw new Error("Transcript approval request must not retain metadata");
      }
      break;
    case "approval.response":
      requiredString(data, "requestId", "Transcript approval response");
      if (!data.option || typeof data.option !== "object") {
        throw new Error("Transcript approval response option is invalid");
      }
      break;
    case "question.request":
      requiredString(data, "requestId", "Transcript question request");
      requiredString(data, "title", "Transcript question request");
      if (!Array.isArray(data.questions) || "answers" in data) {
        throw new Error("Transcript question request is invalid");
      }
      break;
    case "question.response":
      requiredString(data, "requestId", "Transcript question response");
      if (
        (data.status !== "answered" && data.status !== "cancelled") ||
        "answers" in data
      ) {
        throw new Error("Transcript question response is invalid");
      }
      break;
    case "agent.switch":
      requiredString(data, "toBindingId", "Transcript agent switch");
      break;
    case "system.notice":
      requiredString(data, "text", "Transcript system notice");
      break;
    case "cancelled":
      assertOptionalString(data, "text", "Transcript cancellation");
      assertOptionalString(data, "requestId", "Transcript cancellation");
      if (
        data.interactionType != null &&
        data.interactionType !== "approval" &&
        data.interactionType !== "question"
      ) {
        throw new Error("Transcript cancellation interaction type is invalid");
      }
      break;
    case "error":
      requiredString(data, "message", "Transcript error");
      break;
    case "command":
      requiredString(data, "command", "Transcript command");
      if (
        data.origin !== "app" &&
        data.origin !== "extension" &&
        data.origin !== "skill" &&
        data.origin !== "native-agent"
      ) {
        throw new Error("Transcript command origin is invalid");
      }
      if (
        data.status !== "completed" &&
        data.status !== "failed" &&
        data.status !== "cancelled"
      ) {
        throw new Error("Transcript command status is invalid");
      }
      break;
    case "skill-activation":
      requiredString(data, "skillId", "Transcript skill activation");
      requiredString(data, "skillName", "Transcript skill activation");
      requiredString(data, "version", "Transcript skill activation");
      if (
        data.origin !== "user" &&
        data.origin !== "model" &&
        data.origin !== "app"
      ) {
        throw new Error("Transcript skill activation origin is invalid");
      }
      break;
  }
  return data as TranscriptEntry;
}
