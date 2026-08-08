import { describe, expect, it } from "vitest";
import {
  normalizeWorkspaceJson,
  type WorkspaceJson,
} from "../workspace-layout-normalizer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid layout JSON that round-trips cleanly through the normalizer. */
function minimalValidLayout(): WorkspaceJson {
  return {
    main: {
      id: "main",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        {
          id: "main-tabs",
          type: "tabs",
          stacked: false,
          currentTab: 0,
          children: [
            {
              id: "leaf-1",
              type: "leaf",
              state: {
                type: "markdown",
                state: {},
                icon: "file",
                title: "Note",
              },
            },
          ],
        },
      ],
    },
    left: {
      id: "left",
      type: "split",
      direction: "vertical",
      sizes: [],
      children: [],
      width: "16rem",
    },
    right: {
      id: "right",
      type: "split",
      direction: "vertical",
      sizes: [],
      children: [],
      width: "16rem",
    },
    bottom: {
      id: "bottom-panel",
      type: "tabs",
      stacked: false,
      currentTab: 0,
      children: [],
      height: "0px",
    },
  };
}

// ---------------------------------------------------------------------------
// Core normalizations
// ---------------------------------------------------------------------------

describe("normalizeWorkspaceJson", () => {
  it("returns a valid layout from an empty object", () => {
    const result = normalizeWorkspaceJson({});
    expect(result.main).toBeDefined();
    expect(result.main.type).toBe("split");
    expect(result.left.type).toBe("split");
    expect(result.right.type).toBe("split");
    expect(result.bottom).toEqual({
      id: "bottom-panel",
      type: "tabs",
      stacked: false,
      currentTab: 0,
      children: [],
      height: "0px",
    });
    expect(result.floating ?? []).toEqual([]);
  });

  it("returns a valid layout from null / undefined", () => {
    for (const input of [null, undefined, 42, "bad"]) {
      const result = normalizeWorkspaceJson(input);
      expect(result.main.type).toBe("split");
      expect(result.left.type).toBe("split");
      expect(result.right.type).toBe("split");
      expect(result.bottom.height).toBe("0px");
    }
  });

  it("passes a valid layout through unchanged", () => {
    const layout = minimalValidLayout();
    const result = normalizeWorkspaceJson(layout);
    expect(result.main.id).toBe("main");
    expect(result.main.children[0].id).toBe("main-tabs");
    expect(
      (result.main.children[0] as { children: { id: string }[] }).children[0]
        .id,
    ).toBe("leaf-1");
    expect(result.left.width).toBe("16rem");
    expect(result.bottom).toEqual(layout.bottom);
  });

  it("normalizes bottom tabs, groups, active leaves, and height", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      bottom: {
        id: "bottom",
        type: "tabs",
        stacked: true,
        currentTab: 1,
        height: "18rem",
        children: [
          {
            id: "bottom-leaf",
            type: "leaf",
            state: {
              type: "terminal",
              state: { cwd: "/vault" },
              icon: "terminal",
              title: "Terminal",
            },
          },
          {
            id: "bottom-group",
            type: "sidebar-group",
            name: "Output",
            children: [
              {
                id: "output-leaf",
                type: "leaf",
                state: {
                  type: "output",
                  state: {},
                  icon: "list",
                  title: "Output",
                },
              },
            ],
          },
        ],
      },
      active: "output-leaf",
    });

    expect(result.bottom).toMatchObject({
      id: "bottom",
      stacked: true,
      currentTab: 1,
      height: "18rem",
    });
    expect(result.bottom.children.map((child) => child.id)).toEqual([
      "bottom-leaf",
      "bottom-group",
    ]);
    expect(result.active).toBe("output-leaf");
  });

  it("repairs malformed bottom state without dropping a stable id", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      bottom: {
        id: "persisted-bottom",
        type: "split",
        height: 320,
        children: "invalid",
      },
    });

    expect(result.bottom).toEqual({
      id: "persisted-bottom",
      type: "tabs",
      stacked: false,
      currentTab: 0,
      children: [],
      height: "0px",
    });
  });

  it("repairs sizes arrays that are shorter than children count", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      main: {
        id: "s",
        type: "split",
        direction: "vertical",
        sizes: [], // wrong length — two children need two sizes
        children: [
          {
            id: "t1",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "l1",
                type: "leaf",
                state: { type: "empty", state: {}, icon: "", title: "" },
              },
            ],
          },
          {
            id: "t2",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "l2",
                type: "leaf",
                state: { type: "empty", state: {}, icon: "", title: "" },
              },
            ],
          },
        ],
      },
    });
    expect(result.main.sizes).toHaveLength(2);
    expect(result.main.sizes.every((s) => s > 0 && isFinite(s))).toBe(true);
  });

  it("repairs sizes arrays that contain non-finite values", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      main: {
        id: "s",
        type: "split",
        direction: "vertical",
        sizes: [Infinity, NaN, -5, 0],
        children: [
          {
            id: "t1",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "l1",
                type: "leaf",
                state: { type: "empty", state: {}, icon: "", title: "" },
              },
            ],
          },
          {
            id: "t2",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "l2",
                type: "leaf",
                state: { type: "empty", state: {}, icon: "", title: "" },
              },
            ],
          },
        ],
      },
    });
    expect(result.main.sizes).toHaveLength(2);
    expect(result.main.sizes.every((s) => s > 0 && isFinite(s))).toBe(true);
  });

  it("clamps currentTab that is out of bounds to 0", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      main: {
        id: "s",
        type: "split",
        direction: "vertical",
        sizes: [100],
        children: [
          {
            id: "t1",
            type: "tabs",
            stacked: false,
            currentTab: 99, // out of range
            children: [
              {
                id: "l1",
                type: "leaf",
                state: { type: "empty", state: {}, icon: "", title: "" },
              },
            ],
          },
        ],
      },
    });
    const tabs = result.main.children[0] as { currentTab: number };
    expect(tabs.currentTab).toBe(0);
  });

  it("clamps non-integer currentTab to 0", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      main: {
        id: "s",
        type: "split",
        direction: "vertical",
        sizes: [100],
        children: [
          {
            id: "t1",
            type: "tabs",
            stacked: false,
            currentTab: 0.7,
            children: [
              {
                id: "l1",
                type: "leaf",
                state: { type: "empty", state: {}, icon: "", title: "" },
              },
            ],
          },
        ],
      },
    });
    const tabs = result.main.children[0] as { currentTab: number };
    expect(tabs.currentTab).toBe(0);
  });

  it("drops floating windows that have no leaf content", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      floating: [
        {
          id: "empty-win",
          type: "floating",
          direction: "vertical",
          sizes: [],
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          children: [], // no leaves
        },
        {
          id: "win-with-content",
          type: "floating",
          direction: "vertical",
          sizes: [100],
          x: 50,
          y: 50,
          width: 400,
          height: 300,
          children: [
            {
              id: "ft",
              type: "tabs",
              stacked: false,
              currentTab: 0,
              children: [
                {
                  id: "fl",
                  type: "leaf",
                  state: {
                    type: "graph",
                    state: {},
                    icon: "box",
                    title: "Graph",
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    // Empty window dropped; window with content kept.
    expect(result.floating).toHaveLength(1);
    expect(result.floating![0].id).toBe("win-with-content");
  });

  it("drops popout-mode floating windows (they cannot be restored)", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      floating: [
        {
          id: "popout-win",
          type: "floating",
          mode: "popout",
          direction: "vertical",
          sizes: [100],
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          children: [
            {
              id: "pt",
              type: "tabs",
              stacked: false,
              currentTab: 0,
              children: [
                {
                  id: "pl",
                  type: "leaf",
                  state: {
                    type: "markdown",
                    state: {},
                    icon: "file",
                    title: "",
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.floating ?? []).toHaveLength(0);
  });

  it("preserves collapsed and minimized displayState on floating windows", () => {
    const withState = (displayState: string) =>
      normalizeWorkspaceJson({
        ...minimalValidLayout(),
        floating: [
          {
            id: "w",
            type: "floating",
            direction: "vertical",
            displayState,
            sizes: [100],
            x: 0,
            y: 0,
            width: 400,
            height: 300,
            children: [
              {
                id: "t",
                type: "tabs",
                stacked: false,
                currentTab: 0,
                children: [
                  {
                    id: "l",
                    type: "leaf",
                    state: { type: "empty", state: {}, icon: "", title: "" },
                  },
                ],
              },
            ],
          },
        ],
      });

    expect(withState("collapsed").floating![0].displayState).toBe("collapsed");
    expect(withState("minimized").floating![0].displayState).toBe("minimized");
    // "maximized" and "normal" are not persisted — no displayState on output.
    expect(withState("maximized").floating![0]).not.toHaveProperty(
      "displayState",
    );
    expect(withState("normal").floating![0]).not.toHaveProperty("displayState");
    expect(withState("bogus").floating![0]).not.toHaveProperty("displayState");
  });

  it("strips stale hiddenLeafIds that refer to absent children", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      right: {
        id: "right",
        type: "split",
        direction: "vertical",
        sizes: [100],
        width: "16rem",
        children: [
          {
            id: "rt",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "grp",
                type: "sidebar-group",
                name: "Tools",
                hiddenLeafIds: ["present-leaf", "stale-leaf-id"],
                children: [
                  {
                    id: "present-leaf",
                    type: "leaf",
                    state: { type: "graph", state: {}, icon: "box", title: "" },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const tabs = result.right.children[0] as { children: any[] };
    const group = tabs.children[0];
    expect(group.hiddenLeafIds).toEqual(["present-leaf"]);
    expect(group.hiddenLeafIds).not.toContain("stale-leaf-id");
  });

  it("strips stale collapsed and panelSizes entries from sidebar groups", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      right: {
        id: "right",
        type: "split",
        direction: "vertical",
        sizes: [100],
        width: "16rem",
        children: [
          {
            id: "rt",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "grp",
                type: "sidebar-group",
                name: "Tools",
                collapsed: { "real-leaf": true, "gone-leaf": true },
                panelSizes: { "real-leaf": 60, "gone-leaf": 40 },
                children: [
                  {
                    id: "real-leaf",
                    type: "leaf",
                    state: { type: "graph", state: {}, icon: "box", title: "" },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const tabs = result.right.children[0] as { children: any[] };
    const group = tabs.children[0];
    expect(group.collapsed).toEqual({ "real-leaf": true });
    expect(group.panelSizes).toEqual({ "real-leaf": 60 });
    expect("gone-leaf" in group.collapsed).toBe(false);
    expect("gone-leaf" in group.panelSizes).toBe(false);
  });

  it("drops unknown child node types silently", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      main: {
        id: "s",
        type: "split",
        direction: "vertical",
        sizes: [100],
        children: [
          { type: "unknown-future-type", id: "unk" }, // unknown — should be dropped
          {
            id: "t1",
            type: "tabs",
            stacked: false,
            currentTab: 0,
            children: [
              {
                id: "l1",
                type: "leaf",
                state: { type: "empty", state: {}, icon: "", title: "" },
              },
            ],
          },
        ],
      },
    });
    // Unknown type is dropped, only the valid tabs child remains.
    expect(result.main.children).toHaveLength(1);
    expect(result.main.children[0].type).toBe("tabs");
    // sizes array is repaired to match the 1 remaining child.
    expect(result.main.sizes).toHaveLength(1);
  });

  it("generates replacement ids for nodes with missing ids", () => {
    const result = normalizeWorkspaceJson({
      main: {
        type: "split",
        // no id
        direction: "vertical",
        sizes: [100],
        children: [
          {
            type: "tabs",
            // no id
            stacked: false,
            currentTab: 0,
            children: [
              {
                type: "leaf",
                state: { type: "empty", state: {}, icon: "", title: "" },
              },
            ],
          },
        ],
      },
      left: {
        type: "split",
        direction: "vertical",
        sizes: [],
        children: [],
        width: "16rem",
      },
      right: {
        type: "split",
        direction: "vertical",
        sizes: [],
        children: [],
        width: "16rem",
      },
    });

    expect(typeof result.main.id).toBe("string");
    expect(result.main.id.length).toBeGreaterThan(0);
    expect(typeof result.main.children[0].id).toBe("string");
    expect(result.main.children[0].id.length).toBeGreaterThan(0);
  });

  it("preserves the sidedock width when present", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      left: {
        id: "left",
        type: "split",
        direction: "vertical",
        sizes: [],
        children: [],
        width: "22rem",
      },
    });
    expect(result.left.width).toBe("22rem");
  });

  it("falls back to 16rem for sidedock width when missing", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      left: {
        id: "left",
        type: "split",
        direction: "vertical",
        sizes: [],
        children: [],
        // no width
      },
    });
    expect(result.left.width).toBe("16rem");
  });

  it("omits the active field when missing or empty", () => {
    expect(normalizeWorkspaceJson({}).active).toBeUndefined();
    expect(
      normalizeWorkspaceJson({ ...minimalValidLayout(), active: "" }).active,
    ).toBeUndefined();
  });

  it("preserves a non-empty active field as-is", () => {
    const result = normalizeWorkspaceJson({
      ...minimalValidLayout(),
      active: "some-leaf-id",
    });
    expect(result.active).toBe("some-leaf-id");
  });
});
