import type { AppSlashCommandRegistry } from "@lapis-notes/api/agent-skills";
import type { NativeAgentCommand, SkillSnapshot } from "../skills/types";
import type { EffectiveSlashCommand, SlashCommandSource } from "./types";

const RESERVED: EffectiveSlashCommand[] = [
  {
    name: "new",
    description: "Start a new chat in the current scope.",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "skills",
    description: "List effective application skills.",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "tools",
    description: "List effective application tools.",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "skill",
    description: "Activate a skill by name.",
    argumentHint: "<name> [arguments]",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "native",
    description: "Forward a command to the current agent.",
    argumentHint: "<command> [arguments]",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "refresh",
    description: "Refresh agent skills on a replacement binding.",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
];

export class SlashCommandCatalog {
  #skillCommands: EffectiveSlashCommand[] = [];
  readonly #native = new Map<string, NativeAgentCommand[]>();

  constructor(private readonly extensions?: AppSlashCommandRegistry) {}

  rebuildSkillCommands(snapshot: SkillSnapshot): void {
    const reserved = new Set(RESERVED.map((command) => command.name));
    const extensionNames = new Set(
      (this.extensions?.list() ?? []).map((item) => item.command.name),
    );
    this.#skillCommands = snapshot.skills
      .filter((skill) => skill.userInvocable)
      .map((skill) => {
        const collision =
          reserved.has(skill.name) || extensionNames.has(skill.name);
        return {
          name: skill.name,
          description: skill.description,
          argumentHint: skill.argumentHint,
          source: "skill" as const,
          dispatch: { kind: "skill" as const, skill: skill.name },
          disabled: collision,
        } satisfies EffectiveSlashCommand & { disabled?: boolean };
      })
      .filter((command) => !("disabled" in command && command.disabled));
  }

  replaceNativeCommands(
    agentBindingId: string,
    commands: readonly NativeAgentCommand[],
  ): void {
    this.#native.set(
      agentBindingId,
      commands.map((command) => ({ ...command })),
    );
  }

  clearNativeCommands(agentBindingId: string): void {
    this.#native.delete(agentBindingId);
  }

  get(
    name: string,
    agentBindingId?: string,
  ): EffectiveSlashCommand | undefined {
    return this.list(agentBindingId).find(
      (command) =>
        command.name === name || command.aliases?.includes(name),
    );
  }

  list(agentBindingId?: string): EffectiveSlashCommand[] {
    const reservedNames = new Set(RESERVED.map((command) => command.name));
    const extension = (this.extensions?.list() ?? [])
      .filter((item) => !reservedNames.has(item.command.name))
      .map((item) => ({
        name: item.command.name,
        description: item.command.description,
        argumentHint: item.command.argumentHint,
        aliases: item.command.aliases,
        source: "extension" as const,
        dispatch: item.command.dispatch,
      }));
    const extensionNames = new Set(extension.map((command) => command.name));
    const skills = this.#skillCommands.filter(
      (command) =>
        !reservedNames.has(command.name) && !extensionNames.has(command.name),
    );
    const claimed = new Set([
      ...reservedNames,
      ...extensionNames,
      ...skills.map((command) => command.name),
    ]);
    const native = (agentBindingId ? this.#native.get(agentBindingId) : undefined)
      ?.filter((command) => !claimed.has(sanitizeName(command.name)))
      .map((command) => ({
        name: sanitizeName(command.name),
        description: command.description ?? "Current agent command",
        argumentHint: command.argumentHint,
        source: "native-agent" as SlashCommandSource,
        dispatch: {
          kind: "native-agent" as const,
          nativeName: command.name,
        },
      }));
    return [...RESERVED, ...extension, ...skills, ...(native ?? [])];
  }

  native(
    agentBindingId: string | undefined,
    name: string,
  ): NativeAgentCommand | undefined {
    if (!agentBindingId) return undefined;
    return this.#native
      .get(agentBindingId)
      ?.find((command) => sanitizeName(command.name) === sanitizeName(name));
  }
}

function sanitizeName(name: string): string {
  return name.trim().replace(/^\/+/u, "").toLowerCase();
}
