import type { SkillRegistry } from "../skills/registry";
import type { LoadedAppSkill, SkillDiscoveryContext } from "../skills/types";
import { SlashCommandCatalog } from "./catalog";
import {
  isLiteralSlashText,
  parseSlashCommand,
  unescapeLiteralSlash,
} from "./parser";
import type {
  CommandExecutionResult,
  CommandResolution,
  EffectiveSlashCommand,
  ParsedSlashCommand,
} from "./types";

export class SlashCommandRouter {
  constructor(
    readonly catalog: SlashCommandCatalog,
    private readonly skills?: SkillRegistry,
  ) {}

  parse(input: string): ParsedSlashCommand | undefined {
    return parseSlashCommand(input);
  }

  resolve(
    input: string,
    agentBindingId?: string,
  ): CommandResolution | undefined {
    if (isLiteralSlashText(input)) {
      return { kind: "literal", text: unescapeLiteralSlash(input) };
    }
    const parsed = parseSlashCommand(input);
    if (!parsed) return undefined;
    const command = this.catalog.get(parsed.name, agentBindingId);
    if (!command) {
      const suggestions = this.catalog
        .list(agentBindingId)
        .map((item) => item.name)
        .filter((name) => name.startsWith(parsed.name.slice(0, 2)))
        .slice(0, 5);
      return { kind: "unknown", parsed, suggestions };
    }
    return { kind: "command", parsed, command };
  }

  async execute(
    resolution: CommandResolution,
    context: {
      agentBindingId?: string;
      discovery: SkillDiscoveryContext;
      loadSkill?: (name: string) => LoadedAppSkill | undefined;
    },
  ): Promise<CommandExecutionResult> {
    if (resolution.kind === "literal") {
      return { kind: "prompt", prompt: resolution.text };
    }
    if (resolution.kind === "unknown") {
      const hint =
        resolution.suggestions.length > 0
          ? ` Did you mean /${resolution.suggestions.join(", /")}?`
          : "";
      return {
        kind: "error",
        message: `Unknown command: /${resolution.parsed.name}.${hint}`,
      };
    }
    const { parsed, command } = resolution;
    return this.#dispatch(command, parsed, context);
  }

  async #dispatch(
    command: EffectiveSlashCommand,
    parsed: ParsedSlashCommand,
    context: {
      agentBindingId?: string;
      discovery: SkillDiscoveryContext;
      loadSkill?: (name: string) => LoadedAppSkill | undefined;
    },
  ): Promise<CommandExecutionResult> {
    if (command.name === "skill") {
      const [skillName, ...rest] = parsed.rawArguments.split(/\s+/u);
      if (!skillName) {
        return { kind: "error", message: "Usage: /skill <name> [arguments]" };
      }
      return this.#activateSkill(skillName, rest.join(" "), context);
    }
    if (command.name === "native") {
      const [nativeName, ...rest] = parsed.rawArguments.split(/\s+/u);
      if (!nativeName) {
        return { kind: "error", message: "Usage: /native <command> [arguments]" };
      }
      const native = this.catalog.native(context.agentBindingId, nativeName);
      if (!native) {
        return {
          kind: "error",
          message: `Native command is unavailable: ${nativeName}`,
        };
      }
      return {
        kind: "native",
        name: native.name,
        arguments: rest.join(" "),
      };
    }
    if (command.name === "new") return { kind: "local", notice: "new" };
    if (command.name === "skills") return { kind: "local", notice: "skills" };
    if (command.name === "tools") return { kind: "local", notice: "tools" };
    if (command.name === "refresh") return { kind: "local", notice: "refresh" };

    const dispatch = command.dispatch;
    if (dispatch.kind === "host") {
      await dispatch.execute({
        arguments: parsed.rawArguments,
      });
      return { kind: "local", notice: command.name };
    }
    if (dispatch.kind === "tool") {
      return {
        kind: "tool",
        tool: dispatch.tool,
        input: {
          command: parsed.rawArguments,
          commandName: command.name,
          skillName: command.name,
        },
      };
    }
    if (dispatch.kind === "skill") {
      return this.#activateSkill(dispatch.skill, parsed.rawArguments, context);
    }
    if (dispatch.kind === "prompt") {
      const prompt = dispatch.template.includes("{{args}}")
        ? dispatch.template.replaceAll("{{args}}", parsed.rawArguments)
        : `${dispatch.template}\n${parsed.rawArguments}`.trim();
      return { kind: "prompt", prompt };
    }
    if (dispatch.kind === "native-agent") {
      return {
        kind: "native",
        name: dispatch.nativeName,
        arguments: parsed.rawArguments,
      };
    }
    return { kind: "error", message: `Unsupported command: /${command.name}` };
  }

  async #activateSkill(
    name: string,
    args: string,
    context: {
      discovery: SkillDiscoveryContext;
    },
  ): Promise<CommandExecutionResult> {
    const loaded = this.skills
      ? await this.skills.resolve(name, context.discovery)
      : undefined;
    if (!loaded) {
      return { kind: "error", message: `Unknown skill: ${name}` };
    }
    if (loaded.command.kind === "tool") {
      return {
        kind: "tool",
        tool: loaded.command.tool,
        input: {
          command: args,
          commandName: name,
          skillName: name,
        },
      };
    }
    const activation = this.skills
      ? await this.skills.activate(name, context.discovery, "user", args)
      : undefined;
    if (!activation) {
      return { kind: "error", message: `Unknown skill: ${name}` };
    }
    return { kind: "skill", activation };
  }
}
