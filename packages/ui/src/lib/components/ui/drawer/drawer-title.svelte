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
  }: DialogPrimitive.TitleProps = $props();
</script>

<DrawerPrimitive.Title
  bind:ref
  data-slot="drawer-title"
  class={cn("text-foreground font-semibold", className)}
  {...restProps}
/>
