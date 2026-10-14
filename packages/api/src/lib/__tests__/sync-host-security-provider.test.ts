import { afterEach, expect, it, vi } from "vitest";
import {
  SyncHostService,
  type SyncHostCapabilities,
  type SyncHostSecurityProvider,
} from "../sync-host";
import { MemoryAppDatabase, MemoryVaultAdapter, Vault } from "../storage";
import { Plugin } from "../plugin";
import type { App } from "../context.svelte";

const databases: MemoryAppDatabase[] = [];
afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

async function fixture() {
  const database = new MemoryAppDatabase("index");
  databases.push(database);
  await database.open();
  const status = vi.fn(async () => ({ state: "locked" }));
  const result = {
    crypto: { status },
    syncIdentity: { status },
    pairing: { createRelayProbe: status },
    membership: { getSnapshot: status },
    recovery: { exportBundle: status },
  } as unknown as Pick<
    SyncHostCapabilities,
    "crypto" | "syncIdentity" | "pairing" | "membership" | "recovery"
  >;
  const provider: SyncHostSecurityProvider = {
    forRuntime: vi.fn(() => result),
    revokeRuntime: vi.fn(),
  };
  const select = vi.fn((pluginId: string) =>
    pluginId === "sync" ? provider : undefined,
  );
  const service = new SyncHostService(
    database,
    new Vault(new MemoryVaultAdapter()),
    Date.now,
    { securityProvider: select },
  );
  await service.ready();
  return { service, database, status, result, provider, select };
}

it("delegates every security group without putting credentials in the index", async () => {
  const { service, database, status, provider, select } = await fixture();
  const host = service.forPlugin("sync", ["crypto:nostr-sync"]);
  expect(select).not.toHaveBeenCalled();
  await host.crypto.status();
  await host.syncIdentity.status();
  await host.pairing.createRelayProbe();
  await host.membership.getSnapshot();
  await host.recovery.exportBundle();
  expect(status).toHaveBeenCalledTimes(5);
  expect(select).toHaveBeenCalledExactlyOnceWith("sync");
  expect(provider.forRuntime).toHaveBeenCalledOnce();
  expect(
    await database.getMeta("sync-host:v1:security:crypto:sync"),
  ).toBeUndefined();
  expect("securityProvider" in service.options).toBe(false);
  expect("securityProvider" in host).toBe(false);
  await service.dispose();
});

it("checks grants before selecting or calling a security provider", async () => {
  const { service, select, status } = await fixture();
  const host = service.forPlugin("sync", []);
  await expect(host.crypto.status()).rejects.toThrow(
    "not granted crypto:nostr-sync",
  );
  await expect(host.recovery.exportBundle()).rejects.toThrow(
    "not granted crypto:nostr-sync",
  );
  expect(select).not.toHaveBeenCalled();
  expect(status).not.toHaveBeenCalled();
  await service.dispose();
});

it("rejects an in-flight result after revocation and awaits native cleanup", async () => {
  const { service, status, provider } = await fixture();
  const result = deferred<{ state: string }>();
  const cleanup = deferred<void>();
  status.mockImplementation(() => result.promise);
  vi.mocked(provider.revokeRuntime).mockReturnValue(cleanup.promise);
  const host = service.forPlugin("sync", ["crypto:nostr-sync"]);
  const pending = host.crypto.status();
  const rejected = expect(pending).rejects.toThrow(/runtime.*active|revoked/i);
  const revoked = service.revokePlugin("sync");
  let drained = false;
  void revoked.then(() => (drained = true));
  await Promise.resolve();
  expect(drained).toBe(false);
  await expect(host.crypto.status()).rejects.toThrow(
    /runtime.*active|revoked/i,
  );
  result.resolve({ state: "unlocked" });
  await rejected;
  cleanup.resolve();
  await revoked;
  expect(provider.revokeRuntime).toHaveBeenCalledOnce();
  const next = service.forPlugin("sync", ["crypto:nostr-sync"]);
  await next.crypto.status();
  expect(provider.forRuntime).toHaveBeenCalledTimes(2);
  await service.dispose();
});

it("does not fall back to local security when a provider fails", async () => {
  const { service, status, result, provider } = await fixture();
  status.mockRejectedValue(new Error("native host unavailable"));
  const host = service.forPlugin("sync", ["crypto:nostr-sync"]);
  await expect(host.crypto.status()).rejects.toThrow("native host unavailable");
  vi.mocked(provider.forRuntime).mockReturnValue({
    ...result,
    crypto: {},
  } as never);
  const broken = service.forPlugin("sync", ["crypto:nostr-sync"]);
  await expect(broken.crypto.status()).rejects.toThrow(/security provider/i);
  await service.dispose();
});

it.each([null, {}, Promise.resolve({})])(
  "rejects malformed provider selection without local fallback (%s)",
  async (invalid) => {
    const { service, select } = await fixture();
    select.mockReturnValue(invalid as never);
    const host = service.forPlugin("sync", ["crypto:nostr-sync"]);
    await expect(host.crypto.status()).rejects.toThrow(
      /invalid.*security provider/i,
    );
    await service.dispose();
  },
);

it("disposal joins a revocation that was already running", async () => {
  const { service, provider } = await fixture();
  const host = service.forPlugin("sync", ["crypto:nostr-sync"]);
  await host.crypto.status();
  const cleanup = deferred<void>();
  vi.mocked(provider.revokeRuntime).mockReturnValue(cleanup.promise);
  const revoking = service.revokePlugin("sync");
  const closing = service.dispose();
  expect(service.dispose()).toBe(closing);
  let finished = false;
  void closing.then(() => (finished = true));
  await Promise.resolve();
  expect(finished).toBe(false);
  cleanup.resolve();
  await Promise.all([closing, revoking]);
  expect(provider.revokeRuntime).toHaveBeenCalledOnce();
});

it("retains legacy key custody and denies local enrollment for delegated plugins", async () => {
  const { service, database } = await fixture();
  const wrappingKey = new Uint8Array(32).fill(17);
  const descriptor = {
    name: "external",
    provider: "os-credential-store",
    keyId: "test",
  } as const;
  await service.enrollPluginCryptoWithWrappingKey(
    "nostr-sync",
    wrappingKey,
    descriptor,
  );
  const legacy = service.forPlugin("nostr-sync", ["crypto:nostr-sync"]);
  expect((await legacy.crypto.status()).state).toBe("unlocked");
  expect(
    await database.getMeta("sync-host:v1:security:crypto:nostr-sync"),
  ).toBeDefined();
  await expect(
    service.enrollPluginCryptoWithWrappingKey("sync", wrappingKey, descriptor),
  ).rejects.toThrow(/delegated/i);
  await expect(
    service.unlockPluginCryptoWithWrappingKey("sync", wrappingKey),
  ).rejects.toThrow(/delegated/i);
  await expect(service.enrollPluginCrypto("sync", "password")).rejects.toThrow(
    /delegated/i,
  );
  await expect(service.unlockPluginCrypto("sync", "password")).rejects.toThrow(
    /delegated/i,
  );
  expect(() => service.lockPluginCrypto("sync")).toThrow(/delegated/i);
  expect(
    await database.getMeta("sync-host:v1:security:crypto:sync"),
  ).toBeUndefined();
  await service.dispose();
});

it("disposal invalidates every runtime and drains all cleanup, including failures", async () => {
  const { service, provider } = await fixture();
  const first = service.forPlugin("sync", ["crypto:nostr-sync"]);
  const second = service.forPlugin("sync", ["crypto:nostr-sync"]);
  await Promise.all([first.crypto.status(), second.crypto.status()]);
  const cleanup = deferred<void>();
  vi.mocked(provider.revokeRuntime)
    .mockRejectedValueOnce(new Error("native close failed"))
    .mockReturnValueOnce(cleanup.promise);
  const closing = service.dispose();
  const rejected = expect(closing).rejects.toThrow("native close failed");
  expect(() => service.forPlugin("sync")).toThrow(/disposed/i);
  await expect(second.crypto.status()).rejects.toThrow(
    /runtime.*active|revoked/i,
  );
  cleanup.resolve();
  await rejected;
  expect(provider.revokeRuntime).toHaveBeenCalledTimes(2);
});

it.each([false, true])(
  "plugin disable drains security even when unload fails (%s)",
  async (unloadFails) => {
    const { service, provider } = await fixture();
    const cleanup = deferred<void>();
    vi.mocked(provider.revokeRuntime).mockReturnValue(cleanup.promise);
    class SecurityPlugin extends Plugin {
      async onunload() {
        if (unloadFails) throw new Error("unload failed");
      }
    }
    const plugin = new SecurityPlugin({} as App, {
      id: "sync",
      name: "Sync",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "test",
      author: "test",
    });
    plugin.configureRuntime({
      createSyncHostCapabilities: () =>
        service.forPlugin("sync", ["crypto:nostr-sync"]),
      revokeSyncHostCapabilities: () => service.revokePlugin("sync"),
    });
    await plugin.loadAsync();
    await plugin.syncHost.crypto.status();
    const disabling = plugin.disable();
    const outcome = disabling.then(
      () => null,
      (error: unknown) => error,
    );
    await vi.waitFor(() =>
      expect(provider.revokeRuntime).toHaveBeenCalledOnce(),
    );
    let finished = false;
    void outcome.then(() => (finished = true));
    await Promise.resolve();
    expect(finished).toBe(false);
    cleanup.resolve();
    if (unloadFails)
      expect(await outcome).toMatchObject({ message: "unload failed" });
    else expect(await outcome).toBeNull();
    await service.dispose();
  },
);
