import { describe, expect, it, vi } from "vitest";
import {
  graphTagSearchQuery,
  openGraphTagSearch,
} from "./graph-node-activation";
import type { GraphNode } from "./graph-types";

function tagNode(label: string): GraphNode {
  return {
    id: `tag:${label}`,
    label,
    path: label,
    type: "tag",
    exists: true,
    refCount: 1,
    outgoingCount: 0,
    tags: [],
    groupIds: [],
  };
}

describe("Graph tag activation", () => {
  it("normalizes a tag to one leading hash", () => {
    expect(graphTagSearchQuery(tagNode("###project/alpha"))).toBe(
      "tag:#project/alpha",
    );
  });

  it("opens Search through the registered command", async () => {
    const executeCommand = vi.fn().mockResolvedValue(undefined);
    await expect(
      openGraphTagSearch(
        { commands: { executeCommand } } as never,
        tagNode("#project/alpha"),
      ),
    ).resolves.toBe(true);
    expect(executeCommand).toHaveBeenCalledWith(
      "search:open-search",
      "tag:#project/alpha",
    );
  });

  it("is nonfatal when Search is disabled", async () => {
    const executeCommand = vi
      .fn()
      .mockRejectedValue(new Error("Unknown command"));
    await expect(
      openGraphTagSearch(
        { commands: { executeCommand } } as never,
        tagNode("project/alpha"),
      ),
    ).resolves.toBe(true);
  });
});
