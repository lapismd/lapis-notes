import { beforeAll, describe, expect, it } from "vitest";
import { AppSkillRegistry } from "@lapis-notes/api/agent-skills";
import { SkillRegistry } from "./registry";

let Vault: typeof import("@lapis-notes/api/vault").Vault;
let MemoryVaultAdapter: typeof import("@lapis-notes/api/vault").MemoryVaultAdapter;

beforeAll(async () => {
  ({ Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault"));
});

const RESEARCH = `---
name: research-notes
description: Research a topic thoroughly using notes in the current scope.
---
Use notes_search then read.
`;

async function seed(
  files: Record<string, string>,
  options: { bundled?: boolean; appSkills?: AppSkillRegistry } = {},
) {
  const vault = new Vault(new MemoryVaultAdapter());
  await vault.load();
  for (const [path, content] of Object.entries(files)) {
    await vault.mkpath(path.replace(/\/[^/]+$/u, ""));
    await vault.create(path, content);
  }
  return new SkillRegistry({
    vault,
    appSkills: options.appSkills,
    bundled: options.bundled
      ? [
          {
            id: "bundled:research-notes",
            name: "research-notes",
            description: "Bundled research",
            source: "bundled",
            root: "bundled/research-notes",
            version: "bundled",
            userInvocable: true,
            modelInvocable: true,
            command: { kind: "model" },
            instructions: "bundled",
          },
        ]
      : [],
  });
}

describe("SkillRegistry discovery", () => {
  it("lets folder skills override bundled and extension skills", async () => {
    const appSkills = new AppSkillRegistry();
    appSkills.registerSkill(
      { pluginId: "demo" },
      {
        name: "research-notes",
        description: "Extension research",
        instructions: "extension",
      },
    );
    const registry = await seed(
      {
        "Projects/.agents/skills/research-notes/SKILL.md": RESEARCH,
      },
      { bundled: true, appSkills },
    );
    const snapshot = await registry.snapshot({
      scopeDir: "Projects",
      availableToolNames: ["notes_search"],
    });
    expect(snapshot.skills).toHaveLength(1);
    expect(snapshot.skills[0]?.description).toContain("current scope");
    expect(registry.diagnostics.some((item) => item.shadowedBy)).toBe(true);
  });

  it("marks same-level duplicates invalid", async () => {
    const registry = await seed({
      ".agents/skills/a/SKILL.md": RESEARCH,
      ".agents/skills/b/SKILL.md": RESEARCH.replace(
        "current scope",
        "other copy",
      ),
    });
    const snapshot = await registry.snapshot({ scopeDir: "" });
    expect(snapshot.skills.find((skill) => skill.name === "research-notes")).toBe(
      undefined,
    );
    expect(
      registry.diagnostics.some((item) => /Duplicate skill name/u.test(item.message)),
    ).toBe(true);
  });

  it("keeps an existing snapshot when skills change", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    await vault.mkpath(".agents/skills/research-notes");
    await vault.create(".agents/skills/research-notes/SKILL.md", RESEARCH);
    const registry = new SkillRegistry({ vault });
    const first = await registry.snapshot({ scopeDir: "" });
    const file = vault.getFileByPath(".agents/skills/research-notes/SKILL.md");
    expect(file).toBeTruthy();
    await vault.modify(
      file!,
      RESEARCH.replace("thoroughly", "quickly"),
    );
    registry.invalidate();
    const second = await registry.snapshot({ scopeDir: "" });
    expect(first.skills[0]?.version).not.toBe(second.skills[0]?.version);
  });

  it("excludes skills that require unavailable tools or disabled extensions", async () => {
    const appSkills = new AppSkillRegistry();
    appSkills.registerSkill(
      { pluginId: "search" },
      {
        name: "search-notes",
        description: "Search notes",
        instructions: "Use notes_search.",
      },
    );
    const registry = await seed(
      {
        ".agents/skills/gated/SKILL.md": `---
name: gated-notes
description: Needs a missing tool
metadata:
  lapis:
    requires:
      tools:
        - missing_tool
---
Hidden.
`,
      },
      { appSkills },
    );
    const snapshot = await registry.snapshot({
      scopeDir: "",
      availableToolNames: ["notes_search"],
      enabledPluginIds: ["demo"],
    });
    expect(snapshot.skills.map((skill) => skill.name)).toEqual([]);
    expect(
      registry.diagnostics.some((item) =>
        /Required tool is unavailable/u.test(item.message),
      ),
    ).toBe(true);
    expect(
      registry.diagnostics.some((item) =>
        /Disabled extension root/u.test(item.message),
      ),
    ).toBe(true);
  });
});
