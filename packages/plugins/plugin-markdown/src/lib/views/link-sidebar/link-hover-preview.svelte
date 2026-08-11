<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import * as HoverCard from "@lapismd/design-core/shadcn/hover-card";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import {
    onDestroy,
    untrack,
    type ComponentProps,
    type Snippet,
  } from "svelte";
  import { FileEmbed } from "$lib/components/embed";
  import { provideEditablePreviewClose } from "$lib/components/embed/editable-preview-close-context";

  let {
    app,
    file,
    editingId,
    oneditingchange,
    sourcePath = "",
    label,
    onclick,
    children,
  }: {
    app: App;
    file: TFile;
    editingId: string;
    oneditingchange?: (id: string, editing: boolean) => void;
    sourcePath?: string;
    label: string;
    onclick: (event: MouseEvent) => void;
    children: Snippet;
  } = $props();

  let open = $state(false);
  let editing = $state(false);
  let fileEmbed: { exit: () => Promise<boolean> } | null = $state(null);

  type InteractOutsideEvent = Parameters<
    NonNullable<ComponentProps<typeof HoverCard.Content>["onInteractOutside"]>
  >[0];

  provideEditablePreviewClose(() => {
    open = false;
  });

  function handleOpenChange(nextOpen: boolean): void {
    if (!nextOpen && editing) {
      open = true;
      return;
    }
    open = nextOpen;
  }

  function getOpen(): boolean {
    return open;
  }

  function handleInteractOutside(event: InteractOutsideEvent): void {
    if (!editing) return;

    event.preventDefault();
    void fileEmbed?.exit().then((exited) => {
      if (exited) open = false;
    });
  }

  function getEditing(): boolean {
    return editing;
  }

  function setEditing(nextEditing: boolean): void {
    editing = nextEditing;
    untrack(() => oneditingchange?.(editingId, nextEditing));
  }

  onDestroy(() => {
    untrack(() => oneditingchange?.(editingId, false));
  });
</script>

<HoverCard.Root bind:open={getOpen, handleOpenChange}>
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
  <HoverCard.Content
    class="markdown-link-sidebar__preview"
    data-editing={editing ? "true" : "false"}
    onInteractOutside={handleInteractOutside}
  >
    <ScrollArea.Root
      class="markdown-link-sidebar__preview-scroll"
      data-editing={editing ? "true" : "false"}
    >
      <FileEmbed
        bind:this={fileEmbed}
        {app}
        {file}
        {sourcePath}
        onopen={onclick}
        editable
        returnToPreviewOnBlur={false}
        bind:editing={getEditing, setEditing}
      />
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
    box-sizing: border-box;
    width: min(26rem, calc(100vw - 2rem));
    max-height: min(24rem, calc(100vh - 2rem));
    padding: 0.75rem;
  }

  :global(
    [data-ui-component="hover-card"][data-ui-part="hover-card-content"].markdown-link-sidebar__preview[data-editing="true"]
  ) {
    border: 2px solid var(--ui-hover-card-focus-ring-color, var(--ring));
  }

  :global(.markdown-link-sidebar__preview-scroll) {
    width: 100%;
    height: 21rem;
    min-height: 0;
  }

  :global(
    .markdown-link-sidebar__preview-scroll[data-editing="true"]
      [data-ui-part="scroll-area-viewport"]
  ) {
    overflow: hidden !important;
  }

  :global(
    .markdown-link-sidebar__preview-scroll[data-editing="true"]
      [data-ui-part="scroll-area-viewport"]
      > div
  ) {
    height: 100%;
    min-height: 0;
  }

  :global(
    .markdown-link-sidebar__preview-scroll[data-editing="true"]
      [data-ui-part="scroll-area-scrollbar"]
  ) {
    display: none;
  }
</style>
