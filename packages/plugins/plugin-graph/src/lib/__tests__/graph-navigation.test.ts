import { describe, expect, it, vi } from "vitest";
import { resolveGraphNavigationLeaf } from "../graph-navigation";

const GraphViewType = "graph";
const LocalGraphViewType = "graph-local";

type MockLeaf = {
  id: string;
  state: { type: string; state?: Record<string, unknown> };
  view?: { getViewType(): string; file?: { path: string } | null };
};

type MockWorkspace = {
  rootSplit: {
    iterateAllLeaves<T>(callback: (leaf: MockLeaf) => T | void): T | void;
    iterateAllTabs<T>(
      callback: (tabs: { selectedLeaf: MockLeaf | null }) => T | void,
    ): T | void;
  };
  activeRootLeaf: MockLeaf | null;
  getLeaf: ReturnType<typeof vi.fn>;
};

function createWorkspaceHarness(options: {
  graphLeaf: MockLeaf;
  rootLeaves: MockLeaf[];
  sidebarLeaf?: MockLeaf;
  activeRootLeaf?: MockLeaf | null;
  getLeafImpl?: (newLeaf?: boolean) => MockLeaf;
}) {
  const graphLeaf = options.graphLeaf as never;
  const rootLeaves = options.rootLeaves;
  const sidebarLeaf = options.sidebarLeaf;

  const workspace = {
    rootSplit: {
      iterateAllLeaves<T>(callback: (leaf: MockLeaf) => T | void): T | void {
        for (const leaf of rootLeaves) {
          const result = callback(leaf);
          if (result !== undefined) {
            return result;
          }
        }
      },
      iterateAllTabs<T>(
        callback: (tabs: { selectedLeaf: MockLeaf | null }) => T | void,
      ): T | void {
        for (const leaf of rootLeaves) {
          const result = callback({ selectedLeaf: leaf });
          if (result !== undefined) {
            return result;
          }
        }
      },
    },
    activeRootLeaf: (options.activeRootLeaf ?? rootLeaves[0] ?? null) as never,
    getLeaf: vi.fn((newLeaf?: boolean) => {
      if (options.getLeafImpl) {
        return options.getLeafImpl(newLeaf) as never;
      }
      if (newLeaf) {
        return { id: "new-tab", state: { type: "empty", state: {} } } as never;
      }
      return (sidebarLeaf ??
        rootLeaves.find((leaf) => leaf.state.type === "markdown") ??
        rootLeaves[0]) as never;
    }),
  };

  return { workspace: workspace as MockWorkspace, graphLeaf };
}

describe("resolveGraphNavigationLeaf", () => {
  it("routes local graph clicks through workspace.getLeaf()", () => {
    const graphLeaf: MockLeaf = {
      id: "local-graph",
      state: { type: LocalGraphViewType, state: {} },
      view: { getViewType: () => LocalGraphViewType },
    };
    const mainLeaf: MockLeaf = {
      id: "main",
      state: { type: "markdown", state: { file: "Notes/A.md" } },
      view: {
        getViewType: () => "markdown",
        file: { path: "Notes/A.md" },
      },
    };
    const { workspace } = createWorkspaceHarness({
      graphLeaf,
      rootLeaves: [mainLeaf],
      sidebarLeaf: graphLeaf,
      activeRootLeaf: mainLeaf,
    });

    const target = resolveGraphNavigationLeaf({
      workspace: workspace as never,
      graphLeaf: graphLeaf as never,
      isLocal: true,
      openInNewPane: false,
    });

    expect(workspace.getLeaf).toHaveBeenCalledWith(undefined);
    expect(target).toBe(graphLeaf);
  });

  it("prefers a non-graph root leaf when global graph is active in another tab", () => {
    const documentLeaf: MockLeaf = {
      id: "document",
      state: { type: "markdown", state: { file: "Notes/A.md" } },
      view: {
        getViewType: () => "markdown",
        file: { path: "Notes/A.md" },
      },
    };
    const graphLeaf: MockLeaf = {
      id: "graph",
      state: { type: GraphViewType, state: {} },
      view: { getViewType: () => GraphViewType },
    };
    const { workspace } = createWorkspaceHarness({
      graphLeaf,
      rootLeaves: [documentLeaf, graphLeaf],
      activeRootLeaf: graphLeaf,
    });

    const target = resolveGraphNavigationLeaf({
      workspace: workspace as never,
      graphLeaf: graphLeaf as never,
      isLocal: false,
      openInNewPane: false,
    });

    expect(target).toBe(documentLeaf);
  });

  it("falls back to the graph leaf when it is the only root tab", () => {
    const graphLeaf: MockLeaf = {
      id: "graph-only",
      state: { type: GraphViewType, state: {} },
      view: { getViewType: () => GraphViewType },
    };
    const { workspace } = createWorkspaceHarness({
      graphLeaf,
      rootLeaves: [graphLeaf],
      activeRootLeaf: graphLeaf,
    });

    const target = resolveGraphNavigationLeaf({
      workspace: workspace as never,
      graphLeaf: graphLeaf as never,
      isLocal: false,
      openInNewPane: false,
    });

    expect(target).toBe(graphLeaf);
  });
});
