import { expect, it, vi } from "vitest";
import { Configuration } from "../configuration.svelte";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";

vi.mock("../settings.svelte", () => ({ SettingTab: class {} }));
const path = ".lapis/app.json";
async function fixture() {
  const adapter = new MemoryVaultAdapter({
    [path]: JSON.stringify({
      keep: "original",
      pluginData: {
        other: { keep: 2 },
        "repository-history": {
          automaticBackup: true,
          showWorkingCopyStatus: false,
        },
      },
    }),
  });
  const conditional = vi.fn(
    async (file: string, text: string, expected: string | null) => {
      if ((await adapter.read(file).catch(() => null)) !== expected)
        throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
      await adapter.write(file, text);
    },
  );
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    writeTextIfUnchanged: conditional,
  });
  const vault = new Vault(adapter);
  await vault.load();
  const registry = new FileEditingSessionRegistry();
  const app = { vault, fileEditingSessions: registry, workspace: { on() {} } };
  const configuration = new Configuration(app as any, path);
  await configuration.load();
  configuration.schema.register({
    id: "late",
    title: "Late settings",
    type: "object",
    properties: { setting: { type: "boolean", default: true } },
  });
  return { adapter, conditional, registry, configuration };
}

it("reconciles an external saved baseline without materializing defaults or writing", async () => {
  const f = await fixture();
  const next = {
    keep: "native",
    pluginData: {
      other: { keep: 2 },
      "repository-history": {
        automaticBackup: false,
        showWorkingCopyStatus: false,
      },
    },
  };
  await f.adapter.write(path, JSON.stringify(next));
  await f.configuration.reloadFromDisk({ materializeDefaults: false });
  expect(f.conditional).not.toHaveBeenCalled();
  expect(JSON.parse(await f.adapter.read(path))).toEqual(next);
  expect(f.configuration.getPluginData("repository-history")).toEqual(
    next.pluginData["repository-history"],
  );
  await f.registry.dispose();
});

it("retains default reload materialization", async () => {
  const f = await fixture();
  await f.configuration.reloadFromDisk();
  expect(f.conditional).toHaveBeenCalledOnce();
  expect(JSON.parse(await f.adapter.read(path))).toMatchObject({
    keep: "original",
    "late.setting": true,
  });
  await f.registry.dispose();
});

it("reconciles between a guarded native mutation and an unrelated queued save without deadlock or a stale snapshot", async () => {
  const f = await fixture();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const mutation = f.registry.guard(path, async () => {
    await gate;
    const current = JSON.parse(await f.adapter.read(path));
    current.pluginData["repository-history"].automaticBackup = false;
    await f.adapter.write(path, JSON.stringify(current));
  });
  const reconcile = f.registry.afterMutations(() =>
    f.configuration.reloadFromDisk({ materializeDefaults: false }),
  );
  const later = f.configuration.updateConfigurationOption("later", 9);
  release();
  await Promise.all([mutation, reconcile, later]);
  expect(JSON.parse(await f.adapter.read(path))).toEqual({
    keep: "original",
    later: 9,
    pluginData: {
      other: { keep: 2 },
      "repository-history": {
        automaticBackup: false,
        showWorkingCopyStatus: false,
      },
    },
  });
  expect(f.conditional).toHaveBeenCalledOnce();
  expect(f.registry.textConflicts.entries).toHaveLength(0);
  await f.registry.dispose();
});
