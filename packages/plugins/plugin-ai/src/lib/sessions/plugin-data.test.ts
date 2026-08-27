import { describe, expect, it } from "vitest";
import { equalAiPluginData, parseAiPluginData } from "./plugin-data";

describe("AI plugin data", () => {
  it("reads legacy settings-only payloads", () => {
    expect(
      parseAiPluginData({ defaultRuntime: "fake", acpAgent: "codex" }),
    ).toEqual({
      settings: {
        defaultRuntime: "fake",
        acpAgent: "codex",
        defaultModels: { codex: "gpt-5.6-sol", cursor: "" },
        defaultModel: "gpt-5.6-sol",
        thinking: "medium",
        memoryAutomaticRecall: false,
        memoryConsolidationEnabled: false,
        memoryConsolidationRuntime: "acp",
        memoryConsolidationAgent: "codex",
        memoryConsolidationModel: "gpt-5.6-sol",
        handoffSummariesEnabled: false,
        handoffSummaryRuntime: "acp",
        handoffSummaryAgent: "codex",
        handoffSummaryModel: "gpt-5.6-sol",
        appToolsEnabled: true,
        disabledAppToolNames: [],
        enabledAppToolNames: [],
        enabledCommunityToolPluginIds: [],
      },
      source: { defaultRuntime: "fake", acpAgent: "codex" },
    });
  });

  it("leaves legacy sessions inert while retaining the unknown source", () => {
    const parsed = parseAiPluginData({
      settings: { defaultRuntime: "acp" },
      sessions: [
        {
          id: "ai:default",
          runtime: "fake",
          runtimeSessionId: "fake-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          items: [{ id: "m1", type: "message", role: "user", text: "hi" }],
        },
      ],
    });
    expect(parsed.settings.defaultRuntime).toBe("acp");
    expect(parsed.source.sessions).toEqual([
      expect.objectContaining({ id: "ai:default" }),
    ]);
    expect(parsed).not.toHaveProperty("sessions");
  });

  it("keeps Cursor and falls unknown ACP agents back to Codex", () => {
    expect(parseAiPluginData({ acpAgent: "cursor" }).settings.acpAgent).toBe(
      "cursor",
    );
    expect(parseAiPluginData({ acpAgent: "claude" }).settings.acpAgent).toBe(
      "codex",
    );
  });

  it("migrates legacy models and preserves independent provider choices", () => {
    expect(
      parseAiPluginData({ defaultModel: "gpt-legacy" }).settings.defaultModels,
    ).toEqual({ codex: "gpt-legacy", cursor: "" });
    const cursor = parseAiPluginData({
      acpAgent: "cursor",
      defaultModel: "ignored-active-alias",
      defaultModels: { codex: "gpt-codex", cursor: "composer-2" },
    }).settings;
    expect(cursor.defaultModel).toBe("composer-2");
    expect(cursor.defaultModels.codex).toBe("gpt-codex");
  });

  it("preserves inert legacy and unknown values when settings are serialized", async () => {
    const { serializeAiPluginData } = await import("./plugin-data");
    const parsed = parseAiPluginData({
      settings: { defaultRuntime: "fake" },
      sessions: [{ id: "legacy", items: [{ text: "do not render" }] }],
      futureValue: { enabled: true },
    });
    parsed.settings.defaultRuntime = "auto";
    expect(serializeAiPluginData(parsed)).toMatchObject({
      settings: { defaultRuntime: "auto" },
      sessions: [{ id: "legacy" }],
      futureValue: { enabled: true },
    });
  });

  it("reads legacy community plugin opt-ins and omits the empty key on write", async () => {
    const { serializeAiPluginData } = await import("./plugin-data");
    const parsed = parseAiPluginData({
      settings: {
        enabledCommunityToolPluginIds: ["story-community"],
        enabledAppToolNames: ["kept_tool"],
        disabledAppToolNames: ["notes_search"],
      },
    });
    expect(parsed.settings.enabledCommunityToolPluginIds).toEqual([
      "story-community",
    ]);
    expect(parsed.settings.enabledAppToolNames).toEqual(["kept_tool"]);
    expect(parsed.settings.disabledAppToolNames).toEqual(["notes_search"]);
    parsed.settings.enabledCommunityToolPluginIds = [];
    const serialized = serializeAiPluginData(parsed).settings as Record<
      string,
      unknown
    >;
    expect(serialized.enabledAppToolNames).toEqual(["kept_tool"]);
    expect(serialized.disabledAppToolNames).toEqual(["notes_search"]);
    expect(serialized).not.toHaveProperty("enabledCommunityToolPluginIds");
  });

  it("detects normalized no-op settings updates before persistence", () => {
    const current = parseAiPluginData({
      settings: { defaultRuntime: "auto", thinking: "medium" },
      futureValue: { enabled: true },
    });
    const unchanged = {
      ...current,
      settings: { ...current.settings, thinking: "medium" as const },
    };
    const changed = {
      ...current,
      settings: { ...current.settings, thinking: "high" as const },
    };

    expect(equalAiPluginData(current, unchanged)).toBe(true);
    expect(equalAiPluginData(current, changed)).toBe(false);
  });
});
