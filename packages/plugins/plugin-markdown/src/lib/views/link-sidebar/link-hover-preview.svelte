<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import type { Snippet } from "svelte";
  import { FileEmbed } from "$lib/components/embed";

  const CLOSE_GRACE_MS = 300;

  let {
    app,
    file,
    sourcePath = "",
    label,
    onclick,
    children,
  }: {
    app: App;
    file: TFile;
    sourcePath?: string;
    label: string;
    onclick: (event: MouseEvent) => void;
    children: Snippet;
  } = $props();

  let open = $state(false);
  let previewAnchor: HTMLSpanElement | null = $state(null);
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
    }, CLOSE_GRACE_MS);
  }

  function show() {
    cancelClose();
    open = true;
  }

  $effect(() => {
    return () => cancelClose();
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
    <span
      class="markdown-link-sidebar__preview-anchor"
      data-link-preview-anchor
      aria-hidden="true"
      bind:this={previewAnchor}
    ></span>
    <span class="markdown-link-sidebar__preview-content">
      {@render children()}
    </span>
  </Popover.Trigger>
  {#if open}
    <Popover.Content
      class="markdown-link-sidebar__preview"
      side="right"
      align="start"
      customAnchor={previewAnchor}
      onpointerenter={show}
      onpointerleave={scheduleClose}
      onfocusin={show}
      onfocusout={scheduleClose}
    >
      <ScrollArea.Root class="markdown-link-sidebar__preview-scroll">
        <FileEmbed {app} {file} {sourcePath} onopen={onclick} />
      </ScrollArea.Root>
    </Popover.Content>
  {/if}
</Popover.Root>

<style>
  .markdown-link-sidebar__preview-anchor {
    width: 0;
    height: 1rem;
    flex: 0 0 0;
    align-self: center;
    pointer-events: none;
  }

  .markdown-link-sidebar__preview-content {
    display: inline-flex;
    min-width: 0;
    max-width: 100%;
  }

  :global(
    [data-ui-component="popover"][data-ui-part="popover-content"].markdown-link-sidebar__preview
  ) {
    width: min(26rem, calc(100vw - 2rem));
    max-height: min(24rem, calc(100vh - 2rem));
    --ui-popover-gap: 0;
    padding: 0.75rem;
  }

  :global(.markdown-link-sidebar__preview-scroll) {
    width: 100%;
    height: 21rem;
    min-height: 0;
  }
</style>
