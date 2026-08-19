import { describe, expect, it } from "vitest";
import {
  catalogKindKey,
  catalogOwnerKey,
  catalogSkillExpands,
  catalogToolKey,
  collectCatalogExpandableKeys,
  collectCatalogFolderKeys,
} from "./tree";
import type { CatalogGroup } from "./types";

const group: CatalogGroup = {
  id: "search",
  label: "Search",
  kind: "plugin",
  tools: [
    {
      kind: "tool",
      name: "notes_search",
      description: "Search notes",
      effect: "read",
      pluginId: "search",
      enabled: true,
      owner: { pluginId: "search", source: "core" },
    },
  ],
  commands: [],
  skills: [
    {
      kind: "skill",
      name: "lapis-notes",
      description: "Use note tools",
      source: "bundled",
      shadowed: false,
      userInvocable: false,
    },
    {
      kind: "skill",
      name: "daily",
      description: "Daily notes",
      source: "folder",
      path: "Notes/.agents/skills/daily/SKILL.md",
      shadowed: false,
      userInvocable: true,
    },
  ],
  diagnostics: [],
};

describe("catalog tree keys", () => {
  it("defaults owner and kind folders open without expanding leaves", () => {
    expect(collectCatalogFolderKeys([group])).toEqual([
      catalogOwnerKey("search"),
      catalogKindKey("search", "tools"),
      catalogKindKey("search", "skills"),
    ]);
    expect(collectCatalogExpandableKeys([group])).toContain(
      catalogToolKey("notes_search"),
    );
  });

  it("expands bundled and vault skills so descriptions share the same row toggle", () => {
    expect(catalogSkillExpands(group.skills[0]!)).toBe(true);
    expect(catalogSkillExpands(group.skills[1]!)).toBe(true);
  });
});
