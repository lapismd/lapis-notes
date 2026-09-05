import { describe, expect, it, vi } from "vitest";

import {
  createPlatformSyncSecureStore,
  getDesktopSyncWrappingKey,
  type SyncSecureStoreBackend,
} from "./sync-secure-store";

describe("Deno desktop sync secure store", () => {
  it("creates one OS-backed wrapping key and reuses it without exposing it in an identifier", async () => {
    const values = new Map<string, string>();
    const backend: SyncSecureStoreBackend = {
      provider: "test-keychain",
      load: async (account) => values.get(account) ?? null,
      store: async (account, secret) => void values.set(account, secret),
    };

    const first = await getDesktopSyncWrappingKey(
      { vaultId: "vault-1", pluginId: "nostr-sync", create: true },
      { backend },
    );
    const second = await getDesktopSyncWrappingKey(
      { vaultId: "vault-1", pluginId: "nostr-sync", create: false },
      { backend },
    );

    expect(first).toEqual(second);
    expect(atob(first.wrappingKeyBase64)).toHaveLength(32);
    expect(first.keyId).toBe("test-keychain:vault-1:nostr-sync");
    expect(first.keyId).not.toContain(first.wrappingKeyBase64);
  });

  it("requires recovery when an enrolled vault loses its OS credential", async () => {
    const backend: SyncSecureStoreBackend = {
      provider: "test-keychain",
      load: async () => null,
      store: vi.fn(),
    };
    await expect(
      getDesktopSyncWrappingKey(
        { vaultId: "vault-1", pluginId: "nostr-sync", create: false },
        { backend },
      ),
    ).rejects.toThrow(/recovery or re-enrollment/u);
    expect(backend.store).not.toHaveBeenCalled();
  });

  it("keeps macOS secrets out of process arguments", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ code: 44, stdout: "", stderr: "missing" })
      .mockResolvedValueOnce({ code: 0, stdout: "", stderr: "" });
    const backend = createPlatformSyncSecureStore("darwin", run);
    const secret = btoa("x".repeat(32));
    expect(await backend.load("vault:plugin")).toBeNull();
    await backend.store("vault:plugin", secret);

    expect(run.mock.calls[1]?.[1]).toEqual(["-i"]);
    expect(JSON.stringify(run.mock.calls[1]?.[1])).not.toContain(secret);
    expect(run.mock.calls[1]?.[2]).toContain(secret);
  });

  it("rejects caller-controlled identifiers before reaching the OS", async () => {
    const backend: SyncSecureStoreBackend = {
      provider: "test-keychain",
      load: vi.fn(),
      store: vi.fn(),
    };
    await expect(
      getDesktopSyncWrappingKey(
        { vaultId: "../vault", pluginId: "nostr-sync", create: true },
        { backend },
      ),
    ).rejects.toThrow(/vaultId is invalid/u);
    expect(backend.load).not.toHaveBeenCalled();
  });
});
