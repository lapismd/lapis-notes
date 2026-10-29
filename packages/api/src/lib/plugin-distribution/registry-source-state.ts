import { appStatePath } from "../storage/path";
import { dirname } from "$lib/storage/path";
import type { DataAdapter } from "$lib/storage/fs";
import { ensureFolder } from "./installed-plugin-state";
import {
  parsePluginDistributionMetadata,
  pluginRegistrySourcePreferencesStateSchema,
} from "./schemas";
import type { PluginRegistrySourcePreferencesState } from "./types";

export class PluginRegistrySourcePreferenceStore {
  constructor(
    private readonly adapter: DataAdapter,
    private readonly options: {
      path?: string;
      now?: () => Date;
    } = {},
  ) {}

  async load(): Promise<PluginRegistrySourcePreferencesState> {
    try {
      const raw = await this.adapter.read(this.path);
      return parsePluginDistributionMetadata(
        pluginRegistrySourcePreferencesStateSchema,
        JSON.parse(raw),
      );
    } catch {
      return this.emptyState();
    }
  }

  async save(state: PluginRegistrySourcePreferencesState): Promise<void> {
    const next: PluginRegistrySourcePreferencesState = {
      schemaVersion: 1,
      updatedAt: this.now(),
      sources: state.sources ?? {},
    };
    await ensureFolder(this.adapter, dirname(this.path));
    await this.adapter.write(this.path, JSON.stringify(next, null, 2));
  }

  private emptyState(): PluginRegistrySourcePreferencesState {
    return {
      schemaVersion: 1,
      updatedAt: this.now(),
      sources: {},
    };
  }

  private get path(): string {
    return this.options.path ?? appStatePath("plugin-registry-sources.json");
  }

  private now(): string {
    return (this.options.now?.() ?? new Date()).toISOString();
  }
}
