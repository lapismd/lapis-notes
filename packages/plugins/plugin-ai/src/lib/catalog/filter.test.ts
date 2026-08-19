import { describe, expect, it } from "vitest";
import { filterCatalogGroups } from "./filter";
import type { CatalogGroup } from "./types";

const search: CatalogGroup = {
  id: "search",
  label: "Search",
  kind: "plugin",
  tools: [
    {
      kind: "tool",
      name: "notes_search",
      description: "Search notes in the current scope.",
      effect: "read",
      pluginId: "search",
      enabled: true,
      owner: { pluginId: "search", source: "core" },
    },
  ],
  commands: [
    {
      kind: "command",
      name: "search",
      description: "Search notes",
      source: "extension",
    },
  ],
  skills: [],
  diagnostics: [],
};

describe("filterCatalogGroups", () => {
  it("keeps matching leaves and drops empty owners", () => {
    const filtered = filterCatalogGroups([search], "notes_search");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.tools.map((tool) => tool.name)).toEqual(["notes_search"]);
    expect(filtered[0]?.commands).toEqual([]);
  });

  it("matches slash command names", () => {
    const filtered = filterCatalogGroups([search], "/search");
    expect(filtered[0]?.commands.map((command) => command.name)).toEqual([
      "search",
    ]);
  });
});
