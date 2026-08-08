<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import {
    FrontmatterEditor,
    type FrontmatterController,
    type FrontmatterPropertyManager,
  } from "@lapismd/mira/preview";
  import { untrack } from "svelte";
  import type { FilePropertiesView } from ".";
  import {
    createLapisFrontmatterController,
    createLapisFrontmatterPropertyManager,
    syncLapisFrontmatterController,
  } from "../../frontmatter/lapis-frontmatter-adapter";
  import { leafInSidebar, resolvePanelTargetFile } from "../panel-target-file";
  import MarkdownSidebarPanel from "../sidebar-panel/markdown-sidebar-panel.svelte";

  let {
    app,
    view,
  }: {
    app: App;
    view: FilePropertiesView;
  } = $props();

  const inSidebar = $derived(leafInSidebar(view.leaf));
  const activeFile = $derived.by(() => resolvePanelTargetFile(app));

  const propertyManager: FrontmatterPropertyManager = untrack(() =>
    createLapisFrontmatterPropertyManager(app),
  );
  const controller: FrontmatterController = untrack(() =>
    createLapisFrontmatterController(app, null, propertyManager),
  );

  $effect(() => {
    const file = activeFile;
    if (file) {
      void app.metadataCache.getCache(file.path)?.frontmatter;
    }
    syncLapisFrontmatterController(
      controller,
      app,
      file ?? null,
      propertyManager,
    );
  });
</script>

<MarkdownSidebarPanel
  title="File properties"
  testId="file-properties-panel"
  component="file-properties"
  {inSidebar}
  meta={activeFile ? activeFile.path : "No active file"}
>
  {#if activeFile}
    <FrontmatterEditor
      {controller}
      {propertyManager}
      showChrome={false}
      open={true}
    />
  {:else}
    <p class="markdown-sidebar-panel__empty">
      No active file. Open a Markdown note to edit its properties.
    </p>
  {/if}
</MarkdownSidebarPanel>
