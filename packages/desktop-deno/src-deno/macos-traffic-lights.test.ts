import { describe, expect, it, vi } from "vitest";

import {
  createMacosTrafficLightController,
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
