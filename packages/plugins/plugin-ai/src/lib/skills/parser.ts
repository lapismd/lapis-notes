import { parse as parseYaml } from "yaml";
import type { SkillSourceKind } from "@lapis-notes/api/agent-skills";
import { SKILL_NAME_PATTERN } from "@lapis-notes/api/agent-skills";
import type {
  AppSkillDescriptor,
  LoadedAppSkill,
  SkillCommandDispatch,
  SkillRequirements,
} from "./types";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u;

export class SkillParseError extends Error {
  constructor(
    readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = "SkillParseError";
  }
}

export function skillContentVersion(content: string): string {
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function parseCommand(data: Record<string, unknown>): SkillCommandDispatch {
  const dispatch = readString(data["command-dispatch"]);
  if (!dispatch || dispatch === "model") return { kind: "model" };
  if (dispatch !== "tool") {
    throw new Error(`Unsupported command-dispatch: ${dispatch}`);
  }
  const tool = readString(data["command-tool"]);
  if (!tool) {
    throw new Error("command-dispatch: tool requires command-tool");
  }
  const argMode = readString(data["command-arg-mode"]) ?? "raw";
  if (argMode !== "raw") {
    throw new Error(`Unsupported command-arg-mode: ${argMode}`);
  }
  return { kind: "tool", tool, argMode: "raw" };
}

function parseRequirements(
  data: Record<string, unknown>,
): SkillRequirements | undefined {
  const metadata = isRecord(data.metadata) ? data.metadata : undefined;
  const lapis = metadata && isRecord(metadata.lapis) ? metadata.lapis : undefined;
  const requires =
    lapis && isRecord(lapis.requires) ? lapis.requires : undefined;
  if (!requires) return undefined;
  const requirements: SkillRequirements = {
    tools: readStringList(requires.tools),
    capabilities: readStringList(requires.capabilities),
    extensions: readStringList(requires.extensions),
  };
  if (
    !requirements.tools &&
    !requirements.capabilities &&
    !requirements.extensions
  ) {
    return undefined;
  }
  return requirements;
}

export function parseSkillMarkdown(
  content: string,
  input: {
    path: string;
    source: SkillSourceKind;
    root: string;
  },
): LoadedAppSkill {
  const match = content.match(FRONTMATTER);
  if (!match) {
    throw new SkillParseError(input.path, "SKILL.md must start with YAML frontmatter.");
  }
  let data: unknown;
  try {
    data = parseYaml(match[1] ?? "");
  } catch {
    throw new SkillParseError(input.path, "SKILL.md frontmatter is not valid YAML.");
  }
  if (!isRecord(data)) {
    throw new SkillParseError(input.path, "SKILL.md frontmatter must be a mapping.");
  }
  const name = readString(data.name);
  const description = readString(data.description);
  if (!name) {
    throw new SkillParseError(input.path, "SKILL.md must declare name.");
  }
  if (!SKILL_NAME_PATTERN.test(name)) {
    throw new SkillParseError(input.path, `Invalid skill name: ${name}`);
  }
  if (!description) {
    throw new SkillParseError(input.path, "SKILL.md must declare description.");
  }
  let command: SkillCommandDispatch;
  try {
    command = parseCommand(data);
  } catch (error) {
    throw new SkillParseError(
      input.path,
      error instanceof Error ? error.message : String(error),
    );
  }
  const disableModel = readBoolean(data["disable-model-invocation"], false);
  const descriptor: AppSkillDescriptor = {
    id: `${input.source}:${name}`,
    name,
    description,
    source: input.source,
    root: input.root,
    version: skillContentVersion(content),
    userInvocable: readBoolean(data["user-invocable"], true),
    modelInvocable: !disableModel,
    argumentHint: readString(data["argument-hint"]),
    command,
    requirements: parseRequirements(data),
  };
  return {
    ...descriptor,
    instructions: (match[2] ?? "").trim(),
  };
}
