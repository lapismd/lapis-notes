import { readFileSync } from "node:fs";
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
});
