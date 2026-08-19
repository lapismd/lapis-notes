import { describe, expect, it } from "vitest";
import {
  buildAvailableSkillsManifest,
  hasHostFilesystemPath,
} from "./manifest";

describe("buildAvailableSkillsManifest", () => {
  it("omits host paths and disable-model-invocation skills", () => {
    const xml = buildAvailableSkillsManifest({
      id: "snap-1",
      createdAt: "2026-08-18T00:00:00.000Z",
      skills: [
        {
          skillId: "folder:research-notes",
          name: "research-notes",
          description: "Research a topic",
          version: "fnv1a:1",
          userInvocable: true,
          modelInvocable: true,
        },
        {
          skillId: "folder:private-notes",
          name: "private-notes",
          description: "Manual only",
          version: "fnv1a:2",
          userInvocable: true,
          modelInvocable: false,
        },
      ],
    });
    expect(xml).toContain("<name>research-notes</name>");
    expect(xml).not.toContain("private-notes");
    expect(xml).not.toContain(".agents/skills");
    expect(xml).not.toMatch(/\/Users\/|Projects\//u);
  });

  it("rejects vault-relative skill paths", () => {
    expect(
      hasHostFilesystemPath(
        "<available_skills>Notes/.agents/skills/research-notes</available_skills>",
      ),
    ).toBe(true);
    expect(
      hasHostFilesystemPath(
        "<available_skills><name>research-notes</name></available_skills>",
      ),
    ).toBe(false);
  });
});
