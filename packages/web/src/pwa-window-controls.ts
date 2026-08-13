import {
  applyTitlebarAreaGeometry,
  clearPwaSafeAreas,
} from "./pwa-window-controls-core";

type WindowControlsOverlay = {
  getTitlebarAreaRect(): DOMRectReadOnly;
  addEventListener(type: "geometrychange", listener: EventListener): void;
  removeEventListener(type: "geometrychange", listener: EventListener): void;
};

type NavigatorWithWindowControlsOverlay = Navigator & {
  windowControlsOverlay?: WindowControlsOverlay;
};

const DISPLAY_MODE_QUERIES = [
  "(display-mode: window-controls-overlay)",
  "(display-mode: standalone)",
  "(display-mode: minimal-ui)",
] as const;

function isWindowControlsOverlayDisplayMode(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia(DISPLAY_MODE_QUERIES[0]).matches
  );
}

function resolvePwaDisplayMode(): string | undefined {
  if (typeof globalThis.matchMedia !== "function") return undefined;
  if (isWindowControlsOverlayDisplayMode()) return "window-controls-overlay";
  if (globalThis.matchMedia(DISPLAY_MODE_QUERIES[1]).matches) return "standalone";
  if (globalThis.matchMedia(DISPLAY_MODE_QUERIES[2]).matches) return "minimal-ui";
  return undefined;
}

export function syncPwaTitlebarHidden(
  root: HTMLElement,
  wcoDisplayMode: boolean,
): void {
  if (root.dataset.pwaHost !== "true") {
    delete root.dataset.pwaTitlebarHidden;
    return;
  }
  root.dataset.pwaTitlebarHidden = wcoDisplayMode ? "true" : "false";
}

export function syncTitlebarAreaGeometry(
  overlay: WindowControlsOverlay | undefined,
): void {
  const root = document.documentElement;
  const wcoDisplayMode = isWindowControlsOverlayDisplayMode();
  const displayMode = resolvePwaDisplayMode();
  if (displayMode) root.dataset.pwaDisplayMode = displayMode;
  else delete root.dataset.pwaDisplayMode;
  syncPwaTitlebarHidden(root, wcoDisplayMode);
  if (!wcoDisplayMode) {
    clearPwaSafeAreas(root);
    return;
  }
  const rect = overlay?.getTitlebarAreaRect() ?? new DOMRect(0, 0, 0, 0);
  applyTitlebarAreaGeometry(root, rect, window.innerWidth);
}

export function registerPwaWindowControlsOverlay(): () => void {
  const overlay = (navigator as NavigatorWithWindowControlsOverlay)
    .windowControlsOverlay;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const sync = () => syncTitlebarAreaGeometry(overlay);
  const scheduleSync = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(sync, 100);
  };
  sync();
  requestAnimationFrame(sync);
  window.addEventListener("resize", scheduleSync);
  overlay?.addEventListener("geometrychange", scheduleSync);
  const mediaCleanups = DISPLAY_MODE_QUERIES.map((query) => {
    const media = globalThis.matchMedia?.(query);
    media?.addEventListener("change", sync);
    return () => media?.removeEventListener("change", sync);
  });
  const cleanup = () => {
    if (timeoutId) clearTimeout(timeoutId);
    window.removeEventListener("resize", scheduleSync);
    overlay?.removeEventListener("geometrychange", scheduleSync);
    mediaCleanups.forEach((dispose) => dispose());
  };
  window.addEventListener("pagehide", cleanup, { once: true });
  return cleanup;
}
