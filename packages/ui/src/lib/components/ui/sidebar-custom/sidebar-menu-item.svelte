<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLLIElement>, HTMLLIElement> = $props();
</script>

<li
  bind:this={ref}
  {...restProps}
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-menu-item"
  data-slot="sidebar-menu-item"
  data-sidebar="menu-item"
  class={className}
>
  {@render children?.()}
</li>
