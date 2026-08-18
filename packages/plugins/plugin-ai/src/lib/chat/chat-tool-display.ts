import type { AiChatItem } from "./chat-items";

export type AiChatToolItem = Extract<AiChatItem, { type: "tool" }>;

const SUMMARY_KEYS = [
  "command",
  "path",
  "file",
  "query",
  "url",
  "pattern",
  "target",
] as const;

export function formatToolPayloadAsJson(value?: string): string | undefined {
  if (value == null || value === "") return undefined;
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return JSON.stringify(value, null, 2);
  }
}

export function toolCallTarget(
  input?: string,
  server?: string,
): string | undefined {
  const summary = summarizeToolInput(input);
  return summary || server || undefined;
}

export function toolCallStatus(
  state: AiChatToolItem["state"],
): "complete" | "error" | "running" {
  if (state === "completed") return "complete";
  if (state === "error") return "error";
  return "running";
}

function summarizeToolInput(input?: string): string | undefined {
  if (!input) return undefined;
  try {
    const parsed: unknown = JSON.parse(input);
    if (typeof parsed === "string" && parsed.trim()) return parsed.trim();
    if (!isRecord(parsed)) return undefined;
    for (const key of SUMMARY_KEYS) {
      const value = parsed[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    const locations = parsed.locations;
    if (Array.isArray(locations)) {
      const first = locations[0];
      if (isRecord(first) && typeof first.path === "string" && first.path) {
        return first.path;
      }
    }
  } catch {
    const line = input.trim().split("\n")[0] ?? "";
    if (!line) return undefined;
    return line.length > 80 ? `${line.slice(0, 77)}…` : line;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
