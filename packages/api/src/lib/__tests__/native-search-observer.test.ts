import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import type { App } from "../context.svelte";
import type { NativeBackgroundIndexing } from "../native-background-indexing";
import { Plugin } from "../plugin";
import { MemoryAppDatabase } from "../storage/app-database";
import type { VaultSession } from "../storage/vault-session";
import { InMemoryDataAdapter } from "./data-adapter-conformance";
import NativeIndexingAppHarness from "./NativeIndexingAppHarness.test.svelte";

const cleanups: Array<() => Promise<void>> = [];
beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    media: "",
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const selection = {
  providers: [{ provider_id: "search:markdown", version: "1", priority: 0 }],
  chunking: {
    targetChars: 1400,
    breakpointWindowChars: 280,
    breakpointDecay: 0.92,
  },
};
const status = {
  passes: 1,
  indexed: 7,
  deleted: 0,
  pending: 0,
  error: null,
  active: false,
  processed: 7,
  total: 20,
  phase: "idle" as const,
};

function service() {
  const call = vi.fn<NativeBackgroundIndexing["call"]>(async (command) => ({
    status,
    contribution:
      command.kind === "select_search"
        ? { projection_id: "search", placement: "native", message: null }
        : null,
  }));
  return { call };
}

function searchPlugin(app: App) {
  class SearchPlugin extends Plugin {
    async onload() {
      await this.app.backgroundIndexing!.selectSearch(selection);
    }
  }
  const plugin = new SearchPlugin(app, {
    id: "search",
    name: "Search",
    version: "1",
    author: "Lapis",
  });
  plugin.configureRuntime({ source: "core" });
  return plugin;
}

async function fixture(port?: NativeBackgroundIndexing) {
  const database = new MemoryAppDatabase("native-search-observer");
  await database.open();
  const descriptor = database.descriptor;
  const session: VaultSession = {
    runtime: "test",
    vaultAdapter: new InMemoryDataAdapter(),
    appDatabase: database,
    backgroundIndexing: port,
    appDatabaseState: {
      status: "ready",
      mode: "memory-test",
      providerId: descriptor.providerId,
      role: descriptor.role,
      transport: descriptor.transport,
      capabilities: descriptor.capabilities,
      lockSupported: false,
    },
    close: async () => database.close(),
  };
  let app!: App;
  const harness = mount(NativeIndexingAppHarness, {
    target: document.createElement("div"),
    props: { session, onApp: (value) => (app = value) },
  });
  cleanups.push(async () => {
    await app.metadataCache.dispose();
    await unmount(harness);
    await database.close();
  });
  return { app, database };
}

it("exposes the selected App-owned indexing observer for Search", async () => {
  const call = vi.fn(async () => ({ status: null, contribution: null }));
  const { app } = await fixture({ call });
  expect(app.backgroundIndexing).toBeDefined();
  expect(app.backgroundIndexing?.detached).toBe(false);
  await app.metadataCache.dispose();
  expect(app.backgroundIndexing?.detached).toBe(true);
  expect(call).not.toHaveBeenCalled();
});

it("leaves the native observer absent for standalone browser Apps", async () => {
  const { app } = await fixture();
  expect(app.backgroundIndexing).toBeUndefined();
});

it("shares Search declarations with the MetadataCache-owned session", async () => {
  const port = service();
  const { app } = await fixture(port);
  await app.backgroundIndexing!.selectSearch(selection);
  expect(port.call).toHaveBeenCalledWith({ kind: "select_search", selection });
  expect(app.metadataCache.nativeContributionStatuses).toEqual([
    { projection_id: "search", placement: "native", message: null },
  ]);
});

it("drains native Search only for explicit plugin disable", async () => {
  const port = service();
  const { app } = await fixture(port);
  const plugin = searchPlugin(app);
  await plugin.enable();
  await plugin.disable();
  expect(
    port.call.mock.calls.filter(
      ([command]) => command.kind === "disable_search",
    ),
  ).toHaveLength(1);
});

it("makes plugin unload passive after App detach", async () => {
  const port = service();
  const { app } = await fixture(port);
  const plugin = searchPlugin(app);
  await plugin.enable();
  await app.metadataCache.dispose();
  await plugin.disable();
  expect(
    port.call.mock.calls.some(([command]) => command.kind === "disable_search"),
  ).toBe(false);
});

it("keeps native failures visible without a browser writer", async () => {
  const port = service();
  const { app, database } = await fixture(port);
  const write = vi.spyOn(database, "upsertSearchDocument");
  port.call.mockRejectedValueOnce(new Error("native Search unavailable"));
  await expect(app.backgroundIndexing!.selectSearch(selection)).rejects.toThrow(
    "native Search unavailable",
  );
  expect(write).not.toHaveBeenCalled();
});

it("allows explicit plugin disable to drain an uncertain native selection", async () => {
  const port = service();
  const { app } = await fixture(port);
  const plugin = searchPlugin(app);
  port.call.mockRejectedValueOnce(new Error("selection response unavailable"));
  await expect(plugin.enable()).rejects.toThrow(
    "selection response unavailable",
  );
  await plugin.disable();
  expect(port.call).toHaveBeenCalledWith({ kind: "disable_search" });
});

it("does not describe queued native convergence as a ready Search index", async () => {
  const port = service();
  const { app } = await fixture(port);
  const messages: Array<string | undefined> = [];
  app.notifications.on("changed", () => {
    messages.push(
      ...app.notifications.activeProgress.map((entry) => entry.message),
    );
  });
  port.call.mockResolvedValue({
    status: { ...status, pending: 2 },
    contribution: null,
  });
  await app.backgroundIndexing!.refresh(false, {
    title: "Refreshing search index",
    source: "Search",
    readyMessage: "Search index ready",
  });
  expect(messages).not.toContain("Search index ready");
  expect(messages).toContain("Indexing pending changes");
});

it("keeps native failure progress visible without announcing Search readiness", async () => {
  const port = service();
  const { app } = await fixture(port);
  const messages: Array<string | undefined> = [];
  app.notifications.on("changed", () => {
    messages.push(
      ...app.notifications.activeProgress.map((entry) => entry.message),
    );
  });
  port.call.mockResolvedValue({
    status: { ...status, error: "Native Search projection failed" },
    contribution: null,
  });
  await expect(
    app.backgroundIndexing!.refresh(false, {
      title: "Refreshing search index",
      source: "Search",
      readyMessage: "Search index ready",
    }),
  ).rejects.toThrow("Native Search projection failed");
  expect(messages).not.toContain("Search index ready");
  expect(messages).toContain("Native Search projection failed");
});

it("reports Search progress using the existing observer and detaches its timer", async () => {
  const port = service();
  const { app } = await fixture(port);
  vi.useFakeTimers();
  let finish!: (
    value: Awaited<ReturnType<NativeBackgroundIndexing["call"]>>,
  ) => void;
  const accepted = new Promise<
    Awaited<ReturnType<NativeBackgroundIndexing["call"]>>
  >((resolve) => {
    finish = resolve;
  });
  port.call.mockImplementation(async (command) =>
    command.kind === "refresh"
      ? accepted
      : {
          status: { ...status, active: true, phase: "search" },
          contribution: null,
        },
  );
  const refresh = app.backgroundIndexing!.refresh(false, {
    title: "Refreshing search index",
    source: "Search",
    readyMessage: "Search index ready",
  });
  await vi.advanceTimersByTimeAsync(100);
  expect(app.notifications.activeProgress).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: "Refreshing search index",
        source: "Search",
        message: "Indexing search",
        current: 7,
        total: 20,
      }),
    ]),
  );
  await app.metadataCache.dispose();
  expect(vi.getTimerCount()).toBe(0);
  finish({ status, contribution: null });
  await expect(refresh).resolves.toEqual(status);
  expect(
    port.call.mock.calls.some(([command]) => command.kind === "disable_search"),
  ).toBe(false);
});
