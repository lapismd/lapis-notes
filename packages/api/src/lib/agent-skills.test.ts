import { describe, expect, it } from "vitest";
import {
  AppSkillRegistry,
  AppSlashCommandRegistry,
  assertSkillRelativePath,
} from "./agent-skills";

describe("AppSkillRegistry", () => {
  it("registers roots, directories, and programmatic skills", () => {
    const registry = new AppSkillRegistry();
    const owner = { pluginId: "notes" };
    const root = registry.registerRoot(owner, "skills");
    const directory = registry.registerDirectory(owner, "skills/research-notes");
    const skill = registry.registerSkill(owner, {
      name: "review-note",
      description: "Review a note.",
      instructions: "Look for contradictions.",
    });
    expect(registry.list()).toHaveLength(3);
    root.dispose();
    directory.dispose();
    skill.dispose();
    expect(registry.list()).toEqual([]);
  });

  it("rejects escaped skill paths", () => {
    expect(() => assertSkillRelativePath("../x", "Skill source path")).toThrow(
      /traversal/u,
    );
    expect(() => assertSkillRelativePath("/abs", "Skill source path")).toThrow(
      /extension root/u,
    );
  });
});

describe("AppSlashCommandRegistry", () => {
  it("rejects duplicate names and disposes registrations", () => {
    const registry = new AppSlashCommandRegistry();
    const first = registry.register(
      { pluginId: "notes" },
      {
        name: "search",
        description: "Search notes.",
        dispatch: { kind: "tool", tool: "notes_search" },
      },
    );
    expect(() =>
      registry.register(
        { pluginId: "other" },
        {
          name: "search",
          description: "Other search.",
          dispatch: { kind: "tool", tool: "notes_search" },
        },
      ),
    ).toThrow(/already registered/u);
    first.dispose();
    expect(registry.get("search")).toBeUndefined();
  });
});
