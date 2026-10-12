export type PluginsPlacement =
  | "middle-top-tabs"
  | "stacked-tabs"
  | "left-sidebar"
  | "right-sidebar"
  | "bottom-panel"
  | "sidebar-group";
export function pluginsBrowserOpeningLayout(): Record<string, unknown> {
  const layout = pluginsBrowserLayout("middle-top-tabs");
  layout.main = {
    id: "main",
    type: "split",
    direction: "vertical",
    children: [
      {
        id: "initial-tabs",
        type: "tabs",
        children: [
          {
            id: "initial-tab",
            type: "leaf",
            state: { type: "empty", state: {} },
          },
        ],
        currentTab: 0,
      },
    ],
  };
  layout.active = "initial-tab";
  return layout;
}
export function pluginsBrowserLayout(
  placement: PluginsPlacement,
  browserState: Record<string, unknown> = {},
): Record<string, unknown> {
  const leaf = {
    id: "plugins-review",
    type: "leaf",
    state: {
      type: "plugins",
      state: { route: { page: "landing" }, ...browserState },
      title: "Plugins",
      icon: "package",
    },
  };
  const empty = {
    id: "context",
    type: "leaf",
    state: { type: "empty", state: {}, title: "Workspace" },
  };
  const tabs = (
    id: string,
    children: unknown[],
    stacked = false,
    currentTab = 0,
  ) => ({ id, type: "tabs", children, stacked, currentTab });
  const split = (id: string, children: unknown[], width = "0px") => ({
    id,
    type: "split",
    direction: "vertical",
    children,
    width,
  });
  const group = {
    id: "plugins-group",
    type: "sidebar-group",
    name: "Plugin registry",
    icon: "package",
    children: [leaf],
    collapsed: { "plugins-review": false },
    panelSizes: { "plugins-review": 100 },
  };
  const state = {
    main: split("main", [tabs("context-tabs", [empty])]),
    left: split("left", []),
    right: split("right", []),
    bottom: { ...tabs("bottom-panel", []), height: "0px" },
    floating: [],
    active: leaf.id,
  };
  if (placement === "middle-top-tabs")
    state.main = split("main", [tabs("plugins-tabs", [leaf])]);
  else if (placement === "stacked-tabs")
    state.main = split("main", [tabs("plugins-tabs", [empty, leaf], true, 1)]);
  else if (placement === "left-sidebar")
    state.left = split("left", [tabs("plugins-tabs", [leaf])], "24rem");
  else if (placement === "right-sidebar")
    state.right = split("right", [tabs("plugins-tabs", [leaf])], "24rem");
  else if (placement === "bottom-panel")
    state.bottom = { ...tabs("bottom-panel", [group]), height: "26rem" };
  else state.right = split("right", [tabs("plugins-tabs", [group])], "24rem");
  return state;
}
