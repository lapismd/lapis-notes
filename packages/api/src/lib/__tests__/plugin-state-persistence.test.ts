import { afterEach, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import type { App } from "../context.svelte";
import { Plugin } from "../plugin";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { getWorkspaceHostBinding } from "../workspace-host";
import WorkspaceStateHarness from "./WorkspaceStateHarness.test.svelte";

const corePath = ".lapis/core-plugins.json";
const shellPath = ".lapis/app-shell-plugins.json";
const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const run of cleanup.splice(0).reverse()) await run();
});

class ExamplePlugin extends Plugin {
  onload(): void {}

  constructor(app: App) {
    super(app, {
      id: "example",
      name: "Example",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
  }
}

it("drains a pending core transition and its choice before host teardown", async () => {
  const { app, adapter } = await fixture();
  const plugin = app.plugins.plugins.get("example")!;
  let release!: () => void;
  const held = new Promise<void>((done) => {
    release = done;
  });
  const unload = vi.spyOn(plugin, "onunload").mockImplementation(() => held);
  const disabling = app.plugins.disablePlugin("example");
  let drained = false;
  const flushing = Promise.resolve(app.plugins.flushPendingConfigWrites()).then(
    () => {
      drained = true;
    },
  );
  try {
    await vi.waitFor(() => expect(unload).toHaveBeenCalledOnce());
    expect(drained).toBe(false);
  } finally {
    release();
    await Promise.all([disabling, flushing]);
  }
  expect(JSON.parse(await adapter.read(corePath))).toEqual(["example"]);
});

async function fixture(failInitialCoreRead = false) {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  const adapter = new MemoryVaultAdapter({
    ".lapis/app.json": "{}",
    [corePath]: "[]",
    [shellPath]: '{"fmode":false}',
  });
  if (failInitialCoreRead) {
    const read = adapter.read.bind(adapter);
    let failed = false;
    vi.spyOn(adapter, "read").mockImplementation(async (path) => {
      if (path.replace(/^\/+/, "") === corePath && !failed) {
        failed = true;
        throw Object.assign(new Error("initial read failed"), { code: "EIO" });
      }
      return read(path);
    });
  }
  const write = vi.fn(
    async (path: string, text: string, expected: string | null) => {
      const actual = await adapter.read(path).catch(() => null);
      if (actual !== expected)
        throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
      await adapter.write(path, text);
    },
  );
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    writeTextIfUnchanged: write,
  });
  let app!: App;
  const component = mount(WorkspaceStateHarness, {
    target: document.createElement("div"),
    props: { adapter, onApp: (value) => (app = value) },
  });
  const controller = getWorkspaceHostBinding(app.workspace).controller;
  cleanup.push(async () => {
    await app.workspace.disposeWorkspaceHost();
    await unmount(component);
  });
  await app.vault.load();
  await app.configuration.load();
  app.plugins.registerCorePlugins([ExamplePlugin]);
  await app.plugins.loadPlugins({ communityPlugins: "disabled" });
  await controller.plugins.start();
  return { app, controller, adapter, write };
}

it("persists a core enablement choice before an immediate close guard", async () => {
  const { app, adapter } = await fixture();
  expect(await app.plugins.disablePlugin("example")).toBe(true);
  await app.fileEditingSessions.guard(undefined, async () => {});
  expect(JSON.parse(await adapter.read(corePath))).toEqual(["example"]);
});

it("retains a failed core enablement write until explicit recovery", async () => {
  const { app, adapter, write } = await fixture();
  write.mockRejectedValueOnce(
    Object.assign(new Error("denied"), { code: "EACCES" }),
  );
  await app.plugins.disablePlugin("example");
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toThrow();
  expect(app.fileEditingSessions.textConflicts.entries[0].path).toBe(corePath);
  await app.fileEditingSessions.textConflicts.entries[0].resolve("keep-local");
  await app.fileEditingSessions.guard(undefined, async () => {});
  expect(JSON.parse(await adapter.read(corePath))).toEqual(["example"]);
});

it("preserves an external core choice and restores runtime enablement on disk recovery", async () => {
  const { app, adapter } = await fixture();
  await adapter.write(corePath, '{"disabled":[],"enabled":["example"]}');
  await app.plugins.disablePlugin("example");
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toThrow();
  await app.fileEditingSessions.textConflicts.entries[0].resolve(
    "use-external",
  );
  expect(app.plugins.plugins.get("example")?.enabled).toBe(true);
  await app.fileEditingSessions.guard(undefined, async () => {});
});

it("protects App Shell enablement from external changes and restores the visible choice", async () => {
  const { app, adapter, controller } = await fixture();
  await adapter.write(shellPath, '{"fmode":false,"outside":true}');
  await controller.plugins.enable("fmode");
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toThrow();
  expect(await adapter.read(shellPath)).toContain('"outside":true');
  await app.fileEditingSessions.textConflicts.entries[0].resolve(
    "use-external",
  );
  expect(controller.plugins.get("fmode")?.enabled).toBe(false);
});

it("retains compatibility-file persistence after canonical plugin data has saved", async () => {
  const { app, adapter, write } = await fixture();
  const plugin = app.plugins.plugins.get("example")!;
  await plugin.saveData({ value: "first" });
  const legacy = ".lapis/example.json";
  await adapter.write(legacy, '{"value":"external"}');
  await expect(plugin.saveData({ value: "local" })).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toThrow();
  expect(app.configuration.getPluginData("example")).toEqual({
    value: "local",
  });
  expect(await adapter.read(legacy)).toContain("external");
  expect(write).toHaveBeenCalled();
  await app.fileEditingSessions.textConflicts.entries[0].resolve("keep-local");
  expect(JSON.parse(await adapter.read(legacy))).toEqual({ value: "local" });
});

it("allows recovered plugin activation to persist other owned state without reentering its recovery queue", async () => {
  const { app, adapter } = await fixture();
  const plugin = app.plugins.plugins.get("example")!;
  vi.spyOn(plugin, "onload").mockImplementation(() =>
    app.configuration.updateConfigurationOption("recovered", true),
  );
  await adapter.write(corePath, '{"disabled":[],"enabled":["example"]}');
  await app.plugins.disablePlugin("example");
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toThrow();
  await app.fileEditingSessions.textConflicts.entries[0].resolve(
    "use-external",
  );
  expect(plugin.enabled).toBe(true);
  expect(app.configuration.getConfiguration().get("recovered")).toBe(true);
});

it("retains the original draft if disk changes during runtime recovery and can keep it afterward", async () => {
  const { app, adapter } = await fixture();
  const plugin = app.plugins.plugins.get("example")!;
  await adapter.write(corePath, '{"disabled":[],"enabled":["example"]}');
  await app.plugins.disablePlugin("example");
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toThrow();
  vi.spyOn(plugin, "onload").mockImplementationOnce(async () => {
    await adapter.write(corePath, "[]");
  });
  await expect(
    app.fileEditingSessions.textConflicts.entries[0].resolve("use-external"),
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  expect(
    JSON.parse(app.fileEditingSessions.textConflicts.entries[0].local),
  ).toEqual(["example"]);
  await app.fileEditingSessions.textConflicts.entries[0].resolve("keep-local");
  expect(plugin.enabled).toBe(false);
  expect(JSON.parse(await adapter.read(corePath))).toEqual(["example"]);
});

it("retains runtime recovery after the initial core configuration read fails", async () => {
  const { app, adapter, write } = await fixture(true);
  write.mockRejectedValueOnce(
    Object.assign(new Error("denied"), { code: "EACCES" }),
  );
  await app.plugins.disablePlugin("example");
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toThrow();
  await app.fileEditingSessions.textConflicts.entries[0].resolve(
    "use-external",
  );
  expect(app.plugins.plugins.get("example")?.enabled).toBe(true);
  expect(await adapter.read(corePath)).toBe("[]");
  await app.fileEditingSessions.guard(undefined, async () => {});
});

it("rejects primitive core configuration during recovery and retains the barrier", async () => {
  const { app, adapter } = await fixture();
  await adapter.write(corePath, "false");
  await app.plugins.disablePlugin("example");
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toThrow();
  await expect(
    app.fileEditingSessions.textConflicts.entries[0].resolve("use-external"),
  ).rejects.toThrow("Invalid core plugin configuration");
  expect(app.fileEditingSessions.textConflicts.entries[0].local).toContain(
    "example",
  );
  expect(await adapter.read(corePath)).toBe("false");
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toThrow();
  await app.fileEditingSessions.textConflicts.entries[0].resolve("keep-local");
});
