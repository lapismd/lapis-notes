import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBrowserSyncUnlockHandler,
  requestBrowserStoragePersistence,
  supportsBrowserWebAuthnPrf,
} from "../browser-sync-security";
import { MemoryAppDatabase } from "../storage";

afterEach(() => vi.unstubAllGlobals());

describe("browser sync security", () => {
  it("feature detects WebAuthn PRF instead of assuming support", async () => {
    vi.stubGlobal("PublicKeyCredential", class {
      static async getClientCapabilities() {
        return { "extension:prf": true };
      }
    });
    await expect(supportsBrowserWebAuthnPrf()).resolves.toBe(true);

    vi.stubGlobal("PublicKeyCredential", class {});
    await expect(supportsBrowserWebAuthnPrf()).resolves.toBe(false);
  });

  it("requests best-effort persistence without treating absence as success", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    await expect(
      requestBrowserStoragePersistence({
        persisted: vi.fn().mockResolvedValue(false),
        persist,
      }),
    ).resolves.toEqual({ supported: true, persisted: true });
    expect(persist).toHaveBeenCalledOnce();
    await expect(requestBrowserStoragePersistence(undefined)).resolves.toEqual({
      supported: false,
      persisted: false,
    });
  });

  it("keeps passphrase enrollment in a host-owned callback", async () => {
    vi.stubGlobal("PublicKeyCredential", undefined);
    const database = new MemoryAppDatabase("browser-unlock-test");
    await database.open();
    const enrollPluginCrypto = vi.fn(async () => ({ state: "unlocked" }));
    const handler = createBrowserSyncUnlockHandler({
      database,
      getSyncHost: () => ({ enrollPluginCrypto }) as never,
      rpName: "Lapis Notes",
      interaction: {
        confirmPasskeyEnrollment: vi.fn(async () => false),
        requestPassphrase: vi.fn(async () => "correct horse battery staple"),
      },
    });

    await handler("nostr-sync", {
      state: "unenrolled",
      suite: "lapis-sync-v1-xchacha20poly1305-schnorr",
    });
    expect(enrollPluginCrypto).toHaveBeenCalledWith(
      "nostr-sync",
      "correct horse battery staple",
      undefined,
    );
  });
});
