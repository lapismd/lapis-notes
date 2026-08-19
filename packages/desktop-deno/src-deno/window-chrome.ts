export const DESKTOP_WINDOW_TITLE = "Lapis Notes";
export const DESKTOP_WINDOW_SIZE = { width: 1280, height: 800 } as const;

export function createDesktopWindowOptions(os: string): {
  title: string;
  width: number;
  height: number;
  transparentTitlebar: boolean;
} {
  const hiddenTitlebar = os === "darwin";
  return {
    title: hiddenTitlebar ? "" : DESKTOP_WINDOW_TITLE,
    width: DESKTOP_WINDOW_SIZE.width,
    height: DESKTOP_WINDOW_SIZE.height,
    transparentTitlebar: hiddenTitlebar,
  };
}

export function needsCreatedChromeWindow(os: string): boolean {
  return os === "darwin";
}

export function usesOverlayWindowControls(): boolean {
  return false;
}

export function rendererOriginFromServeAddress(
  raw: string | undefined,
): string {
  const match = raw?.match(/^tcp:(.+)$/u);
  if (!match) {
    throw new Error(`Invalid DENO_SERVE_ADDRESS: ${raw ?? ""}`);
  }
  return `http://${match[1]}/`;
}
