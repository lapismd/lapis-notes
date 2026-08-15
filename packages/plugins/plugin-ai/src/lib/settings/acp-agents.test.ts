import { describe, expect, it } from "vitest";
import {
  catalogModelsForAgent,
  normalizeAcpAgent,
} from "./acp-agents";

describe("ACP agents", () => {
  it("keeps known agents and falls unknown values back to codex", () => {
    expect(normalizeAcpAgent("codex")).toBe("codex");
    expect(normalizeAcpAgent("cursor")).toBe("cursor");
    expect(normalizeAcpAgent("claude")).toBe("codex");
    expect(normalizeAcpAgent("")).toBe("codex");
  });

  it("hides the Codex catalog when Cursor is selected", () => {
    const models = [
      { provider: "codex", model: "gpt-5.6-sol" },
      { provider: "cursor", model: "composer-2.5" },
    ];
    expect(catalogModelsForAgent("codex", models)).toEqual([
      { provider: "codex", model: "gpt-5.6-sol" },
    ]);
    expect(catalogModelsForAgent("cursor", models)).toEqual([]);
  });
});
