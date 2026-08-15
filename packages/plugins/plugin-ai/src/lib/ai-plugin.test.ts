import { describe, expect, it } from "vitest";
import { AiViewType } from "./chat/ai-view-type";
import { FakeAgentRuntime } from "./runtimes/fake/fake-runtime";
import { mergeAiSettings } from "./settings/ai-settings";

describe("AiPlugin contracts", () => {
  it("uses a stable view type and default settings", () => {
    expect(AiViewType).toBe("ai");
    expect(mergeAiSettings(null)).toEqual({
      defaultRuntime: "auto",
      acpAgent: "codex",
      defaultModel: "gpt-5.6-sol",
      thinking: "medium",
    });
    expect(new FakeAgentRuntime().id).toBe("fake");
  });
});
