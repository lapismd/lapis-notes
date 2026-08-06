import type { CachedMetadata, MetadataCache } from "./cache.svelte";
import type { App } from "./context.svelte";
import {
  inferMetadataPropertyType,
  inferMetadataType,
  normalizeMetadataValue,
} from "./metadata-value";
import { joinPath, type TFile } from "./storage";
import { debounce, get, has, set, unset } from "lodash-es";
import { onMount } from "svelte";

export interface IMetadataType {
  text: "text";
  checkbox: "checkbox";
  number: "number";
  multitext: "multitext";
  date: "date";
  datetime: "datetime";
  aliases: "aliases";
  tags: "tags";
  array: "array";
  object: "object";
  unknown: "unknown";
}

export type MetadataType = keyof IMetadataType;

function notifyMetadataTypeError(message: string) {
  const Notice = (globalThis as any).Notice;
  if (typeof Notice === "function") {
    new Notice(message);
  } else {
    console.warn(message);
  }
}

export interface MetadataTypeDef {
  name: string;
  type: MetadataType;
}

export interface MetadataTypeProperty extends MetadataTypeDef {
  count: number;
  files: Set<string>;
}

export interface MetadataRenameFailure {
  path: string;
  message: string;
}

export interface MetadataRenameResult {
  updatedFiles: string[];
  failedFiles: MetadataRenameFailure[];
}

export type MetadataBulkOperationFailure = MetadataRenameFailure;

export interface MetadataBulkOperationResult {
  updatedFiles: string[];
  failedFiles: MetadataBulkOperationFailure[];
}

export interface MetadataBulkOperationProgress {
  current: number;
  total: number;
  path: string;
}

export interface MetadataBulkOperationOptions {
  onProgress?: (progress: MetadataBulkOperationProgress) => void;
  signal?: AbortSignal;
}

export type TypeWidget = {
  default: (value?: unknown) => any;
  icon: string;
  name: string;
  type: MetadataType;
  validate: (value: unknown) => boolean;
  render: (
    el: HTMLElement,
    props: {
      type: MetadataTypeDef;
      value: any;
      onChange: (type: MetadataTypeDef, value: any, event: Event) => void;
    },
  ) => void;
};

export class MetadataTypeManager {
  readonly types: Record<string, MetadataTypeDef> = $state({});
  readonly registeredTypeWidgets: Record<string, TypeWidget> = $state({});
  readonly properties: Record<string, MetadataTypeProperty> = $state({});
  private readonly filePropertyPaths = new Map<string, Set<string>>();

  constructor(readonly app: App) {
    onMount(() => {
      const handler = this.app.vault.on("load", () => this.load());
      const metadataHandler = this.app.metadataCache.on("loaded", () =>
        this.updateProperties(),
      );
      return () => {
        this.app.vault.offref(handler);
        this.app.metadataCache.offref(metadataHandler);
      };
    });
    this.load();
  }

  getAllProperties() {
    return { ...this.properties };
  }

  updateProperties() {
    for (const [file, cache] of this.app.metadataCache
      .getAllItems()
      .entries()) {
      this.processChange(file, cache);
    }
  }

  load() {
    const promises: Array<Promise<unknown>> = [];
    const file = this.app.vault.getFileByPath(
      joinPath(this.app.props.configPath, "../", "types.json"),
    );
    if (file) {
      promises.push(
        this.app.vault.read(file).then((data) => {
          try {
            const typeData = JSON.parse(data) as {
              types: Record<string, string>;
            };
            if ("types" in typeData) {
              for (const [key, value] of Object.entries(typeData.types)) {
                this.types[key] = { name: key, type: value as MetadataType };
                this.properties[key] = {
                  name: key,
                  type: value as MetadataType,
                  count: 0,
                  files: new Set(),
                };
              }
            }
          } catch (e) {
            notifyMetadataTypeError(`Failed to load types.json: ${e}`);
          }
        }),
      );
    }
    return Promise.all(promises).then(() => {
      this.updateProperties();
    });
  }

  readonly save = debounce(() => {
    const file = this.app.vault.getFileByPath(
      joinPath(this.app.props.configPath, "../", "types.json"),
    );
    if (file) {
      return this.app.vault.modify(
        file,
        JSON.stringify(this.toJSON(), null, 2),
      );
    }
  }, 500);

  toJSON() {
    const types: Record<string, string> = {};
    Object.values(this.types).forEach((t) => {
      types[t.name] = t.type;
    });
    return {
      types,
    };
  }

  setType(field: string, type: MetadataType) {
    this.types[field] = { name: field, type };
    this.properties[field] ||= {
      name: field,
      type,
      count: 0,
      files: new Set(),
    };
    if (this.properties[field]) {
      this.properties[field].type = type;
    }
    this.save();
  }

  registerTypeWidget(widget: TypeWidget) {
    this.registeredTypeWidgets[widget.type] = widget;
  }

  unregisterTypeWidget(widget: TypeWidget) {
    delete this.registeredTypeWidgets[widget.type];
  }

  private collectPropertyEntries(
    value: unknown,
    path: string,
    entries: Array<{ path: string; value: unknown; topLevel: boolean }>,
    topLevel = false,
  ) {
    entries.push({ path, value, topLevel });

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        this.collectPropertyEntries(item, `${path}[${index}]`, entries);
      });
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      this.collectPropertyEntries(child, `${path}.${key}`, entries);
    }
  }

  private getEntriesForFrontmatter(
    frontmatter: CachedMetadata["frontmatter"],
  ): Array<{ path: string; value: unknown; topLevel: boolean }> {
    const entries: Array<{ path: string; value: unknown; topLevel: boolean }> =
      [];
    if (!frontmatter || typeof frontmatter !== "object") {
      return entries;
    }

    for (const [key, value] of Object.entries(frontmatter)) {
      this.collectPropertyEntries(value, key, entries, true);
    }

    return entries;
  }

  private getFrontmatterPropertyValue(
    frontmatter: CachedMetadata["frontmatter"],
    path: string,
  ): { found: boolean; topLevel: boolean; value: unknown } {
    if (!frontmatter || typeof frontmatter !== "object") {
      return { found: false, topLevel: false, value: undefined };
    }

    if (Object.prototype.hasOwnProperty.call(frontmatter, path)) {
      return {
        found: true,
        topLevel: true,
        value: frontmatter[path],
      };
    }

    if (has(frontmatter, path)) {
      return {
        found: true,
        topLevel: false,
        value: get(frontmatter, path),
      };
    }

    return { found: false, topLevel: false, value: undefined };
  }

  private refreshProperty(path: string) {
    const existing = this.properties[path];
    const files = existing?.files ?? new Set<string>();

    if (!files.size) {
      if (this.types[path]) {
        this.properties[path] = {
          name: path,
          type: this.types[path].type,
          count: 0,
          files: new Set(),
        };
      } else {
        delete this.properties[path];
      }
      return;
    }

    let type = this.types[path]?.type;
    if (!type) {
      let inferredType: MetadataType | null = null;
      for (const filePath of files) {
        const cache = this.app.metadataCache.getCache(filePath);
        const value = this.getFrontmatterPropertyValue(
          cache?.frontmatter,
          path,
        );
        if (!value.found) {
          continue;
        }

        const nextType = value.topLevel
          ? this.determinePropertyType(path, value.value)
          : this.determineType(value.value);
        if (inferredType === null) {
          inferredType = nextType;
          continue;
        }

        if (inferredType !== nextType) {
          inferredType = "unknown";
          break;
        }
      }

      type = inferredType ?? existing?.type ?? "unknown";
    }

    this.properties[path] = {
      name: path,
      type,
      count: files.size,
      files,
    };
  }

  private syncFileProperties(file: TFile, cache: CachedMetadata) {
    const previousPaths = this.filePropertyPaths.get(file.path) ?? new Set();
    const nextEntries = this.getEntriesForFrontmatter(cache.frontmatter);
    const nextPaths = new Set(nextEntries.map((entry) => entry.path));

    for (const path of previousPaths) {
      if (nextPaths.has(path)) {
        continue;
      }

      const property = this.properties[path];
      if (!property) {
        continue;
      }

      property.files.delete(file.path);
      this.refreshProperty(path);
    }

    for (const entry of nextEntries) {
      this.properties[entry.path] ||= {
        name: entry.path,
        type:
          this.types[entry.path]?.type ??
          (entry.topLevel
            ? this.determinePropertyType(entry.path, entry.value)
            : this.determineType(entry.value)),
        count: 0,
        files: new Set(),
      };
      this.properties[entry.path]!.files.add(file.path);
      this.refreshProperty(entry.path);
    }

    if (nextPaths.size) {
      this.filePropertyPaths.set(file.path, nextPaths);
    } else {
      this.filePropertyPaths.delete(file.path);
    }
  }

  private getFilesForProperty(path: string): Set<string> {
    const files = new Set(this.properties[path]?.files ?? []);
    if (files.size) {
      return files;
    }

    for (const [file, cache] of this.app.metadataCache.getAllItems()) {
      if (cache.frontmatter && has(cache.frontmatter, path)) {
        files.add(file.path);
      }
    }

    return files;
  }

  private getFilesForTopLevelProperty(path: string): Set<string> {
    const files = new Set<string>();

    for (const [file, cache] of this.app.metadataCache.getAllItems()) {
      if (
        cache.frontmatter &&
        typeof cache.frontmatter === "object" &&
        Object.prototype.hasOwnProperty.call(cache.frontmatter, path)
      ) {
        files.add(file.path);
      }
    }

    return files;
  }

  private reportBulkProgress(
    options: MetadataBulkOperationOptions | undefined,
    current: number,
    total: number,
    path: string,
  ) {
    options?.onProgress?.({ current, total, path });
  }

  private throwIfBulkCancelled(options?: MetadataBulkOperationOptions) {
    if (options?.signal?.aborted) {
      throw new Error("Operation cancelled");
    }
  }

  rename(prevId: string, newId: string): Promise<MetadataRenameResult> {
    if (prevId === newId) {
      return Promise.resolve({ updatedFiles: [], failedFiles: [] });
    }

    const files = this.getFilesForProperty(prevId);
    if (!files.size && !this.types[prevId]) {
      return Promise.reject(new Error(`Unable to find property: ${prevId}`));
    }

    return this.renameProperty(files, prevId, newId);
  }

  renameProperty(
    files: Set<string>,
    prevId: string,
    newId: string,
  ): Promise<MetadataRenameResult> {
    const updatedFiles: string[] = [];
    const failedFiles: MetadataRenameFailure[] = [];

    const tasks = [...files].map(async (path) => {
      const file = this.app.vault.getFileByPath(path);
      if (!file) {
        failedFiles.push({ path, message: "File no longer exists" });
        return;
      }

      try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
          if (!has(frontmatter, prevId)) {
            return;
          }

          if (prevId !== newId && has(frontmatter, newId)) {
            throw new Error(`Property \"${newId}\" already exists`);
          }

          const existingValue = get(frontmatter, prevId);
          unset(frontmatter, prevId);
          set(frontmatter, newId, existingValue);
        });
        updatedFiles.push(path);
      } catch (error) {
        failedFiles.push({
          path,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });

    return Promise.all(tasks).then(() => {
      if (!failedFiles.length) {
        if (this.types[prevId]) {
          this.types[newId] = { ...this.types[prevId], name: newId };
          delete this.types[prevId];
          this.save();
        }

        if (this.properties[prevId]) {
          const renamed = this.properties[prevId];
          delete this.properties[prevId];
          this.properties[newId] = {
            name: newId,
            type: this.types[newId]?.type ?? renamed.type,
            count: renamed.files.size,
            files: new Set(renamed.files),
          };
        }
      }

      return { updatedFiles, failedFiles };
    });
  }

  async renameTopLevelProperty(
    prevId: string,
    newId: string,
    options?: MetadataBulkOperationOptions,
  ): Promise<MetadataBulkOperationResult> {
    if (prevId === newId) {
      return { updatedFiles: [], failedFiles: [] };
    }

    const files = [...this.getFilesForTopLevelProperty(prevId)];
    if (!files.length && !this.types[prevId]) {
      throw new Error(`Unable to find property: ${prevId}`);
    }

    const updatedFiles: string[] = [];
    const failedFiles: MetadataBulkOperationFailure[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const path = files[index]!;
      this.throwIfBulkCancelled(options);
      this.reportBulkProgress(options, index, files.length, path);

      const file = this.app.vault.getFileByPath(path);
      if (!file) {
        failedFiles.push({ path, message: "File no longer exists" });
        continue;
      }

      try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
          if (!Object.prototype.hasOwnProperty.call(frontmatter, prevId)) {
            return;
          }

          if (
            prevId !== newId &&
            Object.prototype.hasOwnProperty.call(frontmatter, newId)
          ) {
            throw new Error(`Property "${newId}" already exists`);
          }

          const existingValue = frontmatter[prevId];
          delete frontmatter[prevId];
          frontmatter[newId] = existingValue;
        });
        updatedFiles.push(path);
      } catch (error) {
        failedFiles.push({
          path,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.reportBulkProgress(
      options,
      files.length,
      files.length,
      files.at(-1) ?? prevId,
    );

    if (!failedFiles.length) {
      if (this.types[prevId]) {
        this.types[newId] = { ...this.types[prevId], name: newId };
        delete this.types[prevId];
        this.save();
      }
      this.reload();
    }

    return { updatedFiles, failedFiles };
  }

  async deleteTopLevelProperty(
    path: string,
    options?: MetadataBulkOperationOptions,
  ): Promise<MetadataBulkOperationResult> {
    const files = [...this.getFilesForTopLevelProperty(path)];
    const updatedFiles: string[] = [];
    const failedFiles: MetadataBulkOperationFailure[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const filePath = files[index]!;
      this.throwIfBulkCancelled(options);
      this.reportBulkProgress(options, index, files.length, filePath);

      const file = this.app.vault.getFileByPath(filePath);
      if (!file) {
        failedFiles.push({ path: filePath, message: "File no longer exists" });
        continue;
      }

      try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
          if (Object.prototype.hasOwnProperty.call(frontmatter, path)) {
            delete frontmatter[path];
          }
        });
        updatedFiles.push(filePath);
      } catch (error) {
        failedFiles.push({
          path: filePath,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.reportBulkProgress(
      options,
      files.length,
      files.length,
      files.at(-1) ?? path,
    );

    if (!failedFiles.length) {
      delete this.types[path];
      delete this.properties[path];
      this.save();
      this.reload();
    }

    return { updatedFiles, failedFiles };
  }

  async deleteProperty(
    path: string,
    options?: MetadataBulkOperationOptions,
  ): Promise<MetadataBulkOperationResult> {
    const files = [...this.getFilesForProperty(path)];
    const updatedFiles: string[] = [];
    const failedFiles: MetadataBulkOperationFailure[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const filePath = files[index]!;
      this.throwIfBulkCancelled(options);
      this.reportBulkProgress(options, index, files.length, filePath);

      const file = this.app.vault.getFileByPath(filePath);
      if (!file) {
        failedFiles.push({ path: filePath, message: "File no longer exists" });
        continue;
      }

      try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
          if (has(frontmatter, path)) {
            unset(frontmatter, path);
          }
        });
        updatedFiles.push(filePath);
      } catch (error) {
        failedFiles.push({
          path: filePath,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.reportBulkProgress(
      options,
      files.length,
      files.length,
      files.at(-1) ?? path,
    );

    if (!failedFiles.length) {
      delete this.types[path];
      delete this.properties[path];
      this.save();
      this.reload();
    }

    return { updatedFiles, failedFiles };
  }

  async setTopLevelPropertyType(
    path: string,
    type: MetadataType,
    options?: MetadataBulkOperationOptions,
  ): Promise<MetadataBulkOperationResult> {
    const files = [...this.getFilesForTopLevelProperty(path)];
    const updatedFiles: string[] = [];
    const failedFiles: MetadataBulkOperationFailure[] = [];

    this.types[path] = { name: path, type };
    this.properties[path] ||= {
      name: path,
      type,
      count: 0,
      files: new Set(),
    };
    this.properties[path]!.type = type;

    for (let index = 0; index < files.length; index += 1) {
      const filePath = files[index]!;
      this.throwIfBulkCancelled(options);
      this.reportBulkProgress(options, index, files.length, filePath);

      const file = this.app.vault.getFileByPath(filePath);
      if (!file) {
        failedFiles.push({ path: filePath, message: "File no longer exists" });
        continue;
      }

      try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
          if (!Object.prototype.hasOwnProperty.call(frontmatter, path)) {
            return;
          }
          frontmatter[path] = normalizeMetadataValue(type, frontmatter[path]);
        });
        updatedFiles.push(filePath);
      } catch (error) {
        failedFiles.push({
          path: filePath,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.reportBulkProgress(
      options,
      files.length,
      files.length,
      files.at(-1) ?? path,
    );
    this.save();
    this.reload();

    return { updatedFiles, failedFiles };
  }

  async setPropertyType(
    path: string,
    type: MetadataType,
    options?: MetadataBulkOperationOptions,
  ): Promise<MetadataBulkOperationResult> {
    const files = [...this.getFilesForProperty(path)];
    const updatedFiles: string[] = [];
    const failedFiles: MetadataBulkOperationFailure[] = [];

    this.types[path] = { name: path, type };
    this.properties[path] ||= {
      name: path,
      type,
      count: 0,
      files: new Set(),
    };
    this.properties[path]!.type = type;

    for (let index = 0; index < files.length; index += 1) {
      const filePath = files[index]!;
      this.throwIfBulkCancelled(options);
      this.reportBulkProgress(options, index, files.length, filePath);

      const file = this.app.vault.getFileByPath(filePath);
      if (!file) {
        failedFiles.push({ path: filePath, message: "File no longer exists" });
        continue;
      }

      try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
          if (!has(frontmatter, path)) {
            return;
          }
          set(
            frontmatter,
            path,
            normalizeMetadataValue(type, get(frontmatter, path)),
          );
        });
        updatedFiles.push(filePath);
      } catch (error) {
        failedFiles.push({
          path: filePath,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.reportBulkProgress(
      options,
      files.length,
      files.length,
      files.at(-1) ?? path,
    );
    this.save();
    this.reload();

    return { updatedFiles, failedFiles };
  }

  processChange(file: TFile, cache: CachedMetadata) {
    this.syncFileProperties(file, cache);
  }

  getValues(key: string): unknown[] {
    const values = new Set();
    if (this.properties[key]) {
      for (const path of this.properties[key].files) {
        const cache = this.app.metadataCache.getCache(path);
        if (cache?.frontmatter && has(cache.frontmatter, key)) {
          values.add(get(cache.frontmatter, key));
        }
      }
    }
    return [...values];
  }

  processDelete(file: TFile) {
    const paths = this.filePropertyPaths.get(file.path);
    if (!paths) {
      return;
    }

    for (const path of paths) {
      if (this.properties[path]?.files.delete(file.path)) {
        this.refreshProperty(path);
      }
    }

    this.filePropertyPaths.delete(file.path);
  }

  trackChanges() {
    const changeHandler = this.app.metadataCache.on(
      "changed",
      (file, data, cache) => {
        this.processChange(file, cache);
      },
    );
    const deleteHandler = this.app.metadataCache.on("deleted", (file) => {
      this.processDelete(file);
    });
    const loadHandler = this.app.metadataCache.on("loaded", () => {
      this.reload();
    });
    return () => {
      this.app.metadataCache.offref(changeHandler);
      this.app.metadataCache.offref(deleteHandler);
      this.app.metadataCache.offref(loadHandler);
    };
  }

  reload() {
    this.filePropertyPaths.clear();

    for (const path of Object.keys(this.properties)) {
      if (this.types[path]) {
        this.properties[path] = {
          name: path,
          type: this.types[path].type,
          count: 0,
          files: new Set(),
        };
      } else {
        delete this.properties[path];
      }
    }

    for (const path of Object.keys(this.app.metadataCache.fileCache)) {
      const cache = this.app.metadataCache.getCache(path);
      const file = this.app.vault.getFileByPath(path);
      if (file && cache) {
        this.processChange(file, cache);
      }
    }
  }

  determineType(value: unknown): MetadataType {
    return inferMetadataType(value);
  }

  determinePropertyType(name: string, value: unknown): MetadataType {
    return inferMetadataPropertyType(name, value);
  }
}
