import type { ParsedSlashCommand } from "./types";

const COMMAND_PATTERN =
  /^\/(?<name>[A-Za-z][A-Za-z0-9_-]{0,63})(?<sep>[:\s]|$)(?<args>.*)$/u;

export function parseSlashCommand(input: string): ParsedSlashCommand | undefined {
  const text = input.trimStart();
  if (text.startsWith("//")) return undefined;
  if (!text.startsWith("/")) return undefined;
  const match = text.match(COMMAND_PATTERN);
  if (!match?.groups?.name) return undefined;
  return {
    name: match.groups.name.toLowerCase(),
    rawArguments: (match.groups.args ?? "").trim(),
    original: input,
  };
}

export function isLiteralSlashText(input: string): boolean {
  return input.trimStart().startsWith("//");
}

export function unescapeLiteralSlash(input: string): string {
  const trimmedStart = input.match(/^\s*/u)?.[0] ?? "";
  const rest = input.slice(trimmedStart.length);
  return rest.startsWith("//") ? `${trimmedStart}${rest.slice(1)}` : input;
}
