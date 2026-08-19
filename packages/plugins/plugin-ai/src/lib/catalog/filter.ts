import type { CatalogGroup } from "./types";

export function catalogQueryMatches(
  query: string,
  ...fields: readonly (string | undefined)[]
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

export function filterCatalogGroups(
  groups: readonly CatalogGroup[],
  query: string,
): CatalogGroup[] {
  if (!query.trim()) return [...groups];
  return groups
    .map((group) => {
      const tools = group.tools.filter((tool) =>
        catalogQueryMatches(query, tool.name, tool.description, tool.effect),
      );
      const commands = group.commands.filter((command) =>
        catalogQueryMatches(
          query,
          command.name,
          `/${command.name}`,
          command.description,
        ),
      );
      const skills = group.skills.filter((skill) =>
        catalogQueryMatches(query, skill.name, skill.description),
      );
      const diagnostics = group.diagnostics.filter((diagnostic) =>
        catalogQueryMatches(query, diagnostic.message, diagnostic.path),
      );
      return { ...group, tools, commands, skills, diagnostics };
    })
    .filter(
      (group) =>
        catalogQueryMatches(query, group.label) ||
        group.tools.length +
          group.commands.length +
          group.skills.length +
          group.diagnostics.length >
          0,
    );
}
