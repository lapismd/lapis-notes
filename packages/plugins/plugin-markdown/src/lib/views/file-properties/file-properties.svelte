<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import {
    FrontmatterEditor,
    type FrontmatterController,
    type FrontmatterPropertyManager,
  } from "@lapismd/mira/preview";
  import { onMount, untrack } from "svelte";
  import {
    createLapisFrontmatterController,
    createLapisFrontmatterPropertyManager,
    syncLapisFrontmatterController,
  } from "../../frontmatter/lapis-frontmatter-adapter";
  import { createLapisMiraFileAdapter } from "../../mira/file-adapter";
  import { resolvePanelTargetFile } from "../panel-target-file";
  import { subscribeFileScopedPanelRefresh } from "../file-scoped-panel-refresh";
  import MarkdownSidebarPanel from "../sidebar-panel/markdown-sidebar-panel.svelte";

  let { app }: { app: App } = $props();
  let followRevision = $state(0);
  let syncGeneration = 0;

  const activeFile = $derived.by(() => {
    followRevision;
    return resolvePanelTargetFile(app);
  });

  const fileAdapter = $derived(createLapisMiraFileAdapter(app));
  const propertyManager: FrontmatterPropertyManager = untrack(() =>
    createLapisFrontmatterPropertyManager(app),
  );
  const controller: FrontmatterController = untrack(() =>
    createLapisFrontmatterController(app, null, propertyManager),
  );

  $effect(() => {
    const file = activeFile;
    const generation = ++syncGeneration;
    void (async () => {
      if (file) await app.metadataCache.getFileCacheAsync(file);
      if (generation !== syncGeneration || file !== activeFile) return;
      syncLapisFrontmatterController(
        controller,
        app,
        file ?? null,
        propertyManager,
      );
    })();
  });

  onMount(() =>
    subscribeFileScopedPanelRefresh(app, () => {
      followRevision += 1;
    }),
  );
</script>

<MarkdownSidebarPanel
  title="File properties"
  testId="file-properties-panel"
  component="file-properties"
  showTitle={false}
>
  {#if activeFile}
    <div class="markdown-widget-shell markdown-file-properties__editor">
      <FrontmatterEditor
        {controller}
        {propertyManager}
        {fileAdapter}
        showChrome={false}
        open={true}
      />
    </div>
  {:else}
    <p class="markdown-sidebar-panel__empty">
      No active file. Open a Markdown note to edit its properties.
    </p>
  {/if}
</MarkdownSidebarPanel>

<style>
  .markdown-file-properties__editor {
    --font-interface: var(--ui-workspace-explorer-font-family, inherit);
    --text-sm: 0.75rem;
    --text-sm--line-height: 1rem;
    --markdown-tag-background: color-mix(
      in srgb,
      var(--ui-workspace-accent, var(--primary)) 10%,
      var(--ui-workspace-view-background, var(--background))
    );
    --markdown-tag-background-hover: color-mix(
      in srgb,
      var(--ui-workspace-accent, var(--primary)) 20%,
      var(--ui-workspace-view-background, var(--background))
    );
    --markdown-tag-color: var(
      --ui-workspace-view-foreground,
      var(--foreground)
    );
    --markdown-tag-color-hover: var(
      --ui-workspace-view-foreground,
      var(--foreground)
    );
    --markdown-tag-border-width: 0;
    --markdown-tag-border-color: transparent;
    --markdown-tag-border-color-hover: transparent;
    --markdown-tag-radius: 999px;
    --markdown-tag-size: 0.75rem;
    --markdown-tag-weight: 400;
    --markdown-tag-padding-x: 0.375rem;
    --markdown-tag-padding-y: 0.125rem;
    --markdown-alias-background: color-mix(
      in srgb,
      var(--ui-workspace-view-foreground, var(--foreground)) 8%,
      var(--ui-workspace-view-background, var(--background))
    );
    --markdown-alias-background-hover: color-mix(
      in srgb,
      var(--ui-workspace-view-foreground, var(--foreground)) 14%,
      var(--ui-workspace-view-background, var(--background))
    );
    --markdown-property-focus-background: color-mix(
      in srgb,
      var(--ui-workspace-view-foreground, var(--foreground)) 8%,
      var(--ui-workspace-view-background, var(--background))
    );

    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    color: inherit;
    font-family: var(--ui-workspace-explorer-font-family, inherit);
    font-size: 0.75rem;
    line-height: 1rem;
  }

  .markdown-widget-shell.markdown-file-properties__editor {
    background: transparent;
  }

  :global(.markdown-file-properties__editor .md-frontmatter),
  :global(.markdown-file-properties__editor .md-frontmatter__content),
  :global(.markdown-file-properties__editor .mira-frontmatter),
  :global(.markdown-file-properties__editor .metadata-properties) {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  :global(
    .markdown-file-properties__editor .mira-frontmatter.metadata-container
  ) {
    font-size: 0.75rem;
    line-height: 1rem;
  }

  :global(.markdown-file-properties__editor .metadata-property-key-input),
  :global(.markdown-file-properties__editor .metadata-input),
  :global(.markdown-file-properties__editor textarea) {
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    font: inherit;
    outline: none;
  }

  :global(.markdown-file-properties__editor textarea) {
    resize: none;
  }

  :global(
    .markdown-file-properties__editor .metadata-property-key:focus-within
  ),
  :global(
    .markdown-file-properties__editor .metadata-property-value:focus-within
  ) {
    background: var(--markdown-property-focus-background);
  }

  :global(
    .markdown-file-properties__editor
      .metadata-property-value-list:is(.mod-aliases, .mod-multitext)
      .metadata-property-pill-chip
  ) {
    color: var(--ui-workspace-view-foreground, var(--foreground));
    background: var(--markdown-alias-background);
  }

  @media (hover: hover) {
    :global(
      .markdown-file-properties__editor
        .metadata-property-value-list:is(.mod-aliases, .mod-multitext)
        .metadata-property-pill-chip:hover
    ) {
      background: var(--markdown-alias-background-hover);
    }
  }
</style>
