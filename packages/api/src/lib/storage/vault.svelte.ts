import { projectVaultTree, scanVaultTree } from "./vault-reconciliation";
import type { FileEditingSessionRegistry } from "../file-editing-sessions";
import { DEFAULT_APP_STATE_DIRECTORY } from "./path";
import { EventDispatcher } from "$lib/events";
import {
  hasEditorAssociationGlobMagic,
  matchesEditorAssociationGlob,
  normalizeEditorAssociationGlob,
  validateEditorAssociationGlob,
} from "$lib/glob";
import {
  FileCache,
  TFile,
  TFolder,
  type AsyncResourceAdapter,
  type ChangeEvent,
  type Stat,
  type AtomicDataWriteOptions,
  type DataAdapter,
  type DataWriteOptions,
  type VaultReadHandle,
  type VaultAdapter,
  type TAbstractFile,
} from "./fs";
import { dirname, joinPath, normalizePath } from "./path";

function Err(name: string) {
  return class extends Error {
    code: string = "";
    constructor(...args: any[]) {
      super(...args);
      this.code = name;
      if (this.message) {
        this.message = name + ": " + this.message;
      } else {
        this.message = name;
      }
    }
  };
}

export const ENOTDIR = Err("ENOTDIR");

export interface VaultGlobOptions {
  caseSensitive?: boolean;
}

/**
 * High-level file-system facade for the active vault.
 *
 * `Vault` wraps a {@link DataAdapter}, maintains the in-memory file tree used by
 * the workspace, and emits Obsidian-style file lifecycle events.
 *
 * @public
 */
export class Vault extends EventDispatcher<{
  load: [];
  create: [file: TAbstractFile];
  modify: [file: TAbstractFile];
  delete: [file: TAbstractFile];
  rename: [file: TAbstractFile, oldPath: string];
  all: [event: string, file: TAbstractFile, context: Record<string, unknown>];
}> {
  private files: Record<string, TAbstractFile> = {};
  private filesByName = new Map<string, Set<string>>();
  private mutationTail: Promise<void> = Promise.resolve();

  private mutate<T>(operation: () => Promise<T>): Promise<T> {
    const enqueue = () => {
      const pending = this.mutationTail.then(async () => {
        await this.load();
        return operation();
      });
      this.mutationTail = pending.then(
        () => {},
        () => {},
      );
      return pending;
    };
    return this.operations ? this.operations.track(enqueue) : enqueue();
  }

  private mutateFile<T>(
    file: TAbstractFile,
    operation: () => Promise<T>,
  ): Promise<T> {
    const path = file.path;
    return this.mutate(async () => {
      if (file.path !== path)
        throw new Error("Mutation target changed during admission");
      return operation();
    });
  }

  public configDir: string = DEFAULT_APP_STATE_DIRECTORY;
  readonly cache = new FileCache(1024);

  constructor(
    readonly adapter: DataAdapter,
    private readonly operations?: Pick<FileEditingSessionRegistry, "track">,
  ) {
    super();
    this.load();
  }

  private getPath(path: string) {
    if (path === "/" || !path) {
      return "/";
    }
    return normalizePath(path).replace(/^\/+/, "");
  }

  getName(): string {
    return this.adapter.getName();
  }

  exists(path: string, sensitive?: boolean): Promise<boolean> {
    return this.adapter.exists(this.getPath(path), sensitive);
  }

  stat(path: string) {
    return this.adapter.stat(this.getPath(path));
  }

  list(path: string = "/") {
    return this.adapter.list(this.getPath(path));
  }

  #loaded: Promise<any> | null = null;
  load(): Promise<void> {
    if (this.#loaded) {
      return this.#loaded;
    }
    this.#loaded = this.loadPath().then(() => {
      this.rebuildFileNameIndex();
      this.trigger("load");
    });
    return this.#loaded;
  }

  reload(): Promise<TFolder> {
    return this.mutate(async () => {
      await this.reconcileNow();
      this.trigger("load");
      return this.getRoot();
    });
  }

  /** Reconcile a complete disk snapshot without replacing live resources. */
  reconcile(
    hints: readonly ChangeEvent[] = [],
    current: () => boolean = () => true,
    context: Record<string, unknown> = {},
  ): Promise<void> {
    return this.mutate(() => this.reconcileNow(hints, current, context));
  }

  private async reconcileNow(
    hints: readonly ChangeEvent[] = [],
    current: () => boolean = () => true,
    context: Record<string, unknown> = {},
  ): Promise<void> {
    await this.load();
    const snapshot = await scanVaultTree(this.adapter, current);
    if (!snapshot || !current()) return;
    const projected = projectVaultTree(this, this.files, snapshot, hints);
    this.files = projected.files;
    this.rebuildFileNameIndex();
    for (const event of projected.events) {
      if (event.type === "rename")
        this.cache.rename(event.oldPath!, event.file.path);
      else this.cache.invalidate(event.file.path);
      if (event.type === "rename")
        this.dispatch("rename", event.file, event.oldPath!);
      else this.dispatch(event.type, event.file);
      this.dispatch("all", event.type, event.file, {
        ...context,
        ...(event.oldPath === undefined ? {} : { oldPath: event.oldPath }),
      });
    }
  }

  private recordFile(path: string, stat: Stat): TFile {
    const existing = this.files[path];
    if (existing instanceof TFile) {
      Object.assign(existing.stat, stat);
      return existing;
    }
    const parent = this.files[dirname(path)];
    if (!(parent instanceof TFolder)) throw new ENOTDIR(dirname(path));
    const file = new TFile(path, stat, parent, this);
    this.files[path] = file;
    this.addToFileNameIndex(file);
    parent.children.push(file);
    return file;
  }

  private addToFileNameIndex(file: TFile): void {
    const paths = this.filesByName.get(file.name) ?? new Set<string>();
    paths.add(file.path);
    this.filesByName.set(file.name, paths);
  }

  private removeFromFileNameIndex(file: TFile): void {
    const paths = this.filesByName.get(file.name);
    if (!paths) return;
    paths.delete(file.path);
    if (paths.size === 0) this.filesByName.delete(file.name);
  }

  private rebuildFileNameIndex(): void {
    this.filesByName.clear();
    for (const file of Object.values(this.files)) {
      if (file instanceof TFile) this.addToFileNameIndex(file);
    }
  }

  loadPath(
    basePath: string = "/",
    sourceFiles: Record<string, TAbstractFile> = this.files,
  ): Promise<Record<string, TAbstractFile>> {
    basePath = this.getPath(basePath);
    Object.keys(sourceFiles)
      .filter((k) => k.startsWith(`${basePath}/`) || basePath === "")
      .forEach((k) => {
        delete sourceFiles[k];
      });

    return this.adapter.list(basePath).then(({ files, folders }) => {
      sourceFiles[basePath] ||= new TFolder(basePath, [], null, this);
      const folder = sourceFiles[basePath]! as TFolder;
      folder.parent =
        basePath === "/" ? null : (sourceFiles[dirname(basePath)] as TFolder);
      folder.vault = this;
      const promises: Promise<any>[] = [];

      folders.forEach((path) => {
        path = this.getPath(joinPath(basePath, path));
        sourceFiles[path] = new TFolder(
          path,
          [],
          sourceFiles[dirname(path)] as TFolder,
          this,
        );
        folder.children.push(sourceFiles[path]);
        promises.push(this.loadPath(path, sourceFiles));
      });

      files.forEach((file) => {
        file = this.getPath(joinPath(basePath, file));
        promises.push(
          this.adapter.stat(file).then((stat) => {
            if (stat) {
              sourceFiles[file] = new TFile(file, stat, folder, this);
              folder.children.push(sourceFiles[file]);
            }
          }),
        );
      });

      return Promise.all(promises).then(() => sourceFiles);
    });
  }

  /**
   * Create a new plaintext file inside the vault.
   *
   * @param path - Vault absolute path for the new file, with extension.
   * @param data - Text content for the new file.
   * @param options - (Optional)
   * @public
   */
  create(
    path: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<TFile> {
    const run = () => this.createNow(path, data, options);
    return this.mutate(run);
  }

  private createNow(
    path: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<TFile> {
    path = this.getPath(path);
    const file = this.getFileByPath(path);
    if (file) {
      return this.modifyNow(file, data, options).then(() => file);
    }
    return this.adapter
      .write(path, data, options)
      .then(() => this.adapter.stat(path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to write file: ${path}`);
        }
        const file = this.recordFile(path, stat);
        this.cache.put(path, data);
        this.dispatch("create", file);
        this.dispatch("all", "create", file, {});
        return file;
      });
  }

  get supportsExclusiveCreate(): boolean {
    const adapter = this.adapter as VaultAdapter;
    return (
      adapter.getCapabilities?.().exclusiveCreate === true &&
      typeof adapter.writeExclusive === "function"
    );
  }

  /** Create new bytes without replacing a cached or newly arriving file. */
  createExclusive(
    path: string,
    data: string | ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<TFile> {
    if (!this.supportsExclusiveCreate)
      return Promise.reject(
        Object.assign(new Error("Exclusive file creation is unavailable"), {
          code: "ENOTSUP",
        }),
      );
    const run = async () => {
      await this.load();
      path = this.getPath(path);
      if (this.files[path])
        throw Object.assign(new Error(`A file already exists at ${path}`), {
          code: "EEXIST",
        });
      const parent = this.files[dirname(path)];
      if (!(parent instanceof TFolder)) throw new ENOTDIR(dirname(path));
      await (this.adapter as VaultAdapter).writeExclusive!(path, data, options);
      const stat = await this.adapter.stat(path);
      if (!stat || stat.type !== "file")
        throw new Error(`Unable to create file: ${path}`);
      const file = new TFile(path, stat, parent, this);
      this.files[path] = file;
      this.addToFileNameIndex(file);
      if (typeof data === "string") this.cache.put(path, data);
      else this.cache.invalidate(path);
      parent.children.push(file);
      this.dispatch("create", file);
      this.dispatch("all", "create", file, {});
      return file;
    };
    return this.mutate(run);
  }

  /**
   * Create a new binary file inside the vault.
   *
   * @param path - Vault absolute path for the new file, with extension.
   * @param data - Content for the new file.
   * @param options - (Optional)
   * @throws Error if file already exists
   * @public
   */
  createBinary(
    path: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<TFile> {
    const run = () => this.createBinaryNow(path, data, options);
    return this.mutate(run);
  }

  private createBinaryNow(
    path: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<TFile> {
    path = this.getPath(path);
    return this.adapter
      .writeBinary(path, data, options)
      .then(() => this.adapter.stat(path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to write file: ${path}`);
        }
        const file = this.recordFile(path, stat);
        this.cache.invalidate(path);
        this.dispatch("create", file);
        this.dispatch("all", "create", file, {});
        return file;
      });
  }

  /**
   * Create a new folder inside the vault.
   *
   * @param path - Vault absolute path for the new folder.
   * @throws Error if folder already exists
   * @public
   */
  createFolder(path: string): Promise<TFolder> {
    const run = () => this.createFolderNow(path);
    return this.mutate(run);
  }

  private async createFolderNow(path: string): Promise<TFolder> {
    path = this.getPath(path);

    try {
      const folder = await this.adapter.mkdir(path).then(() => {
        const parent = this.files[dirname(path)];
        if (!parent || !(parent instanceof TFolder)) {
          throw new ENOTDIR(dirname(path));
        }
        const folder = new TFolder(path, [], parent, this);
        this.files[path] = folder;
        parent.children.push(folder);
        this.dispatch("create", folder);
        this.dispatch("all", "create", folder, {});
        return folder;
      });
      return folder;
    } catch (err: any) {
      if (err.code !== "EEXIST") {
        throw err;
      }
      const folder = this.files[path];
      if (folder instanceof TFolder) {
        return folder;
      } else if (folder instanceof TFile) {
        throw new ENOTDIR(path);
      }
      throw err;
    }
  }

  async mkpath(path: string): Promise<TFolder> {
    path = this.getPath(path);
    const parts = path.split("/");
    let folder!: TFolder;
    let currentPath = "";
    if (path.startsWith("/")) {
      currentPath = "/";
      parts.shift();
    }

    for (const part of parts) {
      if (!part) continue;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      try {
        folder = await this.createFolder(currentPath);
      } catch (err: any) {
        if (err.code !== "EEXIST" && !err.toString().includes("EEXIST")) {
          throw err;
        }
        if (this.files[currentPath] instanceof TFile) {
          throw new ENOTDIR(currentPath);
        }
      }
    }

    return folder;
  }

  /**
   * Deletes the file completely.
   *
   * @param file - The file or folder to be deleted
   * @param force - Should attempt to delete folder even if it has hidden
   *   children
   * @public
   */
  delete(
    file: TAbstractFile,
    force?: boolean,
    context: { operationOrigin?: string } = {},
  ): Promise<void> {
    return this.mutateFile(file, () => this.deleteNow(file, force, context));
  }

  private deleteNow(
    file: TAbstractFile,
    force?: boolean,
    context: { operationOrigin?: string } = {},
  ): Promise<void> {
    const remove =
      file instanceof TFolder
        ? this.adapter.rmdir(file.path, force ?? true)
        : this.adapter.remove(file.path);
    return remove.then(() => {
      let parent = this.files[dirname(file.path)] as TFolder;
      Object.keys(this.files)
        .filter(
          (path) => path === file.path || path.startsWith(`${file.path}/`),
        )
        .forEach((path) => {
          const removed = this.files[path];
          if (removed instanceof TFile) this.removeFromFileNameIndex(removed);
          delete this.files[path];
        });
      if (parent) {
        const childIndex = parent.children.findIndex(
          (it) => it.path === file.path,
        );
        if (childIndex !== -1) {
          parent.children.splice(childIndex, 1);
        }
      }
      this.cache.invalidate(file.path);
      this.dispatch("delete", file);
      this.dispatch("all", "delete", file, { force, ...context });
    });
  }

  trash(file: TAbstractFile, system: boolean = true): Promise<void> {
    return this.mutateFile(file, () => this.trashNow(file, system));
  }

  private trashNow(file: TAbstractFile, system: boolean = true): Promise<void> {
    const trash = system
      ? this.adapter.trashSystem(file.path)
      : Promise.resolve(false);
    return trash.then(async (handled) => {
      if (!handled) await this.adapter.trashLocal(file.path);
      await this.reconcileNow([], () => true, { system });
    });
  }

  /**
   * Read a plaintext file that is stored inside the vault, directly from disk.
   * Use this if you intend to modify the file content afterwards. Use
   * {@link Vault.cachedRead} otherwise for better performance.
   *
   * @public
   */
  read(file: TFile): Promise<string> {
    return this.adapter.read(file.path).then((data) => {
      this.cache.put(file.path, data);
      return data;
    });
  }

  /**
   * Read the content of a plaintext file stored inside the vault Use this if
   * you only want to display the content to the user. If you want to modify the
   * file content afterward use {@link Vault.read}
   *
   * @public
   */
  cachedRead(file: TFile): Promise<string> {
    if (this.cache.has(file.path)) {
      return Promise.resolve(this.cache.get(file.path)!);
    }
    return this.read(file);
  }

  /**
   * Read the content of a binary file stored inside the vault.
   *
   * @public
   */
  readBinary(file: TFile): Promise<ArrayBuffer> {
    return this.adapter.readBinary(file.path);
  }

  /** Open a stable streamed snapshot of a file when the adapter supports it. */
  async openRead(file: TFile): Promise<VaultReadHandle> {
    const adapter = this.adapter as DataAdapter & {
      openRead?: (path: string) => Promise<VaultReadHandle>;
    };
    if (adapter.openRead) return adapter.openRead(file.path);
    const data = new Uint8Array(await adapter.readBinary(file.path));
    return {
      size: data.byteLength,
      mtime: file.stat.mtime,
      stream: ({ offset = 0, length, signal } = {}) => {
        const start = Math.max(
          0,
          Math.min(data.byteLength, Math.floor(offset)),
        );
        const end = Math.min(
          data.byteLength,
          start + Math.max(0, Math.floor(length ?? data.byteLength - start)),
        );
        return new ReadableStream<Uint8Array>({
          start(controller) {
            if (signal?.aborted) {
              controller.error(
                signal.reason ?? new DOMException("Aborted", "AbortError"),
              );
              return;
            }
            controller.enqueue(data.slice(start, end));
            controller.close();
          },
        });
      },
    };
  }

  /** Stream a file into the adapter's atomic or strongest safe replacement path. */
  atomicWrite(
    path: string,
    source: ReadableStream<Uint8Array>,
    options: AtomicDataWriteOptions = {},
  ): Promise<TFile> {
    return this.mutate(() => this.atomicWriteNow(path, source, options));
  }

  private async atomicWriteNow(
    path: string,
    source: ReadableStream<Uint8Array>,
    options: AtomicDataWriteOptions = {},
  ): Promise<TFile> {
    path = this.getPath(path);
    const existed = this.getFileByPath(path);
    const adapter = this.adapter as DataAdapter & {
      atomicWrite?: (
        path: string,
        source: ReadableStream<Uint8Array>,
        options?: AtomicDataWriteOptions,
      ) => Promise<void>;
    };
    if (adapter.atomicWrite) {
      await adapter.atomicWrite(path, source, options);
    } else {
      const reader = source.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          if (options.signal?.aborted) {
            throw (
              options.signal.reason ?? new DOMException("Aborted", "AbortError")
            );
          }
          const next = await reader.read();
          if (next.done) break;
          chunks.push(next.value);
          size += next.value.byteLength;
        }
      } finally {
        reader.releaseLock();
      }
      const data = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.byteLength;
      }
      await adapter.writeBinary(path, data.buffer, options);
    }
    await this.reconcileNow(
      [{ type: existed ? "modify" : "create", path }],
      () => true,
      { operationOrigin: options.operationOrigin },
    );
    const file = this.getFileByPath(path);
    if (!file) throw new Error(`Unable to write file: ${path}`);
    return file;
  }

  /**
   * Rename or move a file. To ensure links are automatically renamed, use
   * {@link FileManager.renameFile} instead.
   *
   * @param file - The file to rename/move
   * @param newPath - Vault absolute path to move file to.
   * @public
   */
  rename(file: TAbstractFile, newPath: string): Promise<void> {
    return this.mutateFile(file, () => this.renameNow(file, newPath));
  }

  private renameNow(file: TAbstractFile, newPath: string): Promise<void> {
    newPath = this.getPath(newPath);
    if (file.path == newPath) {
      return Promise.resolve();
    }
    const oldPath = file.path;

    return this.adapter
      .rename(oldPath, newPath)
      .then(() =>
        this.reconcileNow([
          { type: "create", path: newPath, previousPath: oldPath },
        ]),
      );
  }

  /**
   * Modify the contents of a plaintext file.
   *
   * @param file - The file
   * @param data - The new file content
   * @param options - (Optional)
   * @public
   */
  modify(file: TFile, data: string, options?: DataWriteOptions): Promise<void> {
    return this.mutateFile(file, () => this.modifyNow(file, data, options));
  }

  private modifyNow(
    file: TFile,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    if (!this.getFileByPath(file.path)) {
      return this.createNow(file.path, data, options).then(() => {});
    }
    const path = file.path;
    return this.adapter
      .write(path, data, options)
      .then(() => this.#recordTextWrite(path, data, options));
  }

  get supportsConditionalTextWrites(): boolean {
    const adapter = this.adapter as VaultAdapter;
    return (
      adapter.getCapabilities?.().conditionalTextWrite === true &&
      typeof adapter.writeTextIfUnchanged === "function"
    );
  }

  /** Persist only the caller's captured text version; never fall back to write. */
  modifyIfUnchanged(
    file: TFile,
    data: string,
    expected: string | null,
    options?: DataWriteOptions,
  ): Promise<void> {
    return this.mutateFile(file, () =>
      this.modifyIfUnchangedNow(file, data, expected, options),
    );
  }

  private async modifyIfUnchangedNow(
    file: TFile,
    data: string,
    expected: string | null,
    options?: DataWriteOptions,
  ): Promise<void> {
    if (!this.supportsConditionalTextWrites)
      throw new Error("Conditional text writes are unavailable");
    if (expected !== null && typeof expected !== "string")
      throw new Error("Invalid expected text snapshot");
    const path = file.path;
    await (this.adapter as VaultAdapter).writeTextIfUnchanged!(
      path,
      data,
      expected,
      options,
    );
    await this.#recordTextWrite(path, data, options);
  }

  #recordTextWrite(
    path: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    return this.adapter.stat(path).then((stat) => {
      if (!stat) {
        return Promise.reject(`Unable to write file: ${path}`);
      }
      const file = this.recordFile(path, stat);
      this.cache.put(file.path, data);
      this.dispatch("modify", file);
      this.dispatch("all", "modify", file, { data, options });
    });
  }

  /**
   * Modify the contents of a binary file.
   *
   * @param file - The file
   * @param data - The new file content
   * @param options - (Optional)
   * @public
   */
  modifyBinary(
    file: TFile,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    return this.mutateFile(file, () =>
      this.modifyBinaryNow(file, data, options),
    );
  }

  private modifyBinaryNow(
    file: TFile,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    if (!this.getFileByPath(file.path)) {
      return this.createBinaryNow(file.path, data, options).then(() => {});
    }
    const path = file.path;
    return this.adapter
      .writeBinary(file.path, data, options)
      .then(() => this.adapter.stat(path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to write file: ${path}`);
        }
        const file = this.recordFile(path, stat);
        this.cache.invalidate(path);
        this.dispatch("modify", file);
        this.dispatch("all", "modify", file, { data, options });
      });
  }

  /**
   * Atomically read, modify, and save the contents of a note.
   *
   * @example
   *   ```ts
   *   app.vault.process(file, (data) => {
   *    return data.replace('Hello', 'World');
   *   });
   *   ```;
   *
   * @param file - The file to be read and modified.
   * @param fn - A callback function which returns the new content of the note
   *   synchronously.
   * @param options - Write options.
   * @returns String - the text value of the note that was written.
   * @public
   */
  process(
    file: TFile,
    fn: (data: string) => string,
    options?: DataWriteOptions,
  ): Promise<string> {
    return this.mutateFile(file, () => this.processNow(file, fn, options));
  }

  private processNow(
    file: TFile,
    fn: (data: string) => string,
    options?: DataWriteOptions,
  ): Promise<string> {
    return this.adapter.process(file.path, fn, options).then(async (data) => {
      await this.#recordTextWrite(file.path, data, options);
      return data;
    });
  }

  append(file: TFile, data: string, options?: DataWriteOptions): Promise<void> {
    return this.mutateFile(file, () => this.appendNow(file, data, options));
  }

  private appendNow(
    file: TFile,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    return this.adapter
      .append(file.path, data, options)
      .then(() => this.adapter.stat(file.path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to append file: ${file.path}`);
        }
        const next = this.recordFile(file.path, stat);
        this.cache.invalidate(file.path);
        this.dispatch("modify", next);
        this.dispatch("all", "modify", next, { data, options });
      });
  }

  appendBinary(
    file: TFile,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    return this.mutateFile(file, () =>
      this.appendBinaryNow(file, data, options),
    );
  }

  private appendBinaryNow(
    file: TFile,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    return this.adapter
      .appendBinary(file.path, data, options)
      .then(() => this.adapter.stat(file.path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to append file: ${file.path}`);
        }
        const next = this.recordFile(file.path, stat);
        this.cache.invalidate(file.path);
        this.dispatch("modify", next);
        this.dispatch("all", "modify", next, { data, options });
      });
  }

  copy<T extends TAbstractFile>(file: T, newPath: string): Promise<T> {
    return this.mutateFile(file, () => this.copyNow(file, newPath));
  }

  private async copyNow<T extends TAbstractFile>(
    file: T,
    newPath: string,
  ): Promise<T> {
    newPath = this.getPath(newPath);
    await this.adapter.copy(file.path, newPath);
    await this.reconcileNow([], () => true, { originalPath: file.path });
    const copied = this.getAbstractFileByPath(newPath);
    if (!copied) {
      throw new Error(`Unable to copy file: ${file.path}`);
    }
    return copied as T;
  }

  /**
   * Get a file inside the vault at the given path. Returns `null` if the file
   * does not exist.
   *
   * @param path
   * @public
   */
  getFileByPath(path: string): TFile | null {
    path = this.getPath(path);
    const file = this.files[path];
    if (file instanceof TFile) {
      return file.copy();
    }
    return null;
  }

  /**
   * Get a folder inside the vault at the given path. Returns `null` if the
   * folder does not exist.
   *
   * @param path
   * @public
   */
  getFolderByPath(path: string): TFolder | null {
    path = this.getPath(path);
    const file = this.files[path];
    if (file instanceof TFolder) {
      return file.copy();
    }
    return null;
  }

  /**
   * Get a file or folder inside the vault at the given path. To check if the
   * return type is a file, use `instanceof TFile`. To check if it is a folder,
   * use `instanceof TFolder`.
   *
   * @param path - Vault absolute path to the folder or file, with extension,
   *   case sensitive.
   * @returns The abstract file, if it's found.
   * @public
   */
  getAbstractFileByPath(path: string): TAbstractFile | null {
    path = this.getPath(path);
    return this.files[path]?.copy() ?? null;
  }

  /**
   * Get the root folder of the current vault.
   *
   * @public
   */
  getRoot(): TFolder {
    return (this.files["/"] as TFolder).copy();
  }

  getResourcePath(file: TFile): string {
    return this.adapter.getResourcePath(file.path);
  }

  getResourceUrl(file: TFile): Promise<string> {
    const adapter = this.adapter as DataAdapter & Partial<AsyncResourceAdapter>;
    if (adapter.getResourceUrl) {
      return adapter.getResourceUrl(file.path);
    }
    return Promise.resolve(this.getResourcePath(file));
  }

  revokeResourceUrl(url: string): void {
    const adapter = this.adapter as DataAdapter & Partial<AsyncResourceAdapter>;
    adapter.revokeResourceUrl?.(url);
  }

  getAllLoadedFiles(): TAbstractFile[] {
    return Object.values(this.files);
  }

  /**
   * Get all folders in the vault.
   *
   * @param includeRoot - Should the root folder (`/`) be returned
   * @public
   */
  getAllFolders(includeRoot?: boolean): TFolder[] {
    return Object.values(this.files).filter(
      (it) => it instanceof TFolder && (includeRoot || it.path !== "/"),
    ) as TFolder[];
  }

  /**
   * Get all files in the vault.
   *
   * @public
   */
  getFiles(): TFile[] {
    return Object.values(this.files).filter((it) => it instanceof TFile);
  }

  /**
   * Iterate loaded files without allocating a second vault-sized collection.
   * The traversal follows the existing folder tree and only retains iterator
   * state proportional to folder depth.
   *
   * @public
   */
  *iterateFiles(): IterableIterator<TFile> {
    const root = this.files["/"];
    if (!(root instanceof TFolder)) return;

    function* visit(folder: TFolder): IterableIterator<TFile> {
      for (const child of folder.children) {
        if (child instanceof TFile) yield child.copy();
        else if (child instanceof TFolder) yield* visit(child);
      }
    }

    yield* visit(root);
  }

  /**
   * Get all files matching a shared editor-association glob.
   *
   * Filename-only patterns match files in every folder. Patterns containing a
   * slash match normalized vault-relative paths. Invalid patterns return no
   * files.
   *
   * @public
   */
  getFilesByGlob(pattern: string, options: VaultGlobOptions = {}): TFile[] {
    const normalizedPattern = normalizeEditorAssociationGlob(pattern);
    if (!validateEditorAssociationGlob(normalizedPattern).valid) return [];

    const paths = new Set<string>();
    if (!normalizedPattern.includes("/")) {
      if (
        options.caseSensitive === true &&
        !hasEditorAssociationGlobMagic(normalizedPattern)
      ) {
        for (const path of this.filesByName.get(normalizedPattern) ?? []) {
          paths.add(path);
        }
      } else {
        for (const [name, matchingPaths] of this.filesByName) {
          if (!matchesEditorAssociationGlob(normalizedPattern, name, options)) {
            continue;
          }
          for (const path of matchingPaths) paths.add(path);
        }
      }
    } else {
      for (const file of Object.values(this.files)) {
        if (
          file instanceof TFile &&
          matchesEditorAssociationGlob(normalizedPattern, file.path, options)
        ) {
          paths.add(file.path);
        }
      }
    }

    return [...paths]
      .map((path) => this.getFileByPath(path))
      .filter((file): file is TFile => Boolean(file))
      .sort((left, right) =>
        left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
      );
  }

  getMarkdownFiles(): TFile[] {
    return this.getFiles().filter((it) =>
      ["md", "markdown"].includes(it.extension.toLowerCase()),
    );
  }

  static recurseChildren(
    root: TFolder,
    cb: (file: TAbstractFile) => any,
  ): void {
    for (const child of root.children) {
      cb(child);
      if (child instanceof TFolder) {
        Vault.recurseChildren(child, cb);
      }
    }
  }
}
