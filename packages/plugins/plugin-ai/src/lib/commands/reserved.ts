import type { EffectiveSlashCommand } from "./types";

export const RESERVED_SLASH_COMMANDS: EffectiveSlashCommand[] = [
  {
    name: "help",
    description: "Show available commands grouped by App, Actions, Skills, and Current Agent.",
    aliases: ["commands"],
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "new",
    description: "Start a new chat in the current scope.",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "agent",
    description: "Show or switch the current agent.",
    argumentHint: "[codex|cursor|native|fake]",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "model",
    description: "Reserved. Change the model from the composer Model menu.",
    argumentHint: "[name]",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "status",
    description: "Show conversation, agent, model, scope, and executor context.",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "scope",
    description: "Show the current folder scope, or start a new chat in a folder.",
    argumentHint: "[folder]",
    source: "app",
    dispatch: { kind: "host", execute: () => undefined },
  },
  {
    name: "context",
    description: "Show the context the app is making available to the agent.",
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
    name: "cancel",
    description: "Reserved. Use Stop in the composer to cancel the active run.",
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

export function reservedSlashCommandNames(): Set<string> {
  return new Set(
    RESERVED_SLASH_COMMANDS.flatMap((command) => [
      command.name,
      ...(command.aliases ?? []),
    ]),
  );
}

export function reservedCommandMarkdown(
  command: EffectiveSlashCommand,
): string {
  const lines = [
    "---",
    `description: ${JSON.stringify(command.description)}`,
    "kind: host",
  ];
  if (command.argumentHint) {
    lines.push(`argumentHint: ${JSON.stringify(command.argumentHint)}`);
  }
  if (command.aliases?.length) {
    lines.push(
      `aliases: [${command.aliases.map((alias) => JSON.stringify(alias)).join(", ")}]`,
    );
  }
  lines.push(
    "---",
    "",
    `Reserved Lapis command \`/${command.name}\`. This file documents the host handler and is not sent as a prompt.`,
    "",
  );
  return lines.join("\n");
}
