import { parse as parseYaml } from "yaml";
import { SLASH_COMMAND_NAME_PATTERN } from "@lapis-notes/api/agent-skills";
import type { AppSlashCommandDispatch } from "@lapis-notes/api/agent-skills";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u;
const POSITIONAL = /\$([1-9]\d*)/gu;

export class CommandParseError extends Error {
  constructor(
    readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = "CommandParseError";
  }
}

export type CommandFileKind = "prompt" | "host" | "tool" | "skill";

export interface ParsedCommandFile {
  name: string;
  description: string;
  argumentHint?: string;
  aliases?: string[];
  kind: CommandFileKind;
  tool?: string;
  skill?: string;
  template: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readStringList(value: unknown): string[] | undefined {
  if (typeof value === "string") {
    return readStringList(value.split(","));
  }
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

export function commandNameFromFilename(filename: string): string | undefined {
  const name = filename.replace(/\.md$/u, "").trim();
  return SLASH_COMMAND_NAME_PATTERN.test(name) ? name : undefined;
}

export function parseCommandMarkdown(
  content: string,
  path: string,
  name: string,
): ParsedCommandFile {
  if (!SLASH_COMMAND_NAME_PATTERN.test(name)) {
    throw new CommandParseError(path, `Invalid command name: ${name}`);
  }
  const match = FRONTMATTER.exec(content);
  const data = match ? parseYaml(match[1] ?? "") : {};
  if (match && !isRecord(data)) {
    throw new CommandParseError(path, "Command front-matter must be a mapping.");
  }
  const record = isRecord(data) ? data : {};
  const kind = (readString(record.kind) ?? "prompt") as CommandFileKind;
  if (
    kind !== "prompt" &&
    kind !== "host" &&
    kind !== "tool" &&
    kind !== "skill"
  ) {
    throw new CommandParseError(path, `Unsupported command kind: ${kind}`);
  }
  const tool = readString(record.tool);
  const skill = readString(record.skill);
  if (kind === "tool" && !tool) {
    throw new CommandParseError(path, "kind: tool requires tool");
  }
  if (kind === "skill" && !skill) {
    throw new CommandParseError(path, "kind: skill requires skill");
  }
  const body = (match ? match[2] ?? "" : content).replace(/^\s+|\s+$/gu, "");
  return {
    name,
    description: readString(record.description) ?? name,
    argumentHint: readString(record.argumentHint) ?? readString(record["argument-hint"]),
    aliases: readStringList(record.aliases),
    kind,
    tool,
    skill,
    template: body,
  };
}

export function commandFileDispatch(
  parsed: ParsedCommandFile,
): AppSlashCommandDispatch {
  if (parsed.kind === "tool" && parsed.tool) {
    return { kind: "tool", tool: parsed.tool };
  }
  if (parsed.kind === "skill" && parsed.skill) {
    return { kind: "skill", skill: parsed.skill };
  }
  if (parsed.kind === "host") {
    return { kind: "host", execute: () => undefined };
  }
  return { kind: "prompt", template: parsed.template };
}

export function parseCommandArguments(raw: string): string[] {
  const items: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/gu;
  let match = pattern.exec(raw);
  while (match) {
    items.push(match[1] ?? match[2] ?? match[3] ?? "");
    match = pattern.exec(raw);
  }
  return items;
}

export function interpolateCommandTemplate(
  template: string,
  rawArguments: string,
): string {
  const body = template.replace(/^\s+|\s+$/gu, "");
  const args = rawArguments.trim();
  const hasNamed =
    body.includes("$ARGUMENTS") || body.includes("{{args}}");
  const positionals = [...body.matchAll(POSITIONAL)].map((item) =>
    Number(item[1]),
  );
  const hasPositional = positionals.length > 0;
  let result = body
    .replaceAll("$ARGUMENTS", args)
    .replaceAll("{{args}}", args);
  if (hasPositional) {
    const parsed = parseCommandArguments(rawArguments);
    const max = Math.max(...positionals);
    result = result.replace(POSITIONAL, (_match, digits: string) => {
      const index = Number(digits);
      if (index === max) return parsed.slice(index - 1).join(" ");
      return parsed[index - 1] ?? "";
    });
  }
  if (!hasNamed && !hasPositional && args) {
    return `${result}\n\n${args}`;
  }
  return result;
}
