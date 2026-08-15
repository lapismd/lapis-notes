import { describe, expect, it } from "vitest";
import { parseAiPluginData } from "./plugin-data";

describe("AI plugin data", () => {
  it("reads legacy settings-only payloads", () => {
    expect(parseAiPluginData({ defaultRuntime: "fake", acpAgent: "codex" })).toEqual({
      settings: {
        defaultRuntime: "fake",
        acpAgent: "codex",
        defaultModel: "gpt-5.6-sol",
        thinking: "medium",
      },
      sessions: [],
    });
  });

  it("reads settings and stored sessions together", () => {
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
    expect(parsed.sessions[0]?.items[0]).toMatchObject({ text: "hi" });
  });

  it("keeps Cursor and falls unknown ACP agents back to Codex", () => {
    expect(parseAiPluginData({ acpAgent: "cursor" }).settings.acpAgent).toBe(
      "cursor",
    );
    expect(parseAiPluginData({ acpAgent: "claude" }).settings.acpAgent).toBe(
      "codex",
    );
  });
});
