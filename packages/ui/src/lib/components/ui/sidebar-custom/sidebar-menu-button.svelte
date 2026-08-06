<script lang="ts" module>
  export const SIDEBAR_MENU_BUTTON_VARIANTS = ["default", "outline"] as const;
  export type SidebarMenuButtonVariant =
    (typeof SIDEBAR_MENU_BUTTON_VARIANTS)[number];

  export const SIDEBAR_MENU_BUTTON_SIZES = ["default", "sm", "lg"] as const;
  export type SidebarMenuButtonSize =
    (typeof SIDEBAR_MENU_BUTTON_SIZES)[number];

  /** @deprecated Prefer typed props; retained for API compatibility. */
  export function sidebarMenuButtonVariants(_opts?: {
    variant?: SidebarMenuButtonVariant;
    size?: SidebarMenuButtonSize;
    class?: string;
  }): string {
    return "";
  }
</script>

<script lang="ts">
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import {
    type WithElementRef,
    type WithoutChildrenOrChild,
  } from "$lib/utils.js";
  import { mergeProps } from "bits-ui";
  import type { ComponentProps, Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { useSidebar } from "./context.svelte.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    child,
    variant = "default",
    size = "default",
    isActive = false,
    tooltipContent,
    tooltipContentProps,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    isActive?: boolean;
    variant?: SidebarMenuButtonVariant;
    size?: SidebarMenuButtonSize;
    tooltipContent?: Snippet | string;
    tooltipContentProps?: WithoutChildrenOrChild<
      ComponentProps<typeof Tooltip.Content>
    >;
    child?: Snippet<[{ props: Record<string, unknown> }]>;
  } = $props();

  const sidebar = useSidebar();

  const buttonProps = $derived({
    ...restProps,
    class: className,
    "data-ui-component": "sidebar-custom",
    "data-ui-part": "sidebar-menu-button",
    "data-slot": "sidebar-menu-button",
    "data-sidebar": "menu-button",
    "data-variant": variant,
    "data-size": size,
    "data-active": isActive,
  });
</script>

{#snippet Button({ props }: { props?: Record<string, unknown> })}
  {@const mergedProps = mergeProps(buttonProps, props ?? {})}
  {#if child}
    {@render child({ props: mergedProps })}
  {:else}
    <button
      bind:this={ref}
      {...mergedProps}
      data-ui-component="sidebar-custom"
      data-ui-part="sidebar-menu-button"
    >
      {@render children?.()}
    </button>
  {/if}
{/snippet}

{#if !tooltipContent}
  {@render Button({})}
{:else}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        {@render Button({ props })}
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content
      side="right"
      align="center"
      hidden={sidebar.state !== "collapsed" || sidebar.isMobile}
      {...tooltipContentProps}
    >
      {#if typeof tooltipContent === "string"}
        {tooltipContent}
      {:else if tooltipContent}
        {@render tooltipContent()}
      {/if}
    </Tooltip.Content>
  </Tooltip.Root>
{/if}
