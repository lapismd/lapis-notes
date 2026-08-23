import {
  normalizeRootPath,
  normalizeVaultPath,
  resolveAbsolutePath,
} from "./paths.ts";

export const DENO_PLUGIN_ASSET_ROUTE_PREFIX = "/__lapis/plugins";

type InstalledFile = { path: string; sha256: string; size: number };
type RegisteredContext = {
  vaultId: string;
  pluginId: string;
  version: string;
  rootPath: string;
  pluginsPath: string;
  files: Map<string, InstalledFile>;
};
type PluginAssetIo = {
  stat(path: string): Promise<{
    isDirectory: boolean;
    isFile: boolean;
    size: number;
  }>;
  readFile(path: string): Promise<Uint8Array>;
  sha256(bytes: Uint8Array): Promise<string>;
};

function invalid(label: string): Error & { code: string } {
  return Object.assign(new Error(`EINVAL: ${label}`), { code: "EINVAL" });
}

function requiredString(value: unknown, label: string, limit = 8_192): string {
  if (typeof value !== "string") throw invalid(label);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > limit || trimmed.includes("\0")) {
    throw invalid(label);
  }
  return trimmed;
}

function segment(value: unknown, label: string): string {
  const candidate = requiredString(value, label, 500);
  if (
    candidate === "." ||
    candidate === ".." ||
    candidate.includes("/") ||
    candidate.includes("\\")
  ) {
    throw invalid(label);
  }
  return candidate;
}

function assetPath(value: unknown): string {
  const path = requiredString(value, "plugin asset path", 2_000).replace(
    /\\/gu,
    "/",
  );
  if (
    path.startsWith("/") ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw invalid("plugin asset path");
  }
  return path;
}

function contentType(path: string): string | null {
  const lower = path.toLowerCase();
  if (/\.(?:mjs|js|cjs)$/u.test(lower)) return "text/javascript; charset=utf-8";
  if (lower.endsWith(".css")) return "text/css; charset=utf-8";
  if (lower.endsWith(".json")) return "application/json; charset=utf-8";
  if (lower.endsWith(".wasm")) return "application/wasm";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  return null;
}

function decode(value: string, label: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw invalid(label);
  }
}

export function parseDenoPluginAssetUrl(value: string): {
  vaultId: string;
  pluginId: string;
  version: string;
  sha256: string;
  path: string;
} | null {
  const url = new URL(value, "http://lapis.local");
  const prefix = DENO_PLUGIN_ASSET_ROUTE_PREFIX.split("/").filter(Boolean);
  const parts = url.pathname.split("/").filter(Boolean);
  if (
    parts.length < prefix.length + 5 ||
    !prefix.every((part, index) => parts[index] === part)
  ) {
    return null;
  }
  const [vaultId, pluginId, version, sha256, ...pathParts] = parts.slice(
    prefix.length,
  );
  const normalizedSha256 = decode(sha256, "plugin asset sha256").toLowerCase();
  if (!/^[a-f0-9]{64}$/u.test(normalizedSha256)) {
    throw invalid("plugin asset sha256");
  }
  return {
    vaultId: requiredString(decode(vaultId, "plugin asset vault"), "plugin asset vault"),
    pluginId: segment(decode(pluginId, "plugin asset plugin"), "plugin asset plugin"),
    version: segment(decode(version, "plugin asset version"), "plugin asset version"),
    sha256: normalizedSha256,
    path: assetPath(
      pathParts.map((part) => decode(part, "plugin asset path")).join("/"),
    ),
  };
}

function contextKey(vaultId: string, pluginId: string, version: string): string {
  return `${vaultId}\0${pluginId}\0${version}`;
}

function parseFiles(value: unknown): Map<string, InstalledFile> {
  if (!Array.isArray(value)) throw invalid("plugin asset files");
  const files = new Map<string, InstalledFile>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw invalid("plugin asset file");
    }
    const file = raw as Record<string, unknown>;
    const path = assetPath(file.path);
    if (!contentType(path)) continue;
    const sha256 = requiredString(file.sha256, "plugin asset sha256", 100).toLowerCase();
    const size = file.size;
    if (!/^[a-f0-9]{64}$/u.test(sha256) || !Number.isSafeInteger(size) || Number(size) < 0) {
      throw invalid(path);
    }
    files.set(path, { path, sha256, size: Number(size) });
  }
  return files;
}

const defaultIo: PluginAssetIo = {
  stat: async (path) => {
    const stat = await Deno.stat(path);
    return {
      isDirectory: stat.isDirectory,
      isFile: stat.isFile,
      size: stat.size,
    };
  },
  readFile: (path) => Deno.readFile(path),
  async sha256(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  },
};

export class DenoPluginAssetService {
  readonly #contexts = new Map<string, RegisteredContext>();

  constructor(private readonly io: PluginAssetIo = defaultIo) {}

  async register(payload: Record<string, unknown>): Promise<{ registered: true }> {
    const installed = payload.installedPlugin;
    if (!installed || typeof installed !== "object" || Array.isArray(installed)) {
      throw invalid("desktop_plugin_assets_register.payload");
    }
    const record = installed as Record<string, unknown>;
    const vaultId = requiredString(payload.vaultId, "plugin asset vault id");
    const rootPath = normalizeRootPath(
      requiredString(payload.rootPath, "plugin asset root path", 4_000),
    );
    const pluginId = segment(payload.pluginId, "plugin asset plugin id");
    const version = segment(payload.version, "plugin asset version");
    if (
      segment(record.pluginId, "installed plugin id") !== pluginId ||
      segment(record.installedVersion, "installed plugin version") !== version
    ) {
      throw invalid("plugin asset installed metadata mismatch");
    }
    const pluginsPath = normalizeVaultPath(
      typeof payload.pluginsPath === "string"
        ? payload.pluginsPath
        : ".obsidian/plugins",
    );
    const directory = resolveAbsolutePath(
      rootPath,
      `${pluginsPath}/${pluginId}`,
    );
    const directoryStat = await this.io.stat(directory);
    if (!directoryStat.isDirectory) {
      throw Object.assign(new Error(`ENOTDIR: ${directory}`), {
        code: "ENOTDIR",
      });
    }
    this.#contexts.set(contextKey(vaultId, pluginId, version), {
      vaultId,
      pluginId,
      version,
      rootPath,
      pluginsPath,
      files: parseFiles(record.files),
    });
    return { registered: true };
  }

  async respond(requestUrl: string): Promise<Response | null> {
    const request = parseDenoPluginAssetUrl(requestUrl);
    if (!request) return null;
    try {
      const context = this.#contexts.get(
        contextKey(request.vaultId, request.pluginId, request.version),
      );
      const metadata = context?.files.get(request.path);
      const type = contentType(request.path);
      if (!context || !metadata || !type) {
        return new Response("Plugin asset not found", { status: 404 });
      }
      if (metadata.sha256 !== request.sha256) {
        return new Response("Invalid plugin asset hash", { status: 400 });
      }
      const absolutePath = resolveAbsolutePath(
        context.rootPath,
        `${context.pluginsPath}/${context.pluginId}/${request.path}`,
      );
      const stat = await this.io.stat(absolutePath);
      if (!stat.isFile || stat.size !== metadata.size) {
        return new Response("Plugin asset not found", { status: 404 });
      }
      const bytes = await this.io.readFile(absolutePath);
      if ((await this.io.sha256(bytes)) !== metadata.sha256) {
        return new Response("Invalid plugin asset content", { status: 400 });
      }
      return new Response(bytes, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": type,
          "X-Content-Type-Options": "nosniff",
          "X-Lapis-Plugin-Asset-Sha256": metadata.sha256,
        },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      return new Response(code ?? "Invalid plugin asset", {
        status: code === "ENOENT" || code === "EISDIR" ? 404 : 400,
      });
    }
  }

  clear(): void {
    this.#contexts.clear();
  }
}
