import { expect, it, vi } from "vitest";
import { SyncHostService } from "../sync-host";
import { MemoryAppDatabase, MemoryVaultAdapter, Vault } from "../storage";

const key = "sync-host:v1:security:crypto:sync";
const wrappingKey = new Uint8Array(32).fill(77);
const descriptor = {
  name: "external",
  provider: "fixture",
  keyId: "fixture",
} as const;

async function fixture(store: MemoryAppDatabase) {
  const index = new MemoryAppDatabase("disposable-index");
  await index.open();
  const service = new SyncHostService(
    index,
    new Vault(new MemoryVaultAdapter()),
    Date.now,
    {
      securityStore: store,
    },
  );
  await service.ready();
  return {
    index,
    service,
    host: service.forPlugin("sync", ["crypto:nostr-sync"]),
  };
}

it("retains the enrolled identity when the application index is replaced", async () => {
  const store = new MemoryAppDatabase("security");
  await store.open();
  const first = await fixture(store);
  await first.service.enrollPluginCryptoWithWrappingKey(
    "sync",
    wrappingKey,
    descriptor,
  );
  const enrolled = await first.host.crypto.status();
  expect(await store.getMeta(key)).toBeDefined();
  expect(await first.index.getMeta(key)).toBeUndefined();
  first.service.lockPluginCrypto("sync");
  await first.index.close();
  const next = await fixture(store);
  expect((await next.host.crypto.status()).state).toBe("locked");
  await next.service.unlockPluginCryptoWithWrappingKey("sync", wrappingKey);
  expect(await next.host.crypto.status()).toEqual(enrolled);
  expect("securityStore" in next.host).toBe(false);
  expect("securityStore" in next.service.options).toBe(false);
  await next.index.close();
  await store.close();
});

it("does not fall back to index storage after a dedicated store error", async () => {
  const store = new MemoryAppDatabase("security");
  await store.open();
  const { service, index } = await fixture(store);
  vi.spyOn(store, "getMeta").mockRejectedValue(
    new Error("security store offline"),
  );
  await expect(
    service.enrollPluginCryptoWithWrappingKey("sync", wrappingKey, descriptor),
  ).rejects.toThrow("security store offline");
  expect(await index.getMeta(key)).toBeUndefined();
  await index.close();
  await store.close();
});

it.each([null, {}])(
  "rejects an invalid supplied store instead of selecting the index",
  async (store) => {
    await expect(fixture(store as never)).rejects.toThrow(
      /invalid.*security.*store/i,
    );
  },
);

it("keeps network grants in the same independent security store", async () => {
  const store = new MemoryAppDatabase("security");
  await store.open();
  const { service, index } = await fixture(store);
  await service.grantPluginNetworkOrigin("sync", "https://sync.example");
  const networkKey = "sync-host:v1:security:network:sync";
  expect(await store.getMeta(networkKey)).toEqual(expect.any(Array));
  expect(await index.getMeta(networkKey)).toBeUndefined();
  await index.close();
  await store.close();
});

it.each([false, true])(
  "preserves enrollment recovery after a lost transaction response (committed=%s)",
  async (committed) => {
    const store = new MemoryAppDatabase("security");
    await store.open();
    const { service, index, host } = await fixture(store);
    const original = store.transactMeta.bind(store);
    vi.spyOn(store, "transactMeta").mockImplementationOnce(
      async (transaction) => {
        if (committed) await original(transaction);
        throw new Error("lost security write response");
      },
    );
    await expect(
      service.enrollPluginCryptoWithWrappingKey(
        "sync",
        wrappingKey,
        descriptor,
      ),
    ).rejects.toThrow("lost security write response");
    expect((await host.crypto.status()).state).toBe(
      committed ? "locked" : "unenrolled",
    );
    expect(await index.getMeta(key)).toBeUndefined();
    if (committed) {
      const envelope = await store.getMeta<{ publicKey: string }>(key);
      await service.unlockPluginCryptoWithWrappingKey("sync", wrappingKey);
      expect((await host.crypto.status()).devicePublicKey).toBe(
        envelope!.publicKey,
      );
      service.lockPluginCrypto("sync");
    }
    expect([...wrappingKey]).toEqual(new Array(32).fill(77));
    await index.close();
    await store.close();
  },
);
