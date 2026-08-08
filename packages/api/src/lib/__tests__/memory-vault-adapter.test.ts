import { describe, expect, it, vi } from "vitest";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";

describe("MemoryVaultAdapter", () => {
  it("loads deterministic text and binary seeds with normalized folders", async () => {
    const binary = new Uint8Array([0, 1, 2, 255]).buffer;
    const adapter = new MemoryVaultAdapter(
      {
        "README.md": "# Demo",
        "Notes/./Nested/../Nested/note.txt": "Nested",
        "assets/payload.bin": binary,
      },
      { name: "Demo vault", vaultId: "demo-vault", clock: 100 },
    );

    expect(adapter.getName()).toBe("Demo vault");
    expect(adapter.getVaultId()).toBe("demo-vault");
    expect(adapter.getCapabilities()).toEqual({
      persistent: false,
      userVisibleFiles: false,
      requiresPermission: false,
      nativeWatch: false,
      resourceUrls: false,
      systemTrash: false,
    });
    await expect(adapter.list("/")).resolves.toEqual({
      files: ["README.md"],
      folders: ["Notes", "assets"],
    });
    await expect(adapter.list("Notes/Nested")).resolves.toEqual({
      files: ["note.txt"],
      folders: [],
    });
    await expect(adapter.read("Notes/Nested/note.txt")).resolves.toBe("Nested");
    await expect(adapter.readBinary("assets/payload.bin")).resolves.toEqual(
      binary,
    );
    expect(await adapter.stat("README.md")).toEqual({
      type: "file",
      ctime: 102,
      mtime: 102,
      size: 6,
    });
    expect(adapter.getResourcePath("Notes/note.txt")).toBe(
      "memory-vault://demo-vault/Notes/note.txt",
    );
  });

  it("copies binary buffers and maintains deterministic write metadata", async () => {
    const adapter = new MemoryVaultAdapter({}, { clock: 10 });
    const onWrite = vi.fn();
    adapter.onWrite = onWrite;
    const source = new Uint8Array([4, 5, 6]);

    await adapter.writeBinary("data/value.bin", source.buffer, {
      ctime: 50,
      mtime: 60,
    });
    source[0] = 99;
    const firstRead = new Uint8Array(
      await adapter.readBinary("data/value.bin"),
    );
    firstRead[1] = 99;

    expect([
      ...new Uint8Array(await adapter.readBinary("data/value.bin")),
    ]).toEqual([4, 5, 6]);
    expect(await adapter.stat("data/value.bin")).toEqual({
      type: "file",
      ctime: 50,
      mtime: 60,
      size: 3,
    });

    await adapter.write("notes/demo.txt", "one");
    const firstStat = await adapter.stat("notes/demo.txt");
    await adapter.append("notes/demo.txt", " two");
    await expect(
      adapter.process("notes/demo.txt", (value) => value.toUpperCase()),
    ).resolves.toBe("ONE TWO");

    expect(await adapter.read("notes/demo.txt")).toBe("ONE TWO");
    expect((await adapter.stat("notes/demo.txt"))?.ctime).toBe(
      firstStat?.ctime,
    );
    expect(adapter.writeCount).toBe(4);
    expect(onWrite).toHaveBeenLastCalledWith("notes/demo.txt", "ONE TWO", 4);
  });

  it("supports recursive copy, rename, replacement, deletion, and local trash", async () => {
    const adapter = new MemoryVaultAdapter({
      "Projects/Atlas/readme.md": "Atlas",
      "Projects/Atlas/data.json": "{}",
      "Archive/old.txt": "old",
    });

    await adapter.copy("Projects/Atlas", "Archive/Atlas");
    await expect(adapter.read("Archive/Atlas/readme.md")).resolves.toBe(
      "Atlas",
    );
    await adapter.rename("Archive/Atlas/data.json", "Archive/Atlas/data.txt");
    await expect(adapter.exists("Archive/Atlas/data.json")).resolves.toBe(
      false,
    );
    await expect(adapter.read("Archive/Atlas/data.txt")).resolves.toBe("{}");

    await adapter.copy("Projects/Atlas/readme.md", "Archive/old.txt");
    await expect(adapter.read("Archive/old.txt")).resolves.toBe("Atlas");
    await expect(adapter.rmdir("Archive", false)).rejects.toMatchObject({
      code: "ENOTEMPTY",
    });

    await adapter.trashLocal("Projects/Atlas");
    await expect(adapter.exists("Projects/Atlas")).resolves.toBe(false);
    await expect(adapter.read(".trash/Projects/Atlas/readme.md")).resolves.toBe(
      "Atlas",
    );
    await expect(adapter.trashSystem("Archive/old.txt")).resolves.toBe(false);

    await adapter.rmdir("Archive", true);
    await expect(adapter.exists("Archive")).resolves.toBe(false);
  });

  it("reports collisions, missing paths, and unsafe moves", async () => {
    const adapter = new MemoryVaultAdapter({
      "Notes/demo.md": "Demo",
      blocked: "file",
    });

    await expect(adapter.list("missing")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(adapter.read("missing.md")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(adapter.remove("Notes")).rejects.toMatchObject({
      code: "EISDIR",
    });
    await expect(
      adapter.mkdir("blocked/child", { recursive: true }),
    ).rejects.toMatchObject({
      code: "ENOTDIR",
    });
    await expect(adapter.copy("Notes", "Notes/Copy")).rejects.toMatchObject({
      code: "EINVAL",
    });
    await expect(adapter.rename("Notes", "/")).rejects.toMatchObject({
      code: "EISDIR",
    });
    await expect(adapter.write("../outside.md", "nope")).rejects.toMatchObject({
      code: "EPERM",
    });
  });
});
