import {
  DEFAULT_APPROVAL_OPTIONS,
  type AgentEvent,
  type ApprovalKind,
  type ApprovalOption,
  type ApprovalRequest,
} from "../../core/types";

export type AcpRuntimeEventLike = {
  type: string;
  text?: string;
  stream?: "output" | "thought";
  toolCallId?: string;
  title?: string;
  status?: string;
  kind?: string;
  rawInput?: unknown;
  rawOutput?: unknown;
  content?: unknown[];
  message?: string;
  stopReason?: string;
};

export type AcpPermissionRequestLike = {
  requestId?: string;
  id?: string;
  sessionId?: string;
  title?: string;
  kind?: string;
  inferredKind?: string;
  toolName?: string;
  tool?: { name?: string; input?: unknown };
  input?: unknown;
  raw?: Record<string, unknown>;
  options?: Array<{
    optionId?: string;
    id?: string;
    name?: string;
    label?: string;
    kind?: string;
  }>;
  [key: string]: unknown;
};

export type AcpPermissionDecision = {
  outcome:
    | "allow_once"
    | "allow_always"
    | "reject_once"
    | "reject_always"
    | "cancel";
};

export function mapAcpRuntimeEvent(
  event: AcpRuntimeEventLike,
): AgentEvent | null {
  if (event.type === "text_delta") {
    if (event.stream === "thought") {
      return { type: "thinking", text: event.text ?? "", kind: "reasoning" };
    }
    return { type: "text", text: event.text ?? "" };
  }
  if (event.type === "status") {
    return { type: "status", status: event.text ?? event.status ?? "status" };
  }
  if (event.type === "tool_call") {
    const id = event.toolCallId ?? event.title ?? "acp-tool";
    const name = event.title ?? event.kind ?? "acp_tool";
    if (event.status === "completed" || event.status === "failed") {
      return {
        type: "tool.end",
        id,
        name,
        output: event.rawOutput ?? event.content ?? event.text,
        error:
          event.status === "failed"
            ? (event.rawOutput ?? event.content ?? event.text)
            : undefined,
      };
    }
    return {
      type: "tool.start",
      id,
      name,
      input: event.rawInput,
    };
  }
  if (event.type === "done") {
    return { type: "completed", result: { stopReason: event.stopReason } };
  }
  if (event.type === "error") {
    return {
      type: "error",
      error: new Error(event.message ?? "ACP runtime error"),
    };
  }
  return null;
}

export function mapAcpPermissionRequest(
  request: AcpPermissionRequestLike,
): ApprovalRequest {
  const raw = isRecord(request.raw) ? request.raw : {};
  const toolCall = isRecord(raw.toolCall) ? raw.toolCall : {};
  const id = String(
    request.requestId ??
      request.id ??
      toolCall.toolCallId ??
      raw.toolCallId ??
      cryptoRandomId(),
  );
  const options = mapApprovalOptions(
    request.options ??
      (Array.isArray(raw.options)
        ? (raw.options as AcpPermissionRequestLike["options"])
        : undefined),
  );
  const toolName =
    request.tool?.name ??
    request.toolName ??
    stringValue(toolCall.title) ??
    stringValue(toolCall.kind);
  const input = request.tool?.input ?? request.input ?? toolCall.rawInput;
  return {
    id,
    kind: mapApprovalKind(
      request.kind ?? request.inferredKind ?? stringValue(toolCall.kind),
    ),
    title:
      request.title ??
      stringValue(toolCall.title) ??
      (toolName ? `Allow ${toolName}?` : "Allow this agent action?"),
    tool: toolName
      ? {
          name: String(toolName),
          input,
        }
      : undefined,
    options: options.length > 0 ? options : DEFAULT_APPROVAL_OPTIONS,
  };
}

export function mapApprovalOptionToAcpDecision(
  optionId: string,
): AcpPermissionDecision {
  switch (optionId) {
    case "allow-always":
    case "allow_always":
      return { outcome: "allow_always" };
    case "deny-once":
    case "deny_once":
    case "reject-once":
    case "reject_once":
      return { outcome: "reject_once" };
    case "deny-always":
    case "deny_always":
    case "reject-always":
    case "reject_always":
      return { outcome: "reject_always" };
    case "cancel":
      return { outcome: "cancel" };
    default:
      return { outcome: "allow_once" };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function mapApprovalOptions(
  options: AcpPermissionRequestLike["options"],
): ApprovalOption[] {
  if (!options?.length) return [];
  return options.map((option, index) => {
    const id = String(option.optionId ?? option.id ?? `option-${index}`);
    const kind = normalizeOptionKind(option.kind ?? id);
    return {
      id,
      label: option.label ?? option.name ?? labelForKind(kind),
      kind,
    };
  });
}

function mapApprovalKind(kind: string | undefined): ApprovalKind {
  if (kind === "read" || kind === "search") return "read";
  if (
    kind === "write" ||
    kind === "edit" ||
    kind === "delete" ||
    kind === "move"
  ) {
    return "write";
  }
  if (kind === "execute") return "execute";
  if (kind === "network" || kind === "fetch") return "network";
  return "other";
}

function normalizeOptionKind(value: string): ApprovalOption["kind"] {
  const normalized = value.replaceAll("_", "-");
  if (
    normalized === "allow-once" ||
    normalized === "allow-always" ||
    normalized === "deny-once" ||
    normalized === "deny-always"
  ) {
    return normalized;
  }
  if (normalized.includes("always") && normalized.includes("deny")) {
    return "deny-always";
  }
  if (normalized.includes("always")) return "allow-always";
  if (normalized.includes("deny")) return "deny-once";
  return "allow-once";
}

function labelForKind(kind: ApprovalOption["kind"]): string {
  switch (kind) {
    case "allow-always":
      return "Allow always";
    case "deny-once":
      return "Deny once";
    case "deny-always":
      return "Deny always";
    default:
      return "Allow once";
  }
}

function cryptoRandomId(): string {
  return `acp-${Math.random().toString(36).slice(2, 10)}`;
}
