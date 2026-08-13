import {
  assertSupportedPluginAssetPath,
  createWebPluginAssetUrl,
  getInstalledPluginAssetFingerprint,
  getInstalledPluginAssetHash,
  getInstalledPluginAssetVersion,
  isSupportedPluginAssetPath,
  normalizePluginAssetRelativePath,
  PluginAssetServerError,
  readInstalledPluginAsset,
  WEB_PLUGIN_ASSET_CACHE_NAME,
  type InstalledPluginRecord,
  type PluginAssetDataAdapter,
  type PluginAssetServer,
  type PluginAssetUrlRequest,
} from "@lapis-notes/api/plugin-assets";

export interface WebPluginAssetDataAdapter extends PluginAssetDataAdapter {
  getName(): string;
  getVaultId?(): string;
  read(path: string): Promise<string>;
}

export interface WebPluginAssetServerOptions {
  adapter: WebPluginAssetDataAdapter;
  cacheStorage?: CacheStorage;
  pluginsPath?: string;
}

export class WebCachePluginAssetServer implements PluginAssetServer {
  private readonly vaultId: string;
  private readonly mirroredPlugins = new Map<string, Promise<void>>();

  constructor(private readonly options: WebPluginAssetServerOptions) {
    this.vaultId = options.adapter.getVaultId?.() ?? options.adapter.getName();
  }

  async getPluginAssetUrl(request: PluginAssetUrlRequest): Promise<string> {
    const installedPlugin = await this.getInstalledPlugin(request.pluginId);
    const version = getInstalledPluginAssetVersion(installedPlugin);
    if (request.version !== version) {
      throw new PluginAssetServerError(
        "asset-version-mismatch",
        `Plugin ${request.pluginId} asset version ${request.version} does not match installed version ${version}`,
      );
    }
    const path = normalizePluginAssetRelativePath(request.relativePath);
    assertSupportedPluginAssetPath(path);
    const sha256 = getInstalledPluginAssetHash(installedPlugin, path);
    await this.mirrorInstalledPlugin(installedPlugin, version);
    return createWebPluginAssetUrl({
      vaultId: this.vaultId,
      pluginId: request.pluginId,
      version,
      sha256,
      path,
    });
  }

  private async getInstalledPlugin(
    pluginId: string,
  ): Promise<InstalledPluginRecord> {
    try {
      const raw = await this.options.adapter.read(
        ".obsidian/installed-plugins.json",
      );
      const parsed = JSON.parse(raw) as {
        plugins?: Record<string, InstalledPluginRecord>;
      };
      const record = parsed.plugins?.[pluginId];
      if (record) return record;
    } catch {
      // Missing or invalid metadata is reported as an unregistered asset.
    }
    throw new PluginAssetServerError(
      "asset-not-installed",
      `Plugin ${pluginId} is not installed through verified plugin metadata`,
    );
  }

  private mirrorInstalledPlugin(
    installedPlugin: InstalledPluginRecord,
    version: string,
  ): Promise<void> {
    const key = `${installedPlugin.pluginId}@${version}:${getInstalledPluginAssetFingerprint(installedPlugin)}`;
    const existing = this.mirroredPlugins.get(key);
    if (existing) return existing;
    const pending = this.writeInstalledPluginToCache(installedPlugin, version);
    this.mirroredPlugins.set(key, pending);
    return pending;
  }

  private async writeInstalledPluginToCache(
    installedPlugin: InstalledPluginRecord,
    version: string,
  ): Promise<void> {
    const cacheStorage = this.options.cacheStorage ?? globalThis.caches;
    if (!cacheStorage) {
      throw new PluginAssetServerError(
        "asset-server-unavailable",
        "Web plugin asset loading requires Cache Storage support",
      );
    }
    const cache = await cacheStorage.open(WEB_PLUGIN_ASSET_CACHE_NAME);
    await Promise.all(
      installedPlugin.files
        .filter((file) => isSupportedPluginAssetPath(file.path))
        .map(async (file) => {
          const asset = await readInstalledPluginAsset({
            adapter: this.options.adapter,
            installedPlugin,
            relativePath: file.path,
            pluginsPath: this.options.pluginsPath,
          });
          const url = createWebPluginAssetUrl({
            vaultId: this.vaultId,
            pluginId: installedPlugin.pluginId,
            version,
            sha256: asset.sha256,
            path: asset.path,
          });
          await cache.put(
            url,
            new Response(asset.bytes, {
              headers: {
                "Cache-Control": "no-store",
                "Content-Type": asset.contentType,
                "X-Lapis-Plugin-Asset-Sha256": asset.sha256,
              },
            }),
          );
        }),
    );
  }
}

export function createWebPluginAssetServer(
  options: WebPluginAssetServerOptions,
): PluginAssetServer {
  return new WebCachePluginAssetServer(options);
}
