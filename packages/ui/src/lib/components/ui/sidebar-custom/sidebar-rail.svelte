<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
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
  {...restProps}
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-rail"
  data-slot="sidebar-rail"
  aria-label="Toggle Sidebar"
  tabindex={-1}
  onmousedown={handleMouseDown}
  title="Toggle Sidebar"
  class={className}
>
  {@render children?.()}
</button>
