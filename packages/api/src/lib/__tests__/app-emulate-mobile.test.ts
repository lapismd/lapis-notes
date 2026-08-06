import { describe, expect, it, vi } from "vitest";
import { App } from "../context.svelte";

describe("App.emulateMobile", () => {
  it("sets mobile mode to always by default and reloads", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const reload = vi.fn();
    const app = {
      configuration: {
        getConfiguration: () => ({ update }),
      },
    } as unknown as App;

    vi.stubGlobal("window", { location: { reload } });

    await App.prototype.emulateMobile.call(app);

    expect(update).toHaveBeenCalledWith("workspace.mobile.mode", "always");
    expect(reload).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });

  it("sets mobile mode to never when disabled and reloads", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const reload = vi.fn();
    const app = {
      configuration: {
        getConfiguration: () => ({ update }),
      },
    } as unknown as App;

    vi.stubGlobal("window", { location: { reload } });

    await App.prototype.emulateMobile.call(app, false);

    expect(update).toHaveBeenCalledWith("workspace.mobile.mode", "never");
    expect(reload).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });
});
