<script lang="ts">
  import { Popover as PopoverPrimitive } from "bits-ui";
  import { setContext } from "svelte";
  import {
    createOverlayPortalContext,
    popoverPortalContextKey,
  } from "$lib/internal/overlay-portal-context.js";

  let { open = $bindable(false), ...restProps }: PopoverPrimitive.RootProps =
    $props();

  setContext(popoverPortalContextKey, createOverlayPortalContext());
</script>

<PopoverPrimitive.Root bind:open {...restProps} />
