import { describe, expect, it } from "vitest";
import { catalogModelsForAgent, normalizeAcpAgent } from "./acp-agents";

describe("ACP agents", () => {
  it("keeps known agents and falls unknown values back to codex", () => {
    expect(normalizeAcpAgent("codex")).toBe("codex");
    expect(normalizeAcpAgent("cursor")).toBe("cursor");
    expect(normalizeAcpAgent("claude")).toBe("codex");
    expect(normalizeAcpAgent("")).toBe("codex");
  });

  it("filters the shared catalog to the selected provider", () => {
    const models = [
      { provider: "codex", model: "gpt-5.6-sol" },
      { provider: "cursor", model: "composer-2.5" },
    ];
    expect(catalogModelsForAgent("codex", models)).toEqual([
      { provider: "codex", model: "gpt-5.6-sol" },
    ]);
    expect(catalogModelsForAgent("cursor", models)).toEqual([
      { provider: "cursor", model: "composer-2.5" },
    ]);
  });
});
