export type OverlayPortalContext = {
  portalTarget: Element | null;
};

type OverlayPortalProps = {
  to?: Element | string;
  disabled?: boolean;
};

export function createOverlayPortalContext(): OverlayPortalContext {
  return { portalTarget: null };
}

export function resolveOverlayPortalTarget(
  portalContext: OverlayPortalContext | undefined,
): Element | undefined {
  return portalContext?.portalTarget ?? undefined;
}

function isCrossRealmElement(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "nodeType" in value &&
    (value as { nodeType: number }).nodeType === 1 &&
    !(value instanceof Element)
  );
}

export function resolveOverlayPortalProps(
  portalContext: OverlayPortalContext | undefined,
  portalProps?: OverlayPortalProps,
  disablePortals = false,
): OverlayPortalProps | undefined {
  if (portalProps) {
    return portalProps;
  }

  if (disablePortals) {
    return { disabled: true };
  }

  const target = portalContext?.portalTarget;
  if (!target) {
    return undefined;
  }

  if (target instanceof Element) {
    return { to: target };
  }

  if (isCrossRealmElement(target)) {
    return { disabled: true };
  }

  return undefined;
}

export const dropdownMenuPortalContextKey = Symbol(
  "dropdown-menu-portal-context",
);
export const disableOverlayPortalContextKey = Symbol("disable-overlay-portals");
export const contextMenuPortalContextKey = Symbol(
  "context-menu-portal-context",
);
export const hoverCardPortalContextKey = Symbol("hover-card-portal-context");
export const tooltipPortalContextKey = Symbol("tooltip-portal-context");
export const popoverPortalContextKey = Symbol("popover-portal-context");
export const selectPortalContextKey = Symbol("select-portal-context");
