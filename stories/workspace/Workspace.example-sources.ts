const workspaceShellSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  let {
    app,
    displayMode = "desktop",
  }: {
    app: App;
    displayMode?: "desktop" | "mobile";
  } = $props();
</script>

<WorkspaceShell {app} {displayMode} workspaceLabel="Lapis Notes" />`;

const lapisEditorSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  // The consumer initializes its vault, plugins, and persisted layout first.
  let { app }: { app: App } = $props();
</script>

<WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />`;

export function workspaceExampleSource(catalogId: string): string {
  if (catalogId.startsWith("workspace-shell-")) return workspaceShellSource;
  if (catalogId.startsWith("workspace-lapis-editor-demo-")) {
    return lapisEditorSource;
  }
  if (catalogId === "workspace-plugins-cv-file-view") {
    return lapisEditorSource;
  }
  throw new Error(`Missing workspace example source for ${catalogId}`);
}
