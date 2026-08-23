import { getNativeDesktopBridge } from "./desktop-native";
import { IndexedDbKeyValueStore, type KeyValueStore } from "./vault-state";

function requireDesktopInvoke(): <T>(
  command: string,
  payload?: Record<string, unknown>,
) => Promise<T> {
  const bridge = getNativeDesktopBridge();
  if (!bridge) {
    throw new Error("Native desktop bridge is unavailable");
  }
  return bridge.invoke.bind(bridge);
}

/**
 * Persists vault bootstrap keys (saved vault profiles and current profile id)
 * in the native Deno host instead of renderer IndexedDB so a corrupted webview
 * storage partition cannot strand the shell on “Opening vault”.
 */
export class NativeDesktopVaultBootstrapKeyValueStore implements KeyValueStore {
  async get<T = unknown>(key: IDBValidKey): Promise<T | undefined> {
    const invoke = requireDesktopInvoke();
    return invoke<T | undefined>("desktop_vault_bootstrap_kv_get", {
      key: String(key),
    });
  }

  async set(key: IDBValidKey, value: unknown): Promise<void> {
    const invoke = requireDesktopInvoke();
    await invoke("desktop_vault_bootstrap_kv_set", {
      key: String(key),
      value,
    });
  }

  async setMany(entries: [IDBValidKey, unknown][]): Promise<void> {
    if (!entries.length) {
      return;
    }
    const invoke = requireDesktopInvoke();
    await invoke("desktop_vault_bootstrap_kv_set_many", {
      entries: entries.map(([k, v]) => [String(k), v]),
    });
  }

  async getMany<T = unknown>(requestedKeys: IDBValidKey[]): Promise<T[]> {
    const invoke = requireDesktopInvoke();
    return invoke<T[]>("desktop_vault_bootstrap_kv_get_many", {
      keys: requestedKeys.map((k) => String(k)),
    });
  }

  async del(key: IDBValidKey): Promise<void> {
    const invoke = requireDesktopInvoke();
    await invoke("desktop_vault_bootstrap_kv_del", { key: String(key) });
  }

  async keys(): Promise<IDBValidKey[]> {
    const invoke = requireDesktopInvoke();
    return invoke<string[]>("desktop_vault_bootstrap_kv_keys", {});
  }
}

const DEFAULT_MIGRATION_TIMEOUT_MS = 2500;

/**
 * One-time migration from the legacy IndexedDB vault-state store when the main
 * copy is still empty. Uses a timeout so a stuck IndexedDB open cannot block
 * desktop startup indefinitely.
 */
export async function migrateVaultBootstrapStoreFromIndexedDb(
  options: { timeoutMs?: number } = {},
): Promise<void> {
  const bridge = getNativeDesktopBridge();
  if (!bridge) {
    return;
  }

  const isEmpty = await bridge.invoke<boolean>(
    "desktop_vault_bootstrap_kv_is_empty",
    {},
  );
  if (!isEmpty) {
    return;
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_MIGRATION_TIMEOUT_MS;
  const idb = new IndexedDbKeyValueStore();

  const run = async (): Promise<void> => {
    const rawKeys = await idb.keys();
    if (!rawKeys.length) {
      return;
    }

    const entries = [];
    for (const k of rawKeys) {
      entries.push({ key: String(k), value: await idb.get(k) });
    }

    await bridge.invoke("desktop_vault_bootstrap_kv_import_if_empty", {
      entries,
    });
  };

  try {
    await Promise.race([
      run(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `IndexedDB vault-state migration timed out after ${timeoutMs}ms`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    console.warn(
      "[lapis] Vault profile store migration from IndexedDB skipped:",
      error,
    );
  }
}
