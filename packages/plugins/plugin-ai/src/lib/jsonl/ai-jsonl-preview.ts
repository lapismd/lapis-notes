import type { AiChatItem } from "../chat/chat-items";
import { parseJsonLines } from "../conversations/jsonl";
import { projectTranscriptToChatItems } from "../conversations/transcript-projection";
import type {
  AgentBindingRecord,
  ConversationReadWarning,
  TranscriptEntry,
} from "../conversations/types";
import {
  validateAgentBindingRecord,
  validateTranscriptEntry,
} from "../conversations/validation";

export type JsonlRecord = {
  line: number;
  value: unknown;
};

export type AiJsonlPreview =
  | {
      kind: "transcript";
      entries: TranscriptEntry[];
      items: AiChatItem[];
      warnings: ConversationReadWarning[];
    }
  | {
      kind: "agents";
      records: AgentBindingRecord[];
      warnings: ConversationReadWarning[];
    }
  | {
      kind: "records";
      records: JsonlRecord[];
      warnings: Array<{ line: number; message: string }>;
    }
  | {
      kind: "error";
      message: string;
    };

export function createAiJsonlPreview(
  filePath: string,
  content: string,
): AiJsonlPreview {
  const fileName = filePath.split("/").at(-1)?.toLowerCase();
  try {
    if (fileName === "transcript.jsonl") {
      const parsed = parseJsonLines({
        content,
        file: "transcript.jsonl",
        validate: validateTranscriptEntry,
      });
      return {
        kind: "transcript",
        entries: parsed.records,
        items: projectTranscriptToChatItems(parsed.records),
        warnings: parsed.warnings,
      };
    }
    if (fileName === "agents.jsonl") {
      const parsed = parseJsonLines({
        content,
        file: "agents.jsonl",
        validate: validateAgentBindingRecord,
      });
      return {
        kind: "agents",
        records: parsed.records,
        warnings: parsed.warnings,
      };
    }
    return parseGenericJsonLines(content);
  } catch (error) {
    return {
      kind: "error",
      message:
        error instanceof Error ? error.message : "Unable to parse JSONL file",
    };
  }
}

function parseGenericJsonLines(content: string): AiJsonlPreview {
  const records: JsonlRecord[] = [];
  const warnings: Array<{ line: number; message: string }> = [];
  const hasTerminalNewline = /\r?\n$/u.test(content);
  const lines = content.split(/\r?\n/u);
  if (lines.at(-1) === "") lines.pop();

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      records.push({ line: index + 1, value: JSON.parse(line) });
    } catch (error) {
      if (index === lines.length - 1 && !hasTerminalNewline) {
        warnings.push({
          line: index + 1,
          message:
            "Ignored a malformed final JSONL line after an interrupted append",
        });
        return;
      }
      throw new Error(`JSONL contains invalid JSON on line ${index + 1}`, {
        cause: error,
      });
    }
  });

  return { kind: "records", records, warnings };
}
