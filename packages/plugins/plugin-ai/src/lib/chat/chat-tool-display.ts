import type { AiChatItem } from "./chat-items";

export type AiChatToolItem = Extract<AiChatItem, { type: "tool" }>;

export type ToolPayloadLanguage = "json" | "bash" | "plaintext";

export type PresentedToolPayload = {
  code: string;
  language: ToolPayloadLanguage;
};

export type ToolPayloadHint = {
  toolName?: string;
  input?: string;
};

const SUMMARY_KEYS = [
  "command",
  "path",
  "file",
  "query",
  "url",
  "pattern",
  "target",
] as const;

const PRIMARY_KEYS = [
  "output",
  "content",
  "text",
  "result",
  "stdout",
  "aggregated",
] as const;

const METADATA_KEYS = new Set([
  "ok",
  "status",
  "success",
  "isError",
  "server",
  "tool",
  "name",
]);

const STRUCTURAL_SIBLINGS = new Set([
  "path",
  "command",
  "query",
  "file",
  "url",
  "pattern",
  "target",
  "locations",
]);

const RUNNER_TOOL_NAMES = new Set([
  "bash",
  "sh",
  "shell",
  "exec",
  "command",
  "terminal",
  "run",
]);

const MAX_PARSE_DEPTH = 3;

export function presentToolPayload(
  value?: string,
  hint?: ToolPayloadHint,
): PresentedToolPayload | undefined {
  if (value == null || value === "") return undefined;
  const extracted = extractDisplayValue(value, 0);
  if (extracted == null || extracted === "") return undefined;
  if (isRecord(extracted) || Array.isArray(extracted)) {
    return { code: JSON.stringify(extracted, null, 2), language: "json" };
  }
  const text = String(extracted);
  if (!text) return undefined;
  return { code: text, language: detectTextLanguage(text, hint) };
}

export function isOneLineAlert(payload: PresentedToolPayload): boolean {
  return payload.language === "plaintext" && !payload.code.includes("\n");
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

function extractDisplayValue(value: unknown, depth: number): unknown {
  const parsed = tryParseJson(value);
  if (parsed === undefined) return value;
  if (typeof parsed === "string") {
    if (depth + 1 >= MAX_PARSE_DEPTH) return parsed;
    return extractDisplayValue(parsed, depth + 1);
  }
  if (Array.isArray(parsed) || !isRecord(parsed)) return parsed;
  const mcpText = mcpContentText(parsed);
  if (mcpText != null) return extractDisplayValue(mcpText, depth + 1);
  const unwrapped = unwrapEnvelope(parsed);
  if (unwrapped !== undefined) return extractDisplayValue(unwrapped, depth + 1);
  return parsed;
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (
    !trimmed.startsWith("{") &&
    !trimmed.startsWith("[") &&
    !trimmed.startsWith('"')
  ) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function unwrapEnvelope(record: Record<string, unknown>): unknown {
  const keys = Object.keys(record);
  const primary = PRIMARY_KEYS.find(
    (key) => record[key] != null && record[key] !== "",
  );
  if (!primary) return undefined;
  const rest = keys.filter((key) => key !== primary);
  if (rest.some((key) => !METADATA_KEYS.has(key))) return undefined;
  return record[primary];
}

function mcpContentText(record: Record<string, unknown>): string | undefined {
  if (!Array.isArray(record.content) || record.content.length === 0) {
    return undefined;
  }
  const rest = Object.keys(record).filter((key) => key !== "content");
  if (rest.some((key) => STRUCTURAL_SIBLINGS.has(key))) return undefined;
  if (rest.some((key) => !METADATA_KEYS.has(key))) return undefined;
  const parts = record.content.flatMap((entry) => {
    if (typeof entry === "string" && entry) return [entry];
    if (isRecord(entry) && typeof entry.text === "string" && entry.text) {
      return [entry.text];
    }
    return [];
  });
  return parts.length > 0 ? parts.join("\n") : undefined;
}

function detectTextLanguage(
  text: string,
  hint?: ToolPayloadHint,
): ToolPayloadLanguage {
  if (isRunnerToolName(hint?.toolName)) return "bash";
  if (hasCommandInput(hint?.input)) return "bash";
  if (text.includes("\n")) return "bash";
  if (looksLikeCli(text)) return "bash";
  return "plaintext";
}

function isRunnerToolName(name?: string): boolean {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  if (RUNNER_TOOL_NAMES.has(normalized)) return true;
  const leaf = normalized.split(/[:/]/u).at(-1);
  return leaf != null && RUNNER_TOOL_NAMES.has(leaf);
}

function hasCommandInput(input?: string): boolean {
  if (!input) return false;
  try {
    const parsed: unknown = JSON.parse(input);
    return (
      isRecord(parsed) &&
      typeof parsed.command === "string" &&
      parsed.command.trim() !== ""
    );
  } catch {
    return false;
  }
}

function looksLikeCli(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^[$%] /u.test(trimmed) ||
    /^error:/imu.test(trimmed) ||
    /\b(?:stderr|exit \d+)\b/iu.test(trimmed) ||
    /\|/.test(trimmed)
  );
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
