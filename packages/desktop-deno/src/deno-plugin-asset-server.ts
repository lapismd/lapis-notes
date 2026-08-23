import {
  assertSupportedPluginAssetPath,
  createWebPluginAssetUrl,
  getInstalledPluginAssetFingerprint,
  getInstalledPluginAssetVersion,
  normalizePluginAssetRelativePath,
  PluginAssetServerError,
  readInstalledPluginAsset,
  type InstalledPluginRecord,
  type PluginAssetDataAdapter as InstalledPluginAssetDataAdapter,
  type PluginAssetServer,
  type PluginAssetUrlRequest,
} from "@lapis-notes/api";

export interface DenoPluginAssetDataAdapter {
  readBinary(path: string): Promise<ArrayBuffer>;
  getName(): string;
  getVaultId?(): string;
  read(path: string): Promise<string>;
}

export interface DenoPluginAssetBridge {
  invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
}

export interface DenoPluginAssetServerOptions {
  adapter: DenoPluginAssetDataAdapter;
  bridge: DenoPluginAssetBridge;
  pluginsPath?: string;
}

export class DenoHttpPluginAssetServer implements PluginAssetServer {
  readonly #vaultId: string;
  readonly #rootPath: string;
  readonly #registrations = new Map<string, Promise<void>>();

  constructor(private readonly options: DenoPluginAssetServerOptions) {
    this.#vaultId = options.adapter.getVaultId?.() ?? options.adapter.getName();
    const rootPath = (options.adapter as { rootPath?: unknown }).rootPath;
    if (typeof rootPath !== "string" || !rootPath.trim()) {
      throw new PluginAssetServerError(
        "asset-server-unavailable",
        "Deno plugin asset loading requires a native vault root path",
      );
    }
    this.#rootPath = rootPath;
  }

  async getPluginAssetUrl(request: PluginAssetUrlRequest): Promise<string> {
    const installedPlugin = await this.#getInstalledPlugin(request.pluginId);
    const version = getInstalledPluginAssetVersion(installedPlugin);
    if (request.version !== version) {
      throw new PluginAssetServerError(
        "asset-version-mismatch",
        `Plugin ${request.pluginId} asset version ${request.version} does not match installed version ${version}`,
      );
    }

    const path = normalizePluginAssetRelativePath(request.relativePath);
    assertSupportedPluginAssetPath(path);
    const asset = await readInstalledPluginAsset({
      adapter: this.options.adapter as InstalledPluginAssetDataAdapter,
      installedPlugin,
      relativePath: path,
      pluginsPath: this.options.pluginsPath,
    });
    await this.#registerInstalledPlugin(installedPlugin, version);
    return createWebPluginAssetUrl({
      vaultId: this.#vaultId,
      pluginId: request.pluginId,
      version,
      sha256: asset.sha256,
      path,
    });
  }

  async #getInstalledPlugin(pluginId: string): Promise<InstalledPluginRecord> {
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

  #registerInstalledPlugin(
    installedPlugin: InstalledPluginRecord,
    version: string,
  ): Promise<void> {
    const key = `${this.#vaultId}:${installedPlugin.pluginId}:${version}:${getInstalledPluginAssetFingerprint(installedPlugin)}`;
    const existing = this.#registrations.get(key);
    if (existing) return existing;
    const pending = this.options.bridge.invoke<void>(
      "desktop_plugin_assets_register",
      {
        vaultId: this.#vaultId,
        rootPath: this.#rootPath,
        pluginId: installedPlugin.pluginId,
        version,
        installedPlugin,
        pluginsPath: this.options.pluginsPath ?? ".obsidian/plugins",
      },
    );
    this.#registrations.set(key, pending);
    return pending;
  }
}

export function createDenoPluginAssetServer(
  options: DenoPluginAssetServerOptions,
): PluginAssetServer {
  return new DenoHttpPluginAssetServer(options);
}
