<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";
  import { untrack, type ComponentProps } from "svelte";
  import { SidebarState, useSidebar } from "./context.svelte.js";

  let {
    ref = $bindable(null),
    class: className,
    sidebarState,
    onclick,
    ...restProps
  }: ComponentProps<typeof Button> & {
    sidebarState?: SidebarState;
    onclick?: (e: MouseEvent) => void;
  } = $props();

  const sidebar = untrack(() => sidebarState ?? useSidebar());
</script>

<Button
  data-sidebar="trigger"
  data-slot="sidebar-trigger"
  variant="ghost"
  size="icon"
  class={cn(`sidebar-toggle-button size-9 mod-${sidebar.props.id}`, className)}
  type="button"
  onclick={(e) => {
    onclick?.(e);
    sidebar.toggle();
  }}
  {...restProps}
>
  {#if sidebar.props.id === "right"}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="svg-icon sidebar-toggle-button-icon"
    >
      <rect x="1" y="2" width="22" height="20" rx="4"></rect>
      <rect
        x="4"
        y="5"
        width="2"
        height="14"
        rx="2"
        fill="currentColor"
        class="sidebar-toggle-icon-inner"
      ></rect></svg
    >
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="svg-icon sidebar-toggle-button-icon"
    >
      <rect x="1" y="2" width="22" height="20" rx="4"></rect>
      <rect
        x="4"
        y="5"
        width="2"
        height="14"
        rx="2"
        fill="currentColor"
        class="sidebar-toggle-icon-inner"
      ></rect>
    </svg>
  {/if}
  <span class="sr-only">Toggle Sidebar</span>
</Button>
