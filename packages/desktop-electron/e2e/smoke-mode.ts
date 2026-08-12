/**
 * Fixed renderer dev server URL for local desktop smoke (matches
 * vite.config.ts).
 */
export const DESKTOP_SMOKE_DEV_SERVER_URL = "http://127.0.0.1:1421";

/**
 * When set, desktop smoke always runs the full production build (CI and
 * release).
 */
export function isCiDesktopSmoke(): boolean {
  if (process.env["LAPIS_SMOKE_DESKTOP_FULL_BUILD"] === "1") {
    return true;
  }

  const ci = process.env["CI"]?.trim().toLowerCase();
  if (ci === "true" || ci === "1") {
    return true;
  }

  return process.env["GITHUB_ACTIONS"] === "true";
}

/** Local agent smoke uses the Vite dev server; CI uses the packaged renderer. */
export function usesDesktopDevRenderer(): boolean {
  return !isCiDesktopSmoke();
}
