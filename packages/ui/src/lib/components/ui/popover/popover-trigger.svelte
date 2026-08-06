<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { Popover as PopoverPrimitive } from "bits-ui";
  import { getContext } from "svelte";
  import {
    popoverPortalContextKey,
    type OverlayPortalContext,
  } from "$lib/internal/overlay-portal-context.js";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: PopoverPrimitive.TriggerProps = $props();

  const portalContext = getContext<OverlayPortalContext | undefined>(
    popoverPortalContextKey,
  );

  $effect(() => {
    if (portalContext) {
      portalContext.portalTarget = ref?.ownerDocument.body ?? null;
    }
  });
</script>

<PopoverPrimitive.Trigger
  bind:ref
  data-slot="popover-trigger"
  class={cn("", className)}
  {...restProps}
/>
