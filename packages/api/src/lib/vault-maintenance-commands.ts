import type { App } from "./context.svelte";

export const REBUILD_VAULT_CACHE_COMMAND_ID = "app:rebuild-vault-cache";
export const REBUILD_GENERATED_STATE_COMMAND_ID = "app:rebuild-generated-state";
export const SEARCH_REBUILD_INDEX_COMMAND_ID = "search:rebuild-search-index";

export function installVaultMaintenanceCommands(app: App): void {
  app.commands.registerCommand({
    id: REBUILD_VAULT_CACHE_COMMAND_ID,
    name: "Rebuild vault cache",
    title: "Rebuild vault cache",
    category: "Vault",
    icon: "refresh-cw",
    sourcePlugin: "app",
    callback: () => {
      void app.metadataCache.rebuild();
    },
  });
  app.commands.registerCommand({
    id: REBUILD_GENERATED_STATE_COMMAND_ID,
    name: "Rebuild generated metadata and search state",
    title: "Rebuild generated metadata and search state",
    category: "Vault",
    icon: "database-zap",
    sourcePlugin: "app",
    callback: async () => {
      await app.metadataCache.rebuild();
      if (app.commands.getCommand(SEARCH_REBUILD_INDEX_COMMAND_ID)) {
        await app.commands.executeCommand(SEARCH_REBUILD_INDEX_COMMAND_ID);
        return;
      }
      await app.appDatabase.rebuildSearchIndex();
    },
  });
}
