<script lang="ts">
  import { type WithElementRef } from "$lib/utils.js";
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    children,
    child,
    class: className,
    size = "md",
    isActive = false,
    ...restProps
  }: WithElementRef<HTMLAnchorAttributes> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
    size?: "sm" | "md";
    isActive?: boolean;
  } = $props();

  const mergedProps = $derived({
    ...restProps,
    class: className,
    "data-ui-component": "sidebar-custom",
    "data-ui-part": "sidebar-menu-sub-button",
    "data-slot": "sidebar-menu-sub-button",
    "data-sidebar": "menu-sub-button",
    "data-size": size,
    "data-active": isActive,
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <a
    bind:this={ref}
    {...mergedProps}
    data-ui-component="sidebar-custom"
    data-ui-part="sidebar-menu-sub-button"
  >
    {@render children?.()}
  </a>
{/if}
