<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { setContext } from "svelte";
  import {
    createOverlayPortalContext,
    dropdownMenuPortalContextKey,
  } from "$lib/internal/overlay-portal-context.js";

  let {
    open = $bindable(false),
    onOpenChange: onOpenChangeProp,
    ...restProps
  }: DropdownMenuPrimitive.RootProps = $props();

  setContext(dropdownMenuPortalContextKey, createOverlayPortalContext());

  function handleOpenChange(v: boolean) {
    open = v;
    onOpenChangeProp?.(v);
  }
</script>

<DropdownMenuPrimitive.Root
  bind:open
  onOpenChange={handleOpenChange}
  {...restProps}
/>
