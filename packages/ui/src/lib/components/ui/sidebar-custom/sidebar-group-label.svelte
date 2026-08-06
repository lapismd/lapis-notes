<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    children,
    child,
    class: className,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
  } = $props();

  const mergedProps = $derived({
    ...restProps,
    class: className,
    "data-ui-component": "sidebar-custom",
    "data-ui-part": "sidebar-group-label",
    "data-slot": "sidebar-group-label",
    "data-sidebar": "group-label",
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <div
    bind:this={ref}
    {...mergedProps}
    data-ui-component="sidebar-custom"
    data-ui-part="sidebar-group-label"
  >
    {@render children?.()}
  </div>
{/if}
