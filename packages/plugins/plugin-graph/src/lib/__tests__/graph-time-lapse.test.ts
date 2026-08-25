import { describe, expect, test } from "vitest";
import {
  createGraphTimeLapsePlan,
  graphTimeLapseVisibleCount,
} from "../graph-renderer";
import type { GraphData, GraphNode } from "../graph-types";

function node(
  id: string,
  type: GraphNode["type"],
  chronology: { ctime?: number; mtime?: number } = {},
): GraphNode {
  return {
    id,
    label: id,
    path: type === "tag" || type === "unresolved" ? id : `${id}.md`,
    type,
    exists: type !== "unresolved",
    refCount: 0,
    outgoingCount: 0,
    tags: [],
    groupIds: [],
    ...chronology,
  };
}

describe("Graph chronological time-lapse", () => {
  test("orders creation time, mtime fallback, relationships, then undated nodes", () => {
    const graph: GraphData = {
      nodes: [
        node("undated", "note"),
        node("attachment", "attachment", { ctime: 30 }),
        node("second", "note", { mtime: 20 }),
        node("first", "note", { ctime: 10, mtime: 50 }),
        node("tag", "tag"),
        node("unresolved", "unresolved"),
      ],
      links: [
        {
          id: "tag-link",
          source: "second",
          target: "tag",
          count: 1,
          type: "tag",
          directed: false,
        },
        {
          id: "missing-link",
          source: "first",
          target: "unresolved",
          count: 1,
          type: "internal-link",
          directed: true,
        },
      ],
    };

    expect(createGraphTimeLapsePlan(graph)).toEqual([
      "first",
      "unresolved",
      "second",
      "tag",
      "attachment",
      "undated",
    ]);
  });

  test("reveals a bounded chronological prefix over ten seconds", () => {
    expect(graphTimeLapseVisibleCount(0, 10_000, 100)).toBe(0);
    expect(graphTimeLapseVisibleCount(2_500, 10_000, 100)).toBe(25);
    expect(graphTimeLapseVisibleCount(10_000, 10_000, 100)).toBe(100);
    expect(graphTimeLapseVisibleCount(20_000, 10_000, 100)).toBe(100);
  });
});
