import type { AppSlashCommandRegistry } from "@lapis-notes/api/agent-skills";

import type { NativeAgentCommand, SkillSnapshot } from "../skills/types";
import type { DiscoveredCommandFile } from "./discovery";
import { reservedSlashCommandNames, RESERVED_SLASH_COMMANDS } from "./reserved";
import type { EffectiveSlashCommand, SlashCommandSource } from "./types";

export class SlashCommandCatalog {
  #skillCommands: EffectiveSlashCommand[] = [];
  #fileCommands: EffectiveSlashCommand[] = [];
  #reservedOverlays = new Map<string, Pick<EffectiveSlashCommand, "description" | "argumentHint" | "aliases">>();
  #loadFiles?: (scopeDir: string) => Promise<void>;
  readonly #native = new Map<string, NativeAgentCommand[]>();

  constructor(private readonly extensions?: AppSlashCommandRegistry) {}

  setFileCommandLoader(loader: (scopeDir: string) => Promise<void>): void {
    this.#loadFiles = loader;
  }

  async refreshFileCommands(scopeDir: string): Promise<void> {
    await this.#loadFiles?.(scopeDir);
  }

  rebuildSkillCommands(snapshot: SkillSnapshot): void {
    const reserved = reservedSlashCommandNames();
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

  replaceFileCommands(
    commands: readonly DiscoveredCommandFile[],
    overlays: readonly DiscoveredCommandFile[] = [],
  ): void {
    this.#fileCommands = commands.map((command) => ({
      name: command.name,
      description: command.description,
      argumentHint: command.argumentHint,
      aliases: command.aliases,
      source: command.source,
      dispatch: command.dispatch,
    }));
    this.#reservedOverlays = new Map(
      overlays.map((command) => [
        command.name,
        {
          description: command.description,
          argumentHint: command.argumentHint,
          aliases: command.aliases,
        },
      ]),
    );
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
    const reserved = reservedSlashCommandNames();
    const reservedCommands = RESERVED_SLASH_COMMANDS.map((command) => {
      const overlay = this.#reservedOverlays.get(command.name);
      return overlay ? { ...command, ...overlay } : command;
    });
    const extension = (this.extensions?.list() ?? [])
      .filter((item) => !reserved.has(item.command.name))
      .map((item) => ({
        name: item.command.name,
        description: item.command.description,
        argumentHint: item.command.argumentHint,
        aliases: item.command.aliases,
        source: "extension" as const,
        dispatch: item.command.dispatch,
      }));
    const extensionNames = new Set(extension.map((command) => command.name));
    const files = this.#fileCommands.filter(
      (command) =>
        !reserved.has(command.name) && !extensionNames.has(command.name),
    );
    const fileNames = new Set(files.map((command) => command.name));
    const skills = this.#skillCommands.filter(
      (command) =>
        !reserved.has(command.name) &&
        !extensionNames.has(command.name) &&
        !fileNames.has(command.name),
    );
    const claimed = new Set([
      ...reserved,
      ...extensionNames,
      ...fileNames,
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
    return [...reservedCommands, ...extension, ...files, ...skills, ...(native ?? [])];
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
