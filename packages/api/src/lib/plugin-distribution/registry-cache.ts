import type { DataAdapter } from "$lib/storage/fs";
import {
  pluginCatalogDetailSchema,
  pluginCatalogIndexSchema,
  pluginRevocationIndexSchema,
  parsePluginDistributionMetadata,
} from "./schemas";
import type {
  PluginCatalogDetail,
  PluginCatalogIndex,
  PluginRevocationIndex,
} from "./types";

export interface PluginRegistryCacheRecord {
  schemaVersion: 1;
  updatedAt: string;
  sourceUrl: string;
  index: PluginCatalogIndex;
  details: Record<string, PluginCatalogDetail>;
  revocations?: PluginRevocationIndex;
}

export class PluginRegistryCache {
  private memory: PluginRegistryCacheRecord | null = null;

  constructor(
    private readonly options: {
      adapter?: DataAdapter;
      cachePath?: string;
      now?: () => Date;
    } = {},
  ) {}

  getMemory(): PluginRegistryCacheRecord | null {
    return this.memory;
  }

  async read(): Promise<PluginRegistryCacheRecord | null> {
    if (this.memory) return this.memory;
    if (!this.options.adapter) return null;

    try {
      const raw = await this.options.adapter.read(this.cachePath);
      const parsed = JSON.parse(raw) as PluginRegistryCacheRecord;
      this.memory = {
        schemaVersion: 1,
        updatedAt: parsed.updatedAt,
        sourceUrl: parsed.sourceUrl,
        index: parsePluginDistributionMetadata(
          pluginCatalogIndexSchema,
          parsed.index,
        ),
        details: Object.fromEntries(
          Object.entries(parsed.details ?? {}).map(([pluginId, detail]) => [
            pluginId,
            parsePluginDistributionMetadata(pluginCatalogDetailSchema, detail),
          ]),
        ),
        revocations: parsed.revocations
          ? parsePluginDistributionMetadata(
              pluginRevocationIndexSchema,
              parsed.revocations,
            )
          : undefined,
      };
      return this.memory;
    } catch {
      return null;
    }
  }

  async write(
    sourceUrl: string,
    index: PluginCatalogIndex,
    details: Record<string, PluginCatalogDetail> = {},
    revocations?: PluginRevocationIndex,
  ): Promise<PluginRegistryCacheRecord> {
    const record: PluginRegistryCacheRecord = {
      schemaVersion: 1,
      updatedAt: (this.options.now?.() ?? new Date()).toISOString(),
      sourceUrl,
      index,
      details,
    };
    if (revocations) record.revocations = revocations;
    this.memory = record;

    if (this.options.adapter) {
      await ensureFolder(this.options.adapter, this.cacheFolder);
      await this.options.adapter.write(this.cachePath, JSON.stringify(record));
    }

    return record;
  }

  async putDetail(
    pluginId: string,
    detail: PluginCatalogDetail,
  ): Promise<PluginRegistryCacheRecord | null> {
    const existing = await this.read();
    if (!existing) return null;
    return this.write(
      existing.sourceUrl,
      existing.index,
      {
        ...existing.details,
        [pluginId]: detail,
      },
      existing.revocations,
    );
  }

  async putRevocations(
    revocations: PluginRevocationIndex,
  ): Promise<PluginRegistryCacheRecord | null> {
    const existing = await this.read();
    if (!existing) return null;
    return this.write(
      existing.sourceUrl,
      existing.index,
      existing.details,
      revocations,
    );
  }

  private get cachePath(): string {
    return this.options.cachePath ?? ".obsidian/plugin-registry-cache.json";
  }

  private get cacheFolder(): string {
    const parts = this.cachePath.split("/");
    parts.pop();
    return parts.join("/") || "/";
  }
}

const ensureFolder = async (
  adapter: DataAdapter,
  folderPath: string,
): Promise<void> => {
  if (folderPath === "/" || (await adapter.exists(folderPath))) return;
  const parent = folderPath.split("/").slice(0, -1).join("/") || "/";
  await ensureFolder(adapter, parent);
  await adapter.mkdir(folderPath);
};
