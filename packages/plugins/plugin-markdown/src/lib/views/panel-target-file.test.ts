import type { WorkspaceLeaf } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import { leafInSidebar } from "./panel-target-file";

vi.mock("@lapis-notes/api", () => ({ FileView: class {} }));

function leafWithParents(...parents: object[]): WorkspaceLeaf {
  const leaf = {} as WorkspaceLeaf;
  let child = leaf as unknown as { parent?: object };

  for (const parent of parents) {
    child.parent = parent;
    child = parent as { parent?: object };
  }

  return leaf;
}

describe("leafInSidebar", () => {
  it("recognizes a leaf directly contained by sidebar tabs", () => {
    const leaf = leafWithParents({ inSideBar: () => true });

    expect(leafInSidebar(leaf)).toBe(true);
  });

  it("recognizes a leaf nested in a sidebar group", () => {
    const leaf = leafWithParents({}, { inSideBar: () => true });

    expect(leafInSidebar(leaf)).toBe(true);
  });

  it("keeps body leaves on the body surface", () => {
    const leaf = leafWithParents({}, { inSideBar: () => false });

    expect(leafInSidebar(leaf)).toBe(false);
  });
});
