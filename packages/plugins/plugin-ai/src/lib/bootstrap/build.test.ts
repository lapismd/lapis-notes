import { describe, expect, it } from "vitest";
import { buildAgentBootstrap, buildSessionBootstrap } from "./build";
import { MAX_FOLDER_INSTRUCTION_CHARS } from "./types";

describe("AgentBootstrap builder", () => {
  it("includes static rules, tools, and skills", async () => {
    const { text } = await buildSessionBootstrap({
      scopeDir: "Projects",
      launchNotePath: "Projects/architecture.md",
      workspaceLabel: "lapis-code",
      tools: [
        { name: "notes_search", description: "Search notes in the current scope." },
      ],
      skills: [
        { name: "lapis-notes", description: "Operate Lapis Notes.", version: "1" },
      ],
    });
    expect(text).toContain("<lapis_context>");
    expect(text).toContain("You are operating as an AI assistant inside Lapis Notes.");
    expect(text).toContain("Current scope: Projects");
    expect(text).toContain("Launched from: Projects/architecture.md");
    expect(text).toContain("- notes_search — Search notes in the current scope.");
    expect(text).toContain("- lapis-notes");
    expect(text).toContain("skills_read");
  });

  it("walks ancestor AGENTS.md root to leaf and skips path-bearing files", async () => {
    const files: Record<string, string> = {
      ".lapis/AGENTS.md": "Prefer notes under architecture/.",
      "Projects/.lapis/AGENTS.md": "Treat decisions/ as authoritative.",
      "Projects/Lapis/.lapis/AGENTS.md":
        "Read /Users/steve/secret and .agents/skills/hidden.",
    };
    const bootstrap = await buildAgentBootstrap({
      scopeDir: "Projects/Lapis",
      readText: async (path) => files[path],
    });
    expect(bootstrap.folderInstructions.map((entry) => entry.path)).toEqual([
      ".lapis/AGENTS.md",
      "Projects/.lapis/AGENTS.md",
      "Projects/Lapis/.lapis/AGENTS.md",
    ]);
    expect(bootstrap.folderInstructions[2]?.omitted).toBe("path-bearing");
    const { text } = await buildSessionBootstrap({
      scopeDir: "Projects/Lapis",
      readText: async (path) => files[path],
    });
    expect(text).toContain("Prefer notes under architecture/.");
    expect(text).toContain("Treat decisions/ as authoritative.");
    expect(text).not.toContain("/Users/steve/secret");
  });

  it("keeps a path-free bootstrap when scope is a skill folder", async () => {
    const { text } = await buildSessionBootstrap({
      scopeDir: ".agents/skills/lapis-notes",
      launchNotePath: ".agents/skills/lapis-notes/SKILL.md",
      tools: [
        { name: "notes_search", description: "Search notes in the current scope." },
      ],
      skills: [
        { name: "lapis-notes", description: "Operate Lapis Notes.", version: "1" },
      ],
    });
    expect(text).toContain("<lapis_context>");
    expect(text).toContain("Use application-provided tools");
    expect(text).toContain("Current scope: (application folder)");
    expect(text).toContain("Launched from: (application folder)");
    expect(text).toContain("- notes_search");
    expect(text).not.toContain(".agents/skills");
  });

  it("reports budget truncation", async () => {
    const oversized = "A".repeat(MAX_FOLDER_INSTRUCTION_CHARS + 20);
    const bootstrap = await buildAgentBootstrap({
      scopeDir: "Projects",
      readText: async (path) =>
        path === "Projects/.lapis/AGENTS.md" ? oversized : undefined,
    });
    expect(bootstrap.truncated).toBe(true);
    expect(bootstrap.folderInstructions[0]?.truncated).toBe(true);
    expect(bootstrap.folderInstructions[0]?.text).toHaveLength(
      MAX_FOLDER_INSTRUCTION_CHARS,
    );
  });
});
