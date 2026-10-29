import { describe, expect, it, vi } from "vitest";
import { Vault } from "../storage/vault.svelte";
import { FileManager } from "../file-manager";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { InMemoryDataAdapter } from "./data-adapter-conformance";
class ExclusiveAdapter extends InMemoryDataAdapter {
  before: (() => Promise<void>) | undefined;
  getCapabilities() {
    return { exclusiveCreate: true };
  }
  async writeExclusive(path: string, data: string | ArrayBuffer) {
    await this.before?.();
    if (await this.exists(path))
      throw Object.assign(new Error("destination exists"), { code: "EEXIST" });
    if (typeof data === "string") await this.write(path, data);
    else await this.writeBinary(path, data);
  }
}
async function fixture() {
  const adapter = new ExclusiveAdapter();
  const operations = new FileEditingSessionRegistry();
  const vault = new Vault(adapter, operations);
  await vault.load();
  const manager = new FileManager({
    vault,
    fileEditingSessions: operations,
  } as any);
  return { adapter, vault, manager, operations };
}
describe("new-file creation intent", () => {
  it("preserves a destination that appears after the path was chosen", async () => {
    const { adapter, vault, manager } = await fixture();
    adapter.before = async () => {
      await adapter.write("new.md", "external arrival");
    };
    await expect(manager.createFile("new.md", "local")).rejects.toMatchObject({
      code: "EEXIST",
    });
    expect(await adapter.read("new.md")).toBe("external arrival");
    expect(vault.getFileByPath("new.md")).toBeNull();
    expect(vault.cache.has("new.md")).toBe(false);
  });
  it("creates text and binary without corrupting bytes or duplicating the tree", async () => {
    const { adapter, vault, manager } = await fixture();
    const file = await manager.createFile("café.md", "# 笔记\n");
    expect(await vault.read(file)).toBe("# 笔记\n");
    const binary = await manager.createFile(
      "附件.bin",
      Uint8Array.from([0, 255, 128]).buffer,
    );
    expect([...new Uint8Array(await adapter.readBinary(binary.path))]).toEqual([
      0, 255, 128,
    ]);
    expect(vault.getFiles()).toHaveLength(2);
    expect(vault.getRoot().children).toHaveLength(2);
  });
  it("retains creation admission through IO and tree projection", async () => {
    const { adapter, manager, operations, vault } = await fixture();
    let release!: () => void;
    adapter.before = () =>
      new Promise<void>((resolve) => {
        release = resolve;
      });
    const creating = manager.createFile("new.md", "body");
    let done = false;
    const settled = operations.settleOperations().then(() => {
      done = true;
    });
    await vi.waitFor(() => expect(release).toBeTypeOf("function"));
    expect(done).toBe(false);
    release();
    await creating;
    await settled;
    expect(vault.getFileByPath("new.md")).not.toBeNull();
  });
  it("rejects explicit exclusivity on unsupported adapters but preserves legacy creation", async () => {
    const adapter = new InMemoryDataAdapter();
    const vault = new Vault(adapter);
    await vault.load();
    await expect(vault.createExclusive("new.md", "new")).rejects.toMatchObject({
      code: "ENOTSUP",
    });
    const file = await vault.create("existing.md", "before");
    await vault.create("existing.md", "after");
    expect(await vault.read(file)).toBe("after");
  });
});

it("fails closed when exclusivity is advertised without an implemented port", async () => {
  class IncompleteAdapter extends InMemoryDataAdapter {
    getCapabilities() {
      return { exclusiveCreate: true };
    }
  }
  const adapter = new IncompleteAdapter();
  const operations = new FileEditingSessionRegistry();
  const vault = new Vault(adapter, operations);
  await vault.load();
  const manager = new FileManager({
    vault,
    fileEditingSessions: operations,
  } as any);
  await expect(manager.createFile("new.md", "local")).rejects.toMatchObject({
    code: "ENOTSUP",
  });
  expect(await adapter.exists("new.md")).toBe(false);
});
