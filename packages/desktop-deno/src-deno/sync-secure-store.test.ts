import { describe, expect, it, vi } from "vitest";

import {
  createPlatformSyncSecureStore,
  getDesktopSyncWrappingKey,
  getRendererSyncWrappingKey,
  type SyncSecureStoreBackend,
} from "./sync-secure-store";

describe("Deno desktop sync secure store", () => {
  it("isolates native Sync credentials from colon-shaped legacy accounts", async () => {
    const run = vi.fn(async (_command: string, _args: string[]) => ({
      code: 0,
      stdout: btoa("k".repeat(32)),
      stderr: "",
    }));
    await getDesktopSyncWrappingKey(
      { vaultId: "profile:native", pluginId: "sync", create: false },
      { platform: "darwin", runner: run },
    );
    await getRendererSyncWrappingKey(
      { vaultId: "profile", pluginId: "native:sync", create: false },
      { platform: "darwin", runner: run },
    );
    expect(run.mock.calls[0]?.[1]).toContain("md.lapis.notes.sync.native");
    expect(run.mock.calls[1]?.[1]).toContain("md.lapis.notes.sync");
    expect(run.mock.calls[0]?.[1]).toContain("profile:native:sync");
    expect(run.mock.calls[1]?.[1]).toContain("profile:native:sync");
  });
  it("rejects an empty stored credential without replacing it", async () => {
    const backend: SyncSecureStoreBackend = {
      provider: "fixture",
      load: async () => "",
      store: vi.fn(),
    };
    await expect(
      getDesktopSyncWrappingKey(
        { vaultId: "profile", pluginId: "sync", create: true },
        { backend },
      ),
    ).rejects.toThrow(/invalid sync wrapping material/i);
    expect(backend.store).not.toHaveBeenCalled();
  });

  it("distinguishes a missing Linux credential from a failed credential service", async () => {
    const failed = createPlatformSyncSecureStore("linux", async () => ({
      code: 2,
      stdout: "",
      stderr: "private backend diagnostics",
    }));
    await expect(failed.load("profile:sync")).rejects.toThrow(
      "Linux Secret Service lookup failed (exit 2)",
    );
    const missing = createPlatformSyncSecureStore("linux", async () => ({
      code: 1,
      stdout: "",
      stderr: "",
    }));
    expect(await missing.load("profile:sync")).toBeNull();
  });

  it("keeps backend diagnostic content out of credential errors", async () => {
    const failed = createPlatformSyncSecureStore("darwin", async () => ({
      code: 1,
      stdout: "",
      stderr: "private backend diagnostics",
    }));
    const error = await failed.load("profile:sync").then(
      () => null,
      (error: unknown) => error,
    );
    expect(error).toMatchObject({
      message: "macOS Keychain lookup failed (exit 1)",
    });
  });
  it("rejects new Sync raw-key RPC before reaching the OS backend", async () => {
    const backend: SyncSecureStoreBackend = {
      provider: "fixture",
      load: vi.fn(),
      store: vi.fn(),
    };
    await expect(
      getRendererSyncWrappingKey(
        { vaultId: "profile", pluginId: "sync", create: true },
        { backend },
      ),
    ).rejects.toThrow(/native/i);
    expect(backend.load).not.toHaveBeenCalled();
    expect(backend.store).not.toHaveBeenCalled();
  });
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
