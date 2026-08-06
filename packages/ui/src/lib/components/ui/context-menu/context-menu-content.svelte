<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";
  import { getContext } from "svelte";
  import {
    disableOverlayPortalContextKey,
    contextMenuPortalContextKey,
    resolveOverlayPortalProps,
    type OverlayPortalContext,
  } from "$lib/internal/overlay-portal-context.js";

  let {
    ref = $bindable(null),
    portalProps,
    class: className,
    ...restProps
  }: ContextMenuPrimitive.ContentProps & {
    portalProps?: ContextMenuPrimitive.PortalProps;
  } = $props();

  const portalContext = getContext<OverlayPortalContext | undefined>(
    contextMenuPortalContextKey,
  );
  const disablePortals =
    getContext<boolean | undefined>(disableOverlayPortalContextKey) ?? false;
</script>

<ContextMenuPrimitive.Portal
  {...resolveOverlayPortalProps(portalContext, portalProps, disablePortals)}
>
  <ContextMenuPrimitive.Content
    bind:ref
    data-slot="context-menu-content"
    class={cn(
      "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--bits-context-menu-content-available-height) min-w-[8rem] origin-(--bits-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 [-webkit-app-region:no-drag]",
      className,
    )}
    {...restProps}
  />
</ContextMenuPrimitive.Portal>
