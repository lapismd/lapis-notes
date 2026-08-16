import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AiViewType } from "./chat/ai-view-type";
import { AiHistoryViewType } from "./history/ai-history-view-type";
import { FakeAgentRuntime } from "./runtimes/fake/fake-runtime";
import { mergeAiSettings } from "./settings/ai-settings";

describe("AiPlugin contracts", () => {
  it("uses a stable view type and default settings", () => {
    expect(AiViewType).toBe("ai");
    expect(AiHistoryViewType).toBe("ai-conversation-history");
    expect(mergeAiSettings(null)).toEqual({
      defaultRuntime: "auto",
      acpAgent: "codex",
      defaultModels: { codex: "gpt-5.6-sol", cursor: "" },
      defaultModel: "gpt-5.6-sol",
      thinking: "medium",
    });
    expect(new FakeAgentRuntime().id).toBe("fake");
  });

  it("threads the constructor owner into the Plugin base without ambient access", () => {
    const source = readFileSync("src/lib/ai-plugin.ts", "utf8");

    expect(source).toMatch(
      /constructor\(app: App,[\s\S]*?super\(app, pluginManifest\)/u,
    );
    expect(source).not.toContain("globalThis.app");
  });

  it("does not remount an open conversation when global defaults change", () => {
    const source = readFileSync("src/lib/chat/ai-view.ts", "utf8");

    expect(source).not.toContain("this.host.subscribeSettings");
    expect(source).not.toContain("remountPanel");
  });

  it("routes history through a dedicated sidebar view instead of a popup", () => {
    const panel = readFileSync("src/lib/chat/ai-chat-panel.svelte", "utf8");
    const plugin = readFileSync("src/lib/ai-plugin.ts", "utf8");

    expect(panel).toContain("onRevealHistory");
    expect(panel).not.toContain("All conversations (index pending)");
    expect(plugin).toContain("AiHistoryViewType");
    expect(plugin).toContain("revealConversationHistory");
  });

  it("registers concise command-backed chat and history openers", () => {
    const source = readFileSync("src/lib/ai-plugin.ts", "utf8");

    expect(source).toContain('id: "open-chat"');
    expect(source).toContain('name: "Open Chat"');
    expect(source).toContain('id: "open-history"');
    expect(source).toContain('name: "Open History"');
    expect(source).not.toContain("show-ai-conversation-history");
    expect(source).not.toContain('id: "open-ai-chat"');
  });

  it("preserves history while opening exact conversations in reusable main tabs", () => {
    const source = readFileSync("src/lib/ai-plugin.ts", "utf8");

    expect(source).toContain('ensureSideLeaf(AiHistoryViewType, "right")');
    expect(source).toContain('getLeaf("tab")');
    expect(source).toContain("findMainConversationLeaf(location)");
    expect(source).toContain("findUnboundMainAiLeaf()");
    expect(source).toContain("iterateRootLeaves");
    expect(source).toContain('operation: "open-ai-chat"');
    expect(source).not.toContain(
      "getLeavesOfType(AiHistoryViewType)[0] ??\n      this.app.workspace.getLeavesOfType(AiViewType)[0]",
    );
  });
});
