import { describe, expect, it } from "vitest";
import { projectSkillActivationPrompt } from "./activation";
import type { SkillActivation } from "./types";

const activation: SkillActivation = {
  skillId: "folder:research-notes",
  skillName: "research-notes",
  version: "1",
  source: "user",
  arguments: "authentication",
  instructions: "Use notes_search then read.",
};

describe("projectSkillActivationPrompt", () => {
  it("wraps path-free instructions around the first prompt", () => {
    const projected = projectSkillActivationPrompt("authentication", [
      activation,
    ]);
    expect(projected).toContain('<skill_activation name="research-notes" version="1">');
    expect(projected).toContain("Use notes_search then read.");
    expect(projected.endsWith("authentication")).toBe(true);
    expect(projected).not.toContain(".agents/skills");
  });

  it("leaves the prompt unchanged when instructions include a host path", () => {
    expect(
      projectSkillActivationPrompt("authentication", [
        {
          ...activation,
          instructions: "Read Notes/.agents/skills/research-notes/SKILL.md",
        },
      ]),
    ).toBe("authentication");
  });
});
