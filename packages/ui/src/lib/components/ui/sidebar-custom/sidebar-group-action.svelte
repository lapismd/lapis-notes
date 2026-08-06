<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    child,
    ...restProps
  }: WithElementRef<HTMLButtonAttributes> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
  } = $props();

  const mergedProps = $derived({
    ...restProps,
    class: className,
    "data-ui-component": "sidebar-custom",
    "data-ui-part": "sidebar-group-action",
    "data-slot": "sidebar-group-action",
    "data-sidebar": "group-action",
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <button
    bind:this={ref}
    {...mergedProps}
    data-ui-component="sidebar-custom"
    data-ui-part="sidebar-group-action"
  >
    {@render children?.()}
  </button>
{/if}
