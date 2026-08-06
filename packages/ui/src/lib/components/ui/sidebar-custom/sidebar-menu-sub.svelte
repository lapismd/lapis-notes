<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLUListElement>> = $props();
</script>

<ul
  bind:this={ref}
  {...restProps}
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-menu-sub"
  data-slot="sidebar-menu-sub"
  data-sidebar="menu-sub"
  class={className}
>
  {@render children?.()}
</ul>
