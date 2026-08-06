<script lang="ts">
  import { Tooltip as TooltipPrimitive } from "bits-ui";
  import { getContext } from "svelte";
  import {
    tooltipPortalContextKey,
    type OverlayPortalContext,
  } from "$lib/internal/overlay-portal-context.js";

  let { ref = $bindable(null), ...restProps }: TooltipPrimitive.TriggerProps =
    $props();

  const portalContext = getContext<OverlayPortalContext | undefined>(
    tooltipPortalContextKey,
  );

  $effect(() => {
    if (portalContext) {
      portalContext.portalTarget = ref?.ownerDocument.body ?? null;
    }
  });
</script>

<TooltipPrimitive.Trigger bind:ref data-slot="tooltip-trigger" {...restProps} />
