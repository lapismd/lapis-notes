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
    this.folders.delete(path);
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
      this.folders.add(newPath);
      this.folders.delete(path);
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
    await this.rename(path, `/.trash/${path}`);
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
});
