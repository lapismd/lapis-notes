import { describe, expect, it } from "vitest";
import { parseAiPluginData } from "./plugin-data";

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
});
