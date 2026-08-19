import { describe, expect, it, vi } from "vitest";
import type { App } from "../context.svelte";
import {
  REBUILD_GENERATED_STATE_COMMAND_ID,
  REBUILD_VAULT_CACHE_COMMAND_ID,
  SEARCH_REBUILD_INDEX_COMMAND_ID,
  installVaultMaintenanceCommands,
} from "../vault-maintenance-commands";

function createApp(options: { searchCommand?: boolean } = {}) {
  const commands = new Map<
    string,
    { id: string; callback?: (...args: unknown[]) => unknown }
  >();
  const rebuild = vi.fn().mockResolvedValue(undefined);
  const rebuildSearchIndex = vi.fn().mockResolvedValue(undefined);
  const executeSearch = vi.fn().mockResolvedValue(undefined);
  const app = {
    metadataCache: { rebuild },
    appDatabase: { rebuildSearchIndex },
    commands: {
      registerCommand(command: {
        id: string;
        callback?: (...args: unknown[]) => unknown;
      }) {
        commands.set(command.id, command);
      },
      getCommand(id: string) {
        return commands.get(id);
      },
      executeCommand: vi.fn(async (id: string) => {
        if (id === SEARCH_REBUILD_INDEX_COMMAND_ID) {
          return executeSearch();
        }
        return commands.get(id)?.callback?.();
      }),
    },
  } as unknown as App;
  if (options.searchCommand) {
    app.commands.registerCommand({
      id: SEARCH_REBUILD_INDEX_COMMAND_ID,
      callback: executeSearch,
    });
  }
  return { app, rebuild, rebuildSearchIndex, executeSearch, commands };
}

describe("vault maintenance commands", () => {
  it("registers rebuild-vault-cache and calls metadataCache.rebuild", async () => {
    const { app, rebuild, commands } = createApp();
    installVaultMaintenanceCommands(app);

    expect(commands.has(REBUILD_VAULT_CACHE_COMMAND_ID)).toBe(true);
    await app.commands.executeCommand(REBUILD_VAULT_CACHE_COMMAND_ID);
    expect(rebuild).toHaveBeenCalledOnce();
  });

  it("rebuilds generated state through Search when that command is registered", async () => {
    const { app, rebuild, rebuildSearchIndex, executeSearch } = createApp({
      searchCommand: true,
    });
    installVaultMaintenanceCommands(app);

    await app.commands.executeCommand(REBUILD_GENERATED_STATE_COMMAND_ID);

    expect(rebuild).toHaveBeenCalledOnce();
    expect(executeSearch).toHaveBeenCalledOnce();
    expect(rebuildSearchIndex).not.toHaveBeenCalled();
  });

  it("rebuilds generated state through the database when Search is absent", async () => {
    const { app, rebuild, rebuildSearchIndex, executeSearch } = createApp();
    installVaultMaintenanceCommands(app);

    await app.commands.executeCommand(REBUILD_GENERATED_STATE_COMMAND_ID);

    expect(rebuild).toHaveBeenCalledOnce();
    expect(rebuildSearchIndex).toHaveBeenCalledOnce();
    expect(executeSearch).not.toHaveBeenCalled();
  });
});
