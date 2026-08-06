import { dirname } from "$lib/storage/path";
import type { DataAdapter } from "$lib/storage/fs";
import {
  installedPluginsStateSchema,
  parsePluginDistributionMetadata,
} from "./schemas";
import type { InstalledPluginRecord, InstalledPluginsState } from "./types";

export class InstalledPluginStateStore {
  constructor(
    private readonly adapter: DataAdapter,
    private readonly options: {
      path?: string;
      now?: () => Date;
    } = {},
  ) {}

  async load(): Promise<InstalledPluginsState> {
    try {
      const raw = await this.adapter.read(this.path);
      return parsePluginDistributionMetadata(
        installedPluginsStateSchema,
        JSON.parse(raw),
      );
    } catch {
      return this.emptyState();
    }
  }

  async save(state: InstalledPluginsState): Promise<void> {
    const next: InstalledPluginsState = {
      ...state,
      schemaVersion: 1,
      updatedAt: this.now(),
      plugins: state.plugins ?? {},
    };
    await ensureFolder(this.adapter, dirname(this.path));
    await this.adapter.write(this.path, JSON.stringify(next, null, 2));
  }

  async get(pluginId: string): Promise<InstalledPluginRecord | null> {
    const state = await this.load();
    return state.plugins[pluginId] ?? null;
  }

  async list(): Promise<InstalledPluginRecord[]> {
    const state = await this.load();
    return Object.values(state.plugins);
  }

  async upsert(record: InstalledPluginRecord): Promise<void> {
    const state = await this.load();
    await this.save({
      ...state,
      plugins: {
        ...state.plugins,
        [record.pluginId]: record,
      },
    });
  }

  async remove(pluginId: string): Promise<void> {
    const state = await this.load();
    const { [pluginId]: _removed, ...plugins } = state.plugins;
    await this.save({ ...state, plugins });
  }

  private emptyState(): InstalledPluginsState {
    return {
      schemaVersion: 1,
      updatedAt: this.now(),
      plugins: {},
    };
  }

  private get path(): string {
    return this.options.path ?? ".obsidian/installed-plugins.json";
  }

  private now(): string {
    return (this.options.now?.() ?? new Date()).toISOString();
  }
}

export const ensureFolder = async (
  adapter: DataAdapter,
  folderPath: string,
): Promise<void> => {
  if (folderPath === "/" || folderPath === "." || folderPath === "") return;
  if (await adapter.exists(folderPath)) return;
  await ensureFolder(adapter, dirname(folderPath));
  await adapter.mkdir(folderPath);
};
