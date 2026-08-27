import { describe, expect, test, vi } from "vitest";
import { filterGraphBySettings } from "../graph-data";
import { resolveGraphQueryMatches } from "../graph-query-resolution";
import { DEFAULT_GRAPH_SETTINGS, patchGraphSettings } from "../graph-settings";
import type { GraphData } from "../graph-types";

const graph: GraphData = {
  nodes: [
    {
      id: "note:Code/A.md",
      label: "A",
      path: "Code/A.md",
      type: "note",
      exists: true,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
    },
    {
      id: "note:Code/B.md",
      label: "B",
      path: "Code/B.md",
      type: "note",
      exists: true,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
    },
  ],
  links: [],
  centerNodeId: null,
};

describe("Graph Groups", () => {
  test("filters canonical nodes with path-only structured Search matches", async () => {
    const settings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      filters: { searchQuery: "path:Code" },
    });
    const matchPaths = vi.fn(async () => new Set(["Code/A.md"]));

    const matches = await resolveGraphQueryMatches(settings, matchPaths);
    const filtered = filterGraphBySettings(graph, settings, matches);

    expect(matchPaths).toHaveBeenCalledWith("path:Code");
    expect(filtered.nodes.map((node) => node.path)).toEqual(["Code/A.md"]);
  });

  test("evaluates structured queries through path-only Search", async () => {
    const settings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      groups: [
        {
          id: "code",
          query: "path:Code",
          color: "#16a34a",
        },
      ],
    });
    const matchPaths = vi.fn(async () => new Set(["Code/A.md"]));

    const matches = await resolveGraphQueryMatches(settings, matchPaths);
    const filtered = filterGraphBySettings(graph, settings, matches);

    expect(matchPaths).toHaveBeenCalledWith("path:Code");
    expect(filtered.nodes[0]).toMatchObject({
      groupIds: ["code"],
      primaryColor: "#16a34a",
    });
    expect(filtered.nodes[1]).toMatchObject({ groupIds: [] });
  });

  test("uses the first matching Group as colour owner", async () => {
    const settings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      groups: [
        {
          id: "first",
          query: "path:Code",
          color: "#111111",
        },
        {
          id: "second",
          query: "file:A",
          color: "#222222",
        },
      ],
    });
    const matches = await resolveGraphQueryMatches(
      settings,
      async () => new Set(["Code/A.md"]),
    );

    expect(
      filterGraphBySettings(graph, settings, matches).nodes[0],
    ).toMatchObject({
      groupIds: ["first", "second"],
      primaryColor: "#111111",
    });
  });

  test("reports invalid Group queries without failing graph derivation", async () => {
    const settings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      groups: [
        {
          id: "invalid",
          query: "(",
          color: "#111111",
        },
      ],
    });
    const matchPaths = vi.fn(async () => new Set<string>());

    const matches = await resolveGraphQueryMatches(settings, matchPaths);
    const filtered = filterGraphBySettings(graph, settings, matches);

    expect(matches.groupDiagnostics.invalid).toBeTruthy();
    expect(matchPaths).not.toHaveBeenCalled();
    expect(filtered.nodes).toHaveLength(2);
    expect(filtered.nodes.every((node) => node.groupIds.length === 0)).toBe(
      true,
    );
  });
});
