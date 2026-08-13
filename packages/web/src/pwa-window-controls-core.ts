export const DEFAULT_WCO_INSETS: Record<
  string,
  { top: number; left: number; right: number }
> = {
  macos: { top: 38, left: 78, right: 0 },
  windows: { top: 32, left: 0, right: 138 },
  linux: { top: 32, left: 0, right: 138 },
  unknown: { top: 32, left: 0, right: 0 },
};

export type TitlebarAreaRect = Pick<
  DOMRectReadOnly,
  "height" | "width" | "x" | "y"
>;

export function resolveDefaultInsets(os: string) {
  return DEFAULT_WCO_INSETS[os] ?? DEFAULT_WCO_INSETS.unknown;
}

export function resolveTitlebarTop(rect: TitlebarAreaRect, os: string): number {
  if (rect.height > 0) return Math.round(rect.height);
  if (rect.width === 0 && rect.x === 0 && rect.y === 0) {
    return resolveDefaultInsets(os).top;
  }
  return 0;
}

export function resolveControlInsets(options: {
  os: string;
  rect: TitlebarAreaRect;
  viewportWidth: number;
}): { top: number; left: number; right: number } {
  const { os, rect, viewportWidth } = options;
  const defaults = resolveDefaultInsets(os);
  const top = resolveTitlebarTop(rect, os);
  const rightGap = Math.max(0, Math.round(viewportWidth - rect.x - rect.width));
  const left = rect.x > 0 ? Math.round(rect.x) : os === "macos" ? defaults.left : 0;
  const right =
    rect.x === 0 && rightGap > 0
      ? rightGap
      : (os === "windows" || os === "linux") && rect.x === 0
        ? defaults.right
        : 0;
  return { top, left, right };
}

export const PWA_TITLEBAR_GEOMETRY_CSS_PROPERTIES = [
  "--pwa-titlebar-area-height",
  "--pwa-titlebar-area-width",
  "--pwa-titlebar-area-x",
  "--pwa-titlebar-area-y",
  "--pwa-titlebar-safe-area-top",
  "--pwa-titlebar-safe-area-left",
  "--pwa-titlebar-safe-area-right",
  "--workspace-safe-area-top",
  "--workspace-safe-area-left",
  "--workspace-safe-area-right",
] as const;

export function applyTitlebarAreaGeometry(
  root: HTMLElement,
  rect: DOMRectReadOnly,
  viewportWidth: number,
): { top: number; left: number; right: number } {
  root.style.setProperty("--pwa-titlebar-area-height", `${Math.round(rect.height)}px`);
  root.style.setProperty("--pwa-titlebar-area-width", `${Math.round(rect.width)}px`);
  root.style.setProperty("--pwa-titlebar-area-x", `${Math.round(rect.x)}px`);
  root.style.setProperty("--pwa-titlebar-area-y", `${Math.round(rect.y)}px`);
  const insets = resolveControlInsets({
    os: root.dataset.os ?? "unknown",
    rect,
    viewportWidth,
  });
  root.style.setProperty("--pwa-titlebar-safe-area-top", `${insets.top}px`);
  root.style.setProperty("--pwa-titlebar-safe-area-left", `${insets.left}px`);
  root.style.setProperty("--pwa-titlebar-safe-area-right", `${insets.right}px`);
  root.style.setProperty("--workspace-safe-area-top", `${insets.top}px`);
  root.style.setProperty("--workspace-safe-area-left", `${insets.left}px`);
  root.style.setProperty("--workspace-safe-area-right", `${insets.right}px`);
  return insets;
}

export function clearPwaSafeAreas(root: HTMLElement): void {
  for (const property of PWA_TITLEBAR_GEOMETRY_CSS_PROPERTIES) {
    root.style.removeProperty(property);
  }
}
