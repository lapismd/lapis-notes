<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import * as HoverCard from "@lapismd/design-core/shadcn/hover-card";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import type { Snippet } from "svelte";
  import { FileEmbed } from "$lib/components/embed";

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

</script>

<HoverCard.Root>
  <HoverCard.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        type="button"
        class="markdown-link-sidebar__mention"
        aria-label={label}
        {onclick}
      >
        <span class="markdown-link-sidebar__preview-content">
          {@render children()}
        </span>
      </button>
    {/snippet}
  </HoverCard.Trigger>
  <HoverCard.Content class="markdown-link-sidebar__preview">
    <ScrollArea.Root class="markdown-link-sidebar__preview-scroll">
      <FileEmbed {app} {file} {sourcePath} onopen={onclick} />
    </ScrollArea.Root>
  </HoverCard.Content>
</HoverCard.Root>

<style>
  .markdown-link-sidebar__preview-content {
    display: inline-flex;
    min-width: 0;
    max-width: 100%;
  }

  :global(
    [data-ui-component="hover-card"][data-ui-part="hover-card-content"].markdown-link-sidebar__preview
  ) {
    width: min(26rem, calc(100vw - 2rem));
    max-height: min(24rem, calc(100vh - 2rem));
    padding: 0.75rem;
  }

  :global(.markdown-link-sidebar__preview-scroll) {
    width: 100%;
    height: 21rem;
    min-height: 0;
  }
</style>
