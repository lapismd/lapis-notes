import { describe, expect, it, vi } from "vitest";
import { Vault } from "../storage/vault.svelte";
import { TFile, TFolder } from "../storage/fs";
import { InMemoryDataAdapter } from "./data-adapter-conformance";
import { scanVaultTree } from "../storage/vault-reconciliation";

async function fixture() {
  const adapter = new InMemoryDataAdapter();
  await adapter.mkdir("notes");
  await adapter.write("notes/a.md", "before");
  await adapter.write("keep.md", "unchanged");
  const vault = new Vault(adapter);
  await vault.load();
  const nodes = () =>
    new Map(vault.getAllLoadedFiles().map((f) => [f.path, f]));
  return { adapter, vault, nodes, before: nodes() };
}

describe("complete vault reconciliation", () => {
  it("updates content and creation without replacing canonical nodes or stale cache", async () => {
    const { adapter, vault, nodes, before } = await fixture();
    await vault.cachedRead(before.get("notes/a.md") as TFile);
    const events = vi.fn();
    vault.on("all", events);
    await adapter.write("notes/a.md", "external update");
    await adapter.write("notes/new.md", "new");
    await vault.reconcile();
    expect(nodes().get("notes/a.md")).toBe(before.get("notes/a.md"));
    expect(nodes().get("keep.md")).toBe(before.get("keep.md"));
    expect(nodes().get("notes")).toBe(before.get("notes"));
    expect(await vault.cachedRead(before.get("notes/a.md") as TFile)).toBe(
      "external update",
    );
    const folder = nodes().get("notes") as TFolder;
    expect(folder.children).toContain(nodes().get("notes/new.md"));
    expect(nodes().get("notes/new.md")?.parent).toBe(folder);
    expect(
      events.mock.calls.map(([event, file]) => [event, file.path]),
    ).toEqual([
      ["modify", "notes/a.md"],
      ["create", "notes/new.md"],
    ]);
  });

  it("preserves renamed folder descendants and emits each old path for metadata owners", async () => {
    const { adapter, vault, nodes, before } = await fixture();
    const renames: string[][] = [];
    vault.on("rename", (file, old) => renames.push([old, file.path]));
    await adapter.rename("notes", "Archive");
    await vault.reconcile([
      { type: "create", path: "Archive", previousPath: "notes" },
    ]);
    expect(nodes().get("Archive")).toBe(before.get("notes"));
    expect(nodes().get("Archive/a.md")).toBe(before.get("notes/a.md"));
    expect(nodes().get("Archive/a.md")?.parent).toBe(nodes().get("Archive"));
    expect(renames).toEqual([
      ["notes", "Archive"],
      ["notes/a.md", "Archive/a.md"],
    ]);
    expect(
      vault.getFilesByGlob("a.md", { caseSensitive: true }).map((f) => f.path),
    ).toEqual(["Archive/a.md"]);
  });

  it("projects deleted descendants and keeps unrelated identities and indexes", async () => {
    const { adapter, vault, nodes, before } = await fixture();
    const deleted: string[] = [];
    vault.on("delete", (file) => deleted.push(file.path));
    await adapter.rmdir("notes", true);
    await vault.reconcile();
    expect(deleted).toEqual(["notes/a.md", "notes"]);
    expect(nodes().get("keep.md")).toBe(before.get("keep.md"));
    expect(vault.getFilesByGlob("a.md", { caseSensitive: true })).toEqual([]);
    expect(vault.getAllFolders(true)[0]?.children).toEqual([
      before.get("keep.md"),
    ]);
  });

  it("never projects an incomplete scan and permits complete retry", async () => {
    const { adapter, vault, nodes, before } = await fixture();
    const stat = vi.spyOn(adapter, "stat");
    stat.mockImplementationOnce(async () => null);
    const changed = vi.fn();
    vault.on("all", changed);
    await expect(vault.reconcile()).rejects.toThrow();
    expect(nodes()).toEqual(before);
    expect(changed).not.toHaveBeenCalled();
    stat.mockRestore();
    await vault.reconcile();
    expect(changed).not.toHaveBeenCalled();
  });

  it("retires an in-flight scan before it can publish into a closed generation", async () => {
    const { adapter, vault, before } = await fixture();
    await adapter.write("new.md", "external");
    let live = true;
    const stat = adapter.stat.bind(adapter);
    vi.spyOn(adapter, "stat").mockImplementation(async (path) => {
      live = false;
      return stat(path);
    });
    await vault.reconcile([], () => live);
    expect(vault.getFileByPath("new.md")).toBeNull();
    expect(vault.getFiles()).toContain(before.get("keep.md"));
  });

  it("uses stable tree projection for internal rename, copy, trash and atomic writes", async () => {
    const { vault, nodes, before } = await fixture();
    await vault.rename(vault.getFolderByPath("notes")!, "Archive");
    expect(nodes().get("Archive/a.md")).toBe(before.get("notes/a.md"));
    const copied = await vault.copy(
      vault.getFileByPath("Archive/a.md")!,
      "copy.md",
    );
    expect(nodes().get("keep.md")).toBe(before.get("keep.md"));
    await vault.trash(copied, false);
    expect(nodes().get("keep.md")).toBe(before.get("keep.md"));
    await vault.atomicWrite(
      "Archive/a.md",
      new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode("new"));
          c.close();
        },
      }),
    );
    expect(nodes().get("Archive/a.md")).toBe(before.get("notes/a.md"));
    expect(await vault.read(before.get("notes/a.md") as TFile)).toBe("new");
  });

  it("serializes a complete scan with admitted internal mutations", async () => {
    const { adapter, vault } = await fixture();
    const original = adapter.stat.bind(adapter);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let scanning = false;
    vi.spyOn(adapter, "stat").mockImplementationOnce(async (path) => {
      scanning = true;
      await gate;
      return original(path);
    });
    const rename = vi.spyOn(adapter, "rename");
    const reconciling = vault.reconcile();
    await vi.waitFor(() => expect(scanning).toBe(true));
    const moving = vault.rename(vault.getFolderByPath("notes")!, "Archive");
    await Promise.resolve();
    expect(rename).not.toHaveBeenCalled();
    release();
    await reconciling;
    await moving;
    expect(vault.getFileByPath("Archive/a.md")).not.toBeNull();
  });

  it("bounds entries and path storage and rejects invalid children before projection", async () => {
    const { adapter, vault, before, nodes } = await fixture();
    await expect(
      scanVaultTree(adapter, () => true, { entries: 1, bytes: 1024 }),
    ).rejects.toThrow(/bounds/);
    await expect(
      scanVaultTree(adapter, () => true, { entries: 100, bytes: 100 }),
    ).rejects.toThrow(/bounds/);
    vi.spyOn(adapter, "list").mockResolvedValueOnce({
      files: ["../outside"],
      folders: [],
    });
    await expect(vault.reconcile()).rejects.toThrow(/child path/);
    expect(nodes()).toEqual(before);
    await vault.reconcile();
  });

  it("keeps canonical children and stats across existing text and binary write APIs", async () => {
    const { vault, nodes, before, adapter } = await fixture();
    const file = before.get("notes/a.md") as TFile;
    for (const write of [
      () => vault.modify(file, "text"),
      () => vault.modifyBinary(file, new Uint8Array([1, 2]).buffer),
      () => vault.append(file, "tail"),
      () => vault.appendBinary(file, new Uint8Array([3]).buffer),
      () => vault.createBinary(file.path, new Uint8Array([4]).buffer),
    ]) {
      await write();
      expect(nodes().get(file.path)).toBe(file);
      expect((nodes().get("notes") as TFolder).children).toEqual([file]);
      expect(file.stat).toEqual(await adapter.stat(file.path));
    }
  });

  it("invalidates cached text when a binary API replaces existing bytes", async () => {
    const { vault, before } = await fixture();
    const file = before.get("notes/a.md") as TFile;
    await vault.cachedRead(file);
    await vault.modifyBinary(
      file,
      new TextEncoder().encode("binary update").buffer,
    );
    expect(await vault.cachedRead(file)).toBe("binary update");
    await vault.createBinary(
      file.path,
      new TextEncoder().encode("binary replacement").buffer,
    );
    expect(await vault.cachedRead(file)).toBe("binary replacement");
  });
});
