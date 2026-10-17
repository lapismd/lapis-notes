import { describe, expect, it, vi } from "vitest";
import type {
  App,
  PluginCatalogEntry,
  PluginDistributionManager,
} from "@lapis-notes/api";
import { getPluginRegistryController } from "./plugin-registry-controller.svelte";
import { PluginRegistryDetailSession } from "./plugin-registry-detail-session.svelte";

function fixture() {
  const catalog = [
    {
      id: "a",
      name: "A",
      description: "Notes",
      author: "Lapis",
      minAppVersion: "0.0.0",
      detail: "https://example.test/a.json",
      categories: [],
      platforms: ["web"],
      channel: "official",
      latestVersion: "1.0.0",
    },
  ] as PluginCatalogEntry[];
  const records: { pluginId: string }[] = [];
  const distribution = {
    listSources: vi.fn(() => []),
    refreshCatalog: vi.fn(async () => ({ plugins: catalog })),
    search: vi.fn(() => catalog),
    listInstalled: vi.fn(async () => [...records]),
    listUpdates: vi.fn(async () => []),
    getDownloadStats: vi.fn(async () => null),
    addProgressListener: vi.fn(() => () => {}),
    install: vi.fn(async (id: string) => {
      records.push({ pluginId: id });
      return records[0];
    }),
  } as unknown as PluginDistributionManager;
  const app = {
    pluginDistribution: distribution,
    plugins: { on: vi.fn(() => ({})), offref: vi.fn() },
    notifications: {
      notify: vi.fn(() => ({ id: "test-notice" })),
      withProgress: async (
        _: unknown,
        action: (handle: unknown, token: unknown) => Promise<unknown>,
      ) =>
        action({ report: () => {} }, { signal: new AbortController().signal }),
    },
  } as unknown as App;
  return { app, distribution, catalog };
}
describe("shared App registry state", () => {
  it("shares state within an App while keeping Apps isolated", async () => {
    const { app } = fixture();
    const a = getPluginRegistryController(app);
    const b = getPluginRegistryController(app);
    expect(a).toBe(b);
    expect(a).not.toBe(getPluginRegistryController(fixture().app));
    const release = a.retain();
    await a.refresh(false);
    await a.install(a.catalogEntries[0]);
    expect(b.installed.map((r) => r.pluginId)).toEqual(["a"]);
    expect(b.actionFeedback?.state).toBe("success");
    release();
  });
  it("exposes retryable failure and refreshes both surfaces after retry", async () => {
    const { app, distribution, catalog } = fixture();
    const registry = getPluginRegistryController(app);
    const release = registry.retain();
    vi.mocked(distribution.install).mockRejectedValueOnce(
      new Error("bundle rejected"),
    );
    await registry.install(catalog[0]);
    expect(registry.actionFeedback).toMatchObject({
      state: "error",
      message: "bundle rejected",
    });
    expect(registry.runningAction).toBeNull();
    await registry.install(catalog[0]);
    expect(registry.actionFeedback?.state).toBe("success");
    expect(registry.installed).toHaveLength(1);
    release();
  });
  it("deduplicates refreshes and releases listeners only after the last surface closes", async () => {
    const { app, distribution } = fixture();
    const controller = getPluginRegistryController(app);
    const releaseA = controller.retain(),
      releaseB = controller.retain();
    await Promise.all([controller.refresh(false), controller.refresh(false)]);
    expect(distribution.refreshCatalog).toHaveBeenCalledTimes(1);
    expect(app.plugins.on).toHaveBeenCalledWith(
      "plugin-unloaded",
      expect.any(Function),
    );
    releaseA();
    expect(app.plugins.offref).not.toHaveBeenCalled();
    releaseB();
    expect(app.plugins.offref).toHaveBeenCalledTimes(3);
    for (const result of vi.mocked(app.plugins.on).mock.results)
      expect(app.plugins.offref).toHaveBeenCalledWith(result.value);
    releaseB();
    expect(app.plugins.offref).toHaveBeenCalledTimes(3);
  });
  it("keeps existing content when background refresh fails", async () => {
    const { app, distribution } = fixture();
    const controller = getPluginRegistryController(app);
    const release = controller.retain();
    await controller.refresh(false);
    vi.mocked(distribution.refreshCatalog).mockRejectedValueOnce(
      new Error("offline"),
    );
    await controller.refresh(true);
    expect(controller.catalogEntries).toHaveLength(1);
    expect(controller.lastError?.message).toBe("offline");
    release();
  });
  it("ignores late refreshes after teardown", async () => {
    const { app, distribution } = fixture();
    let finish!: () => void;
    vi.mocked(distribution.refreshCatalog).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () =>
            resolve({ schemaVersion: 2, generatedAt: "", plugins: [] });
        }),
    );
    const controller = getPluginRegistryController(app);
    const release = controller.retain();
    const task = controller.refresh(false);
    release();
    finish();
    await task;
    expect(controller.catalogEntries).toEqual([]);
  });
  it("ignores out-of-order and disposed detail requests", async () => {
    const { app, catalog } = fixture();
    const pending = new Map<string, (detail: null) => void>();
    app.pluginDistribution.getPluginDetail = vi.fn(
      (id) =>
        new Promise<null>((resolve) => {
          pending.set(id, resolve);
        }),
    );
    const session = new PluginRegistryDetailSession(app);
    const first = session.select(catalog[0]);
    const second = session.select({ ...catalog[0], id: "b" });
    pending.get("a")!(null);
    await first;
    expect(session.entryId).toBe("b");
    expect(session.loading).toBe(true);
    session.dispose();
    pending.get("b")!(null);
    await second;
    expect(session.overview.status).toBe("loading");
    expect(session.loading).toBe(false);
  });
});
