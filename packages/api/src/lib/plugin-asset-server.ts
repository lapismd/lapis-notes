import { joinPath } from "./storage/path";
import { assertSafePluginRelativePath } from "./plugin-distribution/path-safety";
import type { InstalledPluginRecord } from "./plugin-distribution/types";
import { sha256Hex } from "./plugin-distribution/hashes";

export const WEB_PLUGIN_ASSET_ROUTE_PREFIX = "/__lapis/plugins";
export const WEB_PLUGIN_ASSET_CACHE_NAME = "lapis-plugin-assets-v1";
export const ELECTRON_PLUGIN_ASSET_SCHEME = "lapis-plugin";

export type PluginAssetServerErrorCode =
  | "asset-server-unavailable"
  | "invalid-url"
  | "invalid-path"
  | "unsupported-asset-type"
  | "asset-not-installed"
  | "asset-not-found"
  | "asset-size-mismatch"
  | "asset-hash-mismatch"
  | "asset-version-mismatch";

export class PluginAssetServerError extends Error {
  readonly code: PluginAssetServerErrorCode;
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;

  constructor(
    code: PluginAssetServerErrorCode,
    message: string,
    options: { details?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(message);
    this.name = "PluginAssetServerError";
    this.code = code;
    this.details = options.details;
    this.cause = options.cause;
  }
}

export const isPluginAssetServerError = (
  error: unknown,
): error is PluginAssetServerError => error instanceof PluginAssetServerError;

export interface PluginAssetUrlParts {
  vaultId: string;
  pluginId: string;
  version: string;
  sha256: string;
  path: string;
}

export interface PluginAssetUrlRequest {
  pluginId: string;
  pluginPath: string;
  relativePath: string;
  version: string;
}

export interface PluginAssetServer {
  getPluginAssetUrl(request: PluginAssetUrlRequest): Promise<string> | string;
}

export interface PluginAssetDataAdapter {
  readBinary(path: string): Promise<ArrayBuffer>;
}

export interface InstalledPluginAssetReadOptions {
  adapter: PluginAssetDataAdapter;
  installedPlugin: InstalledPluginRecord;
  relativePath: string;
  expectedSha256?: string;
  pluginsPath?: string;
  verifyHash?: boolean;
}

export interface InstalledPluginAsset {
  bytes: Uint8Array;
  contentType: string;
  path: string;
  sha256: string;
  size: number;
}

export function createWebPluginAssetUrl(parts: PluginAssetUrlParts): string {
  const path = normalizePluginAssetRelativePath(parts.path);
  return [
    WEB_PLUGIN_ASSET_ROUTE_PREFIX,
    encodePathSegment(parts.vaultId),
    encodePathSegment(parts.pluginId),
    encodePathSegment(parts.version),
    encodePathSegment(normalizePluginAssetSha256(parts.sha256)),
    encodePluginAssetPath(path),
  ].join("/");
}

export function parseWebPluginAssetUrl(
  value: string,
  base = "http://lapis.local",
): PluginAssetUrlParts {
  const url = new URL(value, base);
  const prefixParts = WEB_PLUGIN_ASSET_ROUTE_PREFIX.split("/").filter(Boolean);
  const parts = url.pathname.split("/").filter(Boolean);
  if (
    parts.length < prefixParts.length + 5 ||
    !prefixParts.every((part, index) => parts[index] === part)
  ) {
    throw new PluginAssetServerError(
      "invalid-url",
      `Invalid web plugin asset URL: ${value}`,
      { details: { url: value } },
    );
  }

  const [vaultId, pluginId, version, sha256, ...assetPathParts] = parts.slice(
    prefixParts.length,
  );
  return normalizePluginAssetUrlParts({
    vaultId: decodePathSegment(vaultId),
    pluginId: decodePathSegment(pluginId),
    version: decodePathSegment(version),
    sha256: decodePathSegment(sha256),
    path: decodePluginAssetPath(assetPathParts),
  });
}

export function createElectronPluginAssetUrl(
  parts: PluginAssetUrlParts,
): string {
  const path = normalizePluginAssetRelativePath(parts.path);
  return `${ELECTRON_PLUGIN_ASSET_SCHEME}://${encodePathSegment(
    parts.vaultId,
  )}/${encodePathSegment(parts.pluginId)}/${encodePathSegment(
    parts.version,
  )}/${encodePathSegment(normalizePluginAssetSha256(parts.sha256))}/${encodePluginAssetPath(path)}`;
}

export function parseElectronPluginAssetUrl(
  value: string,
): PluginAssetUrlParts {
  const url = new URL(value);
  if (url.protocol !== `${ELECTRON_PLUGIN_ASSET_SCHEME}:`) {
    throw new PluginAssetServerError(
      "invalid-url",
      `Invalid Electron plugin asset URL: ${value}`,
      { details: { url: value } },
    );
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (!url.hostname || parts.length < 4) {
    throw new PluginAssetServerError(
      "invalid-url",
      `Invalid Electron plugin asset URL: ${value}`,
      { details: { url: value } },
    );
  }

  const [pluginId, version, sha256, ...assetPathParts] = parts;
  return normalizePluginAssetUrlParts({
    vaultId: decodePathSegment(url.hostname),
    pluginId: decodePathSegment(pluginId),
    version: decodePathSegment(version),
    sha256: decodePathSegment(sha256),
    path: decodePluginAssetPath(assetPathParts),
  });
}

export function getInstalledPluginAssetVersion(
  record: InstalledPluginRecord,
): string {
  return record.installedVersion;
}

export function getInstalledPluginAssetHash(
  record: InstalledPluginRecord,
  relativePath: string,
): string {
  const path = normalizePluginAssetRelativePath(relativePath);
  const metadata = getInstalledPluginAssetMetadata(record, path);
  return normalizePluginAssetSha256(metadata.sha256);
}

export function getInstalledPluginAssetFingerprint(
  record: InstalledPluginRecord,
): string {
  return record.files
    .filter((file) => isSupportedPluginAssetPath(file.path))
    .map((file) => ({
      path: normalizePluginAssetRelativePath(file.path),
      sha256: normalizePluginAssetSha256(file.sha256),
      size: file.size,
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((file) => `${file.path}:${file.size}:${file.sha256}`)
    .join("|");
}

export function isSupportedPluginAssetPath(path: string): boolean {
  return /\.(?:mjs|js|cjs|css|json|wasm|svg|png|jpg|jpeg|gif)$/iu.test(path);
}

export function assertSupportedPluginAssetPath(path: string): void {
  if (isSupportedPluginAssetPath(path)) {
    return;
  }
  throw new PluginAssetServerError(
    "unsupported-asset-type",
    `Plugin asset ${path} is not a supported module asset type`,
    { details: { path } },
  );
}

export function getPluginAssetContentType(path: string): string {
  const lowerPath = path.toLowerCase();
  if (/\.(?:mjs|js|cjs)$/u.test(lowerPath)) {
    return "text/javascript; charset=utf-8";
  }
  if (lowerPath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (lowerPath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  if (lowerPath.endsWith(".wasm")) {
    return "application/wasm";
  }
  if (lowerPath.endsWith(".svg")) {
    return "image/svg+xml";
  }
  if (lowerPath.endsWith(".png")) {
    return "image/png";
  }
  if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerPath.endsWith(".gif")) {
    return "image/gif";
  }
  return "application/octet-stream";
}

export async function readInstalledPluginAsset({
  adapter,
  installedPlugin,
  relativePath,
  expectedSha256,
  pluginsPath = ".obsidian/plugins",
  verifyHash = true,
}: InstalledPluginAssetReadOptions): Promise<InstalledPluginAsset> {
  const path = normalizePluginAssetRelativePath(relativePath);
  assertSupportedPluginAssetPath(path);
  const metadata = getInstalledPluginAssetMetadata(installedPlugin, path);
  const metadataSha256 = normalizePluginAssetSha256(metadata.sha256);
  if (
    expectedSha256 &&
    normalizePluginAssetSha256(expectedSha256) !== metadataSha256
  ) {
    throw new PluginAssetServerError(
      "asset-hash-mismatch",
      `Plugin asset URL hash for ${path} does not match installed metadata`,
      {
        details: {
          pluginId: installedPlugin.pluginId,
          path,
          expectedSha256: metadataSha256,
          actualSha256: normalizePluginAssetSha256(expectedSha256),
        },
      },
    );
  }

  const assetPath = joinPath(pluginsPath, installedPlugin.pluginId, path);
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await adapter.readBinary(assetPath));
  } catch (error) {
    throw new PluginAssetServerError(
      "asset-not-found",
      `Installed plugin asset ${assetPath} could not be read`,
      {
        cause: error,
        details: {
          pluginId: installedPlugin.pluginId,
          path,
          assetPath,
        },
      },
    );
  }

  if (bytes.byteLength !== metadata.size) {
    throw new PluginAssetServerError(
      "asset-size-mismatch",
      `Installed plugin asset ${path} size mismatch: expected ${metadata.size}, got ${bytes.byteLength}`,
      {
        details: {
          pluginId: installedPlugin.pluginId,
          path,
          expectedSize: metadata.size,
          actualSize: bytes.byteLength,
        },
      },
    );
  }

  if (verifyHash) {
    const actualSha256 = await sha256Hex(bytes);
    if (actualSha256.toLowerCase() !== metadataSha256) {
      throw new PluginAssetServerError(
        "asset-hash-mismatch",
        `Installed plugin asset ${path} SHA-256 mismatch`,
        {
          details: {
            pluginId: installedPlugin.pluginId,
            path,
            expectedSha256: metadataSha256,
            actualSha256,
          },
        },
      );
    }
  }

  return {
    bytes,
    contentType: getPluginAssetContentType(path),
    path,
    sha256: metadataSha256,
    size: metadata.size,
  };
}

export function normalizePluginAssetRelativePath(path: string): string {
  try {
    assertSafePluginRelativePath(path);
  } catch (error) {
    throw new PluginAssetServerError(
      "invalid-path",
      `Plugin asset path is not safe: ${path}`,
      { cause: error, details: { path } },
    );
  }
  return path;
}

function normalizePluginAssetUrlParts(
  parts: PluginAssetUrlParts,
): PluginAssetUrlParts {
  if (!parts.vaultId || !parts.pluginId || !parts.version || !parts.sha256) {
    throw new PluginAssetServerError(
      "invalid-url",
      "Plugin asset URL is incomplete",
      {
        details: { ...parts },
      },
    );
  }
  return {
    ...parts,
    sha256: normalizePluginAssetSha256(parts.sha256),
    path: normalizePluginAssetRelativePath(parts.path),
  };
}

function getInstalledPluginAssetMetadata(
  installedPlugin: InstalledPluginRecord,
  path: string,
): { path: string; sha256: string; size: number } {
  const metadata = installedPlugin.files.find((file) => file.path === path);
  if (!metadata) {
    throw new PluginAssetServerError(
      "asset-not-installed",
      `Plugin ${installedPlugin.pluginId} does not declare installed asset ${path}`,
      {
        details: {
          pluginId: installedPlugin.pluginId,
          path,
        },
      },
    );
  }
  return metadata;
}

function normalizePluginAssetSha256(value: string): string {
  const normalized = value.toLowerCase();
  if (/^[a-f0-9]{64}$/u.test(normalized)) {
    return normalized;
  }
  throw new PluginAssetServerError(
    "invalid-url",
    `Plugin asset SHA-256 hash is invalid: ${value}`,
    { details: { sha256: value } },
  );
}

function encodePluginAssetPath(path: string): string {
  return path.split("/").map(encodePathSegment).join("/");
}

function decodePluginAssetPath(parts: string[]): string {
  if (!parts.length) {
    throw new PluginAssetServerError(
      "invalid-url",
      "Plugin asset URL is missing an asset path",
    );
  }
  return parts.map(decodePathSegment).join("/");
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function decodePathSegment(value: string): string {
  return decodeURIComponent(value);
}
