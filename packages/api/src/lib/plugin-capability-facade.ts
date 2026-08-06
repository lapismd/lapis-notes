export type HostedPluginCapability =
  | "vault:read"
  | "vault:write"
  | "plugin:data"
  | "commands"
  | "notices"
  | "settings"
  | "metadata:query"
  | "events"
  | "logging";

export const HOSTED_PLUGIN_CAPABILITIES: readonly HostedPluginCapability[] = [
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

export type HostedPluginLogLevel =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error";

export interface HostedPluginCapabilityRequest<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  pluginId: string;
  capability: HostedPluginCapability;
  action: string;
  payload?: TPayload;
}

export interface HostedPluginCapabilityBroker {
  invoke<T = unknown>(request: HostedPluginCapabilityRequest): Promise<T>;
}

export interface HostedPluginVaultStat {
  type: "file" | "folder";
  size: number;
  ctime: number;
  mtime: number;
}

export interface HostedPluginVaultListing {
  files: string[];
  folders: string[];
}

export interface HostedPluginCommandDescriptor {
  id: string;
  name: string;
  icon?: string;
  hotkeys?: Array<{
    modifiers: string[];
    key: string;
  }>;
}

export interface HostedPluginSettingsSurface {
  id: string;
  title: string;
  sections?: Array<Record<string, unknown>>;
}

export interface HostedPluginMetadataQuery {
  path?: string;
  tag?: string;
  limit?: number;
}

export interface HostedPluginMetadataResult {
  path: string;
  metadata: Record<string, unknown>;
}

export interface HostedPluginEventSubscription {
  subscriptionId: string;
}

export interface HostedPluginCapabilityFacade {
  readonly pluginId: string;
  readonly capabilities: readonly HostedPluginCapability[];
  readonly vault: {
    exists(path: string): Promise<boolean>;
    stat(path: string): Promise<HostedPluginVaultStat | null>;
    list(path?: string): Promise<HostedPluginVaultListing>;
    readText(path: string): Promise<string>;
    readBinary(path: string): Promise<ArrayBuffer>;
    writeText(path: string, data: string): Promise<void>;
    writeBinary(path: string, data: ArrayBuffer): Promise<void>;
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    remove(path: string): Promise<void>;
    rename(path: string, newPath: string): Promise<void>;
  };
  readonly pluginData: {
    load<T = unknown>(): Promise<T | null>;
    save(data: unknown): Promise<void>;
  };
  readonly commands: {
    register(command: HostedPluginCommandDescriptor): Promise<void>;
    unregister(commandId: string): Promise<void>;
  };
  readonly notices: {
    show(message: string, options?: { timeoutMs?: number }): Promise<void>;
  };
  readonly settings: {
    read<T = unknown>(key?: string): Promise<T | null>;
    registerSurface(surface: HostedPluginSettingsSurface): Promise<void>;
  };
  readonly metadata: {
    query(
      query: HostedPluginMetadataQuery,
    ): Promise<HostedPluginMetadataResult[]>;
  };
  readonly events: {
    subscribe(
      event: string,
      options?: Record<string, unknown>,
    ): Promise<HostedPluginEventSubscription>;
    unsubscribe(subscriptionId: string): Promise<void>;
  };
  readonly logging: {
    log(
      level: HostedPluginLogLevel,
      message: string,
      data?: unknown,
    ): Promise<void>;
    trace(message: string, data?: unknown): Promise<void>;
    debug(message: string, data?: unknown): Promise<void>;
    info(message: string, data?: unknown): Promise<void>;
    warn(message: string, data?: unknown): Promise<void>;
    error(message: string, data?: unknown): Promise<void>;
  };
}

export interface CreateHostedPluginCapabilityFacadeOptions {
  pluginId: string;
  broker: HostedPluginCapabilityBroker;
  capabilities?: readonly HostedPluginCapability[];
}

export function createHostedPluginCapabilityFacade({
  pluginId,
  broker,
  capabilities = HOSTED_PLUGIN_CAPABILITIES,
}: CreateHostedPluginCapabilityFacadeOptions): HostedPluginCapabilityFacade {
  const invoke = <T = unknown>(
    capability: HostedPluginCapability,
    action: string,
    payload: Record<string, unknown> = {},
  ) => broker.invoke<T>({ pluginId, capability, action, payload });

  const log = (
    level: HostedPluginLogLevel,
    message: string,
    data?: unknown,
  ): Promise<void> => invoke("logging", "log", { level, message, data });

  return {
    pluginId,
    capabilities,
    vault: {
      exists: (path) => invoke("vault:read", "exists", { path }),
      stat: (path) => invoke("vault:read", "stat", { path }),
      list: (path = "/") => invoke("vault:read", "list", { path }),
      readText: (path) => invoke("vault:read", "read-text", { path }),
      readBinary: (path) => invoke("vault:read", "read-binary", { path }),
      writeText: (path, data) =>
        invoke("vault:write", "write-text", { path, data }),
      writeBinary: (path, data) =>
        invoke("vault:write", "write-binary", { path, data }),
      mkdir: (path, options = {}) =>
        invoke("vault:write", "mkdir", { path, ...options }),
      remove: (path) => invoke("vault:write", "remove", { path }),
      rename: (path, newPath) =>
        invoke("vault:write", "rename", { path, newPath }),
    },
    pluginData: {
      load: () => invoke("plugin:data", "load"),
      save: (data) => invoke("plugin:data", "save", { data }),
    },
    commands: {
      register: (command) => invoke("commands", "register", { command }),
      unregister: (commandId) =>
        invoke("commands", "unregister", { commandId }),
    },
    notices: {
      show: (message, options = {}) =>
        invoke("notices", "show", { message, ...options }),
    },
    settings: {
      read: (key) => invoke("settings", "read", { key }),
      registerSurface: (surface) =>
        invoke("settings", "register-surface", { surface }),
    },
    metadata: {
      query: (query) => invoke("metadata:query", "query", { query }),
    },
    events: {
      subscribe: (event, options = {}) =>
        invoke("events", "subscribe", { event, options }),
      unsubscribe: (subscriptionId) =>
        invoke("events", "unsubscribe", { subscriptionId }),
    },
    logging: {
      log,
      trace: (message, data) => log("trace", message, data),
      debug: (message, data) => log("debug", message, data),
      info: (message, data) => log("info", message, data),
      warn: (message, data) => log("warn", message, data),
      error: (message, data) => log("error", message, data),
    },
  };
}
