import {
  MAX_CONVERSATION_APPROVAL_GRANTS,
  normalizeApprovalGrants,
} from "./approval-grants";
import {
  CONVERSATION_SCHEMA_VERSION,
  LEGACY_CONVERSATION_SCHEMA_VERSION,
  PREVIOUS_CONVERSATION_SCHEMA_VERSION,
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
  if (
    value.schemaVersion !== CONVERSATION_SCHEMA_VERSION &&
    value.schemaVersion !== PREVIOUS_CONVERSATION_SCHEMA_VERSION &&
    value.schemaVersion !== LEGACY_CONVERSATION_SCHEMA_VERSION
  ) {
    throw new Error(`${label} uses an unsupported required schema version`);
  }
}

function assertCurrentSchemaVersion(
  value: Record<string, unknown>,
  label: string,
): void {
  if (value.schemaVersion !== CONVERSATION_SCHEMA_VERSION) {
    throw new Error(`${label} requires schema version 3`);
  }
}

function assertModelRef(value: unknown, label: string): void {
  if (value == null) return;
  const model = record(value, label);
  requiredString(model, "provider", label);
  requiredString(model, "model", label);
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

function assertInventory(value: unknown, label: string): void {
  const inventory = record(value, `${label}.inventory`);
  if (inventory.kind !== "skills" && inventory.kind !== "tools") {
    throw new Error(`${label}.inventory.kind is invalid`);
  }
  if (!Array.isArray(inventory.items)) {
    throw new Error(`${label}.inventory.items must be an array`);
  }
  for (const entry of inventory.items) {
    const item = record(entry, `${label}.inventory.item`);
    requiredString(item, "name", `${label}.inventory.item`);
    if (item.kind !== "skill" && item.kind !== "tool") {
      throw new Error(`${label}.inventory.item.kind is invalid`);
    }
    assertOptionalString(item, "description", `${label}.inventory.item`);
    assertOptionalString(item, "path", `${label}.inventory.item`);
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
  if (data.approvalGrants != null) {
    if (!Array.isArray(data.approvalGrants)) {
      throw new Error("Conversation metadata.approvalGrants must be an array");
    }
    if (data.approvalGrants.length > MAX_CONVERSATION_APPROVAL_GRANTS) {
      throw new Error(
        "Conversation metadata.approvalGrants exceeds the stored limit",
      );
    }
    const grants = normalizeApprovalGrants(data.approvalGrants);
    if (grants.length > 0) data.approvalGrants = grants;
    else delete data.approvalGrants;
  }
  if (data.pinned != null && typeof data.pinned !== "boolean") {
    throw new Error("Conversation metadata.pinned must be a boolean");
  }
  if (data.pinned === false) delete data.pinned;
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
  } else if (data.type === "binding.context.updated") {
    assertCurrentSchemaVersion(data, "Agent context record");
    requiredString(data, "agentBindingId", "Agent record");
    requiredString(data, "throughEntryId", "Agent record");
    const hash = requiredString(data, "throughEntryHash", "Agent record");
    if (!/^[0-9a-f]{64}$/u.test(hash)) {
      throw new Error("Agent record.throughEntryHash is invalid");
    }
    if (data.cause !== "native-turn" && data.cause !== "handoff") {
      throw new Error("Agent record.cause is invalid");
    }
    assertOptionalString(data, "handoffId", "Agent record");
    assertProjectionMode(data.projectionMode, "Agent record.projectionMode");
    assertOptionalCount(
      data.omittedEntryCount,
      "Agent record.omittedEntryCount",
    );
  } else if (data.type === "binding.config.updated") {
    assertCurrentSchemaVersion(data, "Agent configuration record");
    requiredString(data, "agentBindingId", "Agent record");
    assertModelRef(data.model, "Agent record.model");
    assertThinking(data.thinking, "Agent record.thinking");
    if (data.model == null && data.thinking == null) {
      throw new Error("Agent configuration record must change a field");
    }
  } else if (data.type === "handoff.summary.created") {
    assertCurrentSchemaVersion(data, "Handoff summary record");
    requiredString(data, "conversationId", "Agent record");
    requiredString(data, "fromEntryId", "Agent record");
    requiredString(data, "throughEntryId", "Agent record");
    const hash = requiredString(data, "sourceHash", "Agent record");
    if (!/^[0-9a-f]{64}$/u.test(hash)) {
      throw new Error("Agent record.sourceHash is invalid");
    }
    requiredString(data, "summary", "Agent record");
    const processor = record(data.processor, "Agent record processor");
    requiredString(processor, "runtime", "Agent record processor");
    requiredString(processor, "agent", "Agent record processor");
    requiredString(processor, "model", "Agent record processor");
    if (
      !Number.isSafeInteger(data.estimatedTokens) ||
      Number(data.estimatedTokens) <= 0
    ) {
      throw new Error("Agent record.estimatedTokens is invalid");
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
    "agent.config",
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
  if (data.provenance != null) {
    const provenance = record(data.provenance, "Transcript entry provenance");
    if (
      !["owner", "agent", "untrusted", "system"].includes(
        String(provenance.originClass),
      )
    ) {
      throw new Error("Transcript entry provenance.originClass is invalid");
    }
    if (
      ![
        "user-message",
        "assistant-message",
        "runtime-output",
        "owner-response",
        "app-system",
      ].includes(String(provenance.sourceKind))
    ) {
      throw new Error("Transcript entry provenance.sourceKind is invalid");
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
      assertOptionalString(data, "handoffId", "Transcript agent switch");
      assertOptionalString(
        data,
        "handoffThroughEntryId",
        "Transcript agent switch",
      );
      assertProjectionMode(
        data.handoffMode,
        "Transcript agent switch handoffMode",
      );
      assertOptionalCount(
        data.omittedEntryCount,
        "Transcript agent switch omittedEntryCount",
      );
      break;
    case "agent.config":
      assertCurrentSchemaVersion(data, "Transcript agent config");
      assertModelRef(data.model, "Transcript agent config model");
      assertThinking(data.thinking, "Transcript agent config thinking");
      if (data.model == null && data.thinking == null) {
        throw new Error("Transcript agent config must change a field");
      }
      break;
    case "system.notice":
      requiredString(data, "text", "Transcript system notice");
      if (
        data.layout != null &&
        data.layout !== "report" &&
        data.layout !== "inventory"
      ) {
        throw new Error("Transcript system notice layout is invalid");
      }
      if (data.layout === "inventory") {
        assertInventory(data.inventory, "Transcript system notice");
      }
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

function assertProjectionMode(value: unknown, label: string): void {
  if (
    value != null &&
    value !== "full" &&
    value !== "delta" &&
    value !== "summary-tail"
  ) {
    throw new Error(`${label} is invalid`);
  }
}

function assertOptionalCount(value: unknown, label: string): void {
  if (value != null && (!Number.isSafeInteger(value) || Number(value) < 0)) {
    throw new Error(`${label} is invalid`);
  }
}

function assertThinking(value: unknown, label: string): void {
  if (
    value != null &&
    value !== "off" &&
    value !== "low" &&
    value !== "medium" &&
    value !== "high"
  ) {
    throw new Error(`${label} is invalid`);
  }
}
