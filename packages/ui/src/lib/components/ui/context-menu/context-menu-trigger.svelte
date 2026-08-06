<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import { getContext } from "svelte";
  import {
    contextMenuPortalContextKey,
    type OverlayPortalContext,
  } from "$lib/internal/overlay-portal-context.js";

  let {
    ref = $bindable(null),
    ...restProps
  }: ContextMenuPrimitive.TriggerProps = $props();

  const portalContext = getContext<OverlayPortalContext | undefined>(
    contextMenuPortalContextKey,
  );

  $effect(() => {
    if (portalContext) {
      portalContext.portalTarget = ref?.ownerDocument.body ?? null;
    }
  });
</script>

<ContextMenuPrimitive.Trigger
  bind:ref
  data-slot="context-menu-trigger"
  {...restProps}
/>
