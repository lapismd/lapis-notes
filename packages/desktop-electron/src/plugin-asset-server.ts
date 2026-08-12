import {
  assertSupportedPluginAssetPath,
  createElectronPluginAssetUrl,
  getInstalledPluginAssetFingerprint,
  getInstalledPluginAssetVersion,
  normalizePluginAssetRelativePath,
  PluginAssetServerError,
  readInstalledPluginAsset,
  type PluginAssetDataAdapter as InstalledPluginAssetDataAdapter,
  type PluginAssetServer,
  type PluginAssetUrlRequest,
} from "@lapis-notes/api";
import type { InstalledPluginRecord } from "@lapis-notes/api";

export interface PluginAssetDataAdapter {
  readBinary(path: string): Promise<ArrayBuffer>;
  getName(): string;
  getVaultId?(): string;
  read(path: string): Promise<string>;
}

export interface ElectronPluginAssetBridge {
  invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
}

export interface ElectronPluginAssetServerOptions {
  adapter: PluginAssetDataAdapter;
  bridge: ElectronPluginAssetBridge;
  pluginsPath?: string;
}

export class ElectronProtocolPluginAssetServer implements PluginAssetServer {
  private readonly options: ElectronPluginAssetServerOptions;
  private readonly vaultId: string;
  private readonly rootPath: string;
  private readonly registrations = new Map<string, Promise<void>>();

  constructor(options: ElectronPluginAssetServerOptions) {
    this.options = options;
    this.vaultId = getAdapterVaultId(options.adapter);
    this.rootPath = getAdapterRootPath(options.adapter);
  }

  async getPluginAssetUrl(request: PluginAssetUrlRequest): Promise<string> {
    const installedPlugin = await this.getInstalledPlugin(request.pluginId);
    const version = getInstalledPluginAssetVersion(installedPlugin);
    if (request.version !== version) {
      throw new PluginAssetServerError(
        "asset-version-mismatch",
        `Plugin ${request.pluginId} asset version ${request.version} does not match installed version ${version}`,
        {
          details: {
            pluginId: request.pluginId,
            requestedVersion: request.version,
            installedVersion: version,
          },
        },
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
    await this.registerInstalledPlugin(installedPlugin, version);
    return createElectronPluginAssetUrl({
      vaultId: this.vaultId,
      pluginId: request.pluginId,
      version,
      sha256: asset.sha256,
      path,
    });
  }

  private async getInstalledPlugin(
    pluginId: string,
  ): Promise<InstalledPluginRecord> {
    const installedPlugin = await readInstalledPluginRecord(
      this.options.adapter,
      pluginId,
    );
    if (!installedPlugin) {
      throw new PluginAssetServerError(
        "asset-not-installed",
        `Plugin ${pluginId} is not installed through verified plugin metadata`,
        { details: { pluginId } },
      );
    }
    return installedPlugin;
  }

  private registerInstalledPlugin(
    installedPlugin: InstalledPluginRecord,
    version: string,
  ): Promise<void> {
    const key = `${this.vaultId}:${installedPlugin.pluginId}:${version}:${getInstalledPluginAssetFingerprint(installedPlugin)}`;
    const existing = this.registrations.get(key);
    if (existing) {
      return existing;
    }

    const pending = this.options.bridge.invoke<void>(
      "desktop_plugin_assets_register",
      {
        vaultId: this.vaultId,
        rootPath: this.rootPath,
        pluginId: installedPlugin.pluginId,
        version,
        installedPlugin,
        pluginsPath: this.options.pluginsPath ?? ".obsidian/plugins",
      },
    );
    this.registrations.set(key, pending);
    return pending;
  }
}

export function createElectronPluginAssetServer(
  options: ElectronPluginAssetServerOptions,
): PluginAssetServer {
  return new ElectronProtocolPluginAssetServer(options);
}

async function readInstalledPluginRecord(
  adapter: PluginAssetDataAdapter,
  pluginId: string,
): Promise<InstalledPluginRecord | null> {
  try {
    const raw = await adapter.read(".obsidian/installed-plugins.json");
    const parsed = JSON.parse(raw) as {
      plugins?: Record<string, InstalledPluginRecord>;
    };
    return parsed.plugins?.[pluginId] ?? null;
  } catch {
    return null;
  }
}

function getAdapterVaultId(adapter: PluginAssetDataAdapter): string {
  return adapter.getVaultId?.() ?? adapter.getName();
}

function getAdapterRootPath(adapter: PluginAssetDataAdapter): string {
  const rootPath = (adapter as { rootPath?: unknown }).rootPath;
  if (typeof rootPath === "string" && rootPath.trim()) {
    return rootPath;
  }
  throw new PluginAssetServerError(
    "asset-server-unavailable",
    "Electron plugin asset loading requires a native vault root path",
  );
}
