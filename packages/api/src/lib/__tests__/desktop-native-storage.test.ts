import { afterEach, expect, it } from "vitest";

import {
  MemoryKeyValueStore,
  NativeDesktopVaultAdapter,
  NativeDesktopTursoAppDatabaseProvider,
  createNativeDesktopVault,
  getCurrentVaultProfile,
  getNativeDesktopBridge,
  getVaultProfile,
  moveNativeDesktopVaultProfile,
  pickNativeDesktopVault,
  removeStoredVaultProfile,
  setDefaultVaultStateStore,
  setNativeDesktopBridge,
} from "../storage";

function createDesktopBridge() {
  return {
    runtime: "electron-desktop" as const,
    toFileUrl: (path: string) => `file://${path}`,
    invoke: async <T>(command: string): Promise<T> => {
      switch (command) {
        case "desktop_pick_vault_folder":
          return { path: "/vault", name: "Vault" } as T;
        case "desktop_create_vault_folder":
          return { path: "/created-vault", name: "created-vault" } as T;
        case "desktop_move_vault_folder":
          return { path: "/moved-vault", name: "moved-vault" } as T;
        default:
          throw new Error(`Unexpected command: ${command}`);
      }
    },
  };
}

afterEach(() => {
  setNativeDesktopBridge(null);
  setDefaultVaultStateStore(null);
});

it("publishes the native desktop bridge on the process-wide global", () => {
  const bridge = createDesktopBridge();
  setNativeDesktopBridge(bridge);
  expect(
    (globalThis as { __LAPIS_NATIVE_DESKTOP__?: unknown })
      .__LAPIS_NATIVE_DESKTOP__,
  ).toBe(bridge);
  setNativeDesktopBridge(null);
  expect(
    (globalThis as { __LAPIS_NATIVE_DESKTOP__?: unknown })
      .__LAPIS_NATIVE_DESKTOP__,
  ).toBeUndefined();
});

it("registers a wrapped bridge without overwriting the read-only preload global", () => {
  const preloadBridge = createDesktopBridge();
  Object.defineProperty(globalThis, "__LAPIS_NATIVE_DESKTOP__", {
    value: preloadBridge,
    configurable: true,
    writable: false,
  });
  const wrappedBridge = { ...preloadBridge };

  expect(() => setNativeDesktopBridge(wrappedBridge)).not.toThrow();
  expect(getNativeDesktopBridge()).toBe(wrappedBridge);
  expect(globalThis.__LAPIS_NATIVE_DESKTOP__).toBe(preloadBridge);
});

it("persists the selected native desktop vault profile", async () => {
  const store = new MemoryKeyValueStore();
  setDefaultVaultStateStore(store);
  setNativeDesktopBridge(createDesktopBridge());

  const picked = await pickNativeDesktopVault();

  expect(picked?.profile).toMatchObject({
    id: "desktop-folder:/vault",
    name: "Vault",
    kind: "desktop-folder",
    handle: {
      rootPath: "/vault",
    },
  });
  await expect(getCurrentVaultProfile()).resolves.toMatchObject({
    id: "desktop-folder:/vault",
    kind: "desktop-folder",
  });
});

it("persists created native desktop vaults through the shared profile store", async () => {
  const store = new MemoryKeyValueStore();
  setDefaultVaultStateStore(store);
  setNativeDesktopBridge(createDesktopBridge());

  const created = await createNativeDesktopVault();

  expect(created?.profile).toMatchObject({
    id: "desktop-folder:/created-vault",
    name: "created-vault",
    kind: "desktop-folder",
    handle: {
      rootPath: "/created-vault",
    },
  });
  await expect(getCurrentVaultProfile()).resolves.toMatchObject({
    id: "desktop-folder:/created-vault",
    kind: "desktop-folder",
  });
});

it("moves stored native desktop vault profiles and updates the current profile id", async () => {
  const store = new MemoryKeyValueStore();
  setDefaultVaultStateStore(store);
  setNativeDesktopBridge(createDesktopBridge());

  const picked = await pickNativeDesktopVault();
  expect(picked).not.toBeNull();

  const moved = await moveNativeDesktopVaultProfile(picked!.profile, {
    stateStore: store,
  });

  expect(moved).toMatchObject({
    id: "desktop-folder:/moved-vault",
    name: "Vault",
    handle: {
      rootPath: "/moved-vault",
    },
  });
  await expect(getVaultProfile("desktop-folder:/vault", store)).resolves.toBe(
    undefined,
  );
  await expect(getCurrentVaultProfile(store)).resolves.toMatchObject({
    id: "desktop-folder:/moved-vault",
    handle: {
      rootPath: "/moved-vault",
    },
  });
});

it("removes stored native desktop vault profiles", async () => {
  const store = new MemoryKeyValueStore();
  setDefaultVaultStateStore(store);
  setNativeDesktopBridge(createDesktopBridge());

  const picked = await pickNativeDesktopVault();
  expect(picked).not.toBeNull();

  await removeStoredVaultProfile(picked!.profile.id, { stateStore: store });

  await expect(getVaultProfile(picked!.profile.id, store)).resolves.toBe(
    undefined,
  );
  await expect(getCurrentVaultProfile(store)).resolves.toBe(undefined);
});

it("routes app-database operations through the bounded native Turso RPC", async () => {
  const calls: Array<{ command: string; payload?: Record<string, unknown> }> =
    [];
  setNativeDesktopBridge({
    runtime: "electron-desktop",
    platform: { runtime: "electron-desktop", os: "macos", arch: "arm64" },
    capabilities: {
      database: { id: "database", status: "available" },
    },
    toFileUrl: (path: string) => `file://${path}`,
    async invoke<T>(command: string, payload?: Record<string, unknown>) {
      calls.push({ command, payload });
      if (command === "desktop_db_open") {
        return {
          providerId: "electron-turso-native",
          engine: "turso",
          transport: "native",
          role: "direct",
          storageMode: "local",
          capabilities: {
            nativeFullTextSearch: true,
            vectorSearch: true,
            approximateNearestNeighbors: false,
            localEmbeddings: true,
            crossTabCoordination: false,
            sync: false,
          },
        } as T;
      }
      return undefined as T;
    },
  });

  const database = await new NativeDesktopTursoAppDatabaseProvider().open({
    vaultId: "desktop-folder:/vault",
    runtime: "electron-desktop",
  });
  await database.setMeta("theme", "dark");
  await database.close();

  expect(database.descriptor).toMatchObject({
    providerId: "electron-turso-native",
    engine: "turso",
    transport: "native",
    capabilities: { nativeFullTextSearch: true, vectorSearch: true },
  });
  expect(calls).toEqual([
    {
      command: "desktop_db_open",
      payload: { vaultId: "desktop-folder:/vault" },
    },
    {
      command: "desktop_db_call",
      payload: {
        vaultId: "desktop-folder:/vault",
        method: "setMeta",
        args: ["theme", "dark"],
      },
    },
    {
      command: "desktop_db_close",
      payload: { vaultId: "desktop-folder:/vault" },
    },
  ]);
});

it("routes text appends through the native append command without a readback", async () => {
  const calls: Array<{ command: string; payload?: Record<string, unknown> }> =
    [];
  setNativeDesktopBridge({
    runtime: "electron-desktop",
    toFileUrl: (path: string) => `file://${path}`,
    async invoke<T>(command: string, payload?: Record<string, unknown>) {
      calls.push({ command, payload });
      return undefined as T;
    },
  });
  const adapter = new NativeDesktopVaultAdapter("/vault");

  await adapter.append("Notes/.lapis/transcript.jsonl", "entry\n");

  expect(calls).toEqual([
    {
      command: "desktop_fs_append_text",
      payload: {
        rootPath: "/vault",
        normalizedPath: "Notes/.lapis/transcript.jsonl",
        data: "entry\n",
        options: undefined,
      },
    },
  ]);
});
