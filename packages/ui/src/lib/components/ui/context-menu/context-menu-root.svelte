<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import { setContext } from "svelte";
  import {
    contextMenuPortalContextKey,
    createOverlayPortalContext,
  } from "$lib/internal/overlay-portal-context.js";

  let {
    open = $bindable(false),
    ...restProps
  }: ContextMenuPrimitive.RootProps = $props();

  setContext(contextMenuPortalContextKey, createOverlayPortalContext());
</script>

<ContextMenuPrimitive.Root bind:open {...restProps} />
