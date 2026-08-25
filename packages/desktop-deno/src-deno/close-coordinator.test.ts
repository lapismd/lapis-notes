import { describe, expect, it, vi } from "vitest";

import {
  createDenoCloseCoordinator,
  installDenoWindowCloseRouting,
} from "./close-coordinator";

describe("Deno close coordinator", () => {
  it("defers renderer teardown outside the native close callback", async () => {
    vi.useFakeTimers();
    try {
      const emitBeforeClose = vi.fn();
      const shutdown = vi.fn(async () => {});
      const exit = vi.fn();
      const preventDefault = vi.fn();
      const coordinator = createDenoCloseCoordinator({
        emitBeforeClose,
        shutdown,
        exit,
      });

      coordinator.onWindowClose({ preventDefault });
      expect(preventDefault).toHaveBeenCalledOnce();
      expect(emitBeforeClose).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(0);
      expect(emitBeforeClose).toHaveBeenCalledOnce();
      expect(shutdown).not.toHaveBeenCalled();

      coordinator.rendererReady();
      await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
      expect(preventDefault).toHaveBeenCalledOnce();
      expect(shutdown).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shuts native services down when renderer teardown times out", async () => {
    vi.useFakeTimers();
    try {
      const shutdown = vi.fn(async () => {});
      const exit = vi.fn();
      const coordinator = createDenoCloseCoordinator({
        deferRendererClose: (callback) => callback(),
        emitBeforeClose: vi.fn(),
        shutdown,
        exit,
        timeoutMs: 25,
      });
      coordinator.onWindowClose({ preventDefault: vi.fn() });
      await vi.advanceTimersByTimeAsync(25);
      expect(shutdown).toHaveBeenCalledOnce();
      expect(exit).toHaveBeenCalledWith(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores duplicate close requests and acknowledgements", async () => {
    const emitBeforeClose = vi.fn();
    const shutdown = vi.fn();
    const coordinator = createDenoCloseCoordinator({
      deferRendererClose: (callback) => callback(),
      emitBeforeClose,
      shutdown,
      exit: vi.fn(),
    });
    const event = { preventDefault: vi.fn() };
    coordinator.onWindowClose(event);
    coordinator.onWindowClose(event);
    coordinator.rendererReady();
    coordinator.rendererReady();
    await Promise.resolve();
    expect(emitBeforeClose).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
    expect(shutdown).toHaveBeenCalledOnce();
  });

  it("runs the same handshake for a native acceptance close request", () => {
    const emitBeforeClose = vi.fn();
    const coordinator = createDenoCloseCoordinator({
      deferRendererClose: (callback) => callback(),
      emitBeforeClose,
      shutdown: vi.fn(),
      exit: vi.fn(),
    });
    coordinator.requestClose();
    coordinator.requestClose();
    expect(emitBeforeClose).toHaveBeenCalledOnce();
  });

  it("routes bootstrap and visible window close events through one coordinator", () => {
    const bootstrap = new EventTarget();
    const visible = new EventTarget();
    const coordinator = createDenoCloseCoordinator({
      deferRendererClose: (callback) => callback(),
      emitBeforeClose: vi.fn(),
      shutdown: vi.fn(),
      exit: vi.fn(),
    });
    const onWindowClose = vi.spyOn(coordinator, "onWindowClose");
    const removeRouting = installDenoWindowCloseRouting(coordinator, [
      bootstrap,
      visible,
      visible,
    ]);

    const bootstrapClose = new Event("close", { cancelable: true });
    const visibleClose = new Event("close", { cancelable: true });
    bootstrap.dispatchEvent(bootstrapClose);
    visible.dispatchEvent(visibleClose);

    expect(bootstrapClose.defaultPrevented).toBe(true);
    expect(visibleClose.defaultPrevented).toBe(true);
    expect(onWindowClose).toHaveBeenCalledTimes(2);

    removeRouting();
    visible.dispatchEvent(new Event("close", { cancelable: true }));
    expect(onWindowClose).toHaveBeenCalledTimes(2);
  });
});
