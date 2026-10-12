import { describe, expect, it, vi } from "vitest";

import { createDesktopSyncUnlockHandler } from "./desktop-sync-security";

describe("desktop sync unlock adapter", () => {
  it("enrolls through the host with a temporary OS-store wrapping key", async () => {
    const enroll = vi.fn(async () => ({ state: "unlocked" as const }));
    const bridge = {
      invoke: vi.fn(async () => ({
        provider: "os-credential-store" as const,
        keyId: "macos-keychain:vault-1:nostr-sync",
        wrappingKeyBase64: btoa("k".repeat(32)),
      })),
    };
    const handler = createDesktopSyncUnlockHandler({
      bridge: bridge as never,
      vaultId: "vault-1",
      getSyncHost: () =>
        ({ enrollPluginCryptoWithWrappingKey: enroll }) as never,
    });

    await handler("nostr-sync", {
      state: "unenrolled",
      suite: "lapis-sync-v1-xchacha20poly1305-schnorr",
    });

    expect(bridge.invoke).toHaveBeenCalledWith(
      "desktop_sync_wrapping_key_get",
      { vaultId: "vault-1", pluginId: "nostr-sync", create: true },
    );
    expect(enroll).toHaveBeenCalledWith(
      "nostr-sync",
      expect.any(Uint8Array),
      {
        name: "external",
        provider: "os-credential-store",
        keyId: "macos-keychain:vault-1:nostr-sync",
      },
      undefined,
    );
  });

  it("refuses malformed native key material", async () => {
    const bridge = {
      invoke: vi.fn(async () => ({
        provider: "os-credential-store" as const,
        keyId: "key-1",
        wrappingKeyBase64: btoa("short"),
      })),
    };
    const handler = createDesktopSyncUnlockHandler({
      bridge: bridge as never,
      vaultId: "vault-1",
      getSyncHost: () => ({}) as never,
    });
    await expect(
      handler("nostr-sync", {
        state: "locked",
        suite: "lapis-sync-v1-xchacha20poly1305-schnorr",
      }),
    ).rejects.toThrow(/secure-storage key is invalid/u);
  });
});
