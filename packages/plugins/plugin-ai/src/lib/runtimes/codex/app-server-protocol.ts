import {
  DEFAULT_APPROVAL_OPTIONS,
  type AgentEvent,
  type ApprovalKind,
  type ApprovalRequest,
} from "../../core/types";

export type AppServerMessage = {
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { message?: string } | unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function mapCodexNotification(message: AppServerMessage): AgentEvent | null {
  const params = asRecord(message.params);
  const item = asRecord(params.item);
  const method = message.method ?? "";

  if (method === "item/agentMessage/delta" || method === "turn/agentMessage/delta") {
    const text = stringValue(params.delta) ?? stringValue(params.text) ?? "";
    return text ? { type: "text", text } : null;
  }
  if (method === "item/reasoning/delta" || method === "turn/reasoning/delta") {
    const text = stringValue(params.delta) ?? stringValue(params.text) ?? "";
    return text ? { type: "thinking", text, kind: "reasoning" } : null;
  }
  if (method === "item/toolCall/started" || item.type === "mcpToolCall") {
    if (stringValue(item.status) === "completed") {
      return {
        type: "tool.end",
        id: String(item.id ?? params.itemId ?? "codex-tool"),
        name: String(item.tool ?? item.command ?? "tool"),
        output: item.result ?? item.output,
      };
    }
    return {
      type: "tool.start",
      id: String(item.id ?? params.itemId ?? "codex-tool"),
      name: String(item.tool ?? item.command ?? "tool"),
      input: item.arguments ?? item.input,
    };
  }
  if (method === "turn/completed") {
    return { type: "completed", result: params };
  }
  if (method === "error" || message.error) {
    const record = asRecord(message.error);
    return {
      type: "error",
      error: new Error(stringValue(record.message) ?? "Codex app-server error"),
    };
  }
  return null;
}

export function approvalRequestFromServerRequest(
  request: Record<string, unknown>,
): ApprovalRequest {
  const kind = mapCodexApprovalKind(stringValue(request.kind) ?? stringValue(request.type));
  return {
    id: String(request.id ?? request.requestId ?? "codex-approval"),
    kind,
    title:
      stringValue(request.reason) ??
      stringValue(request.header) ??
      "Allow this Codex action?",
    tool: request.command
      ? { name: "command", input: request.command }
      : undefined,
    options: DEFAULT_APPROVAL_OPTIONS,
    metadata: request,
  };
}

export function approvalResponseForOption(optionId: string): Record<string, unknown> {
  if (optionId === "allow-always") {
    return { decision: "approve", scope: "session" };
  }
  if (optionId === "deny-once" || optionId === "deny-always") {
    return { decision: "reject", scope: optionId === "deny-always" ? "session" : "turn" };
  }
  return { decision: "approve", scope: "turn" };
}

function mapCodexApprovalKind(kind: string | undefined): ApprovalKind {
  if (kind === "command" || kind === "execute") return "execute";
  if (kind === "file_change" || kind === "apply_patch" || kind === "write") {
    return "write";
  }
  if (kind === "permissions" || kind === "network") return "network";
  if (kind === "read") return "read";
  return "other";
}
