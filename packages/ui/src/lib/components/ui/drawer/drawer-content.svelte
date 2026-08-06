<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { Drawer as DrawerPrimitive, type DrawerDirection } from "vaul-svelte";
  import type { Snippet } from "svelte";
  import DrawerOverlay from "./drawer-overlay.svelte";
  import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
  import { drawerVariants } from "./drawer.shared";

  let {
    ref = $bindable(null),
    class: className,
    direction = "bottom",
    portalProps,
    showHandle = true,
    children,
    ...restProps
  }: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
    direction?: DrawerDirection;
    portalProps?: DialogPrimitive.PortalProps;
    showHandle?: boolean;
    children: Snippet;
  } = $props();
</script>

<DrawerPrimitive.Portal {...portalProps}>
  <DrawerOverlay />
  <DrawerPrimitive.Content
    bind:ref
    data-slot="drawer-content"
    class={cn(drawerVariants({ direction }), className)}
    {...restProps}
  >
    {#if showHandle && (direction === "bottom" || direction === "top")}
      <div class="flex justify-center pt-3">
        <div class="bg-muted h-1.5 w-24 rounded-full"></div>
      </div>
    {/if}
    {@render children?.()}
  </DrawerPrimitive.Content>
</DrawerPrimitive.Portal>
