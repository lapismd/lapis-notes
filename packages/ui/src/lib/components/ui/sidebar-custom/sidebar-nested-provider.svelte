<script lang="ts">
  import type { WithElementRef } from "bits-ui";
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
    id,
    sidebarState,
    style,
    initialWidth = SIDEBAR_WIDTH,
    onOpenChange = () => {},
    controlledOpen = false,
    collapsedSize,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    controlledOpen?: boolean;
    sidebarState?: SidebarState;
    collapsedSize?: string;
    initialWidth?: string;
    id: string;
  } = $props();

  let sidebar = untrack(() =>
    setSidebar(
      sidebarState ?? {
        id,
        collapsedSize,
        open: () => open,
        setOpen: (value: boolean) => {
          if (controlledOpen) {
            onOpenChange(value);
          } else {
            open = value;
            onOpenChange(value);
          }

          // This sets the cookie to keep the sidebar state.
          document.cookie = `${SIDEBAR_COOKIE_NAME}${id ? `:${id}` : ""}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        },
      },
    ),
  );
</script>

<div
  style="--sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}; --sidebar-width: {sidebar.width};"
  {...restProps}
>
  {@render children?.()}
</div>
