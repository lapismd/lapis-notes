<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<
    HTMLAttributes<HTMLUListElement>,
    HTMLUListElement
  > = $props();
</script>

<ul
  bind:this={ref}
  {...restProps}
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-menu"
  data-slot="sidebar-menu"
  data-sidebar="menu"
  class={className}
>
  {@render children?.()}
</ul>
