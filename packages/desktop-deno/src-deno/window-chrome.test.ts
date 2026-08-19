import { describe, expect, it } from "vitest";

import {
  DESKTOP_WINDOW_TITLE,
  MINIMUM_DENO_DESKTOP_VERSION,
  assertSupportedDenoDesktopVersion,
  createDesktopWindowOptions,
  needsCreatedChromeWindow,
  rendererOriginFromServeAddress,
  setOverlayWindowControls,
  supportsDenoDesktopVersion,
  usesOverlayWindowControls,
} from "./window-chrome";

describe("Deno desktop window chrome", () => {
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
