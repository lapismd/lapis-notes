import type { AppSlashCommandDefinition } from "@lapis-notes/api/agent-skills";

export function createNotesSearchSlashCommand(): AppSlashCommandDefinition {
  return {
    name: "search",
    description: "Search notes in the current conversation scope.",
    argumentHint: "<query>",
    dispatch: { kind: "tool", tool: "notes_search" },
  };
}
