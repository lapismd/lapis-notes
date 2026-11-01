import { describe, expect, it, vi } from "vitest";
import {
  preparePwaUpdate,
  setPwaRuntimeApplication,
  type PwaRuntimeApp,
} from "./pwa-runtime-application";

describe("PWA update persistence boundary", () => {
  it("awaits persistence and keeps a refusal visible to the caller", async () => {
    const app = {} as PwaRuntimeApp;
    const prepare = vi
      .fn()
      .mockRejectedValueOnce(new Error("save refused"))
      .mockResolvedValue(undefined);
    const dispose = setPwaRuntimeApplication(app, prepare);
    try {
      await expect(preparePwaUpdate()).rejects.toThrow("save refused");
      await preparePwaUpdate();
      expect(prepare).toHaveBeenCalledTimes(2);
    } finally {
      dispose();
    }
  });
  it("does not let an old session remove its replacement's update preparation", async () => {
    const old = setPwaRuntimeApplication({} as PwaRuntimeApp, vi.fn());
    const prepare = vi.fn().mockResolvedValue(undefined);
    const current = setPwaRuntimeApplication({} as PwaRuntimeApp, prepare);
    old();
    await preparePwaUpdate();
    expect(prepare).toHaveBeenCalledOnce();
    current();
    await preparePwaUpdate();
    expect(prepare).toHaveBeenCalledOnce();
  });
});
