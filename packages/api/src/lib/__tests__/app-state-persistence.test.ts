import { expect, it, vi } from "vitest";
import { Configuration } from "../configuration.svelte";
import { CommandManager } from "../command.svelte";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";

vi.mock("../settings.svelte", () => ({ SettingTab: class {} }));

const configPath = ".lapis/app.json";
const hotkeysPath = ".lapis/hotkeys.json";
async function fixture() {
  const adapter = new MemoryVaultAdapter({
    [configPath]: '{"keep":"original"}',
    [hotkeysPath]: "{}",
  });
  const conditional = vi.fn(
    async (path: string, text: string, expected: string | null) => {
      const actual = await adapter.read(path).catch(() => null);
      if (actual !== expected)
        throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
      await adapter.write(path, text);
    },
  );
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    writeTextIfUnchanged: conditional,
  });
  const vault = new Vault(adapter);
  await vault.load();
  const registry = new FileEditingSessionRegistry();
  const app = {
    vault,
    fileEditingSessions: registry,
    workspace: {
      on() {},
      activeLeaf: null,
      getFocusedCommandHostId: () => "root",
      getCommandHostLeaf: () => null,
    },
    contextKeys: { evaluate: () => true },
  };
  const configuration = new Configuration(app as any, configPath);
  await configuration.load();
  const commands = new CommandManager(app as any);
  await commands.loadHotkeys();
  return { adapter, vault, registry, configuration, commands, conditional };
}

it("serializes concurrent configuration updates without losing independent keys", async () => {
  const { adapter, configuration } = await fixture();
  await Promise.all([
    configuration.updateConfigurationOption("first", 1),
    configuration.updateConfigurationOption("second", 2),
  ]);
  expect(JSON.parse(await adapter.read(configPath))).toEqual({
    keep: "original",
    first: 1,
    second: 2,
  });
});

it("merges concurrent plugin data updates with other configuration updates", async () => {
  const { adapter, configuration } = await fixture();
  await Promise.all([
    configuration.updatePluginData("first", { value: 1 }),
    configuration.updatePluginData("second", { value: 2 }),
    configuration.updateConfigurationOption("setting", true),
  ]);
  expect(JSON.parse(await adapter.read(configPath))).toEqual({
    keep: "original",
    setting: true,
    pluginData: { first: { value: 1 }, second: { value: 2 } },
  });
});

it("waits for a pending settings write before admitting lifecycle teardown", async () => {
  const { adapter, configuration, registry } = await fixture();
  const write = adapter.write.bind(adapter);
  let release!: () => void;
  const blocked = new Promise<void>((done) => {
    release = done;
  });
  let entered!: () => void;
  const started = new Promise<void>((done) => {
    entered = done;
  });
  vi.spyOn(adapter, "write").mockImplementationOnce(
    async (path, text, options) => {
      entered();
      await blocked;
      await write(path, text, options);
    },
  );
  const update = configuration.updateConfigurationOption("first", 1);
  let closed = false;
  const close = registry.guard(undefined, async () => {
    closed = true;
  });
  try {
    await started;
    await new Promise((done) => setTimeout(done, 0));
    expect(closed).toBe(false);
  } finally {
    release();
    await Promise.allSettled([update, close]);
  }
  expect(closed).toBe(true);
});

it("retains failed settings drafts and blocks close until explicit recovery", async () => {
  const { configuration, conditional, registry, adapter } = await fixture();
  const denied = Object.assign(new Error("Read-only folder"), {
    code: "EACCES",
  });
  vi.spyOn(adapter, "write").mockRejectedValueOnce(denied);
  await expect(
    configuration.updateConfigurationOption("first", 1),
  ).rejects.toMatchObject({ code: "EACCES" });
  await expect(registry.guard(undefined, async () => {})).rejects.toMatchObject(
    { code: "ECONFLICT" },
  );
  expect(registry.textConflicts.entries).toHaveLength(1);
  await registry.textConflicts.entries[0].resolve("keep-local");
  await registry.guard(undefined, async () => {});
  expect(JSON.parse(await adapter.read(configPath)).first).toBe(1);
  expect(conditional).toHaveBeenCalled();
});

it("preserves external hotkey state and retains the local shortcut for recovery", async () => {
  const { commands, registry, adapter } = await fixture();
  const external = '{"external":[{"key":"E","modifiers":["Mod"]}]}';
  await adapter.write(hotkeysPath, external);
  await expect(
    commands.setHotkeys("local", [{ key: "L", modifiers: ["Mod"] }]),
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  expect(await adapter.read(hotkeysPath)).toBe(external);
  await expect(registry.guard(undefined, async () => {})).rejects.toMatchObject(
    { code: "ECONFLICT" },
  );
  await registry.textConflicts.entries[0].resolve("use-external");
  expect(commands.getEffectiveHotkeys("external")).toEqual([
    { key: "E", modifiers: ["Mod"] },
  ]);
});

it("retains a settings conflict if the disk record cannot be accepted", async () => {
  const { configuration, registry, adapter } = await fixture();
  await adapter.write(configPath, "{invalid JSON");
  await expect(
    configuration.updateConfigurationOption("first", 1),
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  await expect(
    registry.textConflicts.entries[0].resolve("use-external"),
  ).rejects.toThrow();
  expect(registry.textConflicts.entries).toHaveLength(1);
  await expect(registry.guard(undefined, async () => {})).rejects.toMatchObject(
    { code: "ECONFLICT" },
  );
  expect(configuration.getConfiguration().get("keep")).toBe("original");
  await adapter.write(configPath, '{"keep":"repaired"}');
  await registry.textConflicts.entries[0].refresh();
  await registry.textConflicts.entries[0].resolve("use-external");
  expect(configuration.getConfiguration().get("keep")).toBe("repaired");
});
