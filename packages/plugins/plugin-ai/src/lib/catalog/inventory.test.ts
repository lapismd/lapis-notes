import { beforeAll, describe, expect, it } from "vitest";
import { AppSlashCommandRegistry } from "@lapis-notes/api/agent-skills";
import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import {
  applyAppToolEnablement,
  DEFAULT_AI_SETTINGS,
} from "../settings/ai-settings";
import { BUNDLED_LAPIS_NOTES_SKILL } from "../skills/bundled/lapis-notes";
import { BUNDLED_RESEARCH_SKILL } from "../skills/bundled/research";
import { collectAiCatalog } from "./inventory";

let Vault: typeof import("@lapis-notes/api/vault").Vault;
let MemoryVaultAdapter: typeof import("@lapis-notes/api/vault").MemoryVaultAdapter;

beforeAll(async () => {
  ({ Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault"));
});

describe("AI catalog inventory", () => {
  it("groups tools and commands by owner and lists folder skills outside chat scope", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    await vault.mkpath("Notes/.agents/skills/daily");
    await vault.create(
      "Notes/.agents/skills/daily/SKILL.md",
      `---
name: daily
description: Daily notes
---
Body.
`,
    );
    await vault.mkpath("Projects/.agents/skills/research");
    await vault.create(
      "Projects/.agents/skills/research/SKILL.md",
      `---
name: research
description: Folder research
---
Folder body.
`,
    );
    const tools = new AppToolRegistry();
    tools.register(
      { pluginId: "search", source: "core", provenance: "bundled" },
      {
        name: "notes_search",
        description: "Search notes",
        effect: "read",
        inputSchema: { type: "object", properties: {} },
        async execute() {
          return { content: [] };
        },
      },
    );
    const commands = new AppSlashCommandRegistry();
    commands.register(
      { pluginId: "search" },
      {
        name: "search",
        description: "Search notes",
        dispatch: { kind: "tool", tool: "notes_search" },
      },
    );

    const groups = await collectAiCatalog({
      tools: tools.list(),
      commands: commands.list(),
      vault,
      bundled: [BUNDLED_LAPIS_NOTES_SKILL, BUNDLED_RESEARCH_SKILL],
      settings: DEFAULT_AI_SETTINGS,
      pluginLabel: (id) => (id === "search" ? "Search" : id === "ai" ? "AI" : id),
    });
    const search = groups.find((group) => group.id === "search");
    expect(search?.tools.map((tool) => tool.name)).toEqual(["notes_search"]);
    expect(search?.commands.map((command) => command.name)).toEqual(["search"]);
    const ai = groups.find((group) => group.id === "ai");
    expect(ai?.commands.some((command) => command.name === "help")).toBe(true);
    expect(ai?.skills.some((skill) => skill.name === "lapis-notes")).toBe(true);
    const research = ai?.skills.find((skill) => skill.name === "research");
    expect(research?.shadowed).toBe(true);
    const folders = groups.find((group) => group.id === "folders");
    expect(folders?.skills.map((skill) => skill.name).sort()).toEqual([
      "daily",
      "research",
    ]);
    expect(folders?.skills.find((skill) => skill.name === "research")?.shadowed).toBe(
      false,
    );
    expect(folders?.skills.find((skill) => skill.name === "daily")?.path).toBe(
      "Notes/.agents/skills/daily/SKILL.md",
    );
  });

  it("lists vault command Markdown under Folders and keeps reserved host names", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    await vault.mkpath("Notes/.agents/commands");
    await vault.create(
      "Notes/.agents/commands/review.md",
      `---
description: Review the note
---
Review $ARGUMENTS.
`,
    );
    await vault.create(
      "Notes/.agents/commands/help.md",
      `---
description: Should not win
---
Nope
`,
    );
    const groups = await collectAiCatalog({
      tools: [],
      commands: [],
      vault,
      bundled: [],
      settings: DEFAULT_AI_SETTINGS,
      pluginLabel: (id) => id,
      scopeDir: "Notes",
    });
    const folders = groups.find((group) => group.id === "folders");
    expect(folders?.commands.map((command) => command.name)).toEqual(["review"]);
    expect(folders?.commands[0]?.path).toBe("Notes/.agents/commands/review.md");
    const ai = groups.find((group) => group.id === "ai");
    expect(ai?.commands.some((command) => command.name === "help")).toBe(true);
    expect(
      groups
        .find((group) => group.id === "diagnostics")
        ?.diagnostics.some((item) => /Reserved command name/u.test(item.message)),
    ).toBe(true);
  });

  it("reports persisted tool enablement without rewriting caller settings", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    const tools = new AppToolRegistry();
    tools.register(
      { pluginId: "search", source: "core", provenance: "bundled" },
      {
        name: "notes_search",
        description: "Search notes",
        effect: "read",
        inputSchema: { type: "object", properties: {} },
        async execute() {
          return { content: [] };
        },
      },
    );
    const owner = { name: "notes_search", owner: tools.get("notes_search")!.owner };
    const settings = {
      ...DEFAULT_AI_SETTINGS,
      ...applyAppToolEnablement(DEFAULT_AI_SETTINGS, owner, false, [owner]),
    };
    const groups = await collectAiCatalog({
      tools: tools.list(),
      commands: [],
      vault,
      bundled: [],
      settings,
      pluginLabel: (id) => id,
    });
    const search = groups.find((group) => group.id === "search");
    expect(search?.tools[0]?.enabled).toBe(false);
    expect(DEFAULT_AI_SETTINGS.disabledAppToolNames).toEqual([]);
  });
});
