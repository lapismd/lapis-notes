import { describe, expect, it } from "vitest";

import {
  createDesktopWindowOptions,
  needsCreatedChromeWindow,
  rendererOriginFromServeAddress,
  usesOverlayWindowControls,
} from "./window-chrome";

describe("Deno desktop window chrome", () => {
  it("hides the macOS title bar without overlaying traffic lights", () => {
    expect(createDesktopWindowOptions("darwin").transparentTitlebar).toBe(true);
    expect(createDesktopWindowOptions("linux").transparentTitlebar).toBe(false);
    expect(needsCreatedChromeWindow("darwin")).toBe(true);
    expect(needsCreatedChromeWindow("linux")).toBe(false);
    expect(usesOverlayWindowControls()).toBe(false);
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
