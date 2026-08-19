import type { Vault } from "@lapis-notes/api";
import type { AppSlashCommandDispatch } from "@lapis-notes/api/agent-skills";
import {
  commandFileDispatch,
  commandNameFromFilename,
  CommandParseError,
  parseCommandMarkdown,
  type ParsedCommandFile,
} from "./markdown";
import { reservedSlashCommandNames } from "./reserved";
import type { SlashCommandSource } from "./types";
import type { UserAgentsCommandStore } from "./user-agents";

export type CommandFileSource = "folder" | "vault" | "user";

export interface DiscoveredCommandFile {
  name: string;
  description: string;
  argumentHint?: string;
  aliases?: string[];
  source: CommandFileSource;
  path?: string;
  kind: ParsedCommandFile["kind"];
  dispatch: AppSlashCommandDispatch;
}

export interface CommandDiagnostic {
  path: string;
  message: string;
}

export interface DiscoveredCommands {
  commands: DiscoveredCommandFile[];
  overlays: DiscoveredCommandFile[];
  diagnostics: CommandDiagnostic[];
}

export interface CommandDiscoveryOptions {
  vault: Vault;
  userAgents?: UserAgentsCommandStore;
}

const SOURCE_RANK: Record<CommandFileSource, number> = {
  folder: 3,
  vault: 2,
  user: 1,
};

function commandGlob(prefix: string): string {
  const root = prefix.replace(/\/$/u, "");
  return `${root}/*.md`;
}

function folderPrefix(scopeDir: string): string {
  return scopeDir ? `${scopeDir}/.agents/commands` : ".agents/commands";
}

export class CommandDiscovery {
  constructor(private readonly options: CommandDiscoveryOptions) {}

  async discover(scopeDir: string): Promise<DiscoveredCommands> {
    const diagnostics: CommandDiagnostic[] = [];
    const collected: DiscoveredCommandFile[] = [];
    await this.#collectVault("folder", folderPrefix(scopeDir), collected, diagnostics);
    await this.#collectVault("vault", ".agents/commands", collected, diagnostics);
    await this.#collectUser(collected, diagnostics);
    return mergeCommandFiles(collected, diagnostics);
  }

  async #collectVault(
    source: CommandFileSource,
    prefix: string,
    collected: DiscoveredCommandFile[],
    diagnostics: CommandDiagnostic[],
  ): Promise<void> {
    for (const file of this.options.vault.getFilesByGlob(commandGlob(prefix))) {
      if (file.path.includes("/")) {
        const parent = file.path.slice(0, file.path.lastIndexOf("/"));
        if (parent !== prefix) continue;
      }
      const filename = file.path.split("/").pop() ?? file.path;
      const name = commandNameFromFilename(filename);
      if (!name) {
        diagnostics.push({
          path: file.path,
          message: "Command file name is not a valid slash command.",
        });
        continue;
      }
      try {
        const parsed = parseCommandMarkdown(
          await this.options.vault.cachedRead(file),
          file.path,
          name,
        );
        collected.push({
          name: parsed.name,
          description: parsed.description,
          argumentHint: parsed.argumentHint,
          aliases: parsed.aliases,
          source,
          path: file.path,
          kind: parsed.kind,
          dispatch: commandFileDispatch(parsed),
        });
      } catch (error) {
        diagnostics.push({
          path: file.path,
          message:
            error instanceof CommandParseError
              ? error.message
              : "Command could not be parsed.",
        });
      }
    }
  }

  async #collectUser(
    collected: DiscoveredCommandFile[],
    diagnostics: CommandDiagnostic[],
  ): Promise<void> {
    const store = this.options.userAgents;
    if (!store) return;
    for (const file of await store.list()) {
      const path = store.root
        ? `${store.root.replace(/\/$/u, "")}/${file.name}.md`
        : `${file.name}.md`;
      try {
        const parsed = parseCommandMarkdown(file.content, path, file.name);
        collected.push({
          name: parsed.name,
          description: parsed.description,
          argumentHint: parsed.argumentHint,
          aliases: parsed.aliases,
          source: "user",
          kind: parsed.kind,
          dispatch: commandFileDispatch(parsed),
        });
      } catch (error) {
        diagnostics.push({
          path,
          message:
            error instanceof CommandParseError
              ? error.message
              : "Command could not be parsed.",
        });
      }
    }
  }
}

function mergeCommandFiles(
  collected: DiscoveredCommandFile[],
  diagnostics: CommandDiagnostic[],
): DiscoveredCommands {
  const reserved = reservedSlashCommandNames();
  const overlays: DiscoveredCommandFile[] = [];
  const prompts = new Map<string, DiscoveredCommandFile>();
  const seen = new Map<CommandFileSource, Set<string>>();

  const ranked = [...collected].sort(
    (left, right) => SOURCE_RANK[right.source] - SOURCE_RANK[left.source],
  );
  for (const command of ranked) {
    const path = command.path ?? command.name;
    if (reserved.has(command.name)) {
      if (command.kind !== "host") {
        diagnostics.push({
          path,
          message: `Reserved command name cannot be overridden: ${command.name}`,
        });
        continue;
      }
      const existingOverlay = overlays.find((item) => item.name === command.name);
      if (!existingOverlay) overlays.push(command);
      continue;
    }
    if (command.kind === "host") {
      diagnostics.push({
        path,
        message: `kind: host requires a reserved command name: ${command.name}`,
      });
      continue;
    }
    const level = seen.get(command.source) ?? new Set<string>();
    if (level.has(command.name)) {
      diagnostics.push({
        path,
        message: `Duplicate command name at the same precedence: ${command.name}`,
      });
      prompts.delete(command.name);
      continue;
    }
    level.add(command.name);
    seen.set(command.source, level);
    const existing = prompts.get(command.name);
    if (existing && SOURCE_RANK[existing.source] >= SOURCE_RANK[command.source]) {
      continue;
    }
    prompts.set(command.name, command);
  }
  return {
    commands: [...prompts.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    overlays,
    diagnostics,
  };
}

export function fileCommandSource(
  source: CommandFileSource,
): SlashCommandSource {
  return source;
}
