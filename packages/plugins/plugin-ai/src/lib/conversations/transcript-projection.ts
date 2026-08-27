import type { AiChatItem } from "../chat/chat-items";
import type { DurableSanitizationOptions } from "./redaction";
import { sanitizeDurableField } from "./redaction";
import { CONVERSATION_SCHEMA_VERSION, type TranscriptEntry } from "./types";

export type TranscriptProjectionOptions = DurableSanitizationOptions & {
  agentBindingId?: string;
  now?: () => string;
};

function isRuntimeProvenance(
  value: unknown,
): value is { sessionId: string; runId: string; sequence: number } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "sessionId" in value &&
      "runId" in value,
  );
}

function runtimeProvenance(value: unknown): {
  source?: { sessionId: string; runId: string; sequence: number };
} {
  return isRuntimeProvenance(value) ? { source: { ...value } } : {};
}

function createdAt(item: AiChatItem, now: () => string): string {
  return item.createdAt ?? now();
}

export function projectChatItemsToTranscript(
  items: AiChatItem[],
  options: TranscriptProjectionOptions = {},
): TranscriptEntry[] {
  const now = options.now ?? (() => new Date().toISOString());
  return items.flatMap((item): TranscriptEntry[] => {
    const common = {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      createdAt: createdAt(item, now),
      ...(options.agentBindingId
        ? { agentBindingId: options.agentBindingId }
        : {}),
      ...runtimeProvenance(item.source),
    } as const;
    switch (item.type) {
      case "message":
        return [
          {
            ...common,
            id: item.id,
            type: "message",
            role: item.role,
            text: item.text,
            provenance: {
              originClass: item.role === "user" ? "owner" : "agent",
              sourceKind:
                item.role === "user" ? "user-message" : "assistant-message",
            },
          },
        ];
      case "thinking":
        if (
          item.state !== "done" ||
          (item.kind !== "summary" && item.kind !== "plan")
        ) {
          return [];
        }
        return [
          {
            ...common,
            id: item.id,
            type: "thinking.summary",
            text: item.text,
            kind: item.kind,
            provenance: {
              originClass: "agent",
              sourceKind: "runtime-output",
            },
          },
        ];
      case "tool": {
        if (item.state === "running") return [];
        const input = sanitizeDurableField(item.input, options);
        const output = sanitizeDurableField(item.output, options);
        return [
          {
            ...common,
            id: item.id,
            type: "tool",
            toolId: item.toolId,
            name: item.name,
            server: item.server,
            state: item.state,
            input: input.text,
            output: output.text,
            redacted: input.redacted || output.redacted || undefined,
            truncated: input.truncated || output.truncated || undefined,
            provenance: {
              originClass: "untrusted",
              sourceKind: "runtime-output",
            },
          },
        ];
      }
      case "approval": {
        const toolInput = sanitizeDurableField(
          item.request.tool?.input,
          options,
        );
        const entries: TranscriptEntry[] = [
          {
            ...common,
            id: `${item.id}:request`,
            type: "approval.request",
            requestId: item.request.id,
            kind: item.request.kind,
            title: item.request.title,
            tool: item.request.tool
              ? { name: item.request.tool.name, input: toolInput.text }
              : undefined,
            options: item.request.options.map((option) => ({ ...option })),
            redacted: toolInput.redacted || undefined,
            truncated: toolInput.truncated || undefined,
            provenance: {
              originClass: "untrusted",
              sourceKind: "runtime-output",
            },
          },
        ];
        if (item.responseOptionId) {
          const option = item.request.options.find(
            (candidate) => candidate.id === item.responseOptionId,
          );
          entries.push({
            ...common,
            id: `${item.id}:response`,
            type: "approval.response",
            requestId: item.request.id,
            option: {
              id: item.responseOptionId,
              label: option?.label ?? item.responseOptionId,
            },
            provenance: {
              originClass: "owner",
              sourceKind: "owner-response",
            },
          });
        }
        return entries;
      }
      case "question": {
        const entries: TranscriptEntry[] = [
          {
            ...common,
            id: `${item.id}:request`,
            type: "question.request",
            requestId: item.request.id,
            title: item.request.title,
            questions: structuredClone(item.request.questions),
            provenance: {
              originClass: "agent",
              sourceKind: "runtime-output",
            },
          },
        ];
        if (item.status !== "pending") {
          entries.push({
            ...common,
            id: `${item.id}:response`,
            type: "question.response",
            requestId: item.request.id,
            status: item.status,
            provenance: {
              originClass: "owner",
              sourceKind: "owner-response",
            },
          });
        }
        return entries;
      }
      case "status":
        return [
          {
            ...common,
            id: item.id,
            type: "system.notice",
            text: sanitizeDurableField(item.text, options).text ?? "",
            ...(item.layout === "report" || item.layout === "inventory"
              ? { layout: item.layout }
              : {}),
            ...(item.layout === "inventory" && item.inventory
              ? { inventory: item.inventory }
              : {}),
            provenance: {
              originClass: "system",
              sourceKind: "app-system",
            },
          },
        ];
      case "error":
        return [
          {
            ...common,
            id: item.id,
            type: "error",
            message: sanitizeDurableField(item.text, options).text ?? "",
            retryable: true,
            provenance: {
              originClass: "system",
              sourceKind: "app-system",
            },
          },
        ];
      case "command":
        return [
          {
            ...common,
            id: item.id,
            type: "command",
            command: item.command,
            origin: item.origin,
            arguments: item.arguments,
            status: item.status,
            provenance: {
              originClass: "system",
              sourceKind: "app-system",
            },
          },
        ];
      case "skill-activation":
        return [
          {
            ...common,
            id: item.id,
            type: "skill-activation",
            skillId: item.skillId,
            skillName: item.skillName,
            version: item.version,
            origin: item.origin,
            arguments: item.arguments,
            provenance: {
              originClass:
                item.origin === "user"
                  ? "owner"
                  : item.origin === "model"
                    ? "agent"
                    : "system",
              sourceKind:
                item.origin === "user"
                  ? "owner-response"
                  : item.origin === "model"
                    ? "runtime-output"
                    : "app-system",
            },
          },
        ];
    }
  });
}

export function projectTranscriptToChatItems(
  entries: TranscriptEntry[],
): AiChatItem[] {
  const items: AiChatItem[] = [];
  const approvals = new Map<string, number>();
  const questions = new Map<string, number>();
  for (const entry of entries) {
    switch (entry.type) {
      case "message":
        items.push({
          id: entry.id,
          type: "message",
          role: entry.role,
          text: entry.text,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "thinking.summary":
        items.push({
          id: entry.id,
          type: "thinking",
          text: entry.text,
          kind: entry.kind,
          state: "done",
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "tool":
        items.push({
          id: entry.id,
          type: "tool",
          toolId: entry.toolId,
          name: entry.name,
          server: entry.server,
          state: entry.state === "cancelled" ? "error" : entry.state,
          input: entry.input,
          output: entry.output,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "approval.request":
        approvals.set(entry.requestId, items.length);
        items.push({
          id: entry.id.replace(/:request$/u, ""),
          type: "approval",
          request: {
            id: entry.requestId,
            kind: entry.kind,
            title: entry.title,
            tool: entry.tool,
            options: structuredClone(entry.options),
          },
          status: "pending",
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "approval.response": {
        const index = approvals.get(entry.requestId);
        if (index !== undefined) {
          const current = items[index];
          if (current?.type === "approval") {
            items[index] = {
              ...current,
              status: entry.option.id.startsWith("deny")
                ? "rejected"
                : "approved",
              responseOptionId: entry.option.id,
            };
          }
        }
        break;
      }
      case "question.request":
        questions.set(entry.requestId, items.length);
        items.push({
          id: entry.id.replace(/:request$/u, ""),
          type: "question",
          request: {
            id: entry.requestId,
            title: entry.title,
            questions: structuredClone(entry.questions),
          },
          status: "pending",
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "question.response": {
        const index = questions.get(entry.requestId);
        if (index !== undefined) {
          const current = items[index];
          if (current?.type === "question") {
            items[index] = { ...current, status: entry.status };
          }
        }
        break;
      }
      case "system.notice":
        items.push({
          id: entry.id,
          type: "status",
          text: entry.text,
          ...(entry.layout === "report" || entry.layout === "inventory"
            ? { layout: entry.layout }
            : {}),
          ...(entry.layout === "inventory" && entry.inventory
            ? { inventory: entry.inventory }
            : {}),
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "error":
        items.push({
          id: entry.id,
          type: "error",
          text: entry.message,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "command":
        items.push({
          id: entry.id,
          type: "command",
          command: entry.command,
          origin: entry.origin,
          arguments: entry.arguments,
          status: entry.status,
          text: `/${entry.command}${entry.arguments ? ` ${entry.arguments}` : ""}`,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "skill-activation":
        items.push({
          id: entry.id,
          type: "skill-activation",
          skillId: entry.skillId,
          skillName: entry.skillName,
          version: entry.version,
          origin: entry.origin,
          arguments: entry.arguments,
          text: `Skill ${entry.skillName} (${entry.version})`,
          createdAt: entry.createdAt,
          agentBindingId: entry.agentBindingId,
        });
        break;
      case "agent.switch":
      case "agent.config":
        break;
      case "cancelled": {
        if (entry.interactionType === "approval" && entry.requestId) {
          const index = approvals.get(entry.requestId);
          if (index !== undefined) {
            const current = items[index];
            if (current?.type === "approval") {
              items[index] = { ...current, status: "cancelled" };
            }
          }
        }
        if (entry.interactionType === "question" && entry.requestId) {
          const index = questions.get(entry.requestId);
          if (index !== undefined) {
            const current = items[index];
            if (current?.type === "question") {
              items[index] = { ...current, status: "cancelled" };
            }
          }
        }
        break;
      }
    }
  }
  return items;
}
