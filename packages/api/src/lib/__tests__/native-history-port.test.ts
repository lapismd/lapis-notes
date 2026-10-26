import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import type { App } from "../context.svelte";
import type { NativeHistoryIndex } from "../native-history-index";
import { MemoryAppDatabase } from "../storage/app-database";
import type { VaultSession } from "../storage/vault-session";
import { InMemoryDataAdapter } from "./data-adapter-conformance";
import NativeHistoryAppHarness from "./NativeHistoryAppHarness.test.svelte";

const cleanups: Array<() => Promise<void>> = [];
beforeEach(() =>
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    media: "",
    addEventListener() {},
    removeEventListener() {},
  })),
);
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  vi.unstubAllGlobals();
});
const port = () => ({
  call: vi.fn<NativeHistoryIndex["call"]>(async () => ({
    generation: 1,
    indexed: 1,
    omitted: 0,
    complete: true,
  })),
});
async function fixture(
  sessionPort?: NativeHistoryIndex,
  explicitPort?: NativeHistoryIndex,
) {
  const database = new MemoryAppDatabase("native-history-port");
  await database.open();
  const descriptor = database.descriptor;
  const session: VaultSession = {
    runtime: "test",
    vaultAdapter: new InMemoryDataAdapter(),
    appDatabase: database,
    nativeHistoryIndex: sessionPort,
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
  const harness = mount(NativeHistoryAppHarness, {
    target: document.createElement("div"),
    props: {
      options: {
        version: "test",
        session,
        nativeHistoryIndex: explicitPort,
        markdownRenderer: async () => {},
      },
      onApp: (value) => (app = value),
    },
  });
  cleanups.push(async () => {
    await app.metadataCache.dispose();
    await unmount(harness);
    await database.close();
  });
  return app;
}
it("leaves native History absent for ordinary browser Apps", async () => {
  expect((await fixture()).nativeHistoryIndex).toBeUndefined();
});
it("retains the session's admitted native History without eager calls", async () => {
  const admitted = port(),
    app = await fixture(admitted);
  expect(app.nativeHistoryIndex).toBe(admitted);
  expect(admitted.call).not.toHaveBeenCalled();
});
it("prefers an explicit App port and preserves independent App ownership", async () => {
  const session = port(),
    explicit = port(),
    other = port();
  const first = await fixture(session, explicit),
    second = await fixture(other);
  expect(first.nativeHistoryIndex).toBe(explicit);
  expect(second.nativeHistoryIndex).toBe(other);
  await first.nativeHistoryIndex!.call({ kind: "status" });
  expect(explicit.call).toHaveBeenCalledWith({ kind: "status" });
  expect(session.call).not.toHaveBeenCalled();
  expect(other.call).not.toHaveBeenCalled();
});
