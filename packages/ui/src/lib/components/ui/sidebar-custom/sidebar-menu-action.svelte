<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    showOnHover = false,
    children,
    child,
    ...restProps
  }: WithElementRef<HTMLButtonAttributes> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
    showOnHover?: boolean;
  } = $props();

  const mergedProps = $derived({
    ...restProps,
    class: className,
    "data-ui-component": "sidebar-custom",
    "data-ui-part": "sidebar-menu-action",
    "data-slot": "sidebar-menu-action",
    "data-sidebar": "menu-action",
    "data-show-on-hover": showOnHover ? "true" : undefined,
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <button
    bind:this={ref}
    {...mergedProps}
    data-ui-component="sidebar-custom"
    data-ui-part="sidebar-menu-action"
  >
    {@render children?.()}
  </button>
{/if}
