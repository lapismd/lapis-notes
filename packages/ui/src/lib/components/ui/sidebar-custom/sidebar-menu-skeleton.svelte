<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    showIcon = false,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    showIcon?: boolean;
  } = $props();

  // Random width between 50% and 90%
  const width = `${Math.floor(Math.random() * 40) + 50}%`;
</script>

<div
  bind:this={ref}
  {...restProps}
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-menu-skeleton"
  data-slot="sidebar-menu-skeleton"
  data-sidebar="menu-skeleton"
  class={className}
>
  {#if showIcon}
    <Skeleton
      data-ui-part="sidebar-skeleton"
      data-slot="sidebar-skeleton"
      data-sidebar="menu-skeleton-icon"
    />
  {/if}
  <Skeleton
    data-ui-part="sidebar-menu-skeleton-anon-2"
    data-slot="sidebar-menu-skeleton-anon-2"
    data-sidebar="menu-skeleton-text"
    style="--skeleton-width: {width};"
  />
  {@render children?.()}
</div>
