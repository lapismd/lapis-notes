<script lang="ts">
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { type WithElementRef } from "$lib/utils.js";
  import { untrack } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import {
    SIDEBAR_COOKIE_MAX_AGE,
    SIDEBAR_COOKIE_NAME,
    SIDEBAR_WIDTH,
    SIDEBAR_WIDTH_ICON,
  } from "./constants.js";
  import { setSidebar, SidebarState } from "./context.svelte.js";
  import "./sidebar-custom.css";

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
    {...restProps}
    data-ui-component="sidebar-custom"
    data-ui-part="sidebar-wrapper"
    data-slot="sidebar-wrapper"
    style="--sidebar-width: {sidebar.size}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
    class={className}
    bind:this={ref}
  >
    {@render children?.()}
  </div>
</Tooltip.Provider>
