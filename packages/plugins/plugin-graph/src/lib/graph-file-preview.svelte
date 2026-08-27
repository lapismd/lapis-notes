<script lang="ts">
  import { TFile, type App } from "@lapis-notes/api";
  import { FileEmbed } from "@lapis-notes/markdown/embed";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import { onDestroy } from "svelte";
  import type { GraphNodePreview, GraphPreviewAnchor } from "./graph-renderer";

  let {
    app,
    preview,
    closeDelayMs,
    onOpenFile,
    onDismiss,
  }: {
    app: App;
    preview: GraphNodePreview | null;
    closeDelayMs: number;
    onOpenFile: (preview: GraphNodePreview, event: MouseEvent) => void;
    onDismiss: () => void;
  } = $props();

  let visiblePreview = $state<GraphNodePreview | null>(null);
  let previewAnchor = $state<GraphPreviewAnchor | null>(null);
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let pointerInside = false;
  const file = $derived.by(() => {
    const path = visiblePreview?.node.path;
    const resolved = path ? app.vault.getFileByPath(path) : null;
    return resolved instanceof TFile ? resolved : null;
  });

  $effect(() => {
    if (preview) {
      cancelClose();
      previewAnchor = preview.anchor;
      visiblePreview = preview;
      return;
    }
    scheduleClose();
  });

  onDestroy(cancelClose);

  function cancelClose(): void {
    if (closeTimer !== null) clearTimeout(closeTimer);
    closeTimer = null;
  }

  function scheduleClose(): void {
    cancelClose();
    if (pointerInside) return;
    const delay = Math.max(0, closeDelayMs);
    if (delay === 0) {
      visiblePreview = null;
      return;
    }
    closeTimer = setTimeout(() => {
      closeTimer = null;
      visiblePreview = null;
    }, delay);
  }

  function closeImmediately(): void {
    cancelClose();
    pointerInside = false;
    visiblePreview = null;
    onDismiss();
  }

  function handlePointerEnter(): void {
    pointerInside = true;
    cancelClose();
  }

  function handlePointerLeave(): void {
    pointerInside = false;
    scheduleClose();
  }
</script>

<Popover.Root
  open={visiblePreview !== null && file !== null}
  onOpenChange={(open) => {
    if (!open && visiblePreview) closeImmediately();
  }}
>
  {#if visiblePreview && file && previewAnchor}
    <Popover.Content
      class="graph-file-preview"
      customAnchor={previewAnchor}
      updatePositionStrategy="always"
      side="right"
      align="center"
      sideOffset={8}
      collisionPadding={12}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onCloseAutoFocus={(event) => event.preventDefault()}
      onpointerenter={handlePointerEnter}
      onpointerleave={handlePointerLeave}
      onkeydown={(event) => {
        if (event.key === "Escape") closeImmediately();
      }}
    >
      <ScrollArea.Root class="graph-file-preview__scroll">
        <FileEmbed
          {app}
          {file}
          frontmatterOpen={false}
          onopen={(event) => onOpenFile(visiblePreview!, event)}
        />
      </ScrollArea.Root>
    </Popover.Content>
  {/if}
</Popover.Root>
