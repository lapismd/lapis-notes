import { afterEach, expect, it } from "vitest";

import {
  MemoryKeyValueStore,
  createNativeDesktopVault,
  getCurrentVaultProfile,
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
