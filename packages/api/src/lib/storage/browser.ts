import { basename, dirname, joinPath, normalizePath } from "./path";
import type {
  DataAdapter,
  DataWriteOptions,
  ListedFiles,
  Stat,
  AsyncResourceAdapter,
  VaultIdentityAdapter,
} from "./fs";
import {
  clearVaultScopedState,
  deleteVaultProfile,
  generateBrowserVaultId,
  getDefaultVaultStateStore,
  getVaultProfile,
  listVaultProfiles,
  saveVaultProfile,
  ScopedVaultStore,
  type KeyValueStore,
  type VaultProfile,
} from "./vault-state";

export type BrowserFileSystemPermissionMode = "read" | "readwrite";
export type BrowserFileSystemPermissionState = "granted" | "denied" | "prompt";

export interface BrowserFileSystemPermissionDescriptor {
  mode?: BrowserFileSystemPermissionMode;
}

export interface BrowserFileSystemHandle {
  kind: "file" | "directory";
  name: string;
  queryPermission?(
    descriptor?: BrowserFileSystemPermissionDescriptor,
  ): Promise<BrowserFileSystemPermissionState>;
  requestPermission?(
    descriptor?: BrowserFileSystemPermissionDescriptor,
  ): Promise<BrowserFileSystemPermissionState>;
}

export interface BrowserFileSystemWritableFileStream {
  write(data: ArrayBuffer | Blob | string | Uint8Array): Promise<void>;
  close(): Promise<void>;
}

export interface BrowserFileSystemCreateWritableOptions {
  keepExistingData?: boolean;
}

export interface BrowserFileSystemFileHandle extends BrowserFileSystemHandle {
  kind: "file";
  getFile(): Promise<Blob & { lastModified?: number; name?: string }>;
  createWritable(
    options?: BrowserFileSystemCreateWritableOptions,
  ): Promise<BrowserFileSystemWritableFileStream>;
}

export interface BrowserFileSystemDirectoryHandle
  extends BrowserFileSystemHandle {
  kind: "directory";
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<BrowserFileSystemFileHandle>;
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<BrowserFileSystemDirectoryHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  entries?(): AsyncIterableIterator<
    [string, BrowserFileSystemFileHandle | BrowserFileSystemDirectoryHandle]
  >;
  [Symbol.asyncIterator]?(): AsyncIterableIterator<
    [string, BrowserFileSystemFileHandle | BrowserFileSystemDirectoryHandle]
  >;
}

export interface BrowserVaultAdapterOptions {
  vaultId?: string;
  name?: string;
  stateStore?: KeyValueStore;
}

export interface BrowserDirectoryImportProgress {
  totalFiles: number;
  importedFiles: number;
  currentPath: string | null;
}

export interface BrowserDirectoryImportOptions {
  onProgress?: (
    progress: BrowserDirectoryImportProgress,
  ) => void | Promise<void>;
}

export interface BrowserDirectoryExportProgress {
  totalFiles: number;
  exportedFiles: number;
  currentPath: string | null;
}

export interface BrowserDirectoryExportOptions {
  onProgress?: (
    progress: BrowserDirectoryExportProgress,
  ) => void | Promise<void>;
}

type StoredStat = Partial<Stat> & { type: "file" | "folder" };

function createFsError(code: string, path: string): Error & { code: string } {
  const error = new Error(`${code}: ${path}`) as Error & { code: string };
  error.code = code;
  return error;
}

function isNotFound(error: unknown): boolean {
  const err = error as { name?: string; code?: string };
  return err?.name === "NotFoundError" || err?.code === "ENOENT";
}

const STALE_BROWSER_HANDLE_MESSAGE =
  /state cached in an interface object was made but the state had changed/i;

function isRecoverableBrowserHandleError(error: unknown): boolean {
  let current: unknown = error;
  while (current) {
    const err = current as {
      name?: string;
      code?: string;
      message?: string;
      cause?: unknown;
    };
    if (
      err?.name === "NotFoundError" ||
      err?.name === "NotReadableError" ||
      err?.name === "NoModificationAllowedError" ||
      err?.name === "InvalidStateError" ||
      err?.code === "ENOENT" ||
      STALE_BROWSER_HANDLE_MESSAGE.test(err?.message ?? "")
    ) {
      return true;
    }
    current = err?.cause;
  }
  return false;
}

function delayRetry(attempt: number): Promise<void> {
  const delayMs = 25 * (attempt + 1);
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return (
    value instanceof ArrayBuffer ||
    Object.prototype.toString.call(value) === "[object ArrayBuffer]"
  );
}

function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (isArrayBuffer(data)) return data;
  const view = data as Uint8Array;
  const copy = new Uint8Array(view.byteLength);
  copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  return copy.buffer;
}

function byteSize(data: string | ArrayBuffer): number {
  return typeof data === "string"
    ? new TextEncoder().encode(data).byteLength
    : data.byteLength;
}

function normalizeVaultPath(path: string): string {
  path = normalizePath(path);
  if (path === "/" || !path) return "/";
  if (path.startsWith("../") || path === "..") {
    throw createFsError("EINVAL", path);
  }
  return path.replace(/^\/+/, "").replace(/\/+$/, "");
}

function pathParts(path: string): string[] {
  path = normalizeVaultPath(path);
  return path === "/" ? [] : path.split("/").filter(Boolean);
}

async function listDirectoryEntries(
  directory: BrowserFileSystemDirectoryHandle,
): Promise<
  Array<
    [string, BrowserFileSystemFileHandle | BrowserFileSystemDirectoryHandle]
  >
> {
  const entries =
    directory.entries?.() ?? directory[Symbol.asyncIterator]?.() ?? ([] as any);
  const items: Array<
    [string, BrowserFileSystemFileHandle | BrowserFileSystemDirectoryHandle]
  > = [];
  for await (const [name, handle] of entries) {
    items.push([
      name,
      handle as BrowserFileSystemFileHandle | BrowserFileSystemDirectoryHandle,
    ]);
  }
  items.sort(([left], [right]) => left.localeCompare(right));
  return items;
}

async function ensureTargetPathType(
  target: DataAdapter,
  path: string,
  type: "file" | "folder",
): Promise<void> {
  const existing = await target.stat(path);
  if (!existing) {
    return;
  }

  if (existing.type === "file" && type === "folder") {
    await target.remove(path);
    return;
  }

  if (existing.type === "folder" && type === "file") {
    await target.rmdir(path, true);
  }
}

async function getDirectoryEntry(
  directory: BrowserFileSystemDirectoryHandle,
  name: string,
): Promise<BrowserFileSystemHandle | null> {
  try {
    return await directory.getFileHandle(name);
  } catch (error) {
    if (!isNotFound(error)) {
      try {
        return await directory.getDirectoryHandle(name);
      } catch (dirError) {
        if (isNotFound(dirError)) return null;
        throw dirError;
      }
    }
  }

  try {
    return await directory.getDirectoryHandle(name);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

async function ensureDirectoryEntryType(
  directory: BrowserFileSystemDirectoryHandle,
  name: string,
  type: "file" | "directory",
): Promise<BrowserFileSystemHandle> {
  const existing = await getDirectoryEntry(directory, name);
  if (existing?.kind === type) {
    return existing;
  }

  if (existing) {
    await directory.removeEntry(name, {
      recursive: existing.kind === "directory",
    });
  }

  return type === "directory"
    ? directory.getDirectoryHandle(name, { create: true })
    : directory.getFileHandle(name, { create: true });
}

async function getOrCreateDirectoryPath(
  root: BrowserFileSystemDirectoryHandle,
  normalizedPath: string,
): Promise<BrowserFileSystemDirectoryHandle> {
  let current = root;
  for (const part of pathParts(normalizedPath)) {
    current = (await ensureDirectoryEntryType(
      current,
      part,
      "directory",
    )) as BrowserFileSystemDirectoryHandle;
  }
  return current;
}

async function listAdapterFiles(
  source: DataAdapter,
  basePath = "/",
): Promise<string[]> {
  const normalizedBase = normalizeVaultPath(basePath);
  const listed = await source.list(normalizedBase);
  const files = listed.files.map((name) =>
    normalizedBase === "/" ? name : joinPath(normalizedBase, name),
  );

  for (const folder of listed.folders) {
    const childPath =
      normalizedBase === "/" ? folder : joinPath(normalizedBase, folder);
    files.push(...(await listAdapterFiles(source, childPath)));
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

async function collectDirectoryTree(
  directory: BrowserFileSystemDirectoryHandle,
  basePath: string = "",
): Promise<{
  folders: string[];
  files: Array<{ path: string; handle: BrowserFileSystemFileHandle }>;
}> {
  const folders: string[] = [];
  const files: Array<{ path: string; handle: BrowserFileSystemFileHandle }> =
    [];
  const entries = await listDirectoryEntries(directory);

  for (const [name, handle] of entries) {
    const nextPath = basePath ? joinPath(basePath, name) : name;
    if (handle.kind === "directory") {
      folders.push(nextPath);
      const nested = await collectDirectoryTree(handle, nextPath);
      folders.push(...nested.folders);
      files.push(...nested.files);
      continue;
    }

    files.push({ path: nextPath, handle });
  }

  return { folders, files };
}

export async function importDirectoryHandleToAdapter(
  source: BrowserFileSystemDirectoryHandle,
  target: DataAdapter,
  options: BrowserDirectoryImportOptions = {},
): Promise<BrowserDirectoryImportProgress> {
  const { folders, files } = await collectDirectoryTree(source);
  let importedFiles = 0;

  await options.onProgress?.({
    totalFiles: files.length,
    importedFiles,
    currentPath: null,
  });

  for (const folder of folders) {
    await ensureTargetPathType(target, folder, "folder");
    await target.mkdir(folder, { recursive: true });
  }

  for (const file of files) {
    const parentPath = dirname(file.path);
    if (parentPath !== "/") {
      await target.mkdir(parentPath, { recursive: true });
    }
    await ensureTargetPathType(target, file.path, "file");
    await target.writeBinary(
      file.path,
      toArrayBuffer(await (await file.handle.getFile()).arrayBuffer()),
    );
    importedFiles += 1;
    await options.onProgress?.({
      totalFiles: files.length,
      importedFiles,
      currentPath: file.path,
    });
  }

  return {
    totalFiles: files.length,
    importedFiles,
    currentPath: files.at(-1)?.path ?? null,
  };
}

export async function exportAdapterToDirectoryHandle(
  source: DataAdapter,
  target: BrowserFileSystemDirectoryHandle,
  options: BrowserDirectoryExportOptions = {},
): Promise<BrowserDirectoryExportProgress> {
  const files = await listAdapterFiles(source);
  const progress: BrowserDirectoryExportProgress = {
    totalFiles: files.length,
    exportedFiles: 0,
    currentPath: null,
  };

  await options.onProgress?.({ ...progress });

  for (const path of files) {
    const parentPath = dirname(path);
    const targetDirectory = await getOrCreateDirectoryPath(
      target,
      parentPath === "." ? "/" : parentPath,
    );
    const fileHandle = (await ensureDirectoryEntryType(
      targetDirectory,
      basename(path),
      "file",
    )) as BrowserFileSystemFileHandle;
    const writable = await fileHandle.createWritable({
      keepExistingData: false,
    });
    const data = new Uint8Array(await source.readBinary(path));
    await writable.write(data);
    await writable.close();

    progress.exportedFiles += 1;
    progress.currentPath = path;
    await options.onProgress?.({ ...progress });
  }

  return progress;
}

export class BrowserHandleVaultAdapter
  implements DataAdapter, VaultIdentityAdapter, AsyncResourceAdapter
{
  protected readonly stats: ScopedVaultStore;
  private readonly locks = new Map<string, Promise<unknown>>();

  protected root: BrowserFileSystemDirectoryHandle;

  constructor(
    root: BrowserFileSystemDirectoryHandle,
    readonly kind: "opfs" | "file-system-access",
    options: BrowserVaultAdapterOptions = {},
  ) {
    this.root = root;
    this.vaultId =
      options.vaultId ??
      `${kind}:${root.name || "vault"}`.replace(/[^a-zA-Z0-9:._-]/g, "-");
    this.name = options.name ?? root.name ?? basename(this.vaultId);
    this.stats = new ScopedVaultStore(
      this.vaultId,
      "browser-stats",
      options.stateStore ?? getDefaultVaultStateStore(),
    );
  }

  protected readonly vaultId: string;
  protected readonly name: string;

  getName(): string {
    return this.name;
  }

  getVaultId(): string {
    return this.vaultId;
  }

  getCapabilities() {
    return {
      persistent: true,
      userVisibleFiles: this.kind === "file-system-access",
      requiresPermission: this.kind === "file-system-access",
      nativeWatch: false,
      resourceUrls: true,
      systemTrash: false,
    };
  }

  protected async refreshRootHandleIfNeeded(): Promise<void> {
    // Subclasses can re-resolve the vault root after stale OPFS handle errors.
  }

  private async withPathLock<T>(
    normalizedPath: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const key = normalizeVaultPath(normalizedPath);
    const previous = this.locks.get(key) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    this.locks.set(
      key,
      current.then(
        () => undefined,
        () => undefined,
      ),
    );
    return current;
  }

  private async withHandleRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!isRecoverableBrowserHandleError(error) || attempt === 4) {
          throw error;
        }
        await this.refreshRootHandleIfNeeded();
        await delayRetry(attempt);
      }
    }

    throw lastError;
  }

  private async getDirectory(
    normalizedPath: string,
    options: { create?: boolean } = {},
  ): Promise<BrowserFileSystemDirectoryHandle> {
    let current = this.root;
    for (const part of pathParts(normalizedPath)) {
      current = await current.getDirectoryHandle(part, options);
    }
    return current;
  }

  private async getParentDirectory(
    normalizedPath: string,
    options: { create?: boolean } = {},
  ): Promise<[BrowserFileSystemDirectoryHandle, string]> {
    const path = normalizeVaultPath(normalizedPath);
    if (path === "/") throw createFsError("EINVAL", normalizedPath);
    const parentPath = dirname(path);
    const parent = await this.getDirectory(parentPath, options);
    return [parent, basename(path)];
  }

  private async getHandle(
    normalizedPath: string,
  ): Promise<
    BrowserFileSystemFileHandle | BrowserFileSystemDirectoryHandle | null
  > {
    const path = normalizeVaultPath(normalizedPath);
    if (path === "/") return this.root;
    const [parent, name] = await this.getParentDirectory(path);
    try {
      return await parent.getFileHandle(name);
    } catch (error) {
      if (isRecoverableBrowserHandleError(error) && !isNotFound(error)) {
        throw error;
      }
      if (!isNotFound(error)) {
        try {
          return await parent.getDirectoryHandle(name);
        } catch (dirError) {
          if (isNotFound(dirError)) return null;
          throw dirError;
        }
      }
    }
    try {
      return await parent.getDirectoryHandle(name);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  private async readStoredStat(path: string): Promise<StoredStat | null> {
    return (await this.stats.get<StoredStat>(normalizeVaultPath(path))) ?? null;
  }

  private async writeStoredStat(path: string, stat: StoredStat): Promise<void> {
    await this.stats.set(normalizeVaultPath(path), stat);
  }

  private async deleteStoredStats(path: string): Promise<void> {
    path = normalizeVaultPath(path);
    const keys = await this.stats.keys();
    await Promise.all(
      keys
        .filter((key) => key === path || key.startsWith(`${path}/`))
        .map((key) => this.stats.del(key)),
    );
  }

  private async moveStoredStats(from: string, to: string): Promise<void> {
    from = normalizeVaultPath(from);
    to = normalizeVaultPath(to);
    const keys = await this.stats.keys();
    await Promise.all(
      keys
        .filter((key) => key === from || key.startsWith(`${from}/`))
        .map(async (key) => {
          const value = await this.stats.get<StoredStat>(key);
          if (!value) return;
          const nextKey =
            key === from ? to : `${to}/${key.slice(from.length + 1)}`;
          await this.stats.set(nextKey, value);
          await this.stats.del(key);
        }),
    );
  }

  async exists(normalizedPath: string, sensitive?: boolean): Promise<boolean> {
    return (await this.stat(normalizedPath)) !== null;
  }

  async stat(normalizedPath: string): Promise<Stat | null> {
    const path = normalizeVaultPath(normalizedPath);
    return this.withHandleRetry(async (): Promise<Stat | null> => {
      const handle = await this.getHandle(path);
      if (!handle && path !== "/") throw createFsError("ENOENT", path);
      if (!handle) return null;

      const stored = await this.readStoredStat(path);
      const now = Date.now();
      if (handle.kind === "directory") {
        return {
          type: "folder",
          ctime: stored?.ctime ?? now,
          mtime: stored?.mtime ?? stored?.ctime ?? now,
          size: 0,
        };
      }

      const file = await handle.getFile();
      return {
        type: "file",
        ctime: stored?.ctime ?? file.lastModified ?? now,
        mtime: stored?.mtime ?? file.lastModified ?? now,
        size: file.size,
      };
    }).catch((error: unknown) => {
      if (isNotFound(error)) return null;
      throw error;
    });
  }

  async read(normalizedPath: string): Promise<string> {
    const path = normalizeVaultPath(normalizedPath);
    return this.withHandleRetry(async () => {
      const handle = await this.getHandle(path);
      if (!handle || handle.kind !== "file") {
        throw createFsError("ENOENT", path);
      }
      return (await handle.getFile()).text();
    });
  }

  async readBinary(normalizedPath: string): Promise<ArrayBuffer> {
    const path = normalizeVaultPath(normalizedPath);
    return this.withHandleRetry(async () => {
      const handle = await this.getHandle(path);
      if (!handle || handle.kind !== "file") {
        throw createFsError("ENOENT", path);
      }
      return toArrayBuffer(await (await handle.getFile()).arrayBuffer());
    });
  }

  async write(
    normalizedPath: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    await this.writeFile(normalizedPath, data, options);
  }

  async writeBinary(
    normalizedPath: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    await this.writeFile(normalizedPath, data, options);
  }

  private async writeFile(
    normalizedPath: string,
    data: string | ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    const path = normalizeVaultPath(normalizedPath);
    await this.withHandleRetry(async () => {
      const [parent, name] = await this.getParentDirectory(path, {
        create: true,
      });
      const existing = await this.readStoredStat(path);
      const handle = await parent.getFileHandle(name, { create: true });
      const writable = await handle.createWritable({
        keepExistingData: false,
      });
      await writable.write(data);
      await writable.close();
      const now = Date.now();
      await this.writeStoredStat(path, {
        type: "file",
        ctime: options?.ctime ?? existing?.ctime ?? now,
        mtime: options?.mtime ?? now,
        size: byteSize(data),
      });
    });
  }

  async append(
    normalizedPath: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    await this.withPathLock(normalizedPath, async () => {
      const current = await this.read(normalizedPath).catch(() => "");
      await this.write(normalizedPath, current + data, options);
    });
  }

  async appendBinary(
    normalizedPath: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    await this.withPathLock(normalizedPath, async () => {
      const current = new Uint8Array(
        await this.readBinary(normalizedPath).catch(() => new ArrayBuffer(0)),
      );
      const next = new Uint8Array(current.byteLength + data.byteLength);
      next.set(current);
      next.set(new Uint8Array(data), current.byteLength);
      await this.writeBinary(normalizedPath, next.buffer, options);
    });
  }

  async process(
    normalizedPath: string,
    fn: (data: string) => string,
    options?: DataWriteOptions,
  ): Promise<string> {
    return this.withPathLock(normalizedPath, async () => {
      const data = fn(await this.read(normalizedPath));
      await this.write(normalizedPath, data, options);
      return data;
    });
  }

  async list(normalizedPath: string): Promise<ListedFiles> {
    return this.withHandleRetry(async () => {
      const dir = await this.getDirectory(normalizedPath);
      const result: ListedFiles = { files: [], folders: [] };
      const entries =
        dir.entries?.() ?? dir[Symbol.asyncIterator]?.() ?? ([] as any);
      for await (const [name, handle] of entries) {
        if (handle.kind === "file") {
          result.files.push(name);
        } else if (handle.kind === "directory") {
          result.folders.push(name);
        }
      }
      result.files.sort();
      result.folders.sort();
      return result;
    });
  }

  async mkdir(
    normalizedPath: string,
    options?: Partial<{ recursive: boolean; mode: string }>,
  ): Promise<void> {
    const path = normalizeVaultPath(normalizedPath);
    if (path === "/") return;
    await this.withHandleRetry(async () => {
      const now = Date.now();
      if (options?.recursive) {
        let current = this.root;
        let currentPath = "";
        for (const part of pathParts(path)) {
          currentPath = currentPath ? joinPath(currentPath, part) : part;
          current = await current.getDirectoryHandle(part, { create: true });
          const existing = await this.readStoredStat(currentPath);
          await this.writeStoredStat(currentPath, {
            type: "folder",
            ctime: existing?.ctime ?? now,
            mtime: now,
            size: 0,
          });
        }
        return;
      }
      const [parent, name] = await this.getParentDirectory(path);
      await parent.getDirectoryHandle(name, { create: true });
      const existing = await this.readStoredStat(path);
      await this.writeStoredStat(path, {
        type: "folder",
        ctime: existing?.ctime ?? now,
        mtime: now,
        size: 0,
      });
    });
  }

  async rmdir(normalizedPath: string, recursive: boolean): Promise<void> {
    const path = normalizeVaultPath(normalizedPath);
    await this.withHandleRetry(async () => {
      const [parent, name] = await this.getParentDirectory(path);
      await parent.removeEntry(name, { recursive });
      await this.deleteStoredStats(path);
    });
  }

  async remove(normalizedPath: string): Promise<void> {
    const path = normalizeVaultPath(normalizedPath);
    await this.withHandleRetry(async () => {
      const [parent, name] = await this.getParentDirectory(path);
      await parent.removeEntry(name);
      await this.deleteStoredStats(path);
    });
  }

  async rename(
    normalizedPath: string,
    normalizedNewPath: string,
  ): Promise<void> {
    const from = normalizeVaultPath(normalizedPath);
    const to = normalizeVaultPath(normalizedNewPath);
    if (from === to) return;
    await this.copy(from, to);
    const stat = await this.stat(from);
    if (stat?.type === "folder") {
      await this.rmdir(from, true);
    } else {
      await this.remove(from);
    }
    await this.moveStoredStats(from, to);
  }

  async copy(normalizedPath: string, normalizedNewPath: string): Promise<void> {
    const sourcePath = normalizeVaultPath(normalizedPath);
    const targetPath = normalizeVaultPath(normalizedNewPath);
    const handle = await this.getHandle(sourcePath);
    if (!handle) throw createFsError("ENOENT", sourcePath);
    const existing = await this.getHandle(targetPath);
    if (existing?.kind === "directory") {
      await this.rmdir(targetPath, true);
    } else if (existing?.kind === "file") {
      await this.remove(targetPath);
    }
    if (handle.kind === "file") {
      await this.writeBinary(targetPath, await this.readBinary(sourcePath));
      return;
    }
    await this.mkdir(targetPath, { recursive: true });
    const { files, folders } = await this.list(sourcePath);
    for (const folder of folders) {
      await this.copy(
        joinPath(sourcePath, folder),
        joinPath(targetPath, folder),
      );
    }
    for (const file of files) {
      await this.copy(joinPath(sourcePath, file), joinPath(targetPath, file));
    }
  }

  getResourcePath(normalizedPath: string): string {
    return `browser-vault://${this.vaultId}/${normalizeVaultPath(normalizedPath)}`;
  }

  async getResourceUrl(normalizedPath: string): Promise<string> {
    const data = await this.readBinary(normalizedPath);
    return URL.createObjectURL(new Blob([data]));
  }

  revokeResourceUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  trashSystem(normalizedPath: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  async trashLocal(normalizedPath: string): Promise<void> {
    const path = normalizeVaultPath(normalizedPath);
    const trashPath = normalizeVaultPath(joinPath(".trash", path));
    await this.mkdir(dirname(trashPath), { recursive: true });
    await this.rename(path, trashPath);
  }
}

export function humanizeOpfsVaultId(vaultId: string): string {
  const withoutPrefix = vaultId.startsWith("opfs-")
    ? vaultId.slice("opfs-".length)
    : vaultId;
  const slug = withoutPrefix.replace(/-[a-z0-9]{4}$/, "");
  const words = (slug || withoutPrefix).split("-").filter(Boolean);
  if (words.length === 0) {
    return vaultId;
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function listOpfsVaultIds(): Promise<string[]> {
  const storage = globalThis.navigator?.storage as
    | { getDirectory?: () => Promise<BrowserFileSystemDirectoryHandle> }
    | undefined;
  if (!storage?.getDirectory) {
    return [];
  }

  try {
    const root = await storage.getDirectory();
    let vaults: BrowserFileSystemDirectoryHandle;
    try {
      vaults = await root.getDirectoryHandle("vaults");
    } catch (error) {
      if (isNotFound(error)) {
        return [];
      }
      throw error;
    }

    const ids: string[] = [];
    const entries = vaults.entries?.() ?? vaults[Symbol.asyncIterator]?.();
    if (!entries) {
      return [];
    }

    for await (const [name, handle] of entries as AsyncIterableIterator<
      [string, BrowserFileSystemHandle]
    >) {
      if (handle.kind === "directory") {
        ids.push(name);
      }
    }

    return ids.sort();
  } catch {
    return [];
  }
}

export async function listOrphanOpfsVaultIds(
  stateStore?: KeyValueStore,
): Promise<string[]> {
  const opfsIds = await listOpfsVaultIds();
  if (opfsIds.length === 0) {
    return [];
  }

  const store = stateStore ?? getDefaultVaultStateStore();
  const profiles = await listVaultProfiles(store);
  const registeredOpfsIds = new Set(
    profiles
      .filter((profile) => profile.kind === "opfs")
      .map((profile) => profile.id),
  );

  return opfsIds.filter((id) => !registeredOpfsIds.has(id));
}

export async function createOpfsVault(options: {
  name: string;
  vaultId?: string;
  stateStore?: KeyValueStore;
}): Promise<OpfsVaultAdapter> {
  const vaultId =
    options.vaultId ?? generateBrowserVaultId("opfs", options.name);
  return OpfsVaultAdapter.create({
    vaultId,
    name: options.name,
    stateStore: options.stateStore,
  });
}

export class OpfsVaultAdapter extends BrowserHandleVaultAdapter {
  static async create(
    options: BrowserVaultAdapterOptions = {},
  ): Promise<OpfsVaultAdapter> {
    const storage = globalThis.navigator?.storage as
      | { getDirectory?: () => Promise<BrowserFileSystemDirectoryHandle> }
      | undefined;
    if (!storage?.getDirectory) {
      throw new Error("OPFS is not available in this browser");
    }
    const vaultId = options.vaultId ?? "opfs-default";
    const root = await storage.getDirectory();
    const vaults = await root.getDirectoryHandle("vaults", { create: true });
    const vault = await vaults.getDirectoryHandle(vaultId, { create: true });
    const adapter = new OpfsVaultAdapter(vault, {
      ...options,
      vaultId,
      name: options.name ?? "Browser vault",
    });
    const now = Date.now();
    const store = options.stateStore ?? getDefaultVaultStateStore();
    const existingProfile = await getVaultProfile(adapter.getVaultId(), store);
    await saveVaultProfile(
      {
        id: adapter.getVaultId(),
        name: adapter.getName(),
        kind: "opfs",
        createdAt: existingProfile?.createdAt ?? now,
        updatedAt: now,
        demo: existingProfile?.demo,
      },
      store,
    );
    return adapter;
  }

  protected override async refreshRootHandleIfNeeded(): Promise<void> {
    const storage = globalThis.navigator?.storage as
      | { getDirectory?: () => Promise<BrowserFileSystemDirectoryHandle> }
      | undefined;
    if (!storage?.getDirectory) {
      return;
    }

    const opfsRoot = await storage.getDirectory();
    const vaults = await opfsRoot.getDirectoryHandle("vaults");
    this.root = await vaults.getDirectoryHandle(this.vaultId);
  }

  private constructor(
    root: BrowserFileSystemDirectoryHandle,
    options: BrowserVaultAdapterOptions,
  ) {
    super(root, "opfs", options);
  }
}

export class FileSystemAccessAdapter extends BrowserHandleVaultAdapter {
  static async fromHandle(
    handle: BrowserFileSystemDirectoryHandle,
    options: BrowserVaultAdapterOptions = {},
  ): Promise<FileSystemAccessAdapter> {
    const adapter = new FileSystemAccessAdapter(handle, options);
    const now = Date.now();
    const store = options.stateStore ?? getDefaultVaultStateStore();
    const existingProfile = await getVaultProfile(adapter.getVaultId(), store);
    await saveVaultProfile(
      {
        id: adapter.getVaultId(),
        name: adapter.getName(),
        kind: "file-system-access",
        handle,
        createdAt: existingProfile?.createdAt ?? now,
        updatedAt: now,
      },
      store,
    );
    return adapter;
  }

  private constructor(
    root: BrowserFileSystemDirectoryHandle,
    options: BrowserVaultAdapterOptions,
  ) {
    super(root, "file-system-access", options);
  }
}

export async function pickFileSystemAccessDirectoryHandle(
  options: {
    id?: string;
    mode?: BrowserFileSystemPermissionMode;
  } = {},
): Promise<BrowserFileSystemDirectoryHandle> {
  const picker = (
    globalThis as typeof globalThis & {
      showDirectoryPicker?: (options?: {
        id?: string;
        mode?: BrowserFileSystemPermissionMode;
      }) => Promise<BrowserFileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (!picker) {
    throw new Error("File System Access API is not available in this browser");
  }
  return picker({
    id: options.id ?? "lapis-notes-vault",
    mode: options.mode ?? "readwrite",
  });
}

export async function pickFileSystemAccessVault(
  options: BrowserVaultAdapterOptions = {},
): Promise<FileSystemAccessAdapter> {
  const handle = await pickFileSystemAccessDirectoryHandle({
    id: "lapis-notes-vault",
    mode: "readwrite",
  });
  return FileSystemAccessAdapter.fromHandle(handle, options);
}

async function deleteOpfsVaultDirectory(vaultId: string): Promise<void> {
  const storage = globalThis.navigator?.storage as
    | { getDirectory?: () => Promise<BrowserFileSystemDirectoryHandle> }
    | undefined;
  if (!storage?.getDirectory) {
    return;
  }

  try {
    const root = await storage.getDirectory();
    const vaults = await root.getDirectoryHandle("vaults");
    await vaults.removeEntry(vaultId, { recursive: true });
  } catch (error) {
    if (isNotFound(error)) {
      return;
    }
    throw error;
  }
}

export async function deleteBrowserLocalVault(
  profile: Pick<VaultProfile, "id" | "kind">,
  options: { stateStore?: KeyValueStore } = {},
): Promise<void> {
  if (profile.kind === "opfs") {
    await deleteOpfsVaultDirectory(profile.id);
  } else {
    throw new Error(`Cannot delete browser-local vault kind: ${profile.kind}`);
  }

  const store = options.stateStore ?? getDefaultVaultStateStore();
  await clearVaultScopedState(profile.id, store);
  await deleteVaultProfile(profile.id, store);
}

export async function deleteOrphanOpfsVault(
  vaultId: string,
  options: { stateStore?: KeyValueStore } = {},
): Promise<void> {
  await deleteOpfsVaultDirectory(vaultId);
  await clearVaultScopedState(
    vaultId,
    options.stateStore ?? getDefaultVaultStateStore(),
  );
}
