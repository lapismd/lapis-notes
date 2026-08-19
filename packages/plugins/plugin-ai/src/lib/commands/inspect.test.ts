import { describe, expect, it } from "vitest";
import { formatContextNotice, formatScopeNotice } from "./inspect";
import { composerSlashItems, filterComposerSlashItems } from "./groups";
import { RESERVED_SLASH_COMMANDS } from "./reserved";
import type { EffectiveSlashCommand } from "./types";

describe("slash inspect notices", () => {
  it("formats scope and context dumps", () => {
    expect(
      formatScopeNotice({
        scopeDir: "Projects/Lapis",
        launchNotePath: "architecture.md",
        workspace: "/Users/test/vault",
        source: "conversation",
      }),
    ).toContain("Scope: Projects/Lapis");
    expect(
      formatContextNotice({
        conversationId: "019abc",
        scopeDir: "Projects",
        agent: "Codex ACP",
        model: "gpt-5.6",
        tools: ["notes_search"],
        skills: ["research"],
        folderInstructionPaths: ["Projects/.lapis/AGENTS.md"],
        truncated: false,
      }),
    ).toContain("Available app tools: notes_search");
    expect(
      formatContextNotice({
        conversationId: "019abc",
        scopeDir: "Projects",
        agent: "Codex ACP",
        tools: [],
        skills: [],
        folderInstructionPaths: ["Projects/.lapis/AGENTS.md"],
        truncated: true,
      }),
    ).toContain("Bootstrap truncated");
  });
});

describe("composer slash items", () => {
  it("lists reserved catalog commands and marks argument-free picks for submit", () => {
    const commands: EffectiveSlashCommand[] = [
      {
        name: "help",
        description: "Show commands",
        source: "app",
        dispatch: { kind: "host", execute: () => undefined },
      },
      {
        name: "status",
        description: "Show conversation context",
        source: "app",
        dispatch: { kind: "host", execute: () => undefined },
      },
      {
        name: "model",
        description: "Reserved model",
        argumentHint: "[name]",
        source: "app",
        dispatch: { kind: "host", execute: () => undefined },
      },
      {
        name: "search",
        description: "Search notes",
        source: "extension",
        dispatch: { kind: "tool", tool: "notes_search" },
      },
      {
        name: "compact",
        description: "Compact the thread",
        source: "native-agent",
        dispatch: { kind: "native-agent", nativeName: "compact" },
      },
    ];
    const items = composerSlashItems(commands, "Codex ACP");
    expect(items.map((item) => item.label)).toEqual([
      "/help",
      "/status",
      "/model",
      "/search",
      "/native compact",
    ]);
    expect(items.find((item) => item.label === "/status")?.submitOnSelect).toBe(
      true,
    );
    expect(items.find((item) => item.label === "/model")?.submitOnSelect).toBe(
      false,
    );
    expect(items[4]?.description).toContain("Current Agent · Codex ACP");
  });

  it("includes every reserved catalog command", () => {
    const items = composerSlashItems(RESERVED_SLASH_COMMANDS);
    expect(items.map((item) => item.id).sort()).toEqual(
      [...RESERVED_SLASH_COMMANDS.map((command) => command.name)].sort(),
    );
    expect(items.some((item) => item.id === "cancel")).toBe(true);
    expect(items.some((item) => item.id === "skill")).toBe(true);
    expect(items.some((item) => item.id === "native")).toBe(true);
  });

  it("ranks a command-name match ahead of a description-only hit", () => {
    const items = composerSlashItems(RESERVED_SLASH_COMMANDS);
    expect(items.map((item) => item.id).indexOf("status")).toBeLessThan(
      items.map((item) => item.id).indexOf("context"),
    );
    expect(filterComposerSlashItems(items, "")).toEqual(items);
    for (const query of ["context", "/context", "CONTEXT"]) {
      const ranked = filterComposerSlashItems(items, query);
      expect(ranked[0]?.id).toBe("context");
      expect(ranked.map((item) => item.id)).toContain("status");
      expect(ranked.findIndex((item) => item.id === "context")).toBeLessThan(
        ranked.findIndex((item) => item.id === "status"),
      );
    }
  });
});
