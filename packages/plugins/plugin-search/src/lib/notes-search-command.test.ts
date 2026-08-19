import { describe, expect, it } from "vitest";
import { createNotesSearchSlashCommand } from "./notes-search-command";
import { SearchPlugin } from "./search-plugin";

describe("notes_search slash command", () => {
  it("dispatches notes_search without adding a palette command", () => {
    const command = createNotesSearchSlashCommand();
    expect(command).toMatchObject({
      name: "search",
      argumentHint: "<query>",
      dispatch: { kind: "tool", tool: "notes_search" },
    });
    const onload = SearchPlugin.prototype.onload.toString();
    expect(onload).toContain("registerAgentSlashCommand");
    expect(onload).toContain("createNotesSearchSlashCommand");
    expect(onload).toContain("registerAgentResultView");
    expect(onload).toContain("notes_search");
    expect(onload).not.toMatch(/addCommand\(\s*\{\s*id:\s*["']search["']/u);
  });
});
