import { describe, expect, it, vi } from "vitest";

import {
  closeMacosWindowsByTitle,
  type MacosNativeWindowDriver,
} from "./macos-window-close";

function createDriver() {
  const close = vi.fn();
  const windows = [
    { id: "main", title: "Lapis Notes", handle: {} },
    { id: "about-1", title: "About Lapis Notes", handle: {} },
    { id: "about-2", title: "About Lapis Notes", handle: {} },
  ];
  const driver: MacosNativeWindowDriver = {
    windows: () => windows,
    close,
    dispose: vi.fn(),
  };
  return { close, driver, windows };
}

describe("macOS native window close", () => {
  it("closes every exact title match without touching the main window", () => {
    const { close, driver, windows } = createDriver();

    expect(
      closeMacosWindowsByTitle({
        platform: "darwin",
        title: "About Lapis Notes",
        driver,
      }),
    ).toBe(2);
    expect(close).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenNthCalledWith(1, windows[1]);
    expect(close).toHaveBeenNthCalledWith(2, windows[2]);
  });

  it("does nothing on other platforms or without a match", () => {
    const { close, driver } = createDriver();

    expect(
      closeMacosWindowsByTitle({
        platform: "linux",
        title: "About Lapis Notes",
        driver,
      }),
    ).toBe(0);
    expect(
      closeMacosWindowsByTitle({
        platform: "darwin",
        title: "Settings",
        driver,
      }),
    ).toBe(0);
    expect(close).not.toHaveBeenCalled();
  });
});
