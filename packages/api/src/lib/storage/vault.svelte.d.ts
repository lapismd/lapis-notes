import { EventDispatcher } from "$lib/events";
import { FileCache, TFile, TFolder, type DataAdapter, type DataWriteOptions, type TAbstractFile } from "./fs";
export declare const ENOTDIR: {
    new (...args: any[]): {
        code: string;
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
/**
 * High-level file-system facade for the active vault.
 *
 * `Vault` wraps a {@link DataAdapter}, maintains the in-memory file tree used by
 * the workspace, and emits Obsidian-style file lifecycle events.
 *
 * @public
 */
export declare class Vault extends EventDispatcher<{
    load: [];
    create: [file: TAbstractFile];
    modify: [file: TAbstractFile];
    delete: [file: TAbstractFile];
    rename: [file: TAbstractFile, oldPath: string];
    all: [event: string, file: TAbstractFile, context: Record<string, unknown>];
}> {
    #private;
    readonly adapter: DataAdapter;
    private files;
    configDir: string;
    readonly cache: FileCache;
    constructor(adapter: DataAdapter);
    private getPath;
    getName(): string;
    exists(path: string, sensitive?: boolean): Promise<boolean>;
    stat(path: string): Promise<import("./fs").Stat | null>;
    list(path?: string): Promise<import("./fs").ListedFiles>;
    load(): Promise<void>;
    reload(): Promise<TFolder>;
    loadPath(basePath?: string, sourceFiles?: Record<string, TAbstractFile>): Promise<Record<string, TAbstractFile>>;
    /**
     * Create a new plaintext file inside the vault.
     *
     * @param path - Vault absolute path for the new file, with extension.
     * @param data - Text content for the new file.
     * @param options - (Optional)
     * @public
     */
    create(path: string, data: string, options?: DataWriteOptions): Promise<TFile>;
    /**
     * Create a new binary file inside the vault.
     *
     * @param path - Vault absolute path for the new file, with extension.
     * @param data - Content for the new file.
     * @param options - (Optional)
     * @throws Error if file already exists
     * @public
     */
    createBinary(path: string, data: ArrayBuffer, options?: DataWriteOptions): Promise<TFile>;
    /**
     * Create a new folder inside the vault.
     *
     * @param path - Vault absolute path for the new folder.
     * @throws Error if folder already exists
     * @public
     */
    createFolder(path: string): Promise<TFolder>;
    mkpath(path: string): Promise<TFolder>;
    /**
     * Deletes the file completely.
     *
     * @param file - The file or folder to be deleted
     * @param force - Should attempt to delete folder even if it has hidden
     *   children
     * @public
     */
    delete(file: TAbstractFile, force?: boolean): Promise<void>;
    trash(file: TAbstractFile, system?: boolean): Promise<void>;
    /**
     * Read a plaintext file that is stored inside the vault, directly from disk.
     * Use this if you intend to modify the file content afterwards. Use
     * {@link Vault.cachedRead} otherwise for better performance.
     *
     * @public
     */
    read(file: TFile): Promise<string>;
    /**
     * Read the content of a plaintext file stored inside the vault Use this if
     * you only want to display the content to the user. If you want to modify the
     * file content afterward use {@link Vault.read}
     *
     * @public
     */
    cachedRead(file: TFile): Promise<string>;
    /**
     * Read the content of a binary file stored inside the vault.
     *
     * @public
     */
    readBinary(file: TFile): Promise<ArrayBuffer>;
    /**
     * Rename or move a file. To ensure links are automatically renamed, use
     * {@link FileManager.renameFile} instead.
     *
     * @param file - The file to rename/move
     * @param newPath - Vault absolute path to move file to.
     * @public
     */
    rename(file: TAbstractFile, newPath: string): Promise<void>;
    /**
     * Modify the contents of a plaintext file.
     *
     * @param file - The file
     * @param data - The new file content
     * @param options - (Optional)
     * @public
     */
    modify(file: TFile, data: string, options?: DataWriteOptions): Promise<void>;
    /**
     * Modify the contents of a binary file.
     *
     * @param file - The file
     * @param data - The new file content
     * @param options - (Optional)
     * @public
     */
    modifyBinary(file: TFile, data: ArrayBuffer, options?: DataWriteOptions): Promise<void>;
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
    process(file: TFile, fn: (data: string) => string, options?: DataWriteOptions): Promise<string>;
    append(file: TFile, data: string, options?: DataWriteOptions): Promise<void>;
    appendBinary(file: TFile, data: ArrayBuffer, options?: DataWriteOptions): Promise<void>;
    copy<T extends TAbstractFile>(file: T, newPath: string): Promise<T>;
    /**
     * Get a file inside the vault at the given path. Returns `null` if the file
     * does not exist.
     *
     * @param path
     * @public
     */
    getFileByPath(path: string): TFile | null;
    /**
     * Get a folder inside the vault at the given path. Returns `null` if the
     * folder does not exist.
     *
     * @param path
     * @public
     */
    getFolderByPath(path: string): TFolder | null;
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
    getAbstractFileByPath(path: string): TAbstractFile | null;
    /**
     * Get the root folder of the current vault.
     *
     * @public
     */
    getRoot(): TFolder;
    getResourcePath(file: TFile): string;
    getResourceUrl(file: TFile): Promise<string>;
    revokeResourceUrl(url: string): void;
    getAllLoadedFiles(): TAbstractFile[];
    /**
     * Get all folders in the vault.
     *
     * @param includeRoot - Should the root folder (`/`) be returned
     * @public
     */
    getAllFolders(includeRoot?: boolean): TFolder[];
    /**
     * Get all files in the vault.
     *
     * @public
     */
    getFiles(): TFile[];
    getMarkdownFiles(): TFile[];
    static recurseChildren(root: TFolder, cb: (file: TAbstractFile) => any): void;
}
