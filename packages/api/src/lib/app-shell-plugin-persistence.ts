export const APP_SHELL_PLUGINS_PATH = ".obsidian/app-shell-plugins.json";

export interface AppShellPluginPersistenceVault {
  mkpath?(path: string): Promise<unknown>;
  adapter?: {
    exists?(path: string): Promise<boolean>;
    read(path: string): Promise<string>;
    write(path: string, data: string): Promise<unknown>;
  };
}

export interface AppShellPluginEnablementPersistence {
  load(): Promise<unknown | null>;
  save(enabledById: Record<string, boolean>): Promise<void>;
}

export function createAppShellPluginPersistence(
  vault: AppShellPluginPersistenceVault,
): AppShellPluginEnablementPersistence {
  return {
    async load() {
      const adapter = vault.adapter;
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
      const adapter = vault.adapter;
      if (!adapter?.write) return;
      await vault.mkpath?.(".obsidian").catch(() => undefined);
      await adapter.write(
        APP_SHELL_PLUGINS_PATH,
        `${JSON.stringify(enabledById, null, 2)}\n`,
      );
    },
  };
}
