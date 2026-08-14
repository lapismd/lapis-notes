import { describe, expect, it, vi } from "vitest";
import type { TFile } from "@lapis-notes/api";
import { loadBasesResourceUrl } from "./resource-url";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("loadBasesResourceUrl", () => {
  it("revokes an active resource URL during teardown", async () => {
    const app = {
      vault: {
        getResourceUrl: vi.fn(async () => "blob:cover"),
        revokeResourceUrl: vi.fn(),
      },
    };
    const onReady = vi.fn();
    const dispose = loadBasesResourceUrl(app as never, {} as TFile, onReady);
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledWith("blob:cover"));

    dispose();

    expect(app.vault.revokeResourceUrl).toHaveBeenCalledWith("blob:cover");
  });

  it("revokes a URL that resolves after teardown without publishing it", async () => {
    const pending = deferred<string>();
    const app = {
      vault: {
        getResourceUrl: vi.fn(() => pending.promise),
        revokeResourceUrl: vi.fn(),
      },
    };
    const onReady = vi.fn();
    const dispose = loadBasesResourceUrl(app as never, {} as TFile, onReady);

    dispose();
    pending.resolve("blob:late-cover");
    await vi.waitFor(() =>
      expect(app.vault.revokeResourceUrl).toHaveBeenCalledWith(
        "blob:late-cover",
      ),
    );

    expect(onReady).not.toHaveBeenCalled();
  });
});
