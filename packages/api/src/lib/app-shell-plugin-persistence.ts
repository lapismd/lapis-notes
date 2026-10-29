import { appStatePath, DEFAULT_APP_STATE_DIRECTORY } from "./storage/path";
import type { App } from "./context.svelte";
import { readFileState, saveFileState } from "./file-state-store";
export const APP_SHELL_PLUGINS_PATH = appStatePath("app-shell-plugins.json");

export interface AppShellPluginPersistenceVault {
  mkpath?(path: string): Promise<unknown>;
  adapter?: {
    exists?(path: string): Promise<boolean>;
    read(path: string): Promise<string>;
    write(path: string, data: string): Promise<unknown>;
  };
}

export type AppShellPluginPersistenceVaultSource =
  | AppShellPluginPersistenceVault
  | (() => AppShellPluginPersistenceVault | undefined | null)
  | undefined
  | null;

export interface AppShellPluginEnablementPersistence {
  load(): Promise<unknown | null>;
  save(enabledById: Record<string, boolean>): Promise<void>;
}

function resolvePluginPersistenceVault(
  source: AppShellPluginPersistenceVaultSource,
): AppShellPluginPersistenceVault | undefined {
  if (typeof source === "function") {
    return source() ?? undefined;
  }
  return source ?? undefined;
}

export function createAppShellPluginPersistence(
  vault: AppShellPluginPersistenceVaultSource,
  app?: App,
  apply?: (enabled: Record<string, boolean>) => Promise<void>,
): AppShellPluginEnablementPersistence {
  let resetting = false;
  let snapshot: Record<string, boolean> = {};
  const reset = async (text: string) => {
    const value = JSON.parse(text || "{}");
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.values(value).some((enabled) => typeof enabled !== "boolean")
    )
      throw new Error("Invalid App Shell plugin configuration");
    resetting = true;
    try {
      await apply?.(value);
      snapshot = value;
    } finally {
      resetting = false;
    }
  };
  return {
    async load() {
      const adapter = resolvePluginPersistenceVault(vault)?.adapter;
      if (!adapter?.read) return null;
      try {
        if (app?.vault.supportsConditionalTextWrites) {
          const raw = await readFileState(app, APP_SHELL_PLUGINS_PATH, reset);
          snapshot = raw ? JSON.parse(raw) : {};
          return raw ? snapshot : null;
        }
        if (adapter.exists && !(await adapter.exists(APP_SHELL_PLUGINS_PATH))) {
          return null;
        }
        const raw = await adapter.read(APP_SHELL_PLUGINS_PATH);
        return JSON.parse(raw) as Record<string, boolean>;
      } catch {
        return null;
      }
    },
    async save(enabledById) {
      if (resetting) return;
      if (app?.vault.supportsConditionalTextWrites) {
        snapshot = { ...snapshot, ...enabledById };
        await saveFileState(
          app,
          APP_SHELL_PLUGINS_PATH,
          `${JSON.stringify(snapshot, null, 2)}\n`,
        );
        return;
      }
      const resolved = resolvePluginPersistenceVault(vault);
      const adapter = resolved?.adapter;
      if (!adapter?.write) return;
      await resolved
        ?.mkpath?.(DEFAULT_APP_STATE_DIRECTORY)
        .catch(() => undefined);
      await adapter.write(
        APP_SHELL_PLUGINS_PATH,
        `${JSON.stringify(enabledById, null, 2)}\n`,
      );
    },
  };
}
