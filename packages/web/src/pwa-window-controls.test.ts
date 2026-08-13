import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyTitlebarAreaGeometry,
  clearPwaSafeAreas,
  resolveControlInsets,
  resolveTitlebarTop,
} from "./pwa-window-controls-core";
import {
  syncPwaTitlebarHidden,
  syncTitlebarAreaGeometry,
} from "./pwa-window-controls";

describe("PWA window controls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.pwaHost;
    delete document.documentElement.dataset.pwaTitlebarHidden;
    delete document.documentElement.dataset.pwaDisplayMode;
    clearPwaSafeAreas(document.documentElement);
  });

  it("uses live titlebar geometry and recognizes a collapsed overlay", () => {
    expect(
      resolveTitlebarTop({ height: 38, width: 1200, x: 78, y: 0 }, "macos"),
    ).toBe(38);
    expect(
      resolveTitlebarTop({ height: 0, width: 1200, x: 78, y: 0 }, "macos"),
    ).toBe(0);
  });

  it("keeps macOS traffic-light clearance when the titlebar collapses", () => {
    expect(
      resolveControlInsets({
        os: "macos",
        rect: { height: 0, width: 1200, x: 78, y: 0 },
        viewportWidth: 1200,
      }),
    ).toEqual({ top: 0, left: 78, right: 0 });
  });

  it("reserves Windows caption-button space on the right", () => {
    expect(
      resolveControlInsets({
        os: "windows",
        rect: { height: 32, width: 1062, x: 0, y: 0 },
        viewportWidth: 1200,
      }),
    ).toEqual({ top: 32, left: 0, right: 138 });
  });

  it("sets and clears the hidden-titlebar marker explicitly", () => {
    const root = document.createElement("html");
    root.dataset.pwaHost = "true";
    syncPwaTitlebarHidden(root, true);
    expect(root.dataset.pwaTitlebarHidden).toBe("true");
    syncPwaTitlebarHidden(root, false);
    expect(root.dataset.pwaTitlebarHidden).toBe("false");

    delete root.dataset.pwaHost;
    syncPwaTitlebarHidden(root, true);
    expect(root.dataset.pwaTitlebarHidden).toBeUndefined();
  });

  it("synchronizes display mode and writes safe-area custom properties", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(display-mode: window-controls-overlay)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    document.documentElement.dataset.pwaHost = "true";
    document.documentElement.dataset.os = "macos";
    const rect = new DOMRect(78, 0, 1122, 38);

    syncTitlebarAreaGeometry({ getTitlebarAreaRect: () => rect } as never);
    expect(document.documentElement.dataset.pwaTitlebarHidden).toBe("true");
    expect(
      document.documentElement.style.getPropertyValue(
        "--workspace-safe-area-left",
      ),
    ).toBe("78px");

    const detached = document.createElement("html");
    detached.dataset.os = "macos";
    expect(applyTitlebarAreaGeometry(detached, rect, 1200)).toEqual({
      top: 38,
      left: 78,
      right: 0,
    });
  });
});
