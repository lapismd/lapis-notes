import type { CatalogGroup, CatalogSkillRow } from "./types";

export type CatalogKindKey = "tools" | "commands" | "skills" | "diagnostics";

export function catalogOwnerKey(groupId: string): string {
  return `owner:${groupId}`;
}

export function catalogKindKey(groupId: string, kind: CatalogKindKey): string {
  return `kind:${groupId}:${kind}`;
}

export function catalogToolKey(name: string): string {
  return `leaf:tool:${name}`;
}

export function catalogCommandKey(name: string): string {
  return `leaf:command:${name}`;
}

export function catalogSkillKey(
  source: CatalogSkillRow["source"],
  name: string,
): string {
  return `leaf:skill:${source}:${name}`;
}

export function catalogSkillExpands(_skill: CatalogSkillRow): boolean {
  return true;
}

export function collectCatalogFolderKeys(
  groups: readonly CatalogGroup[],
): string[] {
  const keys: string[] = [];
  for (const group of groups) {
    keys.push(catalogOwnerKey(group.id));
    if (group.tools.length > 0) {
      keys.push(catalogKindKey(group.id, "tools"));
    }
    if (group.commands.length > 0) {
      keys.push(catalogKindKey(group.id, "commands"));
    }
    if (group.skills.length > 0) {
      keys.push(catalogKindKey(group.id, "skills"));
    }
    if (group.diagnostics.length > 0) {
      keys.push(catalogKindKey(group.id, "diagnostics"));
    }
  }
  return keys;
}

export function collectCatalogLeafKeys(
  groups: readonly CatalogGroup[],
): string[] {
  const keys: string[] = [];
  for (const group of groups) {
    for (const tool of group.tools) {
      keys.push(catalogToolKey(tool.name));
    }
    for (const command of group.commands) {
      keys.push(catalogCommandKey(command.name));
    }
    for (const skill of group.skills) {
      if (catalogSkillExpands(skill)) {
        keys.push(catalogSkillKey(skill.source, skill.name));
      }
    }
  }
  return keys;
}

export function collectCatalogExpandableKeys(
  groups: readonly CatalogGroup[],
): string[] {
  return [...collectCatalogFolderKeys(groups), ...collectCatalogLeafKeys(groups)];
}

export function isCatalogFolderKey(key: string): boolean {
  return key.startsWith("owner:") || key.startsWith("kind:");
}
