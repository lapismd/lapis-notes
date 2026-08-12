const pluginSidecarHostModules = {
  lapis: true,
  "@lapis-notes/api": true,
} as const;

type PluginSidecarRequest = {
  id?: string;
  type?: string;
  payload?: Record<string, unknown>;
};

type PluginCapabilityProbe = {
  pluginId?: unknown;
  capability?: unknown;
  action?: unknown;
  payload?: unknown;
};

type BrokerReply = {
  id?: string;
  type?: string;
  result?: unknown;
  error?: string;
};

type HostedPluginConstructor = new (context: unknown) => {
  onload(): Promise<void> | void;
};

type SelectedRuntimePayload = {
  format: string;
  path?: string;
};

const PLUGIN_SIDECAR_CAPABILITIES = [
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

const pendingBrokerRequests = new Map<
  string,
  {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  }
>();

const evaluatedPlugins = new Map<
  string,
  {
    contextId: string;
    pluginId: string;
    manifest: Record<string, unknown>;
    exports: unknown;
    instance?: unknown;
    activationResult?: unknown;
  }
>();

let queue = Promise.resolve();
let brokerRequestCounter = 0;

send({ type: "ready" });

process.on("message", (message) => {
  if (handleBrokerReply(message)) {
    return;
  }

  queue = queue
    .then(() => handleMessage(message))
    .catch((error) => {
      sendError(undefined, error);
    });
});

process.once("SIGTERM", () => process.exit(0));
process.once("SIGINT", () => process.exit(0));

async function handleMessage(message: unknown): Promise<void> {
  if (!isRequest(message) || !message.id) {
    return;
  }

  try {
    switch (message.type) {
      case "prepare": {
        const contextId = normalizeContextId(message.payload?.contextId);
        const brokerResults = await runBrokerProbe(
          contextId,
          message.payload?.brokerProbe,
        );
        send({
          type: "response",
          id: message.id,
          result: {
            status: "ready",
            provider: "electron-plugin-sidecar",
            protocolVersion: 1,
            contextId,
            capabilities: PLUGIN_SIDECAR_CAPABILITIES,
            brokerResults,
          },
        });
        return;
      }
      case "evaluate":
        send({
          type: "response",
          id: message.id,
          result: await evaluatePlugin(message.payload ?? {}),
        });
        return;
      case "activate":
        send({
          type: "response",
          id: message.id,
          result: await activatePlugin(message.payload ?? {}),
        });
        return;
      case "deactivate":
        send({
          type: "response",
          id: message.id,
          result: await deactivatePlugin(message.payload ?? {}),
        });
        return;
      case "shutdown":
        send({ type: "response", id: message.id, result: null });
        process.exit(0);
        return;
      default:
        throw new Error(`Unsupported plugin sidecar request: ${message.type}`);
    }
  } catch (error) {
    sendError(message.id, error);
  }
}

async function evaluatePlugin(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const contextId = normalizeContextId(payload.contextId);
  const pluginId = readString(payload, "pluginId");
  const manifest = isRecord(payload.manifest) ? payload.manifest : {};
  const selectedRuntime = normalizeSelectedRuntime(payload.selectedRuntime);
  const code =
    typeof payload.code === "string"
      ? payload.code
      : await readPluginCode(contextId, pluginId, payload.modulePath);
  const exports = runCommonJsPlugin(code, {
    contextId,
    pluginId,
    manifest,
    modulePath:
      selectedRuntime.path ??
      (typeof payload.modulePath === "string" ? payload.modulePath : undefined),
    format: selectedRuntime.format,
  });
  evaluatedPlugins.set(pluginId, {
    contextId,
    pluginId,
    manifest,
    exports,
  });
  return {
    status: "evaluated",
    provider: "electron-plugin-sidecar",
    pluginId,
    contextId,
    capabilities: PLUGIN_SIDECAR_CAPABILITIES,
  };
}

async function activatePlugin(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const pluginId = readString(payload, "pluginId");
  const record = evaluatedPlugins.get(pluginId);
  if (!record) {
    throw new Error(`Plugin ${pluginId} has not been evaluated`);
  }

  const context = {
    pluginId,
    manifest: isRecord(payload.manifest) ? payload.manifest : record.manifest,
    app: createHostedFacade(record.contextId, pluginId),
    capabilities: PLUGIN_SIDECAR_CAPABILITIES,
  };
  const target = resolvePluginExport(record.exports);
  if (typeof target === "function") {
    if (target.prototype && typeof target.prototype.onload === "function") {
      const PluginType = target as HostedPluginConstructor;
      const instance = new PluginType(context);
      record.instance = instance;
      await instance.onload();
    } else {
      record.activationResult = await target(context);
    }
  } else if (isRecord(target)) {
    record.instance = target;
    if (typeof target.activate === "function") {
      record.activationResult = await target.activate(context);
    } else if (typeof target.onload === "function") {
      await target.onload(context);
    }
  } else {
    throw new Error(`Plugin ${pluginId} does not export an activatable entry`);
  }

  return {
    status: "activated",
    provider: "electron-plugin-sidecar",
    pluginId,
    contextId: record.contextId,
  };
}

async function deactivatePlugin(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const pluginId = readString(payload, "pluginId");
  const record = evaluatedPlugins.get(pluginId);
  if (!record) {
    return { status: "deactivated", pluginId };
  }

  await callMaybe(record.activationResult, "dispose");
  await callMaybe(record.activationResult, "onunload");
  await callMaybe(record.instance, "onunload");
  await callMaybe(record.instance, "dispose");
  if (typeof record.activationResult === "function") {
    await record.activationResult();
  }

  record.instance = undefined;
  record.activationResult = undefined;
  return {
    status: "deactivated",
    provider: "electron-plugin-sidecar",
    pluginId,
    contextId: record.contextId,
  };
}

async function readPluginCode(
  contextId: string,
  pluginId: string,
  modulePath: unknown,
): Promise<string> {
  if (typeof modulePath !== "string" || !modulePath.trim()) {
    throw new Error(`Plugin ${pluginId} is missing modulePath`);
  }
  const result = await invokeCapability({
    contextId,
    pluginId,
    capability: "vault:read",
    action: "read-text",
    payload: { path: modulePath.replace(/^\/+/u, "") },
  });
  if (typeof result !== "string") {
    throw new Error(`Plugin ${pluginId} module did not read as text`);
  }
  return result;
}

function runCommonJsPlugin(
  code: string,
  options: {
    contextId: string;
    pluginId: string;
    manifest: Record<string, unknown>;
    modulePath?: string;
    format: string;
  },
): unknown {
  const module = { exports: {} as unknown };
  const exports = {};
  module.exports = exports;
  const execute = new Function("exports", "module", "require", code);
  execute(exports, module, (specifier: string) =>
    requireHostedModule(specifier, options),
  );
  return module.exports;
}

function requireHostedModule(
  specifier: string,
  options: {
    contextId: string;
    pluginId: string;
    manifest: Record<string, unknown>;
    modulePath?: string;
    format: string;
  },
): unknown {
  if (isSidecarHostModule(specifier)) {
    return createHostedApiModule(options);
  }
  if (isLocalModuleSpecifier(specifier)) {
    throw new Error(
      `Local require ${specifier} is not supported in Electron sidecar v1 for plugin ${options.pluginId} (host=electron-sidecar, format=${options.format}, entry=${options.modulePath ?? "unknown"}). Bundle sidecar plugins into a single CommonJS file before loading.`,
    );
  }
  throw new Error(
    `Unsupported sidecar dependency ${specifier} in plugin ${options.pluginId} (host=electron-sidecar, format=${options.format}, entry=${options.modulePath ?? "unknown"}). Supported sidecar dependencies: ${sidecarHostSpecifiers().join(", ")}. Renderer-only modules such as Svelte, DOM, CodeMirror, and @lapis-notes/ui are unavailable in the sidecar.`,
  );
}

function createHostedApiModule(options: {
  contextId: string;
  pluginId: string;
  manifest: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    createHostedPluginCapabilityFacade: () =>
      createHostedFacade(options.contextId, options.pluginId),
    Plugin: class HostedDesktopPlugin {
      app = createHostedFacade(options.contextId, options.pluginId);
      manifest = options.manifest;
      async onload(): Promise<void> {}
      async onunload(): Promise<void> {}
    },
  };
}

function isSidecarHostModule(specifier: string): boolean {
  return Object.hasOwn(pluginSidecarHostModules, specifier);
}

function sidecarHostSpecifiers(): string[] {
  return Object.keys(pluginSidecarHostModules).sort();
}

function isLocalModuleSpecifier(specifier: string): boolean {
  return (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("/")
  );
}

function createHostedFacade(
  contextId: string,
  pluginId: string,
): Record<string, unknown> {
  const invoke = (
    capability: string,
    action: string,
    payload: Record<string, unknown> = {},
  ) =>
    invokeCapability({
      contextId,
      pluginId,
      capability,
      action,
      payload,
    });
  const log = (level: string, message: string, data?: unknown) =>
    invoke("logging", "log", { level, message, data });
  return {
    pluginId,
    capabilities: PLUGIN_SIDECAR_CAPABILITIES,
    vault: {
      exists: (path: string) => invoke("vault:read", "exists", { path }),
      stat: (path: string) => invoke("vault:read", "stat", { path }),
      list: (path = "/") => invoke("vault:read", "list", { path }),
      readText: (path: string) => invoke("vault:read", "read-text", { path }),
      readBinary: (path: string) =>
        invoke("vault:read", "read-binary", { path }),
      writeText: (path: string, data: string) =>
        invoke("vault:write", "write-text", { path, data }),
      writeBinary: (path: string, data: unknown) =>
        invoke("vault:write", "write-binary", { path, data }),
      mkdir: (path: string, options: Record<string, unknown> = {}) =>
        invoke("vault:write", "mkdir", { path, ...options }),
      remove: (path: string) => invoke("vault:write", "remove", { path }),
      rename: (path: string, newPath: string) =>
        invoke("vault:write", "rename", { path, newPath }),
    },
    pluginData: {
      load: () => invoke("plugin:data", "load"),
      save: (data: unknown) => invoke("plugin:data", "save", { data }),
    },
    commands: {
      register: (command: Record<string, unknown>) =>
        invoke("commands", "register", { command }),
      unregister: (commandId: string) =>
        invoke("commands", "unregister", { commandId }),
    },
    notices: {
      show: (message: string, options: Record<string, unknown> = {}) =>
        invoke("notices", "show", { message, ...options }),
    },
    settings: {
      read: (key?: string) => invoke("settings", "read", { key }),
      registerSurface: (surface: Record<string, unknown>) =>
        invoke("settings", "register-surface", { surface }),
    },
    metadata: {
      query: (query: Record<string, unknown>) =>
        invoke("metadata:query", "query", { query }),
    },
    events: {
      subscribe: (event: string, options: Record<string, unknown> = {}) =>
        invoke("events", "subscribe", { event, options }),
      unsubscribe: (subscriptionId: string) =>
        invoke("events", "unsubscribe", { subscriptionId }),
    },
    logging: {
      log,
      trace: (message: string, data?: unknown) => log("trace", message, data),
      debug: (message: string, data?: unknown) => log("debug", message, data),
      info: (message: string, data?: unknown) => log("info", message, data),
      warn: (message: string, data?: unknown) => log("warn", message, data),
      error: (message: string, data?: unknown) => log("error", message, data),
    },
  };
}

function resolvePluginExport(exports: unknown): unknown {
  if (isRecord(exports)) {
    return exports.default ?? exports.activate ?? exports;
  }
  return exports;
}

async function callMaybe(target: unknown, method: string): Promise<void> {
  if (isRecord(target) && typeof target[method] === "function") {
    await target[method]();
  }
}

function normalizeContextId(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "default";
}

function normalizeSelectedRuntime(value: unknown): SelectedRuntimePayload {
  if (!isRecord(value)) {
    return { format: "commonjs" };
  }
  return {
    format: typeof value.format === "string" ? value.format : "commonjs",
    path: typeof value.path === "string" ? value.path : undefined,
  };
}

function readString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  throw new Error(`Plugin sidecar request requires ${key}`);
}

async function runBrokerProbe(
  contextId: string,
  value: unknown,
): Promise<unknown[] | undefined> {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const probes = value.filter(isCapabilityProbe);
  return Promise.all(
    probes.map((probe) =>
      invokeCapability({
        contextId,
        pluginId: probe.pluginId,
        capability: probe.capability,
        action: probe.action,
        payload: isRecord(probe.payload) ? probe.payload : {},
      }),
    ),
  );
}

function invokeCapability(request: Record<string, unknown>): Promise<unknown> {
  const id = `plugin-sidecar-broker-${Date.now()}-${++brokerRequestCounter}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingBrokerRequests.delete(id);
      reject(new Error(`Plugin capability broker request timed out: ${id}`));
    }, 30_000);
    timer.unref?.();
    pendingBrokerRequests.set(id, { resolve, reject, timer });
    send({ type: "broker-request", id, request });
  });
}

function handleBrokerReply(message: unknown): boolean {
  if (!isBrokerReply(message) || !message.id) {
    return false;
  }

  const pending = pendingBrokerRequests.get(message.id);
  if (!pending) {
    return true;
  }

  pendingBrokerRequests.delete(message.id);
  clearTimeout(pending.timer);
  if (message.type === "broker-error") {
    pending.reject(
      new Error(message.error ?? "Plugin capability broker error"),
    );
  } else {
    pending.resolve(message.result);
  }
  return true;
}

function send(message: Record<string, unknown>): void {
  process.send?.(message);
}

function sendError(id: string | undefined, error: unknown): void {
  send({
    type: "error",
    id,
    error: error instanceof Error ? error.message : String(error),
  });
}

function isRequest(message: unknown): message is PluginSidecarRequest {
  return typeof message === "object" && message !== null;
}

function isBrokerReply(message: unknown): message is BrokerReply {
  return (
    isRecord(message) &&
    (message.type === "broker-response" || message.type === "broker-error")
  );
}

function isCapabilityProbe(value: unknown): value is {
  pluginId: string;
  capability: string;
  action: string;
  payload?: Record<string, unknown>;
} {
  return (
    isRecord(value) &&
    typeof value.pluginId === "string" &&
    typeof value.capability === "string" &&
    typeof value.action === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
