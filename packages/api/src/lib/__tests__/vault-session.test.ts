import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_APP_DATABASE_CAPABILITIES,
  MemoryAppDatabase,
  type AppDatabaseProvider,
} from "../storage/app-database";
import { createVaultSession } from "../storage/vault-session";

const adapter = {
  getName: () => "Mock vault",
  getVaultId: () => "vault-under-test",
} as any;

const provider: AppDatabaseProvider = {
  id: "test-turso-provider",
  canOpen: () => true,
  async open(context) {
    const database = new MemoryAppDatabase(context.vaultId);
    await database.open();
    return database;
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createVaultSession", () => {
  it("blocks rather than falling back when cross-origin isolation is absent", async () => {
    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn() },
    });
    vi.stubGlobal("crossOriginIsolated", false);

    const session = await createVaultSession(adapter, { runtime: "web-pwa" });

    expect(session.appDatabase).toBeUndefined();
    expect(session.appDatabaseState).toMatchObject({
      status: "blocked",
      mode: "turso-blocked",
      providerId: "turso-wasm-local",
      role: "blocked",
      transport: "wasm-worker",
      message: expect.stringContaining("cross-origin isolation"),
    });
  });

  it("creates a Turso proxy when another tab owns the database lock", async () => {
    const request = vi.fn(async (_name, _options, callback) => callback(null));
    const ownerDescriptor = {
      providerId: provider.id,
      engine: "turso",
      transport: "wasm-opfs-worker",
      role: "owner",
      storageMode: "local",
      capabilities: {
        nativeFullTextSearch: false,
        vectorSearch: true,
        approximateNearestNeighbors: false,
        localEmbeddings: true,
        crossTabCoordination: true,
        sync: false,
      },
    };
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        private listener?: (event: MessageEvent) => void;

        addEventListener(_type: "message", listener: (event: MessageEvent) => void) {
          this.listener = listener;
        }
        close() {}
        postMessage(message: any) {
          if (message?.type !== "db-request" || message.method !== "describe") {
            return;
          }
          queueMicrotask(() => {
            this.listener?.({
              data: {
                type: "db-response",
                vaultId: message.vaultId,
                responderId: "owner-tab",
                requesterId: message.requesterId,
                requestId: message.requestId,
                success: true,
                result: ownerDescriptor,
              },
            } as MessageEvent);
          });
        }
      },
    );
    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn() },
      locks: { request },
    });
    vi.stubGlobal("crossOriginIsolated", true);

    const session = await createVaultSession(adapter, {
      runtime: "web-pwa",
      appDatabaseProvider: provider,
    });

    expect(request).toHaveBeenCalledWith(
      "lapis-notes-app-database-owner:vault-under-test",
      { mode: "exclusive", ifAvailable: true },
      expect.any(Function),
    );
    expect(session.appDatabaseState).toMatchObject({
      status: "ready",
      mode: "turso-proxy",
      providerId: "test-turso-provider",
      role: "proxy",
      transport: "broadcast-proxy",
      lockSupported: true,
    });
  });

  it("blocks rather than using another database when Web Locks are absent", async () => {
    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn() },
    });
    vi.stubGlobal("crossOriginIsolated", true);

    const session = await createVaultSession(adapter, { runtime: "web-pwa" });

    expect(session.appDatabase).toBeUndefined();
    expect(session.appDatabaseState).toMatchObject({
      status: "blocked",
      mode: "turso-blocked",
      lockSupported: false,
      capabilities: {
        ...EMPTY_APP_DATABASE_CAPABILITIES,
        localEmbeddings: true,
        crossTabCoordination: false,
      },
      message: expect.stringContaining("Web Locks API"),
    });
  });

  it("opens deno-desktop sessions through the supplied native provider", async () => {
    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn() },
      locks: {
        request: vi.fn(() => {
          throw new Error("deno-desktop must not request a browser lock");
        }),
      },
    });
    vi.stubGlobal("crossOriginIsolated", false);
    const open = vi.fn(provider.open.bind(provider));
    const desktopProvider: AppDatabaseProvider = {
      ...provider,
      id: "desktop-native-test-provider",
      open,
    };

    const session = await createVaultSession(adapter, {
      runtime: "deno-desktop",
      appDatabaseProvider: desktopProvider,
    });

    expect(session.runtime).toBe("deno-desktop");
    expect(open).toHaveBeenCalledWith({
      vaultId: "vault-under-test",
      runtime: "deno-desktop",
      role: "direct",
    });
    expect(session.appDatabase).toBeDefined();
    expect(session.appDatabaseState).toMatchObject({
      status: "ready",
      mode: "memory-test",
      providerId: "memory-test",
      role: "test",
      transport: "memory",
      lockSupported: false,
    });
    await session.close();
  });

  it("accepts an explicit provider without changing the AppDatabase contract", async () => {
    const session = await createVaultSession(adapter, {
      runtime: "test",
      appDatabaseProvider: provider,
    });

    expect(session.appDatabase?.kind).toBe("memory");
    expect(session.appDatabaseState).toMatchObject({
      status: "ready",
      mode: "memory-test",
      providerId: "memory-test",
      role: "test",
      transport: "memory",
    });
    await session.close();
  });

  it("keeps memory available only through explicit test injection", async () => {
    const database = new MemoryAppDatabase("vault-under-test");
    const session = await createVaultSession(adapter, {
      runtime: "test",
      appDatabase: database,
    });

    expect(session.appDatabase).toBe(database);
    expect(session.appDatabaseState.mode).toBe("memory-test");
    await session.close();
  });
});
