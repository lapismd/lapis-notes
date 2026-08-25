import {
  createPanelDemoLayout,
  type PanelDemoKind,
  type PanelDemoLayout,
} from "./create-panel-demo";

const publicComponents: Partial<Record<PanelDemoKind, string>> = {
  "ai-history": "AiHistoryPanel",
  "ai-catalog": "AiCatalogPanel",
  "ai-chat": "AiChatPanel",
  explorer: "ExplorerPanel",
  "file-properties": "FileProperties",
  outline: "Outline",
  backlinks: "Backlinks",
  "outgoing-links": "OutgoingLinks",
  tags: "Tags",
  search: "SearchPanel",
  graph: "GraphControlsOverlay",
  "local-graph": "GraphControlsOverlay",
  bookmarks: "BookmarksPanel",
  history: "HistoryPanel",
};

function indent(value: string, spaces: number): string {
  const padding = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${padding}${line}`))
    .join("\n");
}

export function panelExampleSource(
  kind: PanelDemoKind,
  layout: PanelDemoLayout,
): string {
  const persistedLayout = indent(
    JSON.stringify(createPanelDemoLayout(kind, layout), null, 2),
    2,
  );
  const packageName =
    kind === "graph" || kind === "local-graph"
      ? "@lapis-notes/graph"
      : kind === "search"
        ? "@lapis-notes/search"
        : kind === "bookmarks"
          ? "@lapis-notes/bookmarks"
          : kind === "history"
            ? "@lapis-notes/history"
            : kind === "explorer"
              ? "@lapis-notes/file-explorer"
              : kind === "ai-history" ||
                  kind === "ai-catalog" ||
                  kind === "ai-chat"
                ? "@lapis-notes/ai"
                : "@lapis-notes/markdown";
  const panelImport = `  import { ${publicComponents[kind] ?? "AllProperties"} } from "${packageName}";\n`;
  const pluginName =
    kind === "graph" || kind === "local-graph"
      ? "Graph"
      : kind === "search"
        ? "Search"
        : kind === "bookmarks"
          ? "Bookmarks"
          : kind === "history"
            ? "History"
            : kind === "explorer"
              ? "Explorer"
              : kind === "ai-history" ||
                  kind === "ai-catalog" ||
                  kind === "ai-chat"
                ? "AI"
                : "Markdown";
  const registrationNote = `  // The enabled ${pluginName} plugin registers the workspace view that renders ${publicComponents[kind] ?? "AllProperties"}.`;

  return `<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
${panelImport}
  let { app }: { app: App } = $props();

${registrationNote}
  const layout = ${persistedLayout};

  onMount(() => {
    void app.workspace.changeLayout(layout);
  });
</script>

<WorkspaceShell {app} />`;
}

export function panelExampleSources(kind: PanelDemoKind) {
  return {
    MiddleTopTabs: panelExampleSource(kind, "middle-top-tabs"),
    StackedTabs: panelExampleSource(kind, "stacked-tabs"),
    LeftSidebar: panelExampleSource(kind, "left-sidebar"),
    RightSidebar: panelExampleSource(kind, "right-sidebar"),
    BottomPanel: panelExampleSource(kind, "bottom-panel"),
    SidebarGroup: panelExampleSource(kind, "sidebar-group"),
  };
}
