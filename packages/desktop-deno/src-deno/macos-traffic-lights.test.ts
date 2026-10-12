import { describe, expect, it, vi } from "vitest";

import {
  createMacosTrafficLightController,
  selectMacosTrafficLightWindow,
  installMacosTrafficLightAlignment,
  type MacosTrafficLightButton,
  type MacosTrafficLightDriver,
} from "./macos-traffic-lights";

function createDriver() {
  const buttons: MacosTrafficLightButton[] = [0, 1, 2].map((kind) => ({
    id: String(kind),
    handle: kind,
  }));
  const frames = new Map(
    buttons.map((button, index) => [
      button.id,
      { x: 8 + index * 20, y: 8, width: 14, height: 14 },
    ]),
  );
  const setOrigin = vi.fn((button, origin) => {
    frames.set(button.id, { ...frames.get(button.id)!, ...origin });
  });
  const driver: MacosTrafficLightDriver = {
    buttons: () => buttons,
    frame: (button) => frames.get(button.id)!,
    setOrigin,
    close: vi.fn(),
  };
  return { buttons, frames, setOrigin, driver };
}

describe("macOS native traffic-light alignment", () => {
  it("moves only the three native buttons down by one bounded offset", () => {
    const { frames, setOrigin, driver } = createDriver();
    const controller = createMacosTrafficLightController({
      platform: "darwin",
      driver,
      verticalOffset: 6,
    });

    expect(controller.apply()).toBe(3);
    expect(setOrigin).toHaveBeenNthCalledWith(1, expect.anything(), {
      x: 8,
      y: 2,
    });
    expect([...frames.values()].map(({ y }) => y)).toEqual([2, 2, 2]);
  });

  it.each([
    [22, -6],
    [28, 0],
    [32, 4],
  ])(
    "centres controls using a %ipx native titlebar container",
    (parentHeight, originY) => {
      const { frames, driver } = createDriver();
      for (const [id, frame] of frames)
        frames.set(id, { ...frame, y: 6, height: 16 });
      const nativeDriver = {
        ...driver,
        targetOrigin: (button: MacosTrafficLightButton) => ({
          x: frames.get(button.id)!.x,
          y: originY,
        }),
      };
      const controller = createMacosTrafficLightController({
        platform: "darwin",
        driver: nativeDriver,
      });
      controller.apply();
      for (const frame of frames.values())
        expect(parentHeight - (frame.y + frame.height / 2)).toBe(20);
      expect(controller.apply()).toBe(0);
    },
  );

  it("realigns when the container changes without resetting button frames", () => {
    const { frames, driver } = createDriver();
    let originY = 0;
    const nativeDriver = {
      ...driver,
      targetOrigin: (button: MacosTrafficLightButton) => ({
        x: frames.get(button.id)!.x,
        y: originY,
      }),
    };
    const controller = createMacosTrafficLightController({
      platform: "darwin",
      driver: nativeDriver,
    });
    controller.apply();
    originY = 4;
    expect(controller.apply()).toBe(3);
    expect([...frames.values()].map((frame) => frame.y)).toEqual([4, 4, 4]);
  });

  it("is idempotent and reapplies from a fresh native relayout", () => {
    const { frames, setOrigin, driver } = createDriver();
    const controller = createMacosTrafficLightController({
      platform: "darwin",
      driver,
      verticalOffset: 6,
    });

    controller.apply();
    expect(controller.apply()).toBe(0);
    expect(setOrigin).toHaveBeenCalledTimes(3);

    for (const [id, frame] of frames) frames.set(id, { ...frame, y: 8 });
    expect(controller.apply()).toBe(3);
    expect([...frames.values()].map(({ y }) => y)).toEqual([2, 2, 2]);
  });

  it("does nothing outside macOS and closes its native driver", () => {
    const { setOrigin, driver } = createDriver();
    const controller = createMacosTrafficLightController({
      platform: "linux",
      driver,
    });

    expect(controller.apply()).toBe(0);
    expect(setOrigin).not.toHaveBeenCalled();
    controller.close();
    expect(driver.close).toHaveBeenCalledOnce();
  });
});

describe("macOS chrome window selection", () => {
  it("skips the parked bootstrap and selects the visible overlay window", () => {
    expect(
      selectMacosTrafficLightWindow([
        { window: "bootstrap", visible: false, transparentTitlebar: false },
        { window: "workspace", visible: true, transparentTitlebar: true },
      ]),
    ).toBe("workspace");
  });
  it("never moves controls on a framed About window", () => {
    expect(
      selectMacosTrafficLightWindow([
        { window: "about", visible: true, transparentTitlebar: false },
        { window: "workspace", visible: true, transparentTitlebar: true },
      ]),
    ).toBe("workspace");
    expect(
      selectMacosTrafficLightWindow([
        { window: "about", visible: true, transparentTitlebar: false },
      ]),
    ).toBeUndefined();
  });
});

describe("native traffic-light alignment lifecycle", () => {
  it("reapplies after focus relayout and removes events and delayed work on close", async () => {
    vi.useFakeTimers();
    const window = new EventTarget();
    const apply = vi.fn();
    const dispose = installMacosTrafficLightAlignment(window, apply);
    try {
      await Promise.resolve();
      await vi.runAllTimersAsync();
      apply.mockClear();
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
      await vi.runAllTimersAsync();
      expect(apply).toHaveBeenCalledTimes(2);
      apply.mockClear();
      window.dispatchEvent(new Event("resize"));
      dispose();
      await Promise.resolve();
      await vi.runAllTimersAsync();
      window.dispatchEvent(new Event("load"));
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
      await vi.runAllTimersAsync();
      expect(apply).not.toHaveBeenCalled();
    } finally {
      dispose();
      vi.useRealTimers();
    }
  });
});
