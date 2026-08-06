import type {
  DataAdapter,
  DataWriteOptions,
  ListedFiles,
  Stat,
} from "@lapis-notes/api";

type StoredValue = { data: string | ArrayBuffer; stat: Stat };

/** In-memory vault storage used only by Storybook and workspace mount tests. */
export class StoryMemoryDataAdapter implements DataAdapter {
  readonly #files = new Map<string, StoredValue>();
  readonly #folders = new Map<string, Stat>([
    ["/", { type: "folder", ctime: 1, mtime: 1, size: 0 }],
  ]);
  #clock = 10;
  #writeCount = 0;

  onWrite?: (path: string, data: string, writeCount: number) => void;

  constructor(seed: Record<string, string> = {}) {
    for (const [path, data] of Object.entries(seed)) {
      const normalized = this.#path(path);
      this.#ensureParentFolders(normalized);
      this.#files.set(normalized, {
        data,
        stat: {
          type: "file",
          ctime: this.#nextTime(),
          mtime: this.#nextTime(),
          size: this.#byteLength(data),
        },
      });
    }
  }

  get writeCount(): number {
    return this.#writeCount;
  }

  getName(): string {
    return "storybook-memory";
  }

  #nextTime(): number {
    this.#clock += 1;
    return this.#clock;
  }

  #path(value: string): string {
    const withoutTrailing = value.replace(/\\/g, "/").replace(/\/+$/, "");
    if (!withoutTrailing || withoutTrailing === "/") return "/";
    return withoutTrailing.replace(/^\/+/, "");
  }

  #parent(path: string): string {
    const index = path.lastIndexOf("/");
    return index < 0 ? "/" : path.slice(0, index) || "/";
  }

  #ensureParentFolders(path: string): void {
    let parent = this.#parent(path);
    const parents: string[] = [];
    while (parent !== "/" && !this.#folders.has(parent)) {
      parents.unshift(parent);
      parent = this.#parent(parent);
    }
    for (const folder of parents) {
      const now = this.#nextTime();
      this.#folders.set(folder, {
        type: "folder",
        ctime: now,
        mtime: now,
        size: 0,
      });
    }
  }

  #byteLength(data: string | ArrayBuffer): number {
    return typeof data === "string"
      ? new TextEncoder().encode(data).byteLength
      : data.byteLength;
  }

  async exists(path: string): Promise<boolean> {
    const normalized = this.#path(path);
    return this.#files.has(normalized) || this.#folders.has(normalized);
  }

  async stat(path: string): Promise<Stat | null> {
    const normalized = this.#path(path);
    return (
      this.#files.get(normalized)?.stat ??
      this.#folders.get(normalized) ??
      null
    );
  }

  async list(path: string): Promise<ListedFiles> {
    const normalized = this.#path(path);
    const prefix = normalized === "/" ? "" : `${normalized}/`;
    const listed: ListedFiles = { files: [], folders: [] };

    for (const file of this.#files.keys()) {
      if (!file.startsWith(prefix)) continue;
      const rest = file.slice(prefix.length);
      if (rest && !rest.includes("/")) listed.files.push(rest);
    }
    for (const folder of this.#folders.keys()) {
      if (folder === normalized || !folder.startsWith(prefix)) continue;
      const rest = folder.slice(prefix.length);
      if (rest && !rest.includes("/")) listed.folders.push(rest);
    }

    listed.files.sort();
    listed.folders.sort();
    return listed;
  }

  async read(path: string): Promise<string> {
    const value = this.#files.get(this.#path(path))?.data;
    if (value === undefined) {
      throw Object.assign(new Error(path), { code: "ENOENT" });
    }
    return typeof value === "string" ? value : new TextDecoder().decode(value);
  }

  async readBinary(path: string): Promise<ArrayBuffer> {
    const value = this.#files.get(this.#path(path))?.data;
    if (value === undefined) {
      throw Object.assign(new Error(path), { code: "ENOENT" });
    }
    return typeof value === "string"
      ? (new TextEncoder().encode(value).buffer as ArrayBuffer)
      : value;
  }

  async write(
    path: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    await this.#writeValue(path, data, options);
  }

  async writeBinary(
    path: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    await this.#writeValue(path, data, options);
  }

  async #writeValue(
    path: string,
    data: string | ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    const normalized = this.#path(path);
    this.#ensureParentFolders(normalized);
    const existing = this.#files.get(normalized)?.stat;
    const now = this.#nextTime();
    this.#files.set(normalized, {
      data,
      stat: {
        type: "file",
        ctime: options?.ctime ?? existing?.ctime ?? now,
        mtime: options?.mtime ?? now,
        size: this.#byteLength(data),
      },
    });
    this.#writeCount += 1;
    if (typeof data === "string") {
      this.onWrite?.(normalized, data, this.#writeCount);
    }
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
    const normalized = this.#path(path);
    this.#ensureParentFolders(`${normalized}/child`);
    const now = this.#nextTime();
    this.#folders.set(normalized, {
      type: "folder",
      ctime: now,
      mtime: now,
      size: 0,
    });
  }

  async rmdir(path: string): Promise<void> {
    const normalized = this.#path(path);
    this.#folders.delete(normalized);
    for (const child of [...this.#files.keys()]) {
      if (child.startsWith(`${normalized}/`)) this.#files.delete(child);
    }
    for (const child of [...this.#folders.keys()]) {
      if (child.startsWith(`${normalized}/`)) this.#folders.delete(child);
    }
  }

  async remove(path: string): Promise<void> {
    this.#files.delete(this.#path(path));
  }

  async rename(path: string, newPath: string): Promise<void> {
    await this.copy(path, newPath);
    const source = await this.stat(path);
    if (source?.type === "folder") await this.rmdir(path);
    else await this.remove(path);
  }

  async copy(path: string, newPath: string): Promise<void> {
    const source = this.#path(path);
    const target = this.#path(newPath);
    const file = this.#files.get(source);
    if (file) {
      await this.#writeValue(target, file.data);
      return;
    }
    if (!this.#folders.has(source)) return;
    await this.mkdir(target);
    const { files, folders } = await this.list(source);
    for (const folder of folders) {
      await this.copy(`${source}/${folder}`, `${target}/${folder}`);
    }
    for (const child of files) {
      await this.copy(`${source}/${child}`, `${target}/${child}`);
    }
  }

  getResourcePath(path: string): string {
    return `memory://${this.#path(path)}`;
  }

  async trashSystem(): Promise<boolean> {
    return false;
  }

  async trashLocal(path: string): Promise<void> {
    await this.rename(path, `.trash/${this.#path(path)}`);
  }
}
