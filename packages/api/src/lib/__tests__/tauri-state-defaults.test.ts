import { describe, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import StateDefaultsHarness from "./StateDefaultsHarness.test.svelte";
import { App } from "../context.svelte";
import { Vault } from "../storage/vault.svelte";
import {
  MemoryAppDatabase,
  supportsSearchQueryEnhancementRuntime,
} from "../storage/app-database";
import { isNativeDesktopRuntime } from "../storage/runtime";
import { NativeDesktopVaultAdapter } from "../storage/desktop-native";
import { createVaultSession } from "../storage/vault-session";
import { resolvePluginDataPath } from "../plugin";
import {
  APP_SHELL_PLUGINS_PATH,
  createAppShellPluginPersistence,
} from "../app-shell-plugin-persistence";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

describe("shared state defaults for every host", () => {
  it("defaults the vault state directory to .lapis", () => {
    expect(new Vault(new InMemoryDataAdapter()).configDir).toBe(".lapis");
  });
  it.each(["core", "system"] as const)(
    "stores %s plugin data under .lapis",
    (source) => {
      expect(resolvePluginDataPath("example", source)).toBe(
        "/.lapis/example.json",
      );
    },
  );
  it("persists AppShell enablement in .lapis", async () => {
    const mkpath = vi.fn(async () => undefined);
    const write = vi.fn(async () => undefined);
    await createAppShellPluginPersistence({
      mkpath,
      adapter: { read: async () => "{}", write },
    }).save({ fmode: false });
    expect(APP_SHELL_PLUGINS_PATH).toBe(".lapis/app-shell-plugins.json");
    expect(mkpath).toHaveBeenCalledWith(".lapis");
    expect(write).toHaveBeenCalledWith(
      ".lapis/app-shell-plugins.json",
      expect.any(String),
    );
  });
  it("defaults App configuration without a host-specific override", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      media: "",
      addEventListener() {},
      removeEventListener() {},
    }));
    let app!: App;
    const component = mount(StateDefaultsHarness, {
      target: document.createElement("div"),
      props: {
        onApp: (value) => {
          app = value;
        },
      },
    });
    try {
      expect(app.props.configPath).toBe(".lapis/app.json");
    } finally {
      await unmount(component);
    }
  });
});

describe("Tauri native database admission", () => {
  it("passes the Tauri runtime and direct role to its injected provider", async () => {
    const adapter = new InMemoryDataAdapter();
    const open = vi.fn(async ({ vaultId }) => {
      const database = new MemoryAppDatabase(vaultId);
      await database.open();
      return database;
    });
    const session = await createVaultSession(adapter, {
      runtime: "tauri-desktop",
      appDatabaseProvider: { id: "native-test", canOpen: () => true, open },
    });
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({ runtime: "tauri-desktop", role: "direct" }),
    );
    expect(session.runtime).toBe("tauri-desktop");
    await session.close();
  });
  it("rejects an absent provider before any implicit storage fallback", async () => {
    await expect(
      createVaultSession(new InMemoryDataAdapter(), {
        runtime: "tauri-desktop",
      }),
    ).rejects.toThrow("tauri-desktop requires an AppDatabaseProvider");
  });
});

describe("native classification without implicit service capabilities", () => {
  it.each([
    ["deno-desktop", true],
    ["tauri-desktop", true],
    ["web-pwa", false],
    ["deno-server", false],
    ["test", false],
  ] as const)("classifies %s as native desktop: %s", (runtime, native) => {
    expect(isNativeDesktopRuntime(runtime)).toBe(native);
  });
  it("preserves the public Tauri adapter runtime", () => {
    expect(
      new NativeDesktopVaultAdapter("/vault", {}, "tauri-desktop").runtime,
    ).toBe("tauri-desktop");
  });
  it("does not infer Deno model services from Tauri desktop classification", () => {
    expect(supportsSearchQueryEnhancementRuntime("tauri-desktop")).toBe(false);
  });
});
