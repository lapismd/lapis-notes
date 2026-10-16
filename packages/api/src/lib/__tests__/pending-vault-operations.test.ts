import { expect, it } from "vitest";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";

for (const [kind, method, path, create] of [
  [
    "text note",
    "write",
    "New.md",
    (vault: Vault) => vault.create("New.md", "draft"),
  ],
  [
    "attachment",
    "writeBinary",
    "image.png",
    (vault: Vault) =>
      vault.createBinary("image.png", new Uint8Array([1, 2, 3]).buffer),
  ],
  ["folder", "mkdir", "Folder", (vault: Vault) => vault.createFolder("Folder")],
] as const) {
  it(`drains an admitted ${kind} creation through IO and file-tree projection`, async () => {
    const registry = new FileEditingSessionRegistry();
    const adapter = new MemoryVaultAdapter();
    Object.assign(adapter, {
      getCapabilities: () => ({ conditionalTextWrite: true }),
      writeTextIfUnchanged: async () => {},
    });
    const vault = new Vault(adapter, registry);
    await vault.load();
    let entered!: () => void, release!: () => void;
    const started = new Promise<void>((done) => {
      entered = done;
    });
    const held = new Promise<void>((done) => {
      release = done;
    });
    const original = adapter[method];
    Object.assign(adapter, {
      [method]: async (...args: unknown[]) => {
        entered();
        await held;
        return (original as Function).apply(adapter, args);
      },
    });
    const creating = create(vault);
    let drained = false;
    const draining = registry.settleOperations().then(() => {
      drained = true;
    });
    try {
      await started;
      await new Promise((done) => setTimeout(done, 0));
      expect(drained).toBe(false);
    } finally {
      release();
      await Promise.all([creating, draining]);
    }
    expect(vault.getAbstractFileByPath(path)).not.toBeNull();
    expect(await adapter.exists(path)).toBe(true);
  });
}
