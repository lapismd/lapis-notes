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
  data-ui-part="sidebar-footer"
  data-slot="sidebar-footer"
  data-sidebar="footer"
  class={className}
>
  {@render children?.()}
</div>
