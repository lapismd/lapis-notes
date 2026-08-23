import { describe, expect, it, vi } from "vitest";

import { createDenoCloseCoordinator } from "./close-coordinator";

describe("Deno close coordinator", () => {
  it("prevents the first close until renderer teardown is ready", async () => {
    const emitBeforeClose = vi.fn();
    const requestWindowClose = vi.fn();
    const shutdown = vi.fn(async () => {});
    const exit = vi.fn();
    const preventDefault = vi.fn();
    const coordinator = createDenoCloseCoordinator({
      emitBeforeClose,
      requestWindowClose,
      shutdown,
      exit,
    });

    coordinator.onWindowClose({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitBeforeClose).toHaveBeenCalledOnce();
    expect(shutdown).not.toHaveBeenCalled();

    coordinator.rendererReady();
    await Promise.resolve();
    expect(requestWindowClose).toHaveBeenCalledOnce();
    coordinator.onWindowClose({ preventDefault });
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(shutdown).toHaveBeenCalledOnce();
  });

  it("shuts native services down when renderer teardown times out", async () => {
    vi.useFakeTimers();
    try {
      const shutdown = vi.fn(async () => {});
      const exit = vi.fn();
      const coordinator = createDenoCloseCoordinator({
        emitBeforeClose: vi.fn(),
        requestWindowClose: vi.fn(),
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
    const requestWindowClose = vi.fn();
    const coordinator = createDenoCloseCoordinator({
      emitBeforeClose,
      requestWindowClose,
      shutdown: vi.fn(),
      exit: vi.fn(),
    });
    const event = { preventDefault: vi.fn() };
    coordinator.onWindowClose(event);
    coordinator.onWindowClose(event);
    coordinator.rendererReady();
    coordinator.rendererReady();
    await Promise.resolve();
    expect(emitBeforeClose).toHaveBeenCalledOnce();
    expect(requestWindowClose).toHaveBeenCalledOnce();
  });
});
