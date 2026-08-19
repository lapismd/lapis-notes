import { describe, expect, it } from "vitest";

import {
  DESKTOP_WINDOW_TITLE,
  PARKED_WINDOW_URL,
  createDesktopWindowOptions,
  needsCreatedChromeWindow,
  rendererOriginFromServeAddress,
  usesOverlayWindowControls,
} from "./window-chrome";

describe("Deno desktop window chrome", () => {
  it("creates a chromeless macOS window and keeps other platforms framed", () => {
    expect(createDesktopWindowOptions("darwin")).toMatchObject({
      title: "",
      frameless: true,
      transparentTitlebar: false,
    });
    expect(createDesktopWindowOptions("linux")).toMatchObject({
      title: DESKTOP_WINDOW_TITLE,
      frameless: false,
      transparentTitlebar: false,
    });
    expect(needsCreatedChromeWindow("darwin")).toBe(false);
    expect(needsCreatedChromeWindow("linux")).toBe(false);
    expect(usesOverlayWindowControls()).toBe(false);
    expect(PARKED_WINDOW_URL).toBe("about:blank");
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
