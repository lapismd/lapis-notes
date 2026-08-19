import type { EffectiveSlashCommand, SlashCommandSource } from "./types";

export type SlashCommandGroup = "app" | "actions" | "skills" | "agent";

const GROUP_LABEL: Record<SlashCommandGroup, string> = {
  app: "App",
  actions: "Actions",
  skills: "Skills",
  agent: "Current Agent",
};

const GROUP_ORDER: SlashCommandGroup[] = [
  "app",
  "actions",
  "skills",
  "agent",
];

export function slashCommandGroup(
  command: EffectiveSlashCommand,
): SlashCommandGroup {
  if (
    command.source === "extension" ||
    command.source === "folder" ||
    command.source === "vault" ||
    command.source === "user"
  ) {
    return "actions";
  }
  if (command.source === "skill") return "skills";
  if (command.source === "native-agent") return "agent";
  return "app";
}

export function groupLabel(
  group: SlashCommandGroup,
  agentLabel?: string,
): string {
  if (group === "agent" && agentLabel) return `Current Agent · ${agentLabel}`;
  return GROUP_LABEL[group];
}

export function groupSlashCommands(
  commands: readonly EffectiveSlashCommand[],
): Record<SlashCommandGroup, EffectiveSlashCommand[]> {
  const groups: Record<SlashCommandGroup, EffectiveSlashCommand[]> = {
    app: [],
    actions: [],
    skills: [],
    agent: [],
  };
  for (const command of commands) {
    groups[slashCommandGroup(command)].push(command);
  }
  return groups;
}

export function formatSlashHelp(
  commands: readonly EffectiveSlashCommand[],
  agentLabel?: string,
): string {
  const grouped = groupSlashCommands(commands);
  const sections: string[] = [];
  for (const group of GROUP_ORDER) {
    const items = grouped[group];
    if (items.length === 0) continue;
    const lines = [groupLabel(group, agentLabel)];
    for (const command of items) {
      const name =
        command.source === "native-agent"
          ? `/native ${command.name}`
          : `/${command.name}`;
      const hint = command.argumentHint ? ` ${command.argumentHint}` : "";
      lines.push(`  ${name}${hint} — ${command.description}`);
    }
    sections.push(lines.join("\n"));
  }
  return sections.join("\n\n") || "No commands are available.";
}

export function composerSlashItems(
  commands: readonly EffectiveSlashCommand[],
  agentLabel?: string,
): Array<{
  id: string;
  label: string;
  value: string;
  description: string;
  source: SlashCommandSource;
  submitOnSelect: boolean;
}> {
  const grouped = groupSlashCommands(commands);
  const items: Array<{
    id: string;
    label: string;
    value: string;
    description: string;
    source: SlashCommandSource;
    submitOnSelect: boolean;
  }> = [];
  for (const group of GROUP_ORDER) {
    const heading = groupLabel(group, agentLabel);
    for (const command of grouped[group]) {
      const native = command.source === "native-agent";
      const label = native ? `/native ${command.name}` : `/${command.name}`;
      items.push({
        id: native ? `native:${command.name}` : command.name,
        label,
        value: label,
        description: `${heading} · ${command.description}`,
        source: command.source,
        submitOnSelect: !command.argumentHint,
      });
    }
  }
  return items;
}
