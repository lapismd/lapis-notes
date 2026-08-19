export const DESKTOP_WINDOW_TITLE = "Lapis Notes";
export const DESKTOP_WINDOW_SIZE = { width: 1280, height: 800 } as const;
export const MINIMUM_DENO_DESKTOP_VERSION = "2.9.5";

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
    frameless: false,
    transparentTitlebar: chromeless,
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

export function supportsDenoDesktopVersion(version: string): boolean {
  const current = version.split(/[.-]/u).slice(0, 3).map(Number);
  const minimum = MINIMUM_DENO_DESKTOP_VERSION.split(".").map(Number);
  if (
    current.length !== 3 ||
    current.some((part) => !Number.isInteger(part) || part < 0)
  ) {
    return false;
  }

  for (let index = 0; index < minimum.length; index += 1) {
    if (current[index] > minimum[index]) return true;
    if (current[index] < minimum[index]) return false;
  }
  return true;
}

export function assertSupportedDenoDesktopVersion(version: string): void {
  if (supportsDenoDesktopVersion(version)) return;
  throw new Error(
    `Lapis Notes desktop requires Deno ${MINIMUM_DENO_DESKTOP_VERSION} or later; received ${version}.`,
  );
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
