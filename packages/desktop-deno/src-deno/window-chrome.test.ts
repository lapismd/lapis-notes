import { describe, expect, it } from "vitest";

import {
  DESKTOP_WINDOW_TITLE,
  MINIMUM_DENO_DESKTOP_VERSION,
  assertSupportedDenoDesktopVersion,
  createDesktopWindowOptions,
  needsCreatedChromeWindow,
  rendererOriginFromServeAddress,
  rendererEntryUrl,
  isParkedBootstrapRequest,
  setOverlayWindowControls,
  supportsDenoDesktopVersion,
  usesOverlayWindowControls,
} from "./window-chrome";

describe("Deno desktop window chrome", () => {
  it("isolates the visible macOS renderer from automatic bootstrap navigation", () => {
    const origin = "http://127.0.0.1:55755/";
    const visible = rendererEntryUrl(origin, true);
    expect(visible).not.toBe(origin);
    expect(isParkedBootstrapRequest(origin, true)).toBe(true);
    expect(isParkedBootstrapRequest(visible, true)).toBe(false);
    expect(isParkedBootstrapRequest(`${origin}index.html`, true)).toBe(true);
    expect(isParkedBootstrapRequest(`${origin}assets/main.js`, true)).toBe(
      false,
    );
    expect(isParkedBootstrapRequest(`${origin}about.html`, true)).toBe(false);
  });

  it("preserves the framed host renderer entry", () => {
    const origin = "http://127.0.0.1:55755/";
    expect(rendererEntryUrl(origin, false)).toBe(origin);
    expect(isParkedBootstrapRequest(origin, false)).toBe(false);
  });

  it("creates a chromeless macOS window and keeps other platforms framed", () => {
    expect(createDesktopWindowOptions("darwin")).toMatchObject({
      title: "",
      frameless: false,
      transparentTitlebar: true,
    });
    expect(createDesktopWindowOptions("linux")).toMatchObject({
      title: DESKTOP_WINDOW_TITLE,
      frameless: false,
      transparentTitlebar: false,
    });
    expect(needsCreatedChromeWindow("darwin")).toBe(true);
    expect(needsCreatedChromeWindow("linux")).toBe(false);
    setOverlayWindowControls(true);
    expect(usesOverlayWindowControls()).toBe(true);
    setOverlayWindowControls(false);
    expect(usesOverlayWindowControls()).toBe(false);
  });

  it("requires the Deno release with hidden-inset chrome and fixed bindings", () => {
    expect(MINIMUM_DENO_DESKTOP_VERSION).toBe("2.9.5");
    expect(supportsDenoDesktopVersion("2.9.4")).toBe(false);
    expect(supportsDenoDesktopVersion("2.9.5")).toBe(true);
    expect(supportsDenoDesktopVersion("2.10.0")).toBe(true);
    expect(supportsDenoDesktopVersion("invalid")).toBe(false);
    expect(() => assertSupportedDenoDesktopVersion("2.9.4")).toThrow(
      /requires Deno 2\.9\.5 or later/u,
    );
    expect(() => assertSupportedDenoDesktopVersion("2.9.5")).not.toThrow();
  });

  it("builds the renderer origin from DENO_SERVE_ADDRESS", () => {
    expect(rendererOriginFromServeAddress("tcp:127.0.0.1:55755")).toBe(
      "http://127.0.0.1:55755/",
    );
    expect(() => rendererOriginFromServeAddress(undefined)).toThrow(
      /DENO_SERVE_ADDRESS/,
    );
  });
});
