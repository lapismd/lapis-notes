export const DESKTOP_WINDOW_TITLE = "Lapis Notes";
export const DESKTOP_WINDOW_SIZE = { width: 1280, height: 800 } as const;

let overlayWindowControls = false;

export function createDesktopWindowOptions(os: string): {
  title: string;
  width: number;
  height: number;
  frameless: boolean;
  transparentTitlebar: boolean;
} {
  const chromeless = os === "darwin";
  return {
    title: chromeless ? "" : DESKTOP_WINDOW_TITLE,
    width: DESKTOP_WINDOW_SIZE.width,
    height: DESKTOP_WINDOW_SIZE.height,
    frameless: chromeless,
    transparentTitlebar: false,
  };
}

export function needsCreatedChromeWindow(os: string): boolean {
  return os === "darwin";
}

export function setOverlayWindowControls(enabled: boolean): void {
  overlayWindowControls = enabled;
}

export function usesOverlayWindowControls(): boolean {
  return overlayWindowControls;
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
