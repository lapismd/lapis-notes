import { describe, expect, it } from "vitest";
import { graphLoadFocusNodeId } from "../graph-load-alignment";

describe("Graph load alignment", () => {
  it("keeps Global Graph on its whole-bounds fit", () => {
    expect(
      graphLoadFocusNodeId(false, { centerNodeId: "note:Notes/Active.md" }),
    ).toBeNull();
  });

  it("keeps Local Graph centered on its active note", () => {
    expect(
      graphLoadFocusNodeId(true, { centerNodeId: "note:Notes/Active.md" }),
    ).toBe("note:Notes/Active.md");
  });
});
