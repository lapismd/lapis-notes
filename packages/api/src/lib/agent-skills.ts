import { EventDispatcher } from "./events";

export const SKILL_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
export const SLASH_COMMAND_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

export type SkillSourceKind =
  | "folder"
  | "vault"
  | "user"
  | "extension"
  | "bundled"
  | "programmatic";

export interface ProgrammaticAppSkill {
  name: string;
  description: string;
  instructions: string;
  userInvocable?: boolean;
  disableModelInvocation?: boolean;
  argumentHint?: string;
  command?: {
    kind: "tool";
    tool: string;
    argMode?: "raw";
  };
}

export interface AppSkillOwner {
  pluginId: string;
}

export interface RegisteredAppSkillSource {
  registrationId: string;
  ownerPluginId: string;
  kind: "root" | "directory" | "programmatic";
  path?: string;
  skill?: ProgrammaticAppSkill;
}

export interface AppSkillSourceRegistration {
  readonly id: string;
  readonly kind: RegisteredAppSkillSource["kind"];
  dispose(): void;
}

export type AppSkillRegistryChange = {
  registrationId: string;
  ownerPluginId: string;
  reason: "registered" | "unregistered";
};

export interface AppSlashCommandContext {
  arguments: string;
  conversationId?: string;
}

export type AppSlashCommandDispatch =
  | {
      kind: "host";
      execute: (context: AppSlashCommandContext) => Promise<void> | void;
    }
  | {
      kind: "tool";
      tool: string;
      argMode?: "raw" | "parsed";
    }
  | {
      kind: "skill";
      skill: string;
    }
  | {
      kind: "prompt";
      template: string;
    };

export interface AppSlashCommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  argumentHint?: string;
  dispatch: AppSlashCommandDispatch;
}

export interface RegisteredAppSlashCommand {
  registrationId: string;
  ownerPluginId: string;
  command: AppSlashCommandDefinition;
}

export interface AppSlashCommandRegistration {
  readonly id: string;
  readonly name: string;
  dispose(): void;
}

export type AppSlashCommandRegistryChange = {
  registrationId: string;
  name: string;
  ownerPluginId: string;
  reason: "registered" | "unregistered";
};

let skillSequence = 0;
let slashSequence = 0;

export function assertSkillRelativePath(path: string, label: string): string {
  const trimmed = path.trim().replaceAll("\\", "/");
  if (!trimmed) {
    throw new Error(`${label} must not be empty.`);
  }
  if (trimmed.startsWith("/") || /^[a-z]:/iu.test(trimmed)) {
    throw new Error(`${label} must stay inside the extension root.`);
  }
  const segments = trimmed.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`${label} must not contain traversal segments.`);
  }
  return trimmed;
}

function normalizeSkill(skill: ProgrammaticAppSkill): ProgrammaticAppSkill {
  const name = skill.name.trim();
  if (!SKILL_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid skill name: ${skill.name}. Expected pattern ${SKILL_NAME_PATTERN.source}.`,
    );
  }
  const description = skill.description.trim();
  if (!description) {
    throw new Error(`Skill ${name} description must not be empty.`);
  }
  const instructions = skill.instructions.trim();
  if (!instructions) {
    throw new Error(`Skill ${name} instructions must not be empty.`);
  }
  return { ...skill, name, description, instructions };
}

function normalizeSlashName(name: string): string {
  const normalized = name.trim().replace(/^\/+/u, "").toLowerCase();
  if (!SLASH_COMMAND_NAME_PATTERN.test(normalized)) {
    throw new Error(
      `Invalid slash command name: ${name}. Expected pattern ${SLASH_COMMAND_NAME_PATTERN.source}.`,
    );
  }
  return normalized;
}

/** Transport-neutral registry for plugin-owned skill sources. */
export class AppSkillRegistry extends EventDispatcher<{
  changed: [change: AppSkillRegistryChange];
}> {
  private readonly sources = new Map<string, RegisteredAppSkillSource>();

  registerRoot(
    owner: AppSkillOwner,
    path: string,
  ): AppSkillSourceRegistration {
    return this.#registerPath(owner, "root", path);
  }

  registerDirectory(
    owner: AppSkillOwner,
    path: string,
  ): AppSkillSourceRegistration {
    return this.#registerPath(owner, "directory", path);
  }

  registerSkill(
    owner: AppSkillOwner,
    skill: ProgrammaticAppSkill,
  ): AppSkillSourceRegistration {
    const pluginId = owner.pluginId.trim();
    if (!pluginId) {
      throw new Error("Skill owner plugin id must not be empty.");
    }
    const registeredSkill = normalizeSkill(skill);
    const registrationId = `app-skill-${++skillSequence}`;
    const registered: RegisteredAppSkillSource = {
      registrationId,
      ownerPluginId: pluginId,
      kind: "programmatic",
      skill: registeredSkill,
    };
    this.sources.set(registrationId, registered);
    this.emit("changed", {
      registrationId,
      ownerPluginId: pluginId,
      reason: "registered",
    });
    return this.#disposable(registered);
  }

  list(): RegisteredAppSkillSource[] {
    return [...this.sources.values()];
  }

  #registerPath(
    owner: AppSkillOwner,
    kind: "root" | "directory",
    path: string,
  ): AppSkillSourceRegistration {
    const pluginId = owner.pluginId.trim();
    if (!pluginId) {
      throw new Error("Skill owner plugin id must not be empty.");
    }
    const relative = assertSkillRelativePath(path, "Skill source path");
    const registrationId = `app-skill-${++skillSequence}`;
    const registered: RegisteredAppSkillSource = {
      registrationId,
      ownerPluginId: pluginId,
      kind,
      path: relative,
    };
    this.sources.set(registrationId, registered);
    this.emit("changed", {
      registrationId,
      ownerPluginId: pluginId,
      reason: "registered",
    });
    return this.#disposable(registered);
  }

  #disposable(
    registered: RegisteredAppSkillSource,
  ): AppSkillSourceRegistration {
    let disposed = false;
    return {
      id: registered.registrationId,
      kind: registered.kind,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this.sources.get(registered.registrationId) !== registered) return;
        this.sources.delete(registered.registrationId);
        this.emit("changed", {
          registrationId: registered.registrationId,
          ownerPluginId: registered.ownerPluginId,
          reason: "unregistered",
        });
      },
    };
  }
}

/** Transport-neutral registry for plugin-owned composer slash commands. */
export class AppSlashCommandRegistry extends EventDispatcher<{
  changed: [change: AppSlashCommandRegistryChange];
}> {
  private readonly commands = new Map<string, RegisteredAppSlashCommand>();

  register(
    owner: AppSkillOwner,
    command: AppSlashCommandDefinition,
  ): AppSlashCommandRegistration {
    const pluginId = owner.pluginId.trim();
    if (!pluginId) {
      throw new Error("Slash command owner plugin id must not be empty.");
    }
    const name = normalizeSlashName(command.name);
    if (this.commands.has(name)) {
      throw new Error(`Slash command already registered: ${name}`);
    }
    const description = command.description.trim();
    if (!description) {
      throw new Error(`Slash command ${name} description must not be empty.`);
    }
    if (!command.dispatch || typeof command.dispatch !== "object") {
      throw new Error(`Slash command ${name} must provide a dispatch.`);
    }
    const aliases = (command.aliases ?? []).map((alias) =>
      normalizeSlashName(alias),
    );
    const registrationId = `app-slash-${++slashSequence}`;
    const registered: RegisteredAppSlashCommand = {
      registrationId,
      ownerPluginId: pluginId,
      command: {
        ...command,
        name,
        description,
        aliases,
      },
    };
    this.commands.set(name, registered);
    this.emit("changed", {
      registrationId,
      name,
      ownerPluginId: pluginId,
      reason: "registered",
    });
    let disposed = false;
    return {
      id: registrationId,
      name,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this.commands.get(name) !== registered) return;
        this.commands.delete(name);
        this.emit("changed", {
          registrationId,
          name,
          ownerPluginId: pluginId,
          reason: "unregistered",
        });
      },
    };
  }

  get(name: string): RegisteredAppSlashCommand | undefined {
    const normalized = name.trim().replace(/^\/+/u, "").toLowerCase();
    return this.commands.get(normalized);
  }

  list(): RegisteredAppSlashCommand[] {
    return [...this.commands.values()].sort((left, right) =>
      left.command.name.localeCompare(right.command.name),
    );
  }
}
