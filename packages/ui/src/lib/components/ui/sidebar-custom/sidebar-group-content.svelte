<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  {...restProps}
  data-ui-component="sidebar-custom"
  data-ui-part="sidebar-group-content"
  data-slot="sidebar-group-content"
  data-sidebar="group-content"
  class={className}
>
  {@render children?.()}
</div>
