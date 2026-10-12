import { afterEach, expect, it } from "vitest";

import {
  MemoryKeyValueStore,
  NativeDesktopVaultAdapter,
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
    runtime: "deno-desktop" as const,
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

it("preserves the deno-desktop adapter runtime", () => {
  const adapter = new NativeDesktopVaultAdapter(
    "/vault",
    { name: "Vault" },
    "deno-desktop",
  );
  expect(adapter.runtime).toBe("deno-desktop");
});

it("routes text appends through the native append command without a readback", async () => {
  const calls: Array<{ command: string; payload?: Record<string, unknown> }> =
    [];
  setNativeDesktopBridge({
    runtime: "deno-desktop",
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

it("streams native range reads and stages atomic chunk writes", async () => {
  const calls: Array<{ command: string; payload?: Record<string, unknown> }> = [];
  const source = new TextEncoder().encode("abcdefgh");
  setNativeDesktopBridge({
    runtime: "deno-desktop",
    toFileUrl: (path: string) => `file://${path}`,
    async invoke<T>(command: string, payload?: Record<string, unknown>) {
      calls.push({ command, payload });
      if (command === "desktop_fs_stat") {
        return { type: "file", size: source.byteLength, ctime: 1, mtime: 2 } as T;
      }
      if (command === "desktop_fs_read_range") {
        const offset = Number(payload?.offset ?? 0);
        const length = Number(payload?.length ?? 0);
        return [...source.slice(offset, offset + length)] as T;
      }
      if (command === "desktop_fs_atomic_write_begin") return "write-1" as T;
      return undefined as T;
    },
  });
  const adapter = new NativeDesktopVaultAdapter("/vault");
  const handle = await adapter.openRead("data.bin");
  const bytes = await new Response(
    handle.stream({ offset: 1, length: 3 }),
  ).arrayBuffer();
  expect(new TextDecoder().decode(bytes)).toBe("bcd");

  await adapter.atomicWrite(
    "data.bin",
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("next"));
        controller.close();
      },
    }),
  );
  expect(calls.map(({ command }) => command)).toEqual([
    "desktop_fs_stat",
    "desktop_fs_read_range",
    "desktop_fs_atomic_write_begin",
    "desktop_fs_atomic_write_chunk",
    "desktop_fs_atomic_write_commit",
  ]);
});

it.each(["ENOENT: /vault/gone.bin", "Error: ENOENT: /vault/gone.bin"])(
  "restores portable filesystem codes from native Error rejections: %s",
  async (message) => {
    const rejected = new Error(message);
    setNativeDesktopBridge({
      runtime: "deno-desktop",
      async invoke<T>(command: string) {
        if (command === "desktop_fs_stat") {
          return { type: "file", size: 4, ctime: 1, mtime: 2 } as T;
        }
        throw rejected;
      },
    });
    const adapter = new NativeDesktopVaultAdapter("/vault");
    const handle = await adapter.openRead("gone.bin");
    await expect(handle.stream().getReader().read()).rejects.toMatchObject({
      code: "ENOENT",
    });
  },
);

it("preserves explicit native error codes and unexpected errors", async () => {
  const explicit = Object.assign(new Error("EIO: detail"), { code: "EACCES" });
  const unexpected = new Error("Native transport unavailable");
  let rejected = explicit as Error;
  setNativeDesktopBridge({
    runtime: "deno-desktop",
    async invoke<T>(): Promise<T> {
      throw rejected;
    },
  });
  const adapter = new NativeDesktopVaultAdapter("/vault");
  await expect(adapter.read("private.md")).rejects.toBe(explicit);
  expect(explicit.code).toBe("EACCES");
  rejected = unexpected;
  await expect(adapter.read("private.md")).rejects.toBe(unexpected);
  expect(unexpected).not.toHaveProperty("code");
});
