import type { App } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import type { SearchManager } from "./search-manager";
import { SearchPlugin } from "./search-plugin";
import { reconcileSearchAfterMetadata } from "./search-startup";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("reconcileSearchAfterMetadata", () => {
  it("does not start Search reconciliation before Metadata finishes", async () => {
    const metadata = deferred();
    const reconcileStartup = vi.fn(async () => ({
      documentCount: 1,
    })) as unknown as SearchManager["reconcileStartup"];
    const app = {
      metadataCache: { load: () => metadata.promise },
    } as unknown as Pick<App, "metadataCache">;

    const startup = reconcileSearchAfterMetadata(app, { reconcileStartup });
    await Promise.resolve();
    expect(reconcileStartup).not.toHaveBeenCalled();

    metadata.resolve();

    await expect(startup).resolves.toMatchObject({ documentCount: 1 });
    expect(reconcileStartup).toHaveBeenCalledOnce();
  });

  it("does not register a competing layout-ready startup trigger", () => {
    expect(SearchPlugin.prototype.onload.toString()).not.toContain(
      "onLayoutReady",
    );
  });

  it("absorbs configured provider registration into the startup reconciliation", () => {
    const onload = SearchPlugin.prototype.onload.toString();
    expect(onload).toContain("!this.startupRefreshStarted");
    expect(onload).not.toContain("this.refreshIndex(`provider-");
  });
});
