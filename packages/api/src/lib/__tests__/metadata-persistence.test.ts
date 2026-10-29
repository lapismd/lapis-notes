import { expect, it, vi } from "vitest";
import { MetadataTypeManager } from "../metadata.svelte";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";

vi.mock("svelte", async (load) => ({
  ...(await load<object>()),
  onMount: () => {},
}));

const path = ".lapis/types.json";
const original = JSON.stringify({ types: { status: "text" } });
async function fixture(existing = true) {
  const adapter = new MemoryVaultAdapter(
    existing ? { [path]: original } : { ".lapis/seed": "" },
  );
  const write = vi.fn(
    async (target: string, data: string, expected: string | null) => {
      const actual = await adapter.read(target).catch(() => null);
      if (actual !== expected)
        throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
      await adapter.write(target, data);
    },
  );
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    writeTextIfUnchanged: write,
  });
  const vault = new Vault(adapter);
  await vault.load();
  const registry = new FileEditingSessionRegistry();
  const app = {
    vault,
    fileEditingSessions: registry,
    props: { configPath: ".lapis/app.json" },
    metadataCache: { queryFacets: async () => [] },
  };
  const manager = new MetadataTypeManager(app as any);
  await manager.load();
  return { adapter, registry, manager, write };
}

it("includes newly changed metadata types in immediate lifecycle flush", async () => {
  const { adapter, registry, manager, write } = await fixture();
  manager.setType("status", "number");
  await registry.guard(undefined, async () => {});
  expect(JSON.parse(await adapter.read(path)).types.status).toBe("number");
  expect(write).toHaveBeenCalledOnce();
});

it("retains metadata type conflicts against the loaded bytes", async () => {
  const { adapter, registry, manager } = await fixture();
  await adapter.write(path, '{"types":{"status":"checkbox"}}');
  manager.setType("status", "number");
  await expect(registry.guard(undefined, async () => {})).rejects.toMatchObject(
    { code: "ECONFLICT" },
  );
  expect(JSON.parse(await adapter.read(path)).types.status).toBe("checkbox");
  expect(registry.textConflicts.entries).toHaveLength(1);
  await registry.textConflicts.entries[0].resolve("use-external");
  expect(manager.types.status.type).toBe("checkbox");
  await registry.guard(undefined, async () => {});
});

it("creates missing metadata type state with explicit expected absence", async () => {
  const { adapter, registry, manager, write } = await fixture(false);
  manager.setType("newType", "date");
  await registry.guard(undefined, async () => {});
  expect(JSON.parse(await adapter.read(path)).types.newType).toBe("date");
  expect(write.mock.calls[0][2]).toBe(null);
});

it("serializes successive metadata edits without false conflicts", async () => {
  const { adapter, registry, manager } = await fixture();
  manager.setType("status", "number");
  manager.setType("second", "tags");
  await registry.guard(undefined, async () => {});
  expect(JSON.parse(await adapter.read(path)).types).toEqual({
    status: "number",
    second: "tags",
  });
  expect(registry.textConflicts.entries).toHaveLength(0);
});

it("can discard a metadata draft after external deletion and then save new types", async () => {
  const { adapter, registry, manager } = await fixture();
  await adapter.remove(path);
  manager.setType("status", "number");
  await expect(registry.guard(undefined, async () => {})).rejects.toMatchObject(
    { code: "ECONFLICT" },
  );
  expect(registry.textConflicts.entries[0].external).toBe(null);
  await registry.textConflicts.entries[0].resolve("use-external");
  manager.setType("next", "text");
  await registry.guard(undefined, async () => {});
  expect(JSON.parse(await adapter.read(path)).types).toEqual({ next: "text" });
});

it("keeps later metadata edits in the retained conflict draft", async () => {
  const { adapter, registry, manager } = await fixture();
  await adapter.write(path, '{"types":{"status":"checkbox"}}');
  manager.setType("status", "number");
  await expect(registry.guard(undefined, async () => {})).rejects.toMatchObject(
    { code: "ECONFLICT" },
  );
  manager.setType("latest", "tags");
  await expect(registry.guard(undefined, async () => {})).rejects.toMatchObject(
    { code: "ECONFLICT" },
  );
  expect(JSON.parse(registry.textConflicts.entries[0].local).types).toEqual({
    status: "number",
    latest: "tags",
  });
  await registry.textConflicts.entries[0].resolve("keep-local");
  expect(JSON.parse(await adapter.read(path)).types).toEqual({
    status: "number",
    latest: "tags",
  });
  await registry.guard(undefined, async () => {});
});

it("rejects protected metadata edits before mutating the visible type model", async () => {
  const { registry, manager, adapter } = await fixture();
  await registry.guard(undefined, async () => {
    expect(() => manager.setType("status", "number")).toThrow(/protected/);
    expect(manager.types.status.type).toBe("text");
  });
  expect(await adapter.read(path)).toBe(original);
  manager.setType("status", "number");
  await registry.guard(undefined, async () => {
    expect(() => manager.setType("status", "tags")).toThrow(/protected/);
    expect(manager.types.status.type).toBe("number");
  });
});
