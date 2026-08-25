import { describe, expect, it, vi } from "vitest";

import {
  DESKTOP_CLOSE_SIGNAL_PATH,
  waitForDesktopCloseSignal,
} from "./desktop-close-signal";

describe("desktop renderer close signal", () => {
  it("waits on the private same-origin endpoint", async () => {
    const fetchSignal = vi.fn(async () => new Response("close"));
    await expect(waitForDesktopCloseSignal(fetchSignal)).resolves.toBe(true);
    expect(fetchSignal).toHaveBeenCalledWith(DESKTOP_CLOSE_SIGNAL_PATH, {
      cache: "no-store",
    });
  });

  it("does not treat native shutdown release as a close request", async () => {
    const fetchSignal = vi.fn(async () => new Response(null, { status: 204 }));
    await expect(waitForDesktopCloseSignal(fetchSignal)).resolves.toBe(false);
  });
});
