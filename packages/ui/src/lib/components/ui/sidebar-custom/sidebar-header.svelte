<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { type WithElementRef } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<div
  bind:this={ref}
  {...restProps}
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-header"
  data-slot="sidebar-header"
  data-sidebar="header"
  class={className}
>
  {@render children?.()}
</div>
