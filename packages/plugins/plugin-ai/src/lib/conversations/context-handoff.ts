import type { TranscriptEntry } from "./types";

export const MAX_CONTEXT_HANDOFF_CODE_POINTS = 12_000;

export type ConversationContextHandoff = {
  text: string;
  throughEntryId: string;
};

export function buildConversationContextHandoff(
  transcript: TranscriptEntry[],
  maxCodePoints = MAX_CONTEXT_HANDOFF_CODE_POINTS,
): ConversationContextHandoff | undefined {
  const candidates = transcript.flatMap((entry) => {
    if (entry.type === "message") {
      const label = entry.role === "user" ? "User" : "Assistant";
      return [{ id: entry.id, line: `${label}: ${oneLine(entry.text)}` }];
    }
    if (entry.type === "tool") {
      const command = entry.input
        ? ` — ${oneLine(entry.input).slice(0, 240)}`
        : "";
      return [{ id: entry.id, line: `Tool: ${entry.name}${command}` }];
    }
    return [];
  });
  if (candidates.length === 0 || maxCodePoints <= 0) return undefined;

  const selected: typeof candidates = [];
  let length = 0;
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = candidates[index]!;
    const addition = [...candidate.line].length + (selected.length ? 1 : 0);
    if (selected.length > 0 && length + addition > maxCodePoints) break;
    selected.unshift(candidate);
    length += addition;
    if (length >= maxCodePoints) break;
  }
  const text = [...selected.map((item) => item.line).join("\n")]
    .slice(0, maxCodePoints)
    .join("");
  return text ? { text, throughEntryId: candidates.at(-1)!.id } : undefined;
}

function oneLine(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}
