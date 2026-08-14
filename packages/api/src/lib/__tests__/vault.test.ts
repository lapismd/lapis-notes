import { describe, expect, it } from "vitest";
import {
  TFile,
  Vault,
  type DataAdapter,
  type DataWriteOptions,
  type ListedFiles,
  type Stat,
} from "../storage";

class MemoryAdapter implements DataAdapter {
  private files = new Map<string, string | ArrayBuffer>();
  private folders = new Set<string>(["/"]);

  getName(): string {
    return "memory";
  }

  private path(path: string): string {
    return path === "" ? "/" : path.replace(/\/+$/, "") || "/";
  }

  async exists(path: string): Promise<boolean> {
    path = this.path(path);
    return this.files.has(path) || this.folders.has(path);
  }

  async stat(path: string): Promise<Stat | null> {
    path = this.path(path);
    const now = Date.now();
    if (this.files.has(path)) {
      const value = this.files.get(path)!;
      return {
        ctime: now,
        mtime: now,
        size: typeof value === "string" ? value.length : value.byteLength,
        type: "file",
      };
    }
    if (this.folders.has(path)) {
      return { ctime: now, mtime: now, size: 0, type: "folder" };
    }
    return null;
  }

  async list(path: string): Promise<ListedFiles> {
    path = this.path(path);
    const prefix = path === "/" ? "" : `${path}/`;
    const data: ListedFiles = { files: [], folders: [] };
    for (const file of this.files.keys()) {
      if (!file.startsWith(prefix)) continue;
      const rest = file.slice(prefix.length);
      if (rest && !rest.includes("/")) data.files.push(rest);
    }
    for (const folder of this.folders) {
      if (folder === path || !folder.startsWith(prefix)) continue;
      const rest = folder.slice(prefix.length);
      if (rest && !rest.includes("/")) data.folders.push(rest);
    }
    return data;
  }

  async read(path: string): Promise<string> {
    const value = this.files.get(this.path(path));
    return typeof value === "string"
      ? value
      : new TextDecoder().decode(value as ArrayBuffer);
  }

  async readBinary(path: string): Promise<ArrayBuffer> {
    const value = this.files.get(this.path(path));
    return typeof value === "string"
      ? (new TextEncoder().encode(value).buffer as ArrayBuffer)
      : (value as ArrayBuffer);
  }

  async write(
    path: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    this.files.set(this.path(path), data);
  }

  async writeBinary(path: string, data: ArrayBuffer): Promise<void> {
    this.files.set(this.path(path), data);
  }

  async append(path: string, data: string): Promise<void> {
    const current = (await this.read(path).catch(() => "")) ?? "";
    await this.write(path, current + data);
  }

  async appendBinary(path: string, data: ArrayBuffer): Promise<void> {
    const current = new Uint8Array(
      await this.readBinary(path).catch(() => new ArrayBuffer(0)),
    );
    const next = new Uint8Array(current.byteLength + data.byteLength);
    next.set(current);
    next.set(new Uint8Array(data), current.byteLength);
    await this.writeBinary(path, next.buffer);
  }

  async process(
    path: string,
    fn: (data: string) => string,
    options?: DataWriteOptions,
  ): Promise<string> {
    const next = fn(await this.read(path));
    await this.write(path, next, options);
    return next;
  }

  async mkdir(path: string): Promise<void> {
    this.folders.add(this.path(path));
  }

  async rmdir(path: string): Promise<void> {
    path = this.path(path);
    for (const folder of [...this.folders]) {
      if (folder === path || folder.startsWith(`${path}/`)) {
        this.folders.delete(folder);
      }
    }
    for (const file of [...this.files.keys()]) {
      if (file.startsWith(`${path}/`)) this.files.delete(file);
    }
  }

  async remove(path: string): Promise<void> {
    this.files.delete(this.path(path));
  }

  async rename(path: string, newPath: string): Promise<void> {
    path = this.path(path);
    newPath = this.path(newPath);
    if (this.files.has(path)) {
      this.files.set(newPath, this.files.get(path)!);
      this.files.delete(path);
    } else if (this.folders.has(path)) {
      for (const folder of [...this.folders]) {
        if (folder === path || folder.startsWith(`${path}/`)) {
          this.folders.delete(folder);
          this.folders.add(`${newPath}${folder.slice(path.length)}`);
        }
      }
      for (const [file, data] of [...this.files]) {
        if (file.startsWith(`${path}/`)) {
          this.files.delete(file);
          this.files.set(`${newPath}${file.slice(path.length)}`, data);
        }
      }
    }
  }

  async copy(path: string, newPath: string): Promise<void> {
    this.files.set(this.path(newPath), this.files.get(this.path(path))!);
  }

  getResourcePath(path: string): string {
    return `memory://${this.path(path)}`;
  }

  async trashSystem(): Promise<boolean> {
    return false;
  }

  async trashLocal(path: string): Promise<void> {
    await this.mkdir(".trash");
    await this.rename(path, `.trash/${path}`);
  }
}

describe("Vault compatibility", () => {
  it("creates, appends, renames, copies, and deletes files", async () => {
    const vault = new Vault(new MemoryAdapter());
    await vault.load();

    const file = await vault.create("note.md", "hello");
    expect(file.name).toBe("note.md");
    expect(file.basename).toBe("note");
    expect(await vault.read(file)).toBe("hello");

    await vault.append(file, " world");
    const appended = vault.getFileByPath("note.md");
    expect(appended).toBeInstanceOf(TFile);
    expect(await vault.read(appended!)).toBe("hello world");

    await vault.rename(appended!, "renamed.md");
    const renamed = vault.getFileByPath("renamed.md");
    expect(renamed?.vault).toBe(vault);

    const copied = await vault.copy(renamed!, "copy.md");
    expect(copied.path).toBe("copy.md");
    expect(vault.getAllLoadedFiles().map((item) => item.path)).toContain(
      "copy.md",
    );

    await vault.delete(copied);
    expect(vault.getFileByPath("copy.md")).toBeNull();
  });

  it("queries current files with the shared glob dialect", async () => {
    const vault = new Vault(new MemoryAdapter());
    await vault.load();
    await vault.mkpath("Roles/atlas");
    await vault.mkpath("Roles/nova");
    await vault.mkpath("CVs/archive");
    await vault.create("role.md", "root");
    await vault.create("Roles/atlas/role.md", "atlas");
    await vault.create("Roles/nova/Role.md", "nova");
    await vault.create("CVs/atlas.cv.yml", "atlas cv");
    await vault.create("CVs/archive/nova.cv.yaml", "nova cv");
    await vault.create("CVs/archive/.hidden.cv.yml", "hidden cv");

    expect(
      vault
        .getFilesByGlob("role.md", { caseSensitive: true })
        .map((file) => file.path),
    ).toEqual(["Roles/atlas/role.md", "role.md"]);
    expect(
      vault
        .getFilesByGlob("**/role.md", { caseSensitive: false })
        .map((file) => file.path),
    ).toEqual(["Roles/atlas/role.md", "Roles/nova/Role.md", "role.md"]);
    expect(
      vault
        .getFilesByGlob("**/*.cv.{yml,yaml}", { caseSensitive: false })
        .map((file) => file.path),
    ).toEqual([
      "CVs/archive/.hidden.cv.yml",
      "CVs/archive/nova.cv.yaml",
      "CVs/atlas.cv.yml",
    ]);
    expect(
      vault.getFilesByGlob("Roles/?tlas/[r]ole.md").map((file) => file.path),
    ).toEqual(["Roles/atlas/role.md"]);
    expect(
      vault
        .getFilesByGlob("Roles\\\\**\\\\role.md", { caseSensitive: true })
        .map((file) => file.path),
    ).toEqual(["Roles/atlas/role.md"]);
    expect(vault.getFilesByGlob("")).toEqual([]);
    expect(vault.getFilesByGlob("[z-a]")).toEqual([]);
  });

  it("keeps glob results synchronized with vault lifecycle changes", async () => {
    const adapter = new MemoryAdapter();
    await adapter.mkdir("Roles");
    await adapter.mkdir("Roles/a");
    await adapter.write("Roles/a/role.md", "source");
    const vault = new Vault(adapter);
    await vault.load();
    await vault.mkpath("Roles/b");
    const source = vault.getFileByPath("Roles/a/role.md");
    expect(source).not.toBeNull();
    expect(vault.getFilesByGlob("**/role.md")).toHaveLength(1);

    await vault.copy(source!, "Roles/b/role.md");
    expect(
      vault.getFilesByGlob("**/role.md").map((file) => file.path),
    ).toEqual(["Roles/a/role.md", "Roles/b/role.md"]);

    await vault.rename(source!, "Roles/a/archive.md");
    expect(
      vault.getFilesByGlob("**/role.md").map((file) => file.path),
    ).toEqual(["Roles/b/role.md"]);

    const archived = vault.getFileByPath("Roles/a/archive.md");
    expect(archived).not.toBeNull();
    await vault.rename(archived!, "Roles/a/role.md");
    expect(
      vault.getFilesByGlob("**/role.md").map((file) => file.path),
    ).toEqual(["Roles/a/role.md", "Roles/b/role.md"]);

    const folder = vault.getFolderByPath("Roles/b");
    expect(folder).not.toBeNull();
    await vault.delete(folder!);
    expect(vault.getFilesByGlob("**/role.md")).toHaveLength(1);

    const binary = await vault.createBinary(
      "asset.bin",
      new Uint8Array([1, 2, 3]).buffer,
    );
    expect(vault.getFilesByGlob("*.bin").map((file) => file.path)).toEqual([
      "asset.bin",
    ]);
    await vault.delete(binary);
    expect(vault.getFilesByGlob("*.bin")).toEqual([]);

    const remaining = vault.getFileByPath("Roles/a/role.md");
    expect(remaining).not.toBeNull();
    await vault.delete(remaining!);
    expect(vault.getFilesByGlob("**/role.md")).toEqual([]);

    const restored = await vault.create("role.md", "restored");
    await vault.trash(restored, false);
    expect(
      vault.getFilesByGlob("**/role.md").map((file) => file.path),
    ).toEqual([".trash/role.md"]);
    expect(
      vault.getFilesByGlob(".trash/**/role.md").map((file) => file.path),
    ).toEqual([".trash/role.md"]);

    await vault.reload();
    expect(
      vault.getFilesByGlob(".trash/**/role.md").map((file) => file.path),
    ).toEqual([".trash/role.md"]);
  });
});
