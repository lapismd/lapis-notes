import { basename, normalizePath } from "./path";
import type { Vault } from "./vault.svelte";

interface FileProperties {
  /**
   * Time of creation, represented as a unix timestamp, in milliseconds.
   *
   * @public
   */
  ctime: number;
  /**
   * Time of last modification, represented as a unix timestamp, in
   * milliseconds.
   *
   * @public
   */
  mtime: number;
}

export interface FileStats extends FileProperties {
  /**
   * Size on disk, as bytes.
   *
   * @public
   */
  size: number;
}

export type DataWriteOptions = Partial<FileProperties>;

export interface VaultReadStreamOptions {
  offset?: number;
  length?: number;
  signal?: AbortSignal;
}

export interface VaultReadHandle {
  size: number;
  mtime: number;
  stream(options?: VaultReadStreamOptions): ReadableStream<Uint8Array>;
}

export interface AtomicDataWriteOptions extends DataWriteOptions {
  signal?: AbortSignal;
  /** Opaque host-issued correlation used by the App's mutation broker. */
  operationOrigin?: string;
}

export abstract class TAbstractFile {
  public path: string;
  public vault!: Vault;

  constructor(
    path: string,
    public parent: TFolder | null = null,
    vault?: Vault,
  ) {
    this.path = path.replace(/\\/g, "/").replace(/\/$/, "");
    if (vault) {
      this.vault = vault;
    } else if (parent?.vault) {
      this.vault = parent.vault;
    }
  }

  get baseName() {
    return basename(this.path);
  }

  get extension() {
    const parts = this.baseName.split(".").filter((it) => it);
    return parts.pop() ?? "";
  }

  get name() {
    return this.baseName;
  }

  get basename() {
    const parts = this.baseName.split(".").filter((it) => it);
    parts.pop();
    return parts.join(".");
  }

  abstract copy(
    props?: Partial<{
      path: string;
      stat: FileStats;
      parent: TFolder;
      children: TAbstractFile[];
    }>,
  ): TAbstractFile;

  toString() {
    return this.path;
  }
}

export class TFile extends TAbstractFile {
  constructor(
    path: string,
    readonly stat: FileStats,
    parent: TFolder | null,
    vault?: Vault,
  ) {
    super(path, parent, vault);
  }

  copy(
    props: Partial<{ path: string; stat: FileStats; parent: TFolder }> = {},
  ) {
    return new TFile(
      props.path ?? this.path,
      props.stat ?? this.stat,
      props.parent ?? this.parent,
      props.parent?.vault ?? this.vault,
    );
  }
}

export class TFolder extends TAbstractFile {
  constructor(
    path: string,
    readonly children: TAbstractFile[] = [],
    parent?: TFolder | null,
    vault?: Vault,
  ) {
    super(path, parent ?? null, vault);
  }

  copy(
    props: Partial<{ path: string; children: TAbstractFile[] }> = {},
  ): TFolder {
    return new TFolder(
      props.path ?? this.path,
      props.children ?? this.children.map((it) => it.copy()),
      this.parent,
      this.vault,
    );
  }

  iterateAll(callback: (file: TAbstractFile) => void) {
    callback(this);
    this.children.forEach((child) => {
      if (child instanceof TFile) {
        callback(child);
      } else if (child instanceof TFolder) {
        child.iterateAll(callback);
      }
    });
  }

  get files(): TFile[] {
    const values: TFile[] = [];
    this.iterateAll((f) => {
      if (f instanceof TFile) {
        values.push(f);
      }
    });
    return values;
  }

  isRoot(): boolean {
    return this.parent === null;
  }
}

export interface Stat extends FileStats {
  type: "file" | "folder";
}

export interface ListedFiles {
  /** @public */
  files: string[];
  /** @public */
  folders: string[];
}

export type WatchOptions = {
  recursive?: boolean;
  interval?: number;
};

export interface ChangeEvent {
  previousPath?: string;
  type: "create" | "modify" | "delete";
  path: string;
}

export interface WatchErrorEvent {
  type: "error";
  path: string;
  error: unknown;
}

export interface NativeWatchSubscription {
  close(): void | Promise<void>;
}

export interface NativeWatchAdapter {
  watch(
    path: string | string[],
    options: WatchOptions,
    listener: (event: ChangeEvent | WatchErrorEvent) => void,
  ): NativeWatchSubscription | void;
}

export interface DataAdapter {
  getName(): string;
  exists(normalizedPath: string, sensitive?: boolean): Promise<boolean>;
  stat(normalizedPath: string): Promise<Stat | null>;
  read(normalizedPath: string): Promise<string>;
  readBinary(normalizedPath: string): Promise<ArrayBuffer>;
  write(
    normalizedPath: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void>;
  writeBinary(
    normalizedPath: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void>;
  append(
    normalizedPath: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void>;
  appendBinary(
    normalizedPath: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void>;

  /**
   * Atomically read, modify, and save the contents of a plaintext file.
   *
   * @param normalizedPath - Path to file/folder, use {@link normalizePath} to
   *   normalize beforehand.
   * @param fn - A callback function which returns the new content of the file
   *   synchronously.
   * @param options - Write options.
   * @returns String - the text value of the file that was written.
   * @public
   */
  process(
    normalizedPath: string,
    fn: (data: string) => string,
    options?: DataWriteOptions,
  ): Promise<string>;
  list(normalizedPath: string): Promise<ListedFiles>;
  mkdir(
    normalizedPath: string,
    options?: Partial<{ recursive: boolean; mode: string }>,
  ): Promise<void>;
  rmdir(normalizedPath: string, recursive: boolean): Promise<void>;
  remove(normalizedPath: string): Promise<void>;
  rename(normalizedPath: string, normalizedNewPath: string): Promise<void>;
  copy(normalizedPath: string, normalizedNewPath: string): Promise<void>;
  getResourcePath(normalizedPath: string): string;
  trashSystem(normalizedPath: string): Promise<boolean>;
  trashLocal(normalizedPath: string): Promise<void>;
}

export interface VaultAdapterCapabilities {
  conditionalTextWrite?: boolean;
  persistent: boolean;
  userVisibleFiles: boolean;
  requiresPermission: boolean;
  nativeWatch: boolean;
  resourceUrls: boolean;
  systemTrash: boolean;
}

/**
 * Preferred name for the canonical vault file adapter contract.
 *
 * `DataAdapter` remains exported for Obsidian API compatibility while the
 * runtime migrates toward the cross-host vault session model.
 */
export interface VaultAdapter extends DataAdapter {
  getCapabilities?(): Partial<VaultAdapterCapabilities>;
  /**
   * Reject when the file no longer has these exact contents (null means
   * absent).
   */
  writeTextIfUnchanged?(
    normalizedPath: string,
    data: string,
    expected: string | null,
    options?: DataWriteOptions,
  ): Promise<void>;
  openRead?(normalizedPath: string): Promise<VaultReadHandle>;
  atomicWrite?(
    normalizedPath: string,
    source: ReadableStream<Uint8Array>,
    options?: AtomicDataWriteOptions,
  ): Promise<void>;
}

export interface VaultIdentityAdapter {
  getVaultId(): string;
}

export interface AsyncResourceAdapter {
  getResourceUrl(normalizedPath: string): Promise<string>;
  revokeResourceUrl?(url: string): void;
}

export { DirectoryWatcher } from "./directory-watcher";

export class FileCache {
  private capacity: number;
  private cache: Map<string, string>;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }
    this.capacity = capacity;
    this.cache = new Map<string, string>();
  }

  get(key: string): string | undefined {
    key = normalizePath(key);
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  put(key: string, value: string): void {
    key = normalizePath(key);
    if (this.cache.has(key)) {
      // Update existing key - delete and re-add to move to end
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value!;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  invalidate(key: string) {
    key = normalizePath(key);
    this.keys()
      .filter((path) => path.startsWith(`${key}/`) || path === key)
      .forEach((key) => this.cache.delete(key));
  }

  rename(oldName: string, newName: string) {
    oldName = normalizePath(oldName);
    newName = normalizePath(newName);
    if (this.cache.has(oldName)) {
      const value = this.cache.get(oldName)!;
      this.cache.delete(oldName);
      this.cache.set(newName, value);
    }
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string) {
    return this.cache.has(key);
  }

  // Helper method to see current state (for debugging)
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}
