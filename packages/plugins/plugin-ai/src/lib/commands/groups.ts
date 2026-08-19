import { fuzzySearch } from "@lapis-notes/ui";
import type { EffectiveSlashCommand, SlashCommandSource } from "./types";

export type ComposerSlashItem = {
  id: string;
  label: string;
  value: string;
  description: string;
  source: SlashCommandSource;
  submitOnSelect: boolean;
};

const SLASH_SEARCH_KEYS = [
  { name: "label", weight: 2 },
  { name: "id", weight: 2 },
] as const;

function normalizeSlashQuery(query: string): string {
  return query.trim().replace(/^\/+/u, "");
}

function commandNameFields(item: ComposerSlashItem): string[] {
  const label = item.label.replace(/^\/+/u, "");
  const idTail = item.id.includes(":")
    ? item.id.slice(item.id.lastIndexOf(":") + 1)
    : item.id;
  return [item.id, idTail, label, item.value.replace(/^\/+/u, "")];
}

function matchesCommandName(item: ComposerSlashItem, query: string): boolean {
  const needle = query.toLowerCase();
  return commandNameFields(item).some((field) =>
    field.toLowerCase().includes(needle),
  );
}

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
): ComposerSlashItem[] {
  const grouped = groupSlashCommands(commands);
  const items: ComposerSlashItem[] = [];
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

export function filterComposerSlashItems(
  items: readonly ComposerSlashItem[],
  query: string,
): ComposerSlashItem[] {
  const needle = normalizeSlashQuery(query);
  if (!needle) return [...items];

  const options = {
    keys: [...SLASH_SEARCH_KEYS, { name: "description", weight: 0.4 }],
    minMatchCharLength: 1,
  } as const;
  const matches = fuzzySearch([...items], needle, options);
  const nameHits: ComposerSlashItem[] = [];
  const descriptionHits: ComposerSlashItem[] = [];
  for (const { item } of matches) {
    if (matchesCommandName(item, needle)) {
      nameHits.push(item);
    } else {
      descriptionHits.push(item);
    }
  }
  return [...nameHits, ...descriptionHits];
}
