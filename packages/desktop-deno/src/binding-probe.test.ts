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

  it("recovers when bindings appear after the document was parsed", async () => {
    const bindings = {
      invoke: vi.fn().mockResolvedValue({ name: "Lapis Notes" }),
    };
    const readBindings = vi
      .fn<() => typeof bindings | null>()
      .mockReturnValueOnce(null)
      .mockReturnValue(bindings);

    await expect(
      waitForDesktopBindings({
        readBindings,
        presentAtParse: false,
        timeoutMs: 100,
        retryDelayMs: 0,
      }),
    ).resolves.toBe(bindings);
    expect(readBindings).toHaveBeenCalledTimes(2);
  });

  it("fails after the bounded deadline outside a Deno desktop document", async () => {
    await expect(
      waitForDesktopBindings({
        readBindings: () => null,
        presentAtParse: false,
        timeoutMs: 5,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/opening the Vite port in a browser/u);
  });
});
