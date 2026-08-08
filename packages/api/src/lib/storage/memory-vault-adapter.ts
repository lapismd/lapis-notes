import type {
  DataWriteOptions,
  ListedFiles,
  Stat,
  VaultAdapter,
  VaultAdapterCapabilities,
  VaultIdentityAdapter,
} from "./fs";
import { dirname, joinPath, normalizePath } from "./path";

type StoredValue = {
  data: string | ArrayBuffer;
  stat: Stat;
};

export type MemoryVaultClock = number | (() => number);

export interface MemoryVaultAdapterOptions {
  name?: string;
  vaultId?: string;
  clock?: MemoryVaultClock;
}

/**
 * Deterministic, non-persistent vault adapter for demos, tests, and embedded
 * hosts that need the real vault contract without browser or native storage.
 *
 * @public
 */
export class MemoryVaultAdapter implements VaultAdapter, VaultIdentityAdapter {
  readonly #files = new Map<string, StoredValue>();
  readonly #folders = new Map<string, Stat>();
  readonly #name: string;
  readonly #vaultId: string;
  readonly #clock: () => number;
  #writeCount = 0;

  /** Optional diagnostic hook used by demos and tests. */
  onWrite?: (path: string, data: string, writeCount: number) => void;

  constructor(
    seed: Record<string, string | ArrayBuffer> = {},
    options: MemoryVaultAdapterOptions = {},
  ) {
    this.#name = options.name ?? "memory-vault";
    this.#vaultId = options.vaultId ?? "memory-vault";

    if (typeof options.clock === "function") {
      this.#clock = options.clock;
    } else {
      let time = options.clock ?? 0;
      this.#clock = () => {
        time += 1;
        return time;
      };
    }

    const rootTime = this.#now();
    this.#folders.set("/", {
      type: "folder",
      ctime: rootTime,
      mtime: rootTime,
      size: 0,
    });

    for (const [path, value] of Object.entries(seed)) {
      const normalized = this.#path(path);
      this.#assertFilePath(normalized);
      this.#ensureParentFolders(normalized);
      const createdAt = this.#now();
      this.#files.set(normalized, {
        data: cloneValue(value),
        stat: {
          type: "file",
          ctime: createdAt,
          mtime: createdAt,
          size: byteLength(value),
        },
      });
    }
  }

  get writeCount(): number {
    return this.#writeCount;
  }

  getName(): string {
    return this.#name;
  }

  getVaultId(): string {
    return this.#vaultId;
  }

  getCapabilities(): VaultAdapterCapabilities {
    return {
      persistent: false,
      userVisibleFiles: false,
      requiresPermission: false,
      nativeWatch: false,
      resourceUrls: false,
      systemTrash: false,
    };
  }

  async exists(path: string): Promise<boolean> {
    const normalized = this.#path(path);
    return this.#files.has(normalized) || this.#folders.has(normalized);
  }

  async stat(path: string): Promise<Stat | null> {
    const normalized = this.#path(path);
    const stat =
      this.#files.get(normalized)?.stat ?? this.#folders.get(normalized);
    return stat ? { ...stat } : null;
  }

  async read(path: string): Promise<string> {
    const normalized = this.#path(path);
    const value = this.#files.get(normalized)?.data;
    if (value === undefined) throw fsError("ENOENT", normalized);
    return typeof value === "string" ? value : new TextDecoder().decode(value);
  }

  async readBinary(path: string): Promise<ArrayBuffer> {
    const normalized = this.#path(path);
    const value = this.#files.get(normalized)?.data;
    if (value === undefined) throw fsError("ENOENT", normalized);
    return typeof value === "string"
      ? toArrayBuffer(new TextEncoder().encode(value))
      : value.slice(0);
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

  async append(
    path: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    const current = await this.read(path).catch((error: unknown) => {
      if (hasCode(error, "ENOENT")) return "";
      throw error;
    });
    await this.write(path, current + data, options);
  }

  async appendBinary(
    path: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    const current = new Uint8Array(
      await this.readBinary(path).catch((error: unknown) => {
        if (hasCode(error, "ENOENT")) return new ArrayBuffer(0);
        throw error;
      }),
    );
    const next = new Uint8Array(current.byteLength + data.byteLength);
    next.set(current);
    next.set(new Uint8Array(data), current.byteLength);
    await this.writeBinary(path, toArrayBuffer(next), options);
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

  async list(path: string): Promise<ListedFiles> {
    const normalized = this.#path(path);
    if (!this.#folders.has(normalized)) throw fsError("ENOENT", normalized);

    const prefix = normalized === "/" ? "" : `${normalized}/`;
    const listed: ListedFiles = { files: [], folders: [] };

    for (const file of this.#files.keys()) {
      if (!file.startsWith(prefix)) continue;
      const child = file.slice(prefix.length);
      if (child && !child.includes("/")) listed.files.push(child);
    }

    for (const folder of this.#folders.keys()) {
      if (folder === normalized || !folder.startsWith(prefix)) continue;
      const child = folder.slice(prefix.length);
      if (child && !child.includes("/")) listed.folders.push(child);
    }

    listed.files.sort();
    listed.folders.sort();
    return listed;
  }

  async mkdir(
    path: string,
    options?: Partial<{ recursive: boolean; mode: string }>,
  ): Promise<void> {
    const normalized = this.#path(path);
    if (normalized === "/") return;
    if (this.#files.has(normalized)) throw fsError("EEXIST", normalized);

    const parent = this.#parent(normalized);
    if (!this.#folders.has(parent)) {
      if (!options?.recursive) throw fsError("ENOENT", parent);
      this.#ensureParentFolders(`${normalized}/child`);
    }

    const existing = this.#folders.get(normalized);
    const now = this.#now();
    this.#folders.set(normalized, {
      type: "folder",
      ctime: existing?.ctime ?? now,
      mtime: now,
      size: 0,
    });
  }

  async rmdir(path: string, recursive: boolean): Promise<void> {
    const normalized = this.#path(path);
    if (normalized === "/") throw fsError("EPERM", normalized);
    if (!this.#folders.has(normalized)) throw fsError("ENOENT", normalized);

    const prefix = `${normalized}/`;
    const files = [...this.#files.keys()].filter((key) =>
      key.startsWith(prefix),
    );
    const folders = [...this.#folders.keys()].filter((key) =>
      key.startsWith(prefix),
    );
    if (!recursive && (files.length > 0 || folders.length > 0)) {
      throw fsError("ENOTEMPTY", normalized);
    }

    for (const file of files) this.#files.delete(file);
    for (const folder of folders) this.#folders.delete(folder);
    this.#folders.delete(normalized);
  }

  async remove(path: string): Promise<void> {
    const normalized = this.#path(path);
    if (this.#files.delete(normalized)) return;
    if (this.#folders.has(normalized)) throw fsError("EISDIR", normalized);
    throw fsError("ENOENT", normalized);
  }

  async rename(path: string, newPath: string): Promise<void> {
    const source = this.#path(path);
    const target = this.#path(newPath);
    if (source === target) return;
    await this.copy(source, target);
    if (this.#folders.has(source)) await this.rmdir(source, true);
    else await this.remove(source);
  }

  async copy(path: string, newPath: string): Promise<void> {
    const source = this.#path(path);
    const target = this.#path(newPath);
    if (source === target) return;
    this.#assertFilePath(target);

    const file = this.#files.get(source);
    const isFolder = this.#folders.has(source);
    if (!file && !isFolder) throw fsError("ENOENT", source);
    if (
      (isFolder && target.startsWith(`${source}/`)) ||
      source.startsWith(`${target}/`)
    ) {
      throw fsError("EINVAL", target);
    }

    await this.#removeTarget(target);
    if (file) {
      await this.#writeValue(target, file.data, {
        ctime: file.stat.ctime,
        mtime: file.stat.mtime,
      });
      return;
    }

    await this.mkdir(target, { recursive: true });
    const prefix = `${source}/`;
    const folders = [...this.#folders.keys()]
      .filter((key) => key.startsWith(prefix))
      .sort((a, b) => a.length - b.length);
    for (const folder of folders) {
      const suffix = folder.slice(prefix.length);
      await this.mkdir(joinPath(target, suffix), { recursive: true });
    }
    for (const [filePath, stored] of this.#files.entries()) {
      if (!filePath.startsWith(prefix)) continue;
      const suffix = filePath.slice(prefix.length);
      await this.#writeValue(joinPath(target, suffix), stored.data, {
        ctime: stored.stat.ctime,
        mtime: stored.stat.mtime,
      });
    }
  }

  getResourcePath(path: string): string {
    return `memory-vault://${encodeURIComponent(this.#vaultId)}/${this.#path(path)}`;
  }

  async trashSystem(): Promise<boolean> {
    return false;
  }

  async trashLocal(path: string): Promise<void> {
    const normalized = this.#path(path);
    const trashPath = this.#path(joinPath(".trash", normalized));
    await this.mkdir(dirname(trashPath), { recursive: true });
    await this.rename(normalized, trashPath);
  }

  async #writeValue(
    path: string,
    value: string | ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    const normalized = this.#path(path);
    this.#assertFilePath(normalized);
    if (this.#folders.has(normalized)) throw fsError("EISDIR", normalized);
    this.#ensureParentFolders(normalized);

    const existing = this.#files.get(normalized)?.stat;
    const now = this.#now();
    this.#files.set(normalized, {
      data: cloneValue(value),
      stat: {
        type: "file",
        ctime: options?.ctime ?? existing?.ctime ?? now,
        mtime: options?.mtime ?? now,
        size: byteLength(value),
      },
    });
    this.#writeCount += 1;
    if (typeof value === "string") {
      this.onWrite?.(normalized, value, this.#writeCount);
    }
  }

  async #removeTarget(path: string): Promise<void> {
    if (this.#files.has(path)) {
      this.#files.delete(path);
      return;
    }
    if (this.#folders.has(path)) await this.rmdir(path, true);
  }

  #ensureParentFolders(path: string): void {
    let parent = this.#parent(path);
    const missing: string[] = [];
    while (parent !== "/" && !this.#folders.has(parent)) {
      if (this.#files.has(parent)) throw fsError("ENOTDIR", parent);
      missing.unshift(parent);
      parent = this.#parent(parent);
    }

    for (const folder of missing) {
      const now = this.#now();
      this.#folders.set(folder, {
        type: "folder",
        ctime: now,
        mtime: now,
        size: 0,
      });
    }
  }

  #path(value: string): string {
    const slashes = value.replace(/\\/g, "/").replace(/\/+$/, "");
    if (!slashes || slashes === "/") return "/";
    const normalized = normalizePath(slashes);
    if (!normalized || normalized === "/") return "/";
    if (normalized === ".." || normalized.startsWith("../")) {
      throw fsError("EPERM", value);
    }
    return normalized.replace(/^\/+/, "");
  }

  #parent(path: string): string {
    const parent = dirname(path);
    return parent === "." || parent === "" ? "/" : this.#path(parent);
  }

  #assertFilePath(path: string): void {
    if (path === "/") throw fsError("EISDIR", path);
  }

  #now(): number {
    return this.#clock();
  }
}

function byteLength(value: string | ArrayBuffer): number {
  return typeof value === "string"
    ? new TextEncoder().encode(value).byteLength
    : value.byteLength;
}

function cloneValue(value: string | ArrayBuffer): string | ArrayBuffer {
  return typeof value === "string" ? value : value.slice(0);
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(
    value.byteOffset,
    value.byteOffset + value.byteLength,
  ) as ArrayBuffer;
}

function fsError(code: string, path: string): Error & { code: string } {
  return Object.assign(new Error(`${code}: ${path}`), { code });
}

function hasCode(error: unknown, code: string): boolean {
  return (error as { code?: string } | null)?.code === code;
}
