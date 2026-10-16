import { afterEach, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import type { App } from "../context.svelte";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { getWorkspaceHostBinding } from "../workspace-host";
import WorkspaceStateHarness from "./WorkspaceStateHarness.test.svelte";

const path = ".lapis/app.json";
const key = "workspace.mobile.showBottomNav";
const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const run of cleanup.splice(0).reverse()) await run();
});
async function fixture() {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  const adapter = new MemoryVaultAdapter({
    [path]: JSON.stringify({ [key]: true, outside: "keep" }),
  });
  const write = vi.fn(
    async (file: string, text: string, expected: string | null) => {
      const actual = await adapter.read(file).catch(() => null);
      if (actual !== expected)
        throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
      await adapter.write(file, text);
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
  await controller.settings.load();
  return { app, controller, adapter, write };
}

it("admits a shared Settings change before its debounce and immediate close guard", async () => {
  const { app, controller, adapter } = await fixture();
  expect(controller.settings.update(key, false)).toBe(true);
  await app.fileEditingSessions.guard(undefined, async () => {
    await controller.settings.flushSave();
  });
  expect(JSON.parse(await adapter.read(path))).toEqual({
    [key]: false,
    outside: "keep",
  });
});

it("retains failed shared Settings writes and projects explicit recovery without feedback writes", async () => {
  const { app, controller, adapter, write } = await fixture();
  const external = JSON.stringify({ [key]: false, outside: "external" });
  await adapter.write(path, external);
  controller.settings.update(key, false);
  await expect(
    app.fileEditingSessions.guard(undefined, async () => {}),
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  expect(await adapter.read(path)).toBe(external);
  await app.fileEditingSessions.textConflicts.entries[0].resolve(
    "use-external",
  );
  expect(controller.settings.get(key)).toBe(false);
  controller.settings.update(key, true);
  await app.fileEditingSessions.guard(undefined, async () => {
    await controller.settings.flushSave();
  });
  expect(JSON.parse(await adapter.read(path))).toEqual({
    [key]: true,
    outside: "external",
  });
  expect(write).toHaveBeenCalledTimes(2);
});

it("preserves an independent API change queued before a shared Settings update", async () => {
  const { app, controller, adapter } = await fixture();
  const other = "appearence.interface.scrollbarVisibility";
  const pending = app.configuration.updateConfigurationOption(other, "always");
  controller.settings.update(key, false);
  await pending;
  await app.fileEditingSessions.guard(undefined, async () => {
    await controller.settings.flushSave();
  });
  expect(JSON.parse(await adapter.read(path))).toMatchObject({
    [key]: false,
    [other]: "always",
    outside: "keep",
  });
});
