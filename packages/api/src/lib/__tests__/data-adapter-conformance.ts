import { describe, expect, it } from "vitest";
import {
  dirname,
  joinPath,
  type DataAdapter,
  type DataWriteOptions,
  type ListedFiles,
  type Stat,
} from "../storage";

export class InMemoryDataAdapter implements DataAdapter {
  private files = new Map<string, { data: string | ArrayBuffer; stat: Stat }>();
  private folders = new Map<string, Stat>([
    ["/", { type: "folder", ctime: 1, mtime: 1, size: 0 }],
  ]);
  private clock = 10;

  getName(): string {
    return "memory";
  }

  private nextTime() {
    this.clock += 1;
    return this.clock;
  }

  private path(path: string): string {
    path = path.replace(/\/+$/, "") || "/";
    return path === "/" ? "/" : path.replace(/^\/+/, "");
  }

  private byteLength(data: string | ArrayBuffer): number {
    return typeof data === "string"
      ? new TextEncoder().encode(data).byteLength
      : data.byteLength;
  }

  async exists(path: string): Promise<boolean> {
    path = this.path(path);
    return this.files.has(path) || this.folders.has(path);
  }

  async stat(path: string): Promise<Stat | null> {
    path = this.path(path);
    return this.files.get(path)?.stat ?? this.folders.get(path) ?? null;
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
    for (const folder of this.folders.keys()) {
      if (folder === path || !folder.startsWith(prefix)) continue;
      const rest = folder.slice(prefix.length);
      if (rest && !rest.includes("/")) data.folders.push(rest);
    }
    data.files.sort();
    data.folders.sort();
    return data;
  }

  async read(path: string): Promise<string> {
    const value = this.files.get(this.path(path))?.data;
    if (value === undefined)
      throw Object.assign(new Error(path), { code: "ENOENT" });
    return typeof value === "string" ? value : new TextDecoder().decode(value);
  }

  async readBinary(path: string): Promise<ArrayBuffer> {
    const value = this.files.get(this.path(path))?.data;
    if (value === undefined)
      throw Object.assign(new Error(path), { code: "ENOENT" });
    return typeof value === "string"
      ? (new TextEncoder().encode(value).buffer as ArrayBuffer)
      : value;
  }

  async write(
    path: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    await this.writeValue(path, data, options);
  }

  async writeBinary(
    path: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    await this.writeValue(path, data, options);
  }

  private async writeValue(
    path: string,
    data: string | ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    path = this.path(path);
    const existing = this.files.get(path)?.stat;
    const now = this.nextTime();
    this.files.set(path, {
      data,
      stat: {
        type: "file",
        ctime: options?.ctime ?? existing?.ctime ?? now,
        mtime: options?.mtime ?? now,
        size: this.byteLength(data),
      },
    });
  }

  async append(path: string, data: string): Promise<void> {
    await this.write(path, (await this.read(path).catch(() => "")) + data);
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

  async process(path: string, fn: (data: string) => string): Promise<string> {
    const next = fn(await this.read(path));
    await this.write(path, next);
    return next;
  }

  async mkdir(path: string): Promise<void> {
    path = this.path(path);
    const now = this.nextTime();
    this.folders.set(path, { type: "folder", ctime: now, mtime: now, size: 0 });
  }

  async rmdir(path: string, recursive: boolean = true): Promise<void> {
    path = this.path(path);
    this.folders.delete(path);
    for (const child of [...this.files.keys()]) {
      if (child.startsWith(`${path}/`)) this.files.delete(child);
    }
    for (const child of [...this.folders.keys()]) {
      if (child.startsWith(`${path}/`)) this.folders.delete(child);
    }
  }

  async remove(path: string): Promise<void> {
    this.files.delete(this.path(path));
  }

  async rename(path: string, newPath: string): Promise<void> {
    await this.copy(path, newPath);
    const stat = await this.stat(path);
    if (stat?.type === "folder") {
      await this.rmdir(path, true);
    } else {
      await this.remove(path);
    }
  }

  async copy(path: string, newPath: string): Promise<void> {
    path = this.path(path);
    newPath = this.path(newPath);
    const file = this.files.get(path);
    if (file) {
      await this.writeValue(newPath, file.data);
      return;
    }
    if (this.folders.has(path)) {
      await this.mkdir(newPath);
      const { files, folders } = await this.list(path);
      for (const folder of folders) {
        await this.copy(joinPath(path, folder), joinPath(newPath, folder));
      }
      for (const child of files) {
        await this.copy(joinPath(path, child), joinPath(newPath, child));
      }
    }
  }

  getResourcePath(path: string): string {
    return `memory://${this.path(path)}`;
  }

  async trashSystem(): Promise<boolean> {
    return false;
  }

  async trashLocal(path: string): Promise<void> {
    await this.mkdir(dirname(joinPath(".trash", path)));
    await this.rename(path, joinPath(".trash", path));
  }
}

export function runDataAdapterConformance(
  name: string,
  createAdapter: () => Promise<DataAdapter> | DataAdapter,
) {
  describe(name, () => {
    it("handles text files, folders, stats, and lists", async () => {
      const adapter = await createAdapter();
      await adapter.mkdir("notes");
      await adapter.write("notes/a.md", "hello");

      expect(await adapter.read("notes/a.md")).toBe("hello");
      expect(await adapter.exists("notes/a.md")).toBe(true);
      expect(await adapter.stat("notes/a.md")).toMatchObject({
        type: "file",
        size: 5,
      });
      expect((await adapter.list("/")).folders).toContain("notes");
      expect((await adapter.list("notes")).files).toContain("a.md");
    });

    it("handles binary writes, appends, and process updates", async () => {
      const adapter = await createAdapter();
      await adapter.write("note.md", "a");
      await adapter.append("note.md", "b");
      expect(await adapter.process("note.md", (data) => data + "c")).toBe(
        "abc",
      );
      expect(await adapter.read("note.md")).toBe("abc");

      await adapter.writeBinary("file.bin", new Uint8Array([1]).buffer);
      await adapter.appendBinary("file.bin", new Uint8Array([2, 3]).buffer);
      expect([...new Uint8Array(await adapter.readBinary("file.bin"))]).toEqual(
        [1, 2, 3],
      );
    });

    it("handles copy, rename, delete, and local trash", async () => {
      const adapter = await createAdapter();
      await adapter.mkdir("folder");
      await adapter.write("folder/source.md", "data");
      await adapter.copy("folder/source.md", "folder/copy.md");
      expect(await adapter.read("folder/copy.md")).toBe("data");

      await adapter.rename("folder/copy.md", "renamed.md");
      expect(await adapter.exists("folder/copy.md")).toBe(false);
      expect(await adapter.read("renamed.md")).toBe("data");

      await adapter.trashLocal("renamed.md");
      expect(await adapter.exists("renamed.md")).toBe(false);
      expect(await adapter.read(".trash/renamed.md")).toBe("data");

      await adapter.remove("folder/source.md");
      expect(await adapter.exists("folder/source.md")).toBe(false);
    });
  });
}
