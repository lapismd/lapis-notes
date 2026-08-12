import fs from "node:fs";
import path from "node:path";

export type PluginSidecarCapability =
  | "vault:read"
  | "vault:write"
  | "plugin:data"
  | "commands"
  | "notices"
  | "settings"
  | "metadata:query"
  | "events"
  | "logging";

export const PLUGIN_SIDECAR_CAPABILITIES: readonly PluginSidecarCapability[] = [
  "vault:read",
  "vault:write",
  "plugin:data",
  "commands",
  "notices",
  "settings",
  "metadata:query",
  "events",
  "logging",
] as const;

export interface PluginSidecarCapabilityRequest {
  contextId: string;
  pluginId: string;
  capability: PluginSidecarCapability;
  action: string;
  payload?: Record<string, unknown>;
}

interface PluginSidecarContext {
  rootPath?: string;
  settings?: Record<string, unknown>;
  metadata?: Array<{ path: string; metadata: Record<string, unknown> }>;
  commands: Map<string, Record<string, unknown>>;
  notices: Array<Record<string, unknown>>;
  settingsSurfaces: Map<string, Record<string, unknown>>;
  eventSubscriptions: Map<string, Record<string, unknown>>;
}

let subscriptionCounter = 0;

export class ElectronPluginCapabilityBroker {
  private readonly contexts = new Map<string, PluginSidecarContext>();

  configureContext(
    contextId: string,
    options: {
      rootPath?: unknown;
      settings?: unknown;
      metadata?: unknown;
    } = {},
  ): void {
    const context = this.getContext(contextId);
    if (typeof options.rootPath === "string" && options.rootPath.trim()) {
      context.rootPath = normalizeRootPath(options.rootPath);
    }
    if (isRecord(options.settings)) {
      context.settings = { ...options.settings };
    }
    if (Array.isArray(options.metadata)) {
      context.metadata = options.metadata.filter(isMetadataRecord);
    }
  }

  deleteContext(contextId: string): void {
    this.contexts.delete(contextId);
  }

  async invoke(request: PluginSidecarCapabilityRequest): Promise<unknown> {
    switch (request.capability) {
      case "vault:read":
        return this.handleVaultRead(request);
      case "vault:write":
        return this.handleVaultWrite(request);
      case "plugin:data":
        return this.handlePluginData(request);
      case "commands":
        return this.handleCommands(request);
      case "notices":
        return this.handleNotices(request);
      case "settings":
        return this.handleSettings(request);
      case "metadata:query":
        return this.handleMetadata(request);
      case "events":
        return this.handleEvents(request);
      case "logging":
        return this.handleLogging(request);
      default:
        throw new Error(`Unsupported plugin capability: ${request.capability}`);
    }
  }

  private getContext(contextId: string): PluginSidecarContext {
    const key = normalizeContextId(contextId);
    const existing = this.contexts.get(key);
    if (existing) {
      return existing;
    }

    const context: PluginSidecarContext = {
      commands: new Map(),
      notices: [],
      settingsSurfaces: new Map(),
      eventSubscriptions: new Map(),
    };
    this.contexts.set(key, context);
    return context;
  }

  private requireRootPath(request: PluginSidecarCapabilityRequest): string {
    const rootPath = this.getContext(request.contextId).rootPath;
    if (!rootPath) {
      throw new Error(
        `Plugin sidecar context ${request.contextId} has no vault root`,
      );
    }
    return rootPath;
  }

  private handleVaultRead(request: PluginSidecarCapabilityRequest): unknown {
    const rootPath = this.requireRootPath(request);
    const normalizedPath = normalizeVaultPath(readString(request, "path", "/"));
    const absolutePath = resolveAbsolutePath(rootPath, normalizedPath);

    switch (request.action) {
      case "exists":
        return fs.existsSync(absolutePath);
      case "stat":
        if (!fs.existsSync(absolutePath)) {
          return null;
        }
        return statPayload(fs.statSync(absolutePath));
      case "list": {
        if (!fs.existsSync(absolutePath)) {
          throw makeFsError("ENOENT", normalizedPath);
        }
        const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
        return {
          files: entries
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name),
          folders: entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name),
        };
      }
      case "read-text":
        return fs.readFileSync(absolutePath, "utf8");
      case "read-binary": {
        const buffer = fs.readFileSync(absolutePath);
        return buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        );
      }
      default:
        throw new Error(`Unsupported vault read action: ${request.action}`);
    }
  }

  private handleVaultWrite(request: PluginSidecarCapabilityRequest): unknown {
    const rootPath = this.requireRootPath(request);
    const normalizedPath = normalizeVaultPath(readString(request, "path"));
    const absolutePath = resolveAbsolutePath(rootPath, normalizedPath);

    switch (request.action) {
      case "write-text":
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, readString(request, "data"), "utf8");
        return null;
      case "write-binary":
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, toBuffer(request.payload?.data));
        return null;
      case "mkdir":
        fs.mkdirSync(absolutePath, {
          recursive: request.payload?.recursive === true,
        });
        return null;
      case "remove":
        if (!fs.existsSync(absolutePath)) {
          throw makeFsError("ENOENT", normalizedPath);
        }
        if (fs.statSync(absolutePath).isDirectory()) {
          throw makeFsError("EISDIR", normalizedPath);
        }
        fs.unlinkSync(absolutePath);
        return null;
      case "rename": {
        const newPath = normalizeVaultPath(readString(request, "newPath"));
        const destinationPath = resolveAbsolutePath(rootPath, newPath);
        fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
        fs.renameSync(absolutePath, destinationPath);
        return null;
      }
      default:
        throw new Error(`Unsupported vault write action: ${request.action}`);
    }
  }

  private handlePluginData(request: PluginSidecarCapabilityRequest): unknown {
    const rootPath = this.requireRootPath(request);
    const dataPath = getPluginDataPath(rootPath, request.pluginId);

    switch (request.action) {
      case "load":
        if (!fs.existsSync(dataPath)) {
          return null;
        }
        return JSON.parse(fs.readFileSync(dataPath, "utf8"));
      case "save":
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        fs.writeFileSync(
          dataPath,
          JSON.stringify(request.payload?.data ?? null, null, 2),
          "utf8",
        );
        return null;
      default:
        throw new Error(`Unsupported plugin data action: ${request.action}`);
    }
  }

  private handleCommands(request: PluginSidecarCapabilityRequest): unknown {
    const context = this.getContext(request.contextId);
    switch (request.action) {
      case "register": {
        const command = readRecord(request, "command");
        const id = readStringFromRecord(command, "id");
        context.commands.set(scopedContributionId(request.pluginId, id), {
          ...command,
          pluginId: request.pluginId,
        });
        return null;
      }
      case "unregister":
        context.commands.delete(
          scopedContributionId(
            request.pluginId,
            readString(request, "commandId"),
          ),
        );
        return null;
      default:
        throw new Error(`Unsupported command action: ${request.action}`);
    }
  }

  private handleNotices(request: PluginSidecarCapabilityRequest): unknown {
    if (request.action !== "show") {
      throw new Error(`Unsupported notice action: ${request.action}`);
    }
    const context = this.getContext(request.contextId);
    context.notices.push({
      pluginId: request.pluginId,
      message: readString(request, "message"),
      timeoutMs:
        typeof request.payload?.timeoutMs === "number"
          ? request.payload.timeoutMs
          : undefined,
    });
    return null;
  }

  private handleSettings(request: PluginSidecarCapabilityRequest): unknown {
    const context = this.getContext(request.contextId);
    switch (request.action) {
      case "read": {
        const key = request.payload?.key;
        if (typeof key === "string" && key) {
          return context.settings?.[key] ?? null;
        }
        return context.settings ?? null;
      }
      case "register-surface": {
        const surface = readRecord(request, "surface");
        const id = readStringFromRecord(surface, "id");
        context.settingsSurfaces.set(
          scopedContributionId(request.pluginId, id),
          {
            ...surface,
            pluginId: request.pluginId,
          },
        );
        return null;
      }
      default:
        throw new Error(`Unsupported settings action: ${request.action}`);
    }
  }

  private handleMetadata(request: PluginSidecarCapabilityRequest): unknown {
    if (request.action !== "query") {
      throw new Error(`Unsupported metadata action: ${request.action}`);
    }
    const context = this.getContext(request.contextId);
    const query = isRecord(request.payload?.query) ? request.payload.query : {};
    const pathFilter = typeof query.path === "string" ? query.path : null;
    const tagFilter = typeof query.tag === "string" ? query.tag : null;
    const limit = typeof query.limit === "number" ? query.limit : 50;
    return (context.metadata ?? [])
      .filter((entry) => !pathFilter || entry.path === pathFilter)
      .filter((entry) =>
        !tagFilter
          ? true
          : Array.isArray(entry.metadata.tags) &&
            entry.metadata.tags.includes(tagFilter),
      )
      .slice(0, Math.max(0, limit));
  }

  private handleEvents(request: PluginSidecarCapabilityRequest): unknown {
    const context = this.getContext(request.contextId);
    switch (request.action) {
      case "subscribe": {
        const subscriptionId = `${request.pluginId}:${++subscriptionCounter}`;
        context.eventSubscriptions.set(subscriptionId, {
          pluginId: request.pluginId,
          event: readString(request, "event"),
          options: isRecord(request.payload?.options)
            ? request.payload.options
            : {},
        });
        return { subscriptionId };
      }
      case "unsubscribe":
        context.eventSubscriptions.delete(
          readString(request, "subscriptionId"),
        );
        return null;
      default:
        throw new Error(`Unsupported event action: ${request.action}`);
    }
  }

  private handleLogging(request: PluginSidecarCapabilityRequest): unknown {
    if (request.action !== "log") {
      throw new Error(`Unsupported logging action: ${request.action}`);
    }
    const level = readString(request, "level", "info");
    const message = readString(request, "message");
    const prefix = `[plugin-sidecar][${request.pluginId}] ${message}`;
    const data = request.payload?.data;
    switch (level) {
      case "trace":
        console.trace(prefix, data);
        break;
      case "debug":
        console.debug(prefix, data);
        break;
      case "warn":
        console.warn(prefix, data);
        break;
      case "error":
        console.error(prefix, data);
        break;
      default:
        console.info(prefix, data);
    }
    return null;
  }
}

function normalizeContextId(contextId: string): string {
  return contextId.trim() || "default";
}

function normalizeSeparators(value: string): string {
  return value.replace(/\\/g, "/");
}

function normalizeRootPath(rootPath: string): string {
  return rootPath.replace(/[\\/]+$/, "");
}

function normalizeVaultPath(vaultPath: string): string {
  const candidate = normalizeSeparators(vaultPath.trim());
  if (!candidate || candidate === "/") {
    return "";
  }
  if (path.posix.isAbsolute(candidate)) {
    throw makeFsError("EINVAL", vaultPath);
  }
  const normalized = path.posix.normalize(candidate).replace(/\/+$/, "");
  if (normalized === ".." || normalized.startsWith("../")) {
    throw makeFsError("EINVAL", vaultPath);
  }
  return normalized;
}

function resolveAbsolutePath(rootPath: string, normalizedPath: string): string {
  const pathModule = rootPath.includes("\\") ? path.win32 : path;
  const base = pathModule.resolve(normalizeRootPath(rootPath));
  const relativePath = normalizeVaultPath(normalizedPath);
  if (!relativePath) {
    return base;
  }
  const absolutePath = pathModule.resolve(base, ...relativePath.split("/"));
  if (
    absolutePath !== base &&
    !absolutePath.startsWith(`${base}${pathModule.sep}`)
  ) {
    throw makeFsError("EINVAL", normalizedPath);
  }
  return absolutePath;
}

function makeFsError(code: string, value: string): Error & { code: string } {
  return Object.assign(new Error(`${code}: ${value}`), { code });
}

function statPayload(stat: fs.Stats): Record<string, unknown> {
  return {
    type: stat.isDirectory() ? "folder" : "file",
    size: stat.size,
    ctime: stat.ctimeMs,
    mtime: stat.mtimeMs,
  };
}

function readString(
  request: PluginSidecarCapabilityRequest,
  key: string,
  fallback?: string,
): string {
  const value = request.payload?.[key];
  if (typeof value === "string") {
    return value;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(
    `Plugin capability ${request.capability}.${request.action} requires ${key}`,
  );
}

function readRecord(
  request: PluginSidecarCapabilityRequest,
  key: string,
): Record<string, unknown> {
  const value = request.payload?.[key];
  if (isRecord(value)) {
    return value;
  }
  throw new Error(
    `Plugin capability ${request.capability}.${request.action} requires ${key}`,
  );
}

function readStringFromRecord(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = record[key];
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  throw new Error(`Expected ${key} to be a non-empty string`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMetadataRecord(
  value: unknown,
): value is { path: string; metadata: Record<string, unknown> } {
  return (
    isRecord(value) &&
    typeof value.path === "string" &&
    isRecord(value.metadata)
  );
}

function sanitizePluginId(pluginId: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(pluginId)) {
    throw new Error(`Invalid plugin id: ${pluginId}`);
  }
  return pluginId;
}

function getPluginDataPath(rootPath: string, pluginId: string): string {
  return resolveAbsolutePath(
    rootPath,
    path.posix.join(
      ".obsidian",
      "plugins",
      sanitizePluginId(pluginId),
      "data.json",
    ),
  );
}

function scopedContributionId(
  pluginId: string,
  contributionId: string,
): string {
  return `${sanitizePluginId(pluginId)}:${contributionId}`;
}

function toBuffer(value: unknown): Buffer {
  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }
  if (Array.isArray(value)) {
    return Buffer.from(value);
  }
  throw new Error("Expected binary payload data");
}
