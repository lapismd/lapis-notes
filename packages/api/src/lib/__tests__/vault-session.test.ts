import { describe, expect, it, vi, afterEach } from "vitest";

import { createDefaultAppDatabase } from "../storage/app-database";
import { setNativeDesktopBridge } from "../storage/desktop-native";
import { createVaultSession } from "../storage/vault-session";

afterEach(() => {
  vi.unstubAllGlobals();
  setNativeDesktopBridge(null);
});

describe("createVaultSession", () => {
  it("skips the sqlite OPFS path when the host is not cross-origin isolated", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        getDirectory: vi.fn(),
      },
    });
    vi.stubGlobal("crossOriginIsolated", false);

    const session = await createVaultSession(
      {
        getName: () => "Mock vault",
        getVaultId: () => "vault-under-test",
      } as any,
      { runtime: "web-pwa" },
    );

    if (!session.appDatabase) {
      throw new Error("Expected the fallback app database to be available");
    }
    expect(session.appDatabase.kind).toBe(
      createDefaultAppDatabase("vault-under-test").kind,
    );
  });

  it("proxies sqlite app database calls when another tab already owns the lock", async () => {
    const request = vi.fn(async (_name, _options, callback) => callback(null));
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        addEventListener() {}
        close() {}
        postMessage() {}
      },
    );

    vi.stubGlobal("navigator", {
      storage: {
        getDirectory: vi.fn(),
      },
      locks: {
        request,
      },
    });
    vi.stubGlobal("crossOriginIsolated", true);

    const session = await createVaultSession(
      {
        getName: () => "Mock vault",
        getVaultId: () => "vault-under-test",
      } as any,
      { runtime: "web-pwa" },
    );

    expect(request).toHaveBeenCalledWith(
      "lapis-notes-sqlite-opfs-owner:vault-under-test",
      { mode: "exclusive", ifAvailable: true },
      expect.any(Function),
    );
    expect(session.appDatabase).toBeDefined();
    expect(session.appDatabaseState).toMatchObject({
      status: "ready",
      mode: "sqlite-proxy",
      lockSupported: true,
    });
  });

  it("falls back when Web Locks are unavailable", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        getDirectory: vi.fn(),
      },
    });
    vi.stubGlobal("crossOriginIsolated", true);

    const session = await createVaultSession(
      {
        getName: () => "Mock vault",
        getVaultId: () => "vault-under-test",
      } as any,
      { runtime: "web-pwa" },
    );

    expect(session.appDatabaseState).toMatchObject({
      status: "ready",
      lockSupported: false,
    });
    expect(session.appDatabase?.kind).toBe(
      createDefaultAppDatabase("vault-under-test").kind,
    );
  });

  it("uses the native sqlite app database on the desktop runtime", async () => {
    setNativeDesktopBridge({
      runtime: "electron-desktop",
      invoke: async (command, payload = {}) => {
        if (command === "desktop_db_load_state") {
          return null as never;
        }
        if (command === "desktop_db_save_state") {
          return undefined as never;
        }
        throw new Error(`Unexpected command: ${command}`);
      },
      toFileUrl: (path) => `file://${path}`,
    });

    const session = await createVaultSession(
      {
        getName: () => "Desktop vault",
        getVaultId: () => "vault-under-test",
      } as any,
      { runtime: "electron-desktop" },
    );

    expect(session.appDatabaseState).toMatchObject({
      status: "ready",
      mode: "sqlite-native",
      lockSupported: false,
    });
    expect(session.appDatabase?.kind).toBe("sqlite-native");
  });
});
