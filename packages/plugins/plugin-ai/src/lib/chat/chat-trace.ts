import type { AgentEvent } from "../core/types";
import { createChatItemId, type AiChatItem } from "./chat-items";

export function applyAgentEventToChatItems(
  items: AiChatItem[],
  event: AgentEvent,
  now = () => new Date().toISOString(),
): AiChatItem[] {
  const next = [...items];
  const createdAt = now();
  switch (event.type) {
    case "text": {
      const last = next.at(-1);
      if (last?.type === "message" && last.role === "assistant") {
        next[next.length - 1] = { ...last, text: `${last.text}${event.text}` };
        return next;
      }
      next.push({
        id: createChatItemId("message", next.length + 1),
        type: "message",
        role: "assistant",
        text: event.text,
        createdAt,
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
      });
      return next;
    }
    case "tool.start": {
      const index = next.findIndex(
        (item) => item.type === "tool" && item.toolId === event.id,
      );
      const input = stringifyUnknown(event.input);
      if (index >= 0) {
        const current = next[index];
        if (current?.type === "tool") {
          next[index] = {
            ...current,
            name: event.name,
            server: event.server ?? current.server,
            state: "running",
            input: input ?? current.input,
          };
        }
      } else {
        next.push({
          id: event.id,
          type: "tool",
          toolId: event.id,
          name: event.name,
          server: event.server,
          state: "running",
          input,
          createdAt,
        });
      }
      return next;
    }
    case "tool.end": {
      const index = next.findIndex(
        (item) => item.type === "tool" && item.toolId === event.id,
      );
      const output =
        event.error != null
          ? stringifyUnknown(event.error)
          : stringifyUnknown(event.output);
      if (index >= 0) {
        const current = next[index];
        if (current?.type === "tool") {
          next[index] = {
            ...current,
            state: event.error != null ? "error" : "completed",
            output,
          };
        }
        return next;
      }
      next.push({
        id: event.id,
        type: "tool",
        toolId: event.id,
        name: event.name,
        server: event.server,
        state: event.error != null ? "error" : "completed",
        output,
      });
      return next;
    }
    case "permission.request": {
      next.push({
        id: `approval-${event.request.id}`,
        type: "approval",
        request: event.request,
        status: "pending",
        createdAt,
      });
      return next;
    }
    case "status": {
      if (!isVisibleAgentStatus(event.status)) return next;
      next.push({
        id: createChatItemId("status", next.length + 1),
        type: "status",
        text: event.status,
        createdAt,
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
      });
      return settled;
    }
    case "completed": {
      return next.map((item) =>
        item.type === "thinking" && item.state === "streaming"
          ? { ...item, state: "done" }
          : item,
      );
    }
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

function stringifyUnknown(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
