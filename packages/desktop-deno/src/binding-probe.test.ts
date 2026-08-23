import { describe, expect, it, vi } from "vitest";

import { waitForDesktopBindings } from "./binding-probe";

describe("Deno desktop binding probe", () => {
  it("retries when the first WebView binding return remains pending", async () => {
    const invoke = vi
      .fn<() => Promise<unknown>>()
      .mockImplementationOnce(() => new Promise(() => undefined))
      .mockResolvedValueOnce({ name: "Lapis Notes" });
    const bindings = { invoke };

    await expect(
      waitForDesktopBindings({
        readBindings: () => bindings,
        timeoutMs: 100,
        probeTimeoutMs: 5,
        retryDelayMs: 0,
      }),
    ).resolves.toBe(bindings);
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it("fails immediately outside a Deno desktop document", async () => {
    await expect(
      waitForDesktopBindings({
        readBindings: () => null,
        presentAtParse: false,
      }),
    ).rejects.toThrow(/opening the Vite port in a browser/u);
  });
});
