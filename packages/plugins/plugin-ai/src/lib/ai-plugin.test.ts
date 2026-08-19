import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AiViewType } from "./chat/ai-view-type";
import { AiCatalogViewType } from "./catalog/ai-catalog-view-type";
import { AiHistoryViewType } from "./history/ai-history-view-type";
import { FakeAgentRuntime } from "./runtimes/fake/fake-runtime";
import { mergeAiSettings } from "./settings/ai-settings";

describe("AiPlugin contracts", () => {
  it("uses a stable view type and default settings", () => {
    expect(AiViewType).toBe("ai");
    expect(AiHistoryViewType).toBe("ai-conversation-history");
    expect(AiCatalogViewType).toBe("ai-catalog");
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
      /constructor\(\s*app: App,[\s\S]*?super\(app, pluginManifest\)/u,
    );
    expect(source).not.toContain("globalThis.app");
  });

  it("omits hidden application folders from the New Chat folder list", () => {
    const source = readFileSync("src/lib/ai-plugin.ts", "utf8");
    expect(source).toContain("hasHiddenApplicationSegment(path)");
    expect(source).not.toMatch(
      /parts\[0\] !== "\.obsidian"[\s\S]*!parts\.includes\("\.lapis"\)/u,
    );
  });

  it("renders model badges as muted portaled text", () => {
    const panel = readFileSync("src/lib/chat/ai-chat-panel.svelte", "utf8");
    const css = readFileSync("src/lib/styles.css", "utf8");

    expect(panel).toContain('data-ai-part="model-badge"');
    expect(css).toContain("[data-ai-part=\"model-badge\"]");
    expect(css).toContain("color-mix(in srgb, var(--foreground) 42%, var(--background))");
  });

  it("renders assistant markdown through the public Markdown embed", () => {
    const panel = readFileSync("src/lib/chat/ai-chat-panel.svelte", "utf8");
    const css = readFileSync("src/lib/styles.css", "utf8");
    const index = readFileSync("src/lib/index.ts", "utf8");
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
    };

    expect(manifest.dependencies?.["@lapis-notes/markdown"]).toBe("workspace:*");
    expect(manifest.dependencies?.["@lapismd/mira"]).toBeUndefined();
    expect(manifest.dependencies?.["@lapismd/mira-editor"]).toBeUndefined();
    expect(panel).toContain('from "@lapis-notes/markdown/embed"');
    expect(panel).toContain("MarkdownEmbed");
    expect(panel).toContain('htmlPolicy="safe"');
    expect(css).toContain("[data-ui-component=\"ai-chat-panel\"] .ai-chat-panel__markdown");
    expect(css).toContain("--mira-preview-background: transparent");
    const markdownCss = css.slice(css.indexOf(".ai-chat-panel__markdown"));
    expect(markdownCss).toContain("height: auto");
    expect(markdownCss).toContain("overflow: visible");
    expect(panel).not.toContain("{@html");
    expect(panel).not.toContain("renderChatMarkdown");
    expect(index).not.toContain("renderChatMarkdown");
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

  it("exposes conversation scope as History-style path breadcrumbs", () => {
    const source = readFileSync("src/lib/chat/ai-view.ts", "utf8");

    expect(source).toContain("getBreadcrumbFilePath()");
    expect(source).toContain("getBreadcrumbs()");
    expect(source).toContain('label: "AI"');
    expect(source).toContain("revealConversationHistory");
    expect(source).toContain("scopeDir");
  });

  it("aborts the active turn from the composer stop control", () => {
    const panel = readFileSync("src/lib/chat/ai-chat-panel.svelte", "utf8");
    const controller = readFileSync(
      "src/lib/chat/chat-controller.svelte.ts",
      "utf8",
    );

    expect(panel).toContain("isStopShown={controller.busy}");
    expect(panel).toContain("void controller.cancel()");
    expect(panel).toContain("isSlashCommandNotice");
    expect(panel).toContain("item.submitOnSelect");
    expect(panel).toContain("void controller.syncComposerCommands()");
    expect(panel).toContain("ai-chat-panel__command-notice");
    expect(panel).toContain("Preparing command…");
    expect(controller).toContain("commandWorking = $state(false)");
    expect(controller).toContain("#withCommandProgress");
    expect(controller).toContain("async cancel()");
    expect(controller).toContain("void this.#confirmCancelledNotice(session)");
    expect(controller).toContain("#isAbandoned");
  });

  it("keeps the first user message visible while the session starts", async () => {
    const panel = readFileSync("src/lib/chat/ai-chat-panel.svelte", "utf8");
    const controller = readFileSync(
      "src/lib/chat/chat-controller.svelte.ts",
      "utf8",
    );

    expect(panel).toContain("untrack(() => {");
    expect(panel).toContain("void controller.restore()");
    expect(panel).toContain("controller.items.length === 0 && !controller.busy");
    expect(controller).toContain("this.items = [...this.items, userItem];");
    expect(controller).toMatch(
      /this\.items = \[\.\.\.this\.items, userItem\];[\s\S]*this\.busy = true;[\s\S]*if \(this\.repository\) await this\.#ensureConversation\(\);/u,
    );
    const viewPanel = readFileSync("src/lib/chat/ai-view-panel.svelte", "utf8");
    const view = readFileSync("src/lib/chat/ai-view.ts", "utf8");
    expect(viewPanel).toContain("skillContext={host.skillContext}");
    expect(view).toContain("if (!previous && next) return");
  });

  it("groups adjacent tool calls and presents unwrapped CodeBlock details", () => {
    const panel = readFileSync("src/lib/chat/ai-chat-panel.svelte", "utf8");
    const grouping = readFileSync("src/lib/chat/chat-time.ts", "utf8");

    expect(panel).toContain('from "@lapismd/design-core/shadcn/code-block"');
    expect(panel).toContain("presentToolPayload");
    expect(panel).toContain("language={inputPayload.language}");
    expect(panel).toContain("defaultExpanded={false}");
    expect(panel).toContain("entry.kind === \"tools\"");
    expect(grouping).toContain('kind: "tools"');
  });

  it("keeps the scroll-to-latest control in the transcript body", () => {
    const css = readFileSync("src/lib/styles.css", "utf8");

    expect(css).not.toContain("--ui-ai-chat-scroll-button-bottom");
  });

  it("sizes the conversation kebab menu to unclipped labels", () => {
    const css = readFileSync("src/lib/styles.css", "utf8");
    const menuCss = css.slice(css.indexOf("conversation-menu"));

    expect(css).toContain(
      '[data-ui-component="dropdown-menu"][data-ui-part="dropdown-menu-content"][data-ai-part="conversation-menu"]',
    );
    expect(menuCss).toContain("width: max-content");
    expect(menuCss).toContain("min-width: max-content");
    expect(menuCss).toContain("overflow: visible");
    expect(menuCss).not.toMatch(
      /\[data-ai-part="conversation-menu"\] \[data-ui-part="dropdown-menu-item"\]\s*\{[^}]*font-size/,
    );
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
    expect(source).toContain('id: "open-catalog"');
    expect(source).toContain('name: "Open Catalog"');
    expect(source).toContain('id: "update-bundled-skills"');
    expect(source).toContain('name: "Update bundled skills"');
    expect(source).toContain('id: "update-reserved-commands"');
    expect(source).toContain('name: "Update reserved commands"');
    expect(source).not.toContain("show-ai-conversation-history");
    expect(source).not.toContain('id: "open-ai-chat"');
    expect(source).toContain("registerPaletteProvider");
    expect(source).toContain("AI_CONVERSATION_PALETTE_TAB");
    expect(source).toContain("conversationPaletteItem");
    expect(source).not.toContain("addCommand({\n      id: `ai-conversation");
  });

  it("remounts conversation history when the leaf loads", () => {
    const source = readFileSync("src/lib/history/ai-history-view.ts", "utf8");
    const panel = readFileSync("src/lib/history/ai-history-panel.svelte", "utf8");

    expect(source).toContain("this.unload()");
    expect(source).toContain("this.containerEl.replaceChildren()");
    expect(source).toContain("mount(AiHistoryPanel");
    expect(panel).toContain("repository.listAll()");
    expect(panel).not.toContain("repository.list(");
  });

  it("remounts the catalog when the leaf loads", () => {
    const source = readFileSync("src/lib/catalog/ai-catalog-view.ts", "utf8");
    const panel = readFileSync("src/lib/catalog/ai-catalog-panel.svelte", "utf8");

    expect(source).toContain("this.unload()");
    expect(source).toContain("this.containerEl.replaceChildren()");
    expect(source).toContain("mount(AiCatalogPanel");
    expect(panel).toContain("loadCatalog");
    expect(panel).toContain("Enable ${tool.name} for the next chat");
  });

  it("registers reserved skills and tools result views on load", () => {
    const source = readFileSync("src/lib/ai-plugin.ts", "utf8");
    expect(source).toContain("registerAgentResultView");
    expect(source).toContain('command: "skills"');
    expect(source).toContain('command: "tools"');
    expect(source).toContain("AiInventoryResult");
  });

  it("preserves history while opening exact conversations in reusable main tabs", () => {
    const source = readFileSync("src/lib/ai-plugin.ts", "utf8");

    expect(source).toContain('ensureSideLeaf(AiHistoryViewType, "right")');
    expect(source).toContain('ensureSideLeaf(AiCatalogViewType, "left")');
    expect(source).toContain('getLeaf("tab")');
    expect(source).toContain("findMainConversationLeaf(location)");
    expect(source).toContain("findUnboundMainAiLeaf()");
    expect(source).toContain("iterateRootLeaves");
    expect(source).toContain('operation: "open-ai-chat"');
    expect(source).toContain('focusRootHost: false');
    expect(source).not.toContain('group: "AI"');
    expect(source).not.toContain("groupTitle");
    expect(source).not.toContain(
      "getLeavesOfType(AiHistoryViewType)[0] ??\n      this.app.workspace.getLeavesOfType(AiViewType)[0]",
    );
  });
});
