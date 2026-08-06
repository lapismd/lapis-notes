import "fake-indexeddb/auto";
import { afterEach, vi } from "vitest";

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});
