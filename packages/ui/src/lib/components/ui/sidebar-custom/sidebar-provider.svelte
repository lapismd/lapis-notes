<script lang="ts">
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { cn, type WithElementRef } from "$lib/utils.js";
  import { untrack } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import {
    SIDEBAR_COOKIE_MAX_AGE,
    SIDEBAR_COOKIE_NAME,
    SIDEBAR_WIDTH,
    SIDEBAR_WIDTH_ICON,
  } from "./constants.js";
  import { setSidebar, SidebarState } from "./context.svelte.js";

  let {
    ref = $bindable(null),
    open = $bindable(true),
    onOpenChange = () => {},
    id = "left",
    initialWidth = SIDEBAR_WIDTH,
    sidebarState,
    controlledOpen = false,
    class: className,
    style,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    controlledOpen?: boolean;
    sidebarState?: SidebarState;
    id: string;
    initialWidth?: string;
  } = $props();

  const sidebar = untrack(() =>
    setSidebar(
      sidebarState ?? {
        initialWidth,
        id,
        open: () => open,
        setOpen: (value: boolean) => {
          if (controlledOpen) {
            onOpenChange(value);
          } else {
            open = value;
            onOpenChange(value);
          }

          // This sets the cookie to keep the sidebar state.
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        },
      },
    ),
  );
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
  <div
    data-slot="sidebar-wrapper"
    style="--sidebar-width: {sidebar.size}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
    class={cn(
      "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
      className,
    )}
    bind:this={ref}
    {...restProps}
  >
    {@render children?.()}
  </div>
</Tooltip.Provider>
