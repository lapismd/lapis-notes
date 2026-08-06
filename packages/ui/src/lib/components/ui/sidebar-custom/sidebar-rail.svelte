<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils.js";
  import { untrack } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { useSidebar } from "./context.svelte.js";
  import { useSidebarResize } from "./sidebar-resize.svelte.js";

  let {
    ref = $bindable(null),
    class: className,
    enableDrag = false,
    side = "left",
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    enableDrag?: boolean;
    side: "left" | "right";
  } = $props();

  const sidebar = useSidebar();
  const { handleMouseDown } = untrack(() =>
    useSidebarResize({
      side,
      enableDrag,
      sidebar,
    }),
  );
</script>

<button
  bind:this={ref}
  data-sidebar="rail"
  data-slot="sidebar-rail"
  aria-label="Toggle Sidebar"
  tabIndex={-1}
  onmousedown={handleMouseDown}
  title="Toggle Sidebar"
  class={cn(
    "after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:transition-[width,background-color] after:duration-150 hover:after:w-[4px] hover:after:bg-[var(--interactive-accent)] focus-visible:outline-hidden focus-visible:after:w-[4px] focus-visible:after:bg-[var(--interactive-accent)] sm:flex",
    "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
    "in-data-[state=expanded]:cursor-col-resize",
    "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
    "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
    "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
    "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</button>
