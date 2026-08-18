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
      appToolsEnabled: true,
      disabledAppToolNames: [],
      enabledAppToolNames: [],
      enabledCommunityToolPluginIds: [],
    });
    expect(new FakeAgentRuntime().id).toBe("fake");
  });

  it("normalizes per-tool app-tool enablement and migrates owner-plugin opt-ins", () => {
    expect(
      mergeAiSettings({
        appToolsEnabled: false,
        disabledAppToolNames: [
          " notes_search ",
          "notes_search",
          "notes_read",
          "notes_patch",
          "",
        ],
        enabledAppToolNames: [" story_word_count ", "story_word_count", ""],
        enabledCommunityToolPluginIds: ["zeta", " alpha ", "zeta", ""],
      }),
    ).toMatchObject({
      appToolsEnabled: false,
      disabledAppToolNames: ["edit", "notes_search", "read"],
      enabledAppToolNames: ["story_word_count"],
      enabledCommunityToolPluginIds: ["alpha", "zeta"],
    });
    expect(
      mergeAiSettings(
        {
          enabledCommunityToolPluginIds: ["story-community", "missing"],
        },
        [
          {
            name: "story_word_count",
            owner: {
              pluginId: "story-community",
              source: "community",
            },
          },
        ],
      ),
    ).toMatchObject({
      enabledAppToolNames: ["story_word_count"],
      enabledCommunityToolPluginIds: ["missing"],
    });
  });

  it("threads the constructor owner into the Plugin base without ambient access", () => {
    const source = readFileSync("src/lib/ai-plugin.ts", "utf8");

    expect(source).toMatch(
      /constructor\(app: App,[\s\S]*?super\(app, pluginManifest\)/u,
    );
    expect(source).not.toContain("globalThis.app");
  });

  it("renders model badges as muted portaled text", () => {
    const panel = readFileSync("src/lib/chat/ai-chat-panel.svelte", "utf8");
    const css = readFileSync("src/lib/styles.css", "utf8");

    expect(panel).toContain('data-ai-part="model-badge"');
    expect(css).toContain("[data-ai-part=\"model-badge\"]");
    expect(css).toContain("color-mix(in srgb, var(--foreground) 42%, var(--background))");
  });

  it("persists composer agent, model, and thinking through updateSettings", () => {
    const panel = readFileSync("src/lib/chat/ai-chat-panel.svelte", "utf8");

    expect(panel).toContain("persistComposerDefaults");
    expect(panel).toContain("void onSettingsChange?.(");
    expect(panel).toContain("acpAgent: agent");
    expect(panel).toContain("defaultRuntime: runtimePreference");
    expect(panel).toContain("defaultModel: model");
    expect(panel).toContain("thinking,");
    expect(panel).not.toContain("onSettingsChange: _onSettingsChange");
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
    expect(source).toContain(
      'this.addRibbonIcon("sparkles", "Open Chat"',
    );
    expect(source).toContain("refreshHostRuntimes");
    expect(source).toContain("live-runtime-unavailable");
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
