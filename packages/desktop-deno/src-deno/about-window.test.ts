import { describe, expect, it, vi } from "vitest";

import { DESKTOP_APPLICATION_INFO } from "./application-info";
import {
  DESKTOP_ABOUT_WINDOW_SIZE,
  createDesktopAboutWindowManager,
} from "./about-window";

class FakeAboutWindow extends EventTarget {
  readonly bindings = new Map<string, (...args: unknown[]) => unknown>();
  readonly navigate = vi.fn();
  readonly show = vi.fn();
  readonly focus = vi.fn();
  closed = false;

  bind(name: string, handler: (...args: unknown[]) => unknown): void {
    this.bindings.set(name, handler);
  }

  close(): void {
    this.closed = true;
    this.dispatchEvent(new Event("close"));
  }

  isClosed(): boolean {
    return this.closed;
  }
}

describe("Deno desktop About window", () => {
  it("creates one small branded window and focuses it on repeated open", () => {
    const windows: FakeAboutWindow[] = [];
    const createWindow = vi.fn((options) => {
      expect(options).toMatchObject({
        title: "About Lapis Notes",
        ...DESKTOP_ABOUT_WINDOW_SIZE,
        resizable: false,
      });
      const window = new FakeAboutWindow();
      windows.push(window);
      return window;
    });
    const manager = createDesktopAboutWindowManager({
      createWindow,
      rendererOrigin: "http://127.0.0.1:48123/",
      applicationInfo: DESKTOP_APPLICATION_INFO,
    });

    manager.open();
    manager.open();

    expect(createWindow).toHaveBeenCalledTimes(1);
    expect(windows[0].navigate).toHaveBeenCalledWith(
      "http://127.0.0.1:48123/about.html",
    );
    expect(windows[0].show).toHaveBeenCalledTimes(2);
    expect(windows[0].focus).toHaveBeenCalledTimes(2);
    expect(windows[0].bindings.get("aboutInfo")?.()).toEqual(
      DESKTOP_APPLICATION_INFO,
    );
    expect(manager.hasOpenWindow()).toBe(true);
  });

  it("closes independently and creates a fresh window after native dismissal", async () => {
    const windows: FakeAboutWindow[] = [];
    const manager = createDesktopAboutWindowManager({
      createWindow() {
        const window = new FakeAboutWindow();
        windows.push(window);
        return window;
      },
      rendererOrigin: "http://127.0.0.1:48123/",
      applicationInfo: DESKTOP_APPLICATION_INFO,
    });

    manager.open();
    windows[0].bindings.get("closeAboutWindow")?.();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(windows[0].closed).toBe(true);
    expect(manager.hasOpenWindow()).toBe(false);

    manager.open();
    expect(windows).toHaveLength(2);
  });
});
