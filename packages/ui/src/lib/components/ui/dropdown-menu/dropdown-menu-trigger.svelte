<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { getContext } from "svelte";
  import {
    dropdownMenuPortalContextKey,
    type OverlayPortalContext,
  } from "$lib/internal/overlay-portal-context.js";

  let {
    ref = $bindable(null),
    ...restProps
  }: DropdownMenuPrimitive.TriggerProps = $props();

  const portalContext = getContext<OverlayPortalContext | undefined>(
    dropdownMenuPortalContextKey,
  );

  $effect(() => {
    if (portalContext) {
      portalContext.portalTarget = ref?.ownerDocument.body ?? null;
    }
  });
</script>

<DropdownMenuPrimitive.Trigger
  bind:ref
  data-slot="dropdown-menu-trigger"
  {...restProps}
/>
