import type { AgentEvent } from "../core/types";
import { APP_TOOL_MCP_SERVER_NAME } from "../tools/mcp-server-registry";
import { createChatItemId, type AiChatItem } from "./chat-items";
import {
  isEmptyToolInput,
  isGenericToolName,
  preferToolName,
} from "./chat-tool-identity";

export function applyAgentEventToChatItems(
  items: AiChatItem[],
  event: AgentEvent,
  now = () => new Date().toISOString(),
): AiChatItem[] {
  const next = [...items];
  const createdAt = now();
  const source = event.source ? { source: { ...event.source } } : {};
  switch (event.type) {
    case "text": {
      settleStreamingThinking(next);
      const last = next.at(-1);
      if (last?.type === "message" && last.role === "assistant") {
        next[next.length - 1] = {
          ...last,
          ...source,
          text: `${last.text}${event.text}`,
        };
        return next;
      }
      next.push({
        id: createChatItemId("message", next.length + 1),
        type: "message",
        role: "assistant",
        text: event.text,
        createdAt,
        ...source,
      });
      return next;
    }
    case "thinking": {
      const last = next.at(-1);
      if (last?.type === "thinking" && last.state === "streaming") {
        next[next.length - 1] = {
          ...last,
          text: `${last.text}${event.text}`,
          kind: event.kind ?? last.kind,
          ...source,
        };
        return next;
      }
      next.push({
        id: createChatItemId("thinking", next.length + 1),
        type: "thinking",
        text: event.text,
        kind: event.kind,
        state: "streaming",
        createdAt,
        ...source,
      });
      return next;
    }
    case "tool.start": {
      settleStreamingThinking(next);
      const index = findToolItemIndex(next, event);
      const input = preferToolInput(undefined, event.input);
      if (index >= 0) {
        const current = next[index];
        if (current?.type === "tool") {
          next[index] = {
            ...current,
            toolId: pairedToolId(current, event.id),
            name: preferToolName(current.name, event.name),
            server: event.server ?? current.server,
            state: "running",
            input: preferToolInput(current.input, event.input),
            ...source,
          };
        }
      } else {
        next.push({
          id: event.id,
          type: "tool",
          toolId: event.id,
          name: preferToolName(undefined, event.name),
          server: event.server,
          state: "running",
          input,
          createdAt,
          ...source,
        });
      }
      return next;
    }
    case "tool.end": {
      settleStreamingThinking(next);
      const index = findToolItemIndex(next, event);
      const output =
        event.error != null
          ? stringifyUnknown(event.error)
          : stringifyUnknown(event.output);
      if (index >= 0) {
        const current = next[index];
        if (current?.type === "tool") {
          next[index] = {
            ...current,
            toolId: pairedToolId(current, event.id),
            name: preferToolName(current.name, event.name),
            server: event.server ?? current.server,
            state: event.error != null ? "error" : "completed",
            input: preferToolInput(current.input, event.input),
            output,
            ...source,
          };
        }
        return next;
      }
      next.push({
        id: event.id,
        type: "tool",
        toolId: event.id,
        name: preferToolName(undefined, event.name),
        server: event.server,
        state: event.error != null ? "error" : "completed",
        input: preferToolInput(undefined, event.input),
        output,
        createdAt,
        ...source,
      });
      return next;
    }
    case "permission.request": {
      settleStreamingThinking(next);
      next.push({
        id: `approval-${event.request.id}`,
        type: "approval",
        request: event.request,
        status: "pending",
        createdAt,
        ...source,
      });
      return next;
    }
    case "question.request": {
      settleStreamingThinking(next);
      next.push({
        id: `question-${event.request.id}`,
        type: "question",
        request: event.request,
        status: "pending",
        createdAt,
        ...source,
      });
      return next;
    }
    case "status": {
      if (!isVisibleAgentStatus(event.status)) return next;
      settleStreamingThinking(next);
      next.push({
        id: createChatItemId("status", next.length + 1),
        type: "status",
        text: event.status,
        createdAt,
        ...source,
      });
      return next;
    }
    case "error": {
      const settled = next.map((item) =>
        item.type === "thinking" && item.state === "streaming"
          ? { ...item, state: "done" as const }
          : item,
      );
      settled.push({
        id: createChatItemId("error", next.length + 1),
        type: "error",
        text: event.error.message,
        createdAt,
        ...source,
      });
      return settled;
    }
    case "completed": {
      return next.map((item) =>
        item.type === "thinking" && item.state === "streaming"
          ? { ...item, state: "done", ...source }
          : item,
      );
    }
    case "commands.update":
      return next;
    default:
      return next;
  }
}

export function isVisibleAgentStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return !(
    /^usage updated(?:\s*:\s*[\d,]+\s*\/\s*[\d,]+)?$/.test(normalized) ||
    normalized === "session updated" ||
    /^available commands updated(?:\s*\(\d+\))?$/.test(normalized)
  );
}

export function markApprovalResponse(
  items: AiChatItem[],
  requestId: string,
  optionId: string,
): AiChatItem[] {
  return items.map((item) => {
    if (item.type !== "approval" || item.request.id !== requestId) return item;
    const denied = optionId.startsWith("deny");
    return {
      ...item,
      status: denied ? "rejected" : "approved",
      responseOptionId: optionId,
    };
  });
}

export function markQuestionResponse(
  items: AiChatItem[],
  requestId: string,
): AiChatItem[] {
  return items.map((item) =>
    item.type === "question" && item.request.id === requestId
      ? { ...item, status: "answered" }
      : item,
  );
}

function settleStreamingThinking(items: AiChatItem[]): void {
  for (const [index, item] of items.entries()) {
    if (item.type === "thinking" && item.state === "streaming") {
      items[index] = { ...item, state: "done" };
    }
  }
}

function stringifyUnknown(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function preferToolInput(
  current: string | undefined,
  incoming: unknown,
): string | undefined {
  if (isEmptyToolInput(incoming)) return current;
  return stringifyUnknown(incoming) ?? current;
}

function pairedToolId(
  current: Extract<AiChatItem, { type: "tool" }>,
  incomingId: string,
): string {
  if (current.id === incomingId || current.toolId === incomingId) {
    return current.toolId;
  }
  return incomingId;
}

function findToolItemIndex(
  items: AiChatItem[],
  event: { id: string; name: string; server?: string; input?: unknown },
): number {
  const exact = items.findIndex(
    (item) =>
      item.type === "tool" &&
      (item.toolId === event.id || item.id === event.id),
  );
  if (exact >= 0) return exact;

  const incomingApp = event.server === APP_TOOL_MCP_SERVER_NAME;
  const incomingGeneric =
    !incomingApp &&
    isGenericToolName(event.name) &&
    isEmptyToolInput(event.input);

  if (incomingApp) {
    return items.findIndex(
      (item) =>
        item.type === "tool" &&
        item.server !== APP_TOOL_MCP_SERVER_NAME &&
        isGenericToolName(item.name) &&
        item.id === item.toolId,
    );
  }
  if (incomingGeneric) {
    return items.findIndex(
      (item) =>
        item.type === "tool" &&
        item.server === APP_TOOL_MCP_SERVER_NAME &&
        item.id === item.toolId,
    );
  }
  return -1;
}
