import {
  createPanelDemoLayout,
  type PanelDemoKind,
  type PanelDemoLayout,
} from "./create-panel-demo";

const publicComponents: Partial<Record<PanelDemoKind, string>> = {
  "file-properties": "FileProperties",
  outline: "Outline",
  backlinks: "Backlinks",
  "outgoing-links": "OutgoingLinks",
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
  const panelImport =
    kind === "tags"
      ? '  import Tags from "../lapis-editor-demo/tags/tags.svelte";\n'
      : `  import { ${publicComponents[kind] ?? "AllProperties"} } from "@lapis-notes/markdown";\n`;
  const registrationNote =
    kind === "tags"
      ? "  // The story-local TagsDemoPlugin registers this component as the tags view.\n  void Tags;"
      : `  // The enabled Markdown plugin registers the workspace view that renders ${publicComponents[kind] ?? "AllProperties"}.`;

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
