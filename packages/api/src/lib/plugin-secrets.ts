/**
 * Durable secrets belonging to the active plugin. A missing entry returns
 * `null`.
 */
export interface PluginSecrets {
  get(name: string): Promise<string | null>;
  set(name: string, value: string): Promise<void>;
  delete(name: string): Promise<void>;
}

/** A host-admitted scope. The host also fences calls when its session closes. */
export interface PluginSecretsLease {
  readonly secrets: PluginSecrets;
  close(): void | Promise<void>;
}

/** The plugin manager supplies the registered plugin identity to this host port. */
export interface PluginSecretsHost {
  allows(pluginId: string): boolean;
  open(pluginId: string): Promise<PluginSecretsLease>;
}

export type PluginCredentialCommand =
  | { kind: "open"; plugin: string }
  | { kind: "get" | "delete"; lease: string; name: string }
  | { kind: "set"; lease: string; name: string; value: string }
  | { kind: "close"; lease: string };

export type PluginCredentialReply =
  | { kind: "opened"; lease: string }
  | { kind: "value"; value: string | null }
  | { kind: "done" };

/** Adapt an admitted native connection to the plugin manager's host port. */
export function createNativePluginSecretsHost(
  grants: readonly string[],
  call: (command: PluginCredentialCommand) => Promise<PluginCredentialReply>,
  signal?: AbortSignal,
): PluginSecretsHost {
  const ids = new Set(grants);
  const allows = (id: string) => !signal?.aborted && ids.has(id);
  return {
    allows,
    async open(plugin) {
      if (!allows(plugin))
        throw new Error("Plugin secret storage is unavailable");
      const result = await call({ kind: "open", plugin });
      if (result.kind !== "opened" || typeof result.lease !== "string") {
        throw new Error("Invalid plugin credential reply");
      }
      const { lease } = result;
      return {
        secrets: {
          async get(name) {
            const result = await call({ kind: "get", lease, name });
            if (
              result.kind !== "value" ||
              (result.value !== null && typeof result.value !== "string")
            ) {
              throw new Error("Invalid plugin credential reply");
            }
            return result.value;
          },
          async set(name, value) {
            if (
              (await call({ kind: "set", lease, name, value })).kind !== "done"
            ) {
              throw new Error("Invalid plugin credential reply");
            }
          },
          async delete(name) {
            if ((await call({ kind: "delete", lease, name })).kind !== "done") {
              throw new Error("Invalid plugin credential reply");
            }
          },
        },
        async close() {
          if (!signal?.aborted) await call({ kind: "close", lease });
        },
      };
    },
  };
}

/** Bind a single activation and revoke cached facades when that activation ends. */
export function bindPluginSecrets(
  host: PluginSecretsHost,
  pluginId: string,
): PluginSecretsLease {
  let closed = false;
  let opening: Promise<PluginSecretsLease> | undefined;

  function checkOpen() {
    if (closed || !host.allows(pluginId)) {
      throw new Error("The plugin secret session is closed or unavailable");
    }
  }

  async function run<T>(
    name: string,
    call: (secrets: PluginSecrets) => Promise<T>,
  ) {
    checkOpen();
    if (!/^[a-z0-9][a-z0-9-]{0,127}$/u.test(name)) {
      throw new Error("Invalid plugin secret name");
    }
    opening ??= host.open(pluginId).catch((error: unknown) => {
      opening = undefined;
      throw error;
    });
    const lease = await opening;
    checkOpen();
    const result = await call(lease.secrets);
    checkOpen();
    return result;
  }

  return {
    secrets: Object.freeze<PluginSecrets>({
      get: (name) => run(name, (secrets) => secrets.get(name)),
      set: async (name, value) => {
        if (new TextEncoder().encode(value).byteLength > 32 * 1024) {
          throw new Error("Plugin secret exceeds the storage limit");
        }
        await run(name, (secrets) => secrets.set(name, value));
      },
      delete: (name) => run(name, (secrets) => secrets.delete(name)),
    }),
    async close() {
      if (closed) return;
      closed = true;
      const lease = await opening?.catch(() => undefined);
      await lease?.close();
    },
  };
}
