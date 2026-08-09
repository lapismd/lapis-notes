<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { onMount, type Snippet } from "svelte";
  import MiraPreview from "../markdown/mira-preview.svelte";

  let {
    app,
    file,
    label,
    onclick,
    children,
  }: {
    app: App;
    file: TFile;
    label: string;
    onclick: (event: MouseEvent) => void;
    children: Snippet;
  } = $props();

  let open = $state(false);
  let value = $state("");
  let loadVersion = 0;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  function cancelClose() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = null;
  }

  function scheduleClose() {
    cancelClose();
    closeTimer = setTimeout(() => {
      open = false;
      closeTimer = null;
    }, 120);
  }

  function show() {
    cancelClose();
    open = true;
  }

  $effect(() => {
    const currentFile = file;
    const version = ++loadVersion;
    void app.vault.cachedRead(currentFile).then((next) => {
      if (version === loadVersion) value = next;
    });
  });

  onMount(() => {
    const changed = app.metadataCache.on("changed", (changedFile, data) => {
      if (changedFile.path === file.path) value = data;
    });
    return () => {
      cancelClose();
      app.metadataCache.offref(changed);
    };
  });
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    class="markdown-link-sidebar__mention"
    aria-label={label}
    onpointerenter={show}
    onpointerleave={scheduleClose}
    onfocus={show}
    onblur={scheduleClose}
    {onclick}
  >
    {@render children()}
  </Popover.Trigger>
  {#if open}
    <Popover.Content
      class="markdown-link-sidebar__preview"
      side="right"
      align="start"
      onpointerenter={show}
      onpointerleave={scheduleClose}
    >
      <strong class="markdown-link-sidebar__preview-title">{file.name}</strong>
      <div class="markdown-link-sidebar__preview-body">
        <MiraPreview {app} {value} sourcePath={file.path} />
      </div>
    </Popover.Content>
  {/if}
</Popover.Root>

<style>
  :global(.markdown-link-sidebar__preview) {
    width: min(26rem, calc(100vw - 2rem));
    max-height: 24rem;
    padding: 0.75rem;
  }

  :global(.markdown-link-sidebar__preview-title) {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  :global(.markdown-link-sidebar__preview-body) {
    height: 19rem;
    min-height: 0;
    overflow: auto;
    border-inline-start: 2px solid var(--interactive-accent, var(--primary));
    padding-inline-start: 0.75rem;
  }
</style>
