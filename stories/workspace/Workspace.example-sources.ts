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
  if (
    catalogId === "workspace-lapis-editor-demo-sync-document-loading-and-rename"
  ) {
    return guardedDocumentSource;
  }
  if (catalogId.startsWith("workspace-shell-")) return workspaceShellSource;
  if (catalogId.startsWith("workspace-lapis-editor-demo-")) {
    return lapisEditorSource;
  }
  throw new Error(`Missing workspace example source for ${catalogId}`);
}

const guardedDocumentSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryAppDatabase, MemoryVaultAdapter, type TextFileView } from "@lapis-notes/api";
  import { SourceEditorPlugin } from "@lapis-notes/source-editor";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  const app = new App({
    version: "0.1.2",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({ "first.txt": "first", "second.txt": "second" }),
    appDatabase: new MemoryAppDatabase("guarded-documents"),
    markdownRenderer: async () => {},
  });
  app.plugins.registerCorePlugins([{ plugin: SourceEditorPlugin, required: true }]);
  let ready = $state(false);

  onMount(() => {
    void (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled" });
      await app.workspace.loadLayout();
      const leaf = app.workspace.getLeaf();
      await leaf.openFile(app.vault.getFileByPath("first.txt")!);
      await leaf.openFile(app.vault.getFileByPath("second.txt")!);
      // The source view registers/protects its target before the asynchronous read.
      await app.fileEditingSessions.guard("second.txt", async () => {
        // The target is loaded, drafts are durable, and editor writes are protected.
      });
      await app.fileManager.renameFile(app.vault.getFileByPath("second.txt")!, "renamed.txt");
      await (leaf.view as TextFileView).onRename(app.vault.getFileByPath("renamed.txt")!);
      ready = true;
    })();
    return () => { void (async () => {
      const editors: TextFileView[] = [];
      app.workspace.iterateAllLeaves((leaf) => {
        leaf.view.unload();
        if ("editor" in leaf.view) editors.push(leaf.view as TextFileView);
      });
      await Promise.all(editors.map((view) => view.editor.dispose()));
      for (const plugin of [...app.plugins.corePlugins].reverse()) await plugin.disable();
      await app.fileEditingSessions.dispose();
      await app.workspace.disposeWorkspaceHost();
    })(); };
  });
</script>

{#if ready}<WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />{/if}`;
