import { afterEach, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import type { App } from "../context.svelte";
import { Plugin } from "../plugin";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import WorkspaceStateHarness from "./WorkspaceStateHarness.test.svelte";

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});
class LegacyPlugin extends Plugin {
  constructor(app: App) {
    super(app, {
      id: "legacy-example",
      name: "Legacy example",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      author: "test",
      description: "",
    });
  }
  async onload(): Promise<void> {}
}
async function fixture(conditional: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  const path = ".lapis/legacy-example.json";
  const saved = { shell: "/bin/sh", cwd: "notes", retained: true };
  const adapter = new MemoryVaultAdapter({
    ".lapis/app.json": "{}",
    [path]: JSON.stringify(saved),
  });
  if (conditional)
    Object.assign(adapter, {
      getCapabilities: () => ({ conditionalTextWrite: true }),
      writeTextIfUnchanged: async (
        path: string,
        text: string,
        expected: string | null,
      ) => {
        const actual = await adapter.read(path).catch(() => null);
        if (actual !== expected)
          throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
        await adapter.write(path, text);
      },
    });
  let app!: App;
  const component = mount(WorkspaceStateHarness, {
    target: document.createElement("div"),
    props: {
      adapter,
      onApp: (value) => {
        app = value;
      },
    },
  });
  cleanup.push(async () => {
    await app.workspace.disposeWorkspaceHost();
    await app.fileEditingSessions.dispose();
    await unmount(component);
  });
  await app.vault.load();
  await app.configuration.load();
  app.plugins.registerStaticPlugins([LegacyPlugin]);
  await app.fileEditingSessions.settleOperations();
  const plugin = app.plugins.plugins.get("legacy-example")!;
  return { app, adapter, plugin, path, saved };
}

it.each([false, true])(
  "registration preserves unadopted legacy plugin data until loadData hydrates canonical state (conditional=%s)",
  async (conditional) => {
    const { app, adapter, plugin, path, saved } = await fixture(conditional);
    expect(JSON.parse(await adapter.read(path))).toEqual(saved);
    expect(await plugin.loadData()).toEqual(saved);
    expect(app.configuration.getPluginData("legacy-example")).toEqual(saved);
    await app.fileEditingSessions.settleOperations();
    expect(JSON.parse(await adapter.read(path))).toEqual(saved);
  },
);

it.each([false, true])(
  "explicit canonical plugin-data removal still deletes its compatibility mirror (conditional=%s)",
  async (conditional) => {
    const { app, adapter, plugin, path } = await fixture(conditional);
    await plugin.saveData({ retained: true });
    await app.configuration.removePluginData("legacy-example");
    await app.fileEditingSessions.settleOperations();
    await expect.poll(() => adapter.exists(path)).toBe(false);
  },
);
