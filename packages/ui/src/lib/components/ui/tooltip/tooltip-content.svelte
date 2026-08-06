<script lang="ts">
  import { Tooltip as TooltipPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";
  import { getContext } from "svelte";
  import {
    disableOverlayPortalContextKey,
    resolveOverlayPortalProps,
    tooltipPortalContextKey,
    type OverlayPortalContext,
  } from "$lib/internal/overlay-portal-context.js";

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 0,
    side = "top",
    children,
    arrowClasses,
    portalProps,
    ...restProps
  }: TooltipPrimitive.ContentProps & {
    arrowClasses?: string;
    portalProps?: TooltipPrimitive.PortalProps;
  } = $props();

  const portalContext = getContext<OverlayPortalContext | undefined>(
    tooltipPortalContextKey,
  );
  const disablePortals =
    getContext<boolean | undefined>(disableOverlayPortalContextKey) ?? false;
</script>

<TooltipPrimitive.Portal
  {...resolveOverlayPortalProps(portalContext, portalProps, disablePortals)}
>
  <TooltipPrimitive.Content
    bind:ref
    data-slot="tooltip-content"
    {sideOffset}
    {side}
    class={cn(
      "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-(--layer-tooltip) w-fit origin-(--bits-tooltip-content-transform-origin) rounded-md bg-[var(--interactive-accent)] px-3 py-1.5 text-xs text-balance text-[var(--text-on-accent)]",
      className,
    )}
    {...restProps}
  >
    {@render children?.()}
    <TooltipPrimitive.Arrow>
      {#snippet child({ props })}
        <div
          class={cn(
            "z-(--layer-tooltip) size-2.5 rotate-45 rounded-[2px] bg-[var(--interactive-accent)]",
            "data-[side=top]:translate-x-1/2 data-[side=top]:translate-y-[calc(-50%_+_2px)]",
            "data-[side=bottom]:translate-x-1/2 data-[side=bottom]:-translate-y-[calc(-50%_+_1px)]",
            "data-[side=right]:translate-x-[calc(50%_+_2px)] data-[side=right]:translate-y-1/2",
            "data-[side=left]:translate-y-[calc(50%_-_3px)]",
            arrowClasses,
          )}
          {...props}
        ></div>
      {/snippet}
    </TooltipPrimitive.Arrow>
  </TooltipPrimitive.Content>
</TooltipPrimitive.Portal>
