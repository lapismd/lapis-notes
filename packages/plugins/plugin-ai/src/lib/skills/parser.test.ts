import { describe, expect, it } from "vitest";
import { parseSkillMarkdown, skillContentVersion } from "./parser";

const MINIMUM = `---
name: research-notes
description: Research notes in the current folder
---
# Research Notes
Use notes_search.
`;

describe("parseSkillMarkdown", () => {
  it("parses required frontmatter and a stable version", () => {
    const skill = parseSkillMarkdown(MINIMUM, {
      path: ".agents/skills/research-notes/SKILL.md",
      source: "folder",
      root: ".agents/skills/research-notes",
    });
    expect(skill.name).toBe("research-notes");
    expect(skill.description).toContain("Research notes");
    expect(skill.userInvocable).toBe(true);
    expect(skill.modelInvocable).toBe(true);
    expect(skill.command).toEqual({ kind: "model" });
    expect(skill.instructions).toContain("notes_search");
    expect(skill.version).toBe(skillContentVersion(MINIMUM));
  });

  it("rejects missing name and description", () => {
    expect(() =>
      parseSkillMarkdown("---\ndescription: x\n---\n", {
        path: "a",
        source: "folder",
        root: "a",
      }),
    ).toThrow(/name/u);
    expect(() =>
      parseSkillMarkdown("---\nname: research-notes\n---\n", {
        path: "a",
        source: "folder",
        root: "a",
      }),
    ).toThrow(/description/u);
  });

  it("supports OpenClaw flags, tool dispatch, and namespaced metadata", () => {
    const skill = parseSkillMarkdown(
      `---
name: find-notes
description: Find notes
user-invocable: true
disable-model-invocation: true
argument-hint: "<query>"
command-dispatch: tool
command-tool: notes_search
command-arg-mode: raw
metadata:
  lapis:
    requires:
      tools:
        - notes_search
---
Search.
`,
      { path: "a", source: "folder", root: "a" },
    );
    expect(skill.modelInvocable).toBe(false);
    expect(skill.argumentHint).toBe("<query>");
    expect(skill.command).toEqual({
      kind: "tool",
      tool: "notes_search",
      argMode: "raw",
    });
    expect(skill.requirements?.tools).toEqual(["notes_search"]);
  });

  it("rejects tool dispatch without command-tool", () => {
    expect(() =>
      parseSkillMarkdown(
        `---
name: find-notes
description: Find notes
command-dispatch: tool
---
x
`,
        { path: "a", source: "folder", root: "a" },
      ),
    ).toThrow(/command-tool/u);
  });

  it("changes version when content changes", () => {
    const first = skillContentVersion(MINIMUM);
    const second = skillContentVersion(`${MINIMUM}\nmore`);
    expect(first).not.toBe(second);
  });
});
