import { afterEach, expect, it, vi } from "vitest";
import {
  SyncHostService,
  type SyncHostCapabilities,
  type SyncHostSecurityProvider,
} from "../sync-host";
import { MemoryAppDatabase, MemoryVaultAdapter, Vault } from "../storage";

const databases: MemoryAppDatabase[] = [];
afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

async function fixture() {
  const database = new MemoryAppDatabase("failed-sync-startup");
  databases.push(database);
  await database.open();
  const initialization = Promise.withResolvers<void>();
  vi.spyOn(database, "getMeta").mockImplementation(async () => {
    await initialization.promise;
    return undefined;
  });
  const status = vi.fn(async () => ({ state: "locked" }));
  const provider: SyncHostSecurityProvider = {
    forRuntime: () =>
      ({ crypto: { status } }) as unknown as Pick<
        SyncHostCapabilities,
        "crypto" | "syncIdentity" | "pairing" | "membership" | "recovery"
      >,
    revokeRuntime: vi.fn(),
  };
  const service = new SyncHostService(
    database,
    new Vault(new MemoryVaultAdapter()),
    Date.now,
    { securityProvider: () => provider },
  );
  const runtime = service.forPlugin("sync", ["crypto:nostr-sync"]);
  await runtime.crypto.status();
  return { service, runtime, provider, initialization };
}

it("settles failed initialization before disposing resources without clearing its readiness failure", async () => {
  const { service, runtime, provider, initialization } = await fixture();
  const failure = new Error("Vault folder changed; select it again");
  const readiness = expect(service.ready()).rejects.toBe(failure);
  const disposed = vi.fn();
  const closing = service.dispose();
  void closing.then(disposed, () => {});
  await Promise.resolve();
  expect(disposed).not.toHaveBeenCalled();
  expect(service.dispose()).toBe(closing);
  expect(() => service.forPlugin("late")).toThrow(/disposed/);
  await expect(runtime.crypto.status()).rejects.toThrow(
    "Sync-host capabilities for sync have been revoked",
  );
  initialization.reject(failure);
  await readiness;
  await expect(closing).resolves.toBeUndefined();
  await expect(service.ready()).rejects.toBe(failure);
  expect(provider.revokeRuntime).toHaveBeenCalledOnce();
});

it("still reports delegated cleanup failure after failed initialization has settled", async () => {
  const { service, provider, initialization } = await fixture();
  const failure = new Error("initialization denied");
  const cleanupFailure = new Error("native key cleanup failed");
  const readiness = expect(service.ready()).rejects.toBe(failure);
  const cleanup = Promise.withResolvers<void>();
  vi.mocked(provider.revokeRuntime).mockReturnValue(cleanup.promise);
  const closing = service.dispose();
  const rejected = expect(closing).rejects.toBe(cleanupFailure);
  initialization.reject(failure);
  await readiness;
  cleanup.reject(cleanupFailure);
  await rejected;
  await expect(service.ready()).rejects.toBe(failure);
});
