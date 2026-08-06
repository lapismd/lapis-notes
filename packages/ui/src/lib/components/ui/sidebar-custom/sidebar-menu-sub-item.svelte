<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    children,
    class: className,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLLIElement>> = $props();
</script>

<li
  bind:this={ref}
  {...restProps}
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-menu-sub-item"
  data-slot="sidebar-menu-sub-item"
  data-sidebar="menu-sub-item"
  class={className}
>
  {@render children?.()}
</li>
