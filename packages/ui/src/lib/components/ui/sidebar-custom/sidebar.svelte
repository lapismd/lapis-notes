<script lang="ts">
  import * as Sheet from "@lapismd/design-core/shadcn/sheet";
  import { type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";
  import { SIDEBAR_WIDTH_MOBILE } from "./constants.js";
  import { useSidebar } from "./context.svelte.js";
  import "./sidebar-custom.css";

  let {
    ref = $bindable(null),
    side = "left",
    variant = "sidebar",
    collapsible = "offcanvas",
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  } = $props();

  const sidebar = useSidebar();
</script>

{#if collapsible === "none"}
  <div
    {...restProps}
    data-ui-component="sidebar-custom"
    data-ui-part="sidebar"
    data-slot="sidebar"
    class={className}
    bind:this={ref}
  >
    {@render children?.()}
  </div>
{:else if sidebar.isMobile}
  <Sheet.Root
    bind:open={() => sidebar.openMobile, (v) => sidebar.setOpenMobile(v)}
    {...restProps}
  >
    <Sheet.Content
      bind:ref
      data-sidebar="sidebar"
      data-ui-component="sidebar-custom"
      data-ui-part="sidebar-content"
      data-slot="sidebar"
      data-mobile="true"
      class={className}
      style="--sidebar-width: {SIDEBAR_WIDTH_MOBILE};"
      {side}
      showCloseButton={false}
    >
      <Sheet.Header class="sr-only">
        <Sheet.Title>Sidebar</Sheet.Title>
        <Sheet.Description>Displays the mobile sidebar.</Sheet.Description>
      </Sheet.Header>
      <div
        data-ui-component="sidebar-custom"
        data-ui-part="sidebar-anon-1"
        data-slot="sidebar-anon-1"
      >
        {@render children?.()}
      </div>
    </Sheet.Content>
  </Sheet.Root>
{:else}
  <div
    bind:this={ref}
    data-state={sidebar.state}
    data-collapsible={sidebar.state === "collapsed" ? collapsible : ""}
    data-variant={variant}
    data-side={side}
    data-dragging={sidebar.isDraggingRail}
    data-ui-component="sidebar-custom"
    data-ui-part="sidebar"
    data-slot="sidebar"
  >
    <!-- This is what handles the sidebar gap on desktop -->
    <div
      data-ui-component="sidebar-custom"
      data-ui-part="sidebar-gap"
      data-slot="sidebar-gap"
    ></div>
    <div
      {...restProps}
      data-ui-component="sidebar-custom"
      data-ui-part="sidebar-container"
      data-slot="sidebar-container"
      class={className}
    >
      <div
        data-sidebar="sidebar"
        data-ui-component="sidebar-custom"
        data-ui-part="sidebar-inner"
        data-slot="sidebar-inner"
      >
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
