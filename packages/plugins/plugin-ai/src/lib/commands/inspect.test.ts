import { describe, expect, it } from "vitest";
import { formatContextNotice, formatScopeNotice } from "./inspect";
import { composerSlashItems } from "./groups";
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
      }),
    ).toContain("Available app tools: notes_search");
  });
});

describe("composer slash items", () => {
  it("keeps deferred reserved names out of the App menu", () => {
    const commands: EffectiveSlashCommand[] = [
      {
        name: "help",
        description: "Show commands",
        source: "app",
        dispatch: { kind: "host", execute: () => undefined },
      },
      {
        name: "model",
        description: "Reserved model",
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
      "/search",
      "/native compact",
    ]);
    expect(items[2]?.description).toContain("Current Agent · Codex ACP");
  });
});
