import type { ConversationReadWarning } from "./types";

export function parseJsonLines<T>(input: {
  content: string;
  file: ConversationReadWarning["file"];
  validate(value: unknown): T;
}): { records: T[]; warnings: ConversationReadWarning[] } {
  const records: T[] = [];
  const warnings: ConversationReadWarning[] = [];
  const hasTerminalNewline = /\r?\n$/u.test(input.content);
  const lines = input.content.split(/\r?\n/u);
  if (lines.at(-1) === "") lines.pop();

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      if (index === lines.length - 1 && !hasTerminalNewline) {
        warnings.push({
          file: input.file,
          line: index + 1,
          message:
            "Ignored a malformed final JSONL line after an interrupted append",
        });
        return;
      }
      throw new Error(
        `${input.file} contains invalid JSON on line ${index + 1}`,
        {
          cause: error,
        },
      );
    }
    try {
      records.push(input.validate(parsed));
    } catch (error) {
      throw new Error(
        `${input.file} has an invalid record on line ${index + 1}`,
        {
          cause: error,
        },
      );
    }
  });
  return { records, warnings };
}

export function serializeJsonLine(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}
