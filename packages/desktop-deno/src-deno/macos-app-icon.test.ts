import { describe, expect, it, vi } from "vitest";

import {
  createDesktopAppIconController,
  type MacosAppIconDriver,
} from "./macos-app-icon";

function createDriver(): MacosAppIconDriver {
  return {
    setApplicationIcon: vi.fn(),
    close: vi.fn(),
  };
}

describe("macOS desktop application icon", () => {
  it("applies each appearance once and retains an explicit fallback asset", () => {
    const driver = createDriver();
    const icons = {
      light: new Uint8Array([1]),
      dark: new Uint8Array([2]),
    };
    const controller = createDesktopAppIconController({
      platform: "darwin",
      driver,
      icons,
    });

    expect(controller.apply("light")).toBe(true);
    expect(controller.apply("light")).toBe(false);
    expect(controller.apply("dark")).toBe(true);
    expect(driver.setApplicationIcon).toHaveBeenNthCalledWith(1, icons.light);
    expect(driver.setApplicationIcon).toHaveBeenNthCalledWith(2, icons.dark);
  });

  it("rejects invalid appearances and does nothing outside macOS", () => {
    const driver = createDriver();
    const icons = {
      light: new Uint8Array([1]),
      dark: new Uint8Array([2]),
    };
    const mac = createDesktopAppIconController({
      platform: "darwin",
      driver,
      icons,
    });
    const linux = createDesktopAppIconController({
      platform: "linux",
      driver,
      icons,
    });

    expect(() => mac.apply("sepia")).toThrow("Unsupported desktop app icon");
    expect(linux.apply("dark")).toBe(false);
    expect(driver.setApplicationIcon).not.toHaveBeenCalled();
    linux.close();
    expect(driver.close).toHaveBeenCalledOnce();
  });
});
