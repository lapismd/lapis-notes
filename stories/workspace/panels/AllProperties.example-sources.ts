import {
  createPanelDemoLayout,
  type PanelDemoLayout,
} from "./create-panel-demo";

type AllPropertiesLayout = Exclude<PanelDemoLayout, "comparison">;

function indent(value: string, spaces: number): string {
  const padding = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${padding}${line}`))
    .join("\n");
}

function panelSource(layout: AllPropertiesLayout): string {
  const persistedLayout = indent(
    JSON.stringify(createPanelDemoLayout("all-properties", layout), null, 2),
    2,
  );

  return `<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  let { app }: { app: App } = $props();

  // The enabled @lapis-notes/markdown plugin registers "all-properties".
  const layout = ${persistedLayout};

  onMount(() => {
    void app.workspace.changeLayout(layout);
  });
</script>

<WorkspaceShell {app} />`;
}

export const MiddleTopTabs = panelSource("middle-top-tabs");
export const StackedTabs = panelSource("stacked-tabs");
export const LeftSidebar = panelSource("left-sidebar");
export const RightSidebar = panelSource("right-sidebar");
export const BottomPanel = panelSource("bottom-panel");
export const SidebarGroup = panelSource("sidebar-group");
