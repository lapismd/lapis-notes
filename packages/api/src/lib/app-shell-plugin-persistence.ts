export const APP_SHELL_PLUGINS_PATH = ".obsidian/app-shell-plugins.json";

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
): AppShellPluginEnablementPersistence {
  return {
    async load() {
      const adapter = resolvePluginPersistenceVault(vault)?.adapter;
      if (!adapter?.read) return null;
      try {
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
      const resolved = resolvePluginPersistenceVault(vault);
      const adapter = resolved?.adapter;
      if (!adapter?.write) return;
      await resolved?.mkpath?.(".obsidian").catch(() => undefined);
      await adapter.write(
        APP_SHELL_PLUGINS_PATH,
        `${JSON.stringify(enabledById, null, 2)}\n`,
      );
    },
  };
}
