import type { CachedMetadata, MetadataCache } from "./cache.svelte";
import type { App } from "./context.svelte";
import {
  inferMetadataPropertyType,
  inferMetadataType,
  normalizeMetadataValue,
} from "./metadata-value";
import {
  joinPath,
  type AppDatabaseMetadataFacetRow,
  type TFile,
} from "./storage";
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
  readonly topLevelPropertyNames: Set<string> = $state(new Set());
  readonly propertyValues: Record<string, unknown[]> = $state({});
  propertiesLoading = $state(false);
  queryError = $state<string | null>(null);
  private propertiesGeneration = 0;
  private readonly valueGenerations = new Map<string, number>();
  private readonly schedulePropertiesRefresh = debounce(
    () => void this.updateProperties(),
    50,
  );

  constructor(readonly app: App) {
    onMount(() => {
      const handler = this.app.vault.on("load", () => this.load());
      const metadataHandler = this.app.metadataCache.on("loaded", () =>
        void this.updateProperties(),
      );
      const indexHandler = this.app.metadataCache.on("index-changed", (change) => {
        if (!change.reset && !change.domains.includes("metadata")) return;
        for (const key of Object.keys(this.propertyValues)) delete this.propertyValues[key];
        this.schedulePropertiesRefresh();
      });
      return () => {
        this.app.vault.offref(handler);
        this.app.metadataCache.offref(metadataHandler);
        this.app.metadataCache.offref(indexHandler);
        this.schedulePropertiesRefresh.cancel();
      };
    });
    this.load();
  }

  getAllProperties() {
    return { ...this.properties };
  }

  async updateProperties(): Promise<void> {
    const generation = ++this.propertiesGeneration;
    this.propertiesLoading = true;
    this.queryError = null;
    let topLevel: AppDatabaseMetadataFacetRow[];
    let paths: AppDatabaseMetadataFacetRow[];
    try {
      [topLevel, paths] = await Promise.all([
        this.app.metadataCache.queryFacets({
          kind: "property-name",
          limit: 10_000,
        }),
        this.app.metadataCache.queryFacets({
          kind: "property-path",
          limit: 20_000,
        }),
      ]);
      if (generation !== this.propertiesGeneration) return;
    } catch (error) {
      if (generation === this.propertiesGeneration) {
        this.queryError = error instanceof Error ? error.message : String(error);
      }
      return;
    } finally {
      if (generation === this.propertiesGeneration) {
        this.propertiesLoading = false;
      }
    }

    const next = new Map<string, MetadataTypeProperty>();
    for (const row of paths) {
      if (typeof row.value !== "string") continue;
      next.set(row.value, this.propertyFromFacet(row));
    }
    for (const row of topLevel) {
      if (typeof row.value !== "string") continue;
      next.set(row.value, this.propertyFromFacet(row));
    }
    for (const [name, definition] of Object.entries(this.types)) {
      next.set(
        name,
        next.get(name) ?? {
          name,
          type: definition.type,
          count: 0,
          files: new Set(),
        },
      );
    }

    for (const name of Object.keys(this.properties)) {
      if (!next.has(name)) delete this.properties[name];
    }
    for (const [name, property] of next) this.properties[name] = property;
    this.topLevelPropertyNames.clear();
    for (const row of topLevel) {
      if (typeof row.value === "string") this.topLevelPropertyNames.add(row.value);
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
    return Promise.all(promises).then(async () => {
      await this.updateProperties();
    });
  }

  private propertyFromFacet(
    row: AppDatabaseMetadataFacetRow,
  ): MetadataTypeProperty {
    const name = String(row.value);
    const observed = new Set(
      (row.metadataTypes ?? []).map((type) => this.normalizeIndexedType(name, type)),
    );
    observed.delete("unknown");
    return {
      name,
      type:
        this.types[name]?.type ??
        (observed.size === 1 ? [...observed][0]! : observed.size > 1 ? "unknown" : "unknown"),
      count: row.count,
      files: new Set(),
    };
  }

  private normalizeIndexedType(name: string, type: string): MetadataType {
    const normalizedName = name.toLowerCase();
    if (normalizedName === "tags" || normalizedName === "tag") return "tags";
    if (normalizedName === "aliases" || normalizedName === "alias") return "aliases";
    if ((["text", "number", "array", "object", "date", "datetime", "multitext", "unknown"] as string[]).includes(type)) {
      return type as MetadataType;
    }
    if (type === "string") return "text";
    if (type === "boolean") return "checkbox";
    if (type === "null") return "unknown";
    return type === "checkbox" ? "checkbox" : "unknown";
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

  private async getFilesForProperty(path: string): Promise<Set<string>> {
    const files = new Set<string>();
    let cursor: string | undefined;
    do {
      const page = await this.app.metadataCache.queryMetadataPage({
        after: cursor,
        limit: 500,
        query: {
          propertyFilters: [{ name: path, op: "exists" }],
        },
      });
      for (const row of page.rows) files.add(row.file.path);
      cursor = page.nextCursor;
    } while (cursor);
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

  async rename(prevId: string, newId: string): Promise<MetadataRenameResult> {
    if (prevId === newId) {
      return { updatedFiles: [], failedFiles: [] };
    }

    const files = await this.getFilesForProperty(prevId);
    if (!files.size && !this.types[prevId]) {
      throw new Error(`Unable to find property: ${prevId}`);
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
            count: renamed.count,
            files: new Set(),
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

    const files = [...(await this.getFilesForProperty(prevId))];
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
    const files = [...(await this.getFilesForProperty(path))];
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
    const files = [...(await this.getFilesForProperty(path))];
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
    const files = [...(await this.getFilesForProperty(path))];
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
    const files = [...(await this.getFilesForProperty(path))];
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
    void file;
    void cache;
    this.schedulePropertiesRefresh();
  }

  getValues(key: string): unknown[] {
    if (!this.propertyValues[key]) void this.getValuesAsync(key);
    return [...(this.propertyValues[key] ?? [])];
  }

  async getValuesAsync(key: string, limit = 1_000): Promise<unknown[]> {
    const generation = (this.valueGenerations.get(key) ?? 0) + 1;
    this.valueGenerations.set(key, generation);
    let rows: AppDatabaseMetadataFacetRow[];
    try {
      rows = await this.app.metadataCache.queryFacets({
        kind: "property-value",
        propertyName: key,
        limit,
      });
    } catch (error) {
      if (this.valueGenerations.get(key) === generation) {
        this.queryError = error instanceof Error ? error.message : String(error);
      }
      return [...(this.propertyValues[key] ?? [])];
    }
    if (this.valueGenerations.get(key) !== generation) {
      return [...(this.propertyValues[key] ?? [])];
    }
    const values = rows.map((row) => row.value);
    this.propertyValues[key] = values;
    return [...values];
  }

  processDelete(file: TFile) {
    void file;
    this.schedulePropertiesRefresh();
  }

  trackChanges() {
    const indexHandler = this.app.metadataCache.on("index-changed", (change) => {
      if (!change.reset && !change.domains.includes("metadata")) return;
      for (const key of Object.keys(this.propertyValues)) delete this.propertyValues[key];
      this.schedulePropertiesRefresh();
    });
    const loadHandler = this.app.metadataCache.on("loaded", () => {
      this.reload();
    });
    return () => {
      this.app.metadataCache.offref(indexHandler);
      this.app.metadataCache.offref(loadHandler);
      this.schedulePropertiesRefresh.cancel();
    };
  }

  reload() {
    this.schedulePropertiesRefresh();
  }

  determineType(value: unknown): MetadataType {
    return inferMetadataType(value);
  }

  determinePropertyType(name: string, value: unknown): MetadataType {
    return inferMetadataPropertyType(name, value);
  }
}
