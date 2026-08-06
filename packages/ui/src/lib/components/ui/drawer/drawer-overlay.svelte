<script lang="ts">
  // vaul-svelte still types against bits-ui v0; runtime uses bits-ui v2.
  // @ts-nocheck
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { Drawer as DrawerPrimitive } from "vaul-svelte";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: DialogPrimitive.OverlayProps = $props();
</script>

<DrawerPrimitive.Overlay
  bind:ref
  data-slot="drawer-overlay"
  class={cn("fixed inset-0 z-50 bg-black/50", className)}
  {...restProps}
/>
