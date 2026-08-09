import { describe, expect, it } from "vitest";
import type { HeadingCache } from "@lapis-notes/api";
import {
  buildOutlineTree,
  cleanHeadingLabel,
  expandableOutlineIds,
  filterOutlineTree,
} from "./outline-tree";

function heading(
  label: string,
  level: number,
  line: number,
): HeadingCache {
  return {
    heading: label,
    level,
    position: {
      start: { line, col: 0, offset: line * 10 },
      end: { line, col: label.length, offset: line * 10 + label.length },
    },
  };
}

describe("outline tree", () => {
  it("cleans common Markdown formatting", () => {
    expect(cleanHeadingLabel("**Plan** for [[Project|Alpha]] and `code`")).toBe(
      "Plan for Alpha and code",
    );
  });

  it("nests headings by level in source order", () => {
    const tree = buildOutlineTree([
      heading("Root", 1, 0),
      heading("Child", 2, 1),
      heading("Grandchild", 3, 2),
      heading("Next", 1, 3),
    ]);
    expect(tree.map((node) => node.label)).toEqual(["Root", "Next"]);
    expect(tree[0]?.children[0]?.children[0]?.label).toBe("Grandchild");
    expect(expandableOutlineIds(tree)).toEqual(["1:0", "2:1"]);
  });

  it("retains ancestors when a descendant matches search", () => {
    const tree = buildOutlineTree([
      heading("Root", 1, 0),
      heading("Matching child", 2, 1),
      heading("Other", 1, 2),
    ]);
    const filtered = filterOutlineTree(tree, "matching");
    expect(filtered.map((node) => node.label)).toEqual(["Root"]);
    expect(filtered[0]?.children[0]?.label).toBe("Matching child");
  });
});
