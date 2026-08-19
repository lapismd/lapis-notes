import type { AppSlashCommandDispatch } from "@lapis-notes/api/agent-skills";
import type { NativeAgentCommand, SkillActivation } from "../skills/types";

export type SlashCommandSource =
  | "app"
  | "extension"
  | "skill"
  | "native-agent"
  | "folder"
  | "vault"
  | "user";

export interface EffectiveSlashCommand {
  name: string;
  description: string;
  argumentHint?: string;
  source: SlashCommandSource;
  aliases?: string[];
  dispatch: AppSlashCommandDispatch | { kind: "native-agent"; nativeName: string };
}

export interface ParsedSlashCommand {
  name: string;
  rawArguments: string;
  original: string;
}

export type CommandResolution =
  | { kind: "literal"; text: string }
  | { kind: "unknown"; parsed: ParsedSlashCommand; suggestions: string[] }
  | { kind: "command"; parsed: ParsedSlashCommand; command: EffectiveSlashCommand };

export type CommandExecutionResult =
  | { kind: "local"; notice: string; arguments?: string }
  | { kind: "tool"; tool: string; input: Record<string, unknown> }
  | { kind: "skill"; activation: SkillActivation }
  | { kind: "prompt"; prompt: string }
  | { kind: "native"; name: string; arguments: string }
  | { kind: "error"; message: string };

export type { NativeAgentCommand };
