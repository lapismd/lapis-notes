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
  type DataAdapter,
  type DataWriteOptions,
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
  public configDir: string = ".obsidian";
  readonly cache = new FileCache(1024);

  constructor(readonly adapter: DataAdapter) {
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
    const files = {};
    return this.loadPath("/", files).then(() => {
      this.files = files;
      this.rebuildFileNameIndex();
      this.trigger("load");
      return this.getRoot();
    });
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
    path = this.getPath(path);
    const file = this.getFileByPath(path);
    if (file) {
      return this.modify(file, data, options).then(() => file);
    }
    return this.adapter
      .write(path, data, options)
      .then(() => this.adapter.stat(path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to write file: ${path}`);
        }
        let parent = this.files[dirname(path)] as TFolder;
        const file = new TFile(path, stat, parent, this);
        this.files[path] = file;
        this.addToFileNameIndex(file);
        this.cache.put(path, data);
        parent.children.push(file);
        this.dispatch("create", file);
        this.dispatch("all", "create", file, {});
        return file;
      });
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
    path = this.getPath(path);
    return this.adapter
      .writeBinary(path, data, options)
      .then(() => this.adapter.stat(path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to write file: ${path}`);
        }
        let parent = this.files[dirname(path)] as TFolder;
        const file = new TFile(path, stat, parent, this);
        this.files[path] = file;
        this.addToFileNameIndex(file);
        parent.children.push(file);
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
  async createFolder(path: string): Promise<TFolder> {
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
  delete(file: TAbstractFile, force?: boolean): Promise<void> {
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
      this.dispatch("all", "delete", file, { force });
    });
  }

  trash(file: TAbstractFile, system: boolean = true): Promise<void> {
    const trash = system
      ? this.adapter.trashSystem(file.path)
      : Promise.resolve(false);
    return trash.then((handled) => {
      if (handled) {
        return this.delete(file, true);
      }
      return this.adapter.trashLocal(file.path).then(async () => {
        await this.reload();
        this.dispatch("delete", file);
        this.dispatch("all", "delete", file, { system });
      });
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

  /**
   * Rename or move a file. To ensure links are automatically renamed, use
   * {@link FileManager.renameFile} instead.
   *
   * @param file - The file to rename/move
   * @param newPath - Vault absolute path to move file to.
   * @public
   */
  rename(file: TAbstractFile, newPath: string): Promise<void> {
    newPath = this.getPath(newPath);
    if (file.path == newPath) {
      return Promise.resolve();
    }
    const oldPath = file.path;

    const paths = new Set<string>();
    if (file instanceof TFile) {
      paths.add(file.parent?.path ?? "/");
      paths.add(dirname(newPath));
    } else {
      paths.add(file.path);
      paths.add(newPath);
    }

    return this.adapter.rename(file.path, newPath).then(async () => {
      this.files = await this.loadPath("/", {});
      this.rebuildFileNameIndex();
      let newFile = this.getAbstractFileByPath(newPath);
      if (newFile) {
        this.cache.rename(file.path, newFile.path);
        this.dispatch("rename", newFile, oldPath);
        this.dispatch("all", "rename", file, { oldPath });
      } else {
        console.warn(`Failed to rename file: ${file.path}`);
      }
    });
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
    if (!this.getFileByPath(file.path)) {
      return this.create(file.path, data, options).then(() => {});
    }
    const path = file.path;
    return this.adapter
      .write(path, data, options)
      .then(() => this.adapter.stat(path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to write file: ${path}`);
        }
        let parent = this.files[dirname(path)] as TFolder;
        const file = new TFile(path, stat, parent, this);
        this.files[path] = file;
        this.cache.put(path, data);

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
    if (!this.getFileByPath(file.path)) {
      return this.createBinary(file.path, data, options).then(() => {});
    }
    const path = file.path;
    return this.adapter
      .writeBinary(file.path, data, options)
      .then(() => this.adapter.stat(path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to write file: ${path}`);
        }
        let parent = this.files[dirname(path)] as TFolder;
        const file = new TFile(path, stat, parent, this);
        this.files[path] = file;
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
    return this.adapter.process(file.path, fn, options).then((data) => {
      this.cache.put(file.path, data);
      this.dispatch("modify", file);
      this.dispatch("all", "modify", file, { data, options });
      return data;
    });
  }

  append(file: TFile, data: string, options?: DataWriteOptions): Promise<void> {
    return this.adapter
      .append(file.path, data, options)
      .then(() => this.adapter.stat(file.path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to append file: ${file.path}`);
        }
        const parent = this.files[dirname(file.path)] as TFolder;
        const next = new TFile(file.path, stat, parent, this);
        this.files[file.path] = next;
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
    return this.adapter
      .appendBinary(file.path, data, options)
      .then(() => this.adapter.stat(file.path))
      .then((stat) => {
        if (!stat) {
          return Promise.reject(`Unable to append file: ${file.path}`);
        }
        const parent = this.files[dirname(file.path)] as TFolder;
        const next = new TFile(file.path, stat, parent, this);
        this.files[file.path] = next;
        this.cache.invalidate(file.path);
        this.dispatch("modify", next);
        this.dispatch("all", "modify", next, { data, options });
      });
  }

  async copy<T extends TAbstractFile>(file: T, newPath: string): Promise<T> {
    newPath = this.getPath(newPath);
    await this.adapter.copy(file.path, newPath);
    await this.reload();
    const copied = this.getAbstractFileByPath(newPath);
    if (!copied) {
      throw new Error(`Unable to copy file: ${file.path}`);
    }
    this.dispatch("create", copied);
    this.dispatch("all", "create", copied, { originalPath: file.path });
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
   * Get all files matching a shared editor-association glob.
   *
   * Filename-only patterns match files in every folder. Patterns containing a
   * slash match normalized vault-relative paths. Invalid patterns return no
   * files.
   *
   * @public
   */
  getFilesByGlob(
    pattern: string,
    options: VaultGlobOptions = {},
  ): TFile[] {
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
