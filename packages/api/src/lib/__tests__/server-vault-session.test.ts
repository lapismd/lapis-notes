import { describe, expect, it, vi } from "vitest";
import {
  MemoryAppDatabase,
  type AppDatabaseProvider,
} from "../storage/app-database";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { createVaultSession } from "../storage/vault-session";

describe("server vault runtime selection", () => {
  it.each(["node-server", "deno-server"] as const)(
    "requires an explicit server provider for %s",
    async (runtime) => {
      await expect(
        createVaultSession(new MemoryVaultAdapter(), { runtime }),
      ).rejects.toThrow("server-hosted vaults require an AppDatabaseProvider");
    },
  );

  it.each(["node-server", "deno-server"] as const)(
    "uses the owning provider and closes its database for %s",
    async (runtime) => {
      const adapter = new MemoryVaultAdapter();
      const database = new MemoryAppDatabase(adapter.getVaultId());
      await database.open();
      const open = vi.fn(async () => database);
      const provider: AppDatabaseProvider = {
        id: "server-test",
        canOpen: () => true,
        open,
      };
      const close = vi.spyOn(database, "close");
      const session = await createVaultSession(adapter, {
        runtime,
        appDatabaseProvider: provider,
      });
      expect(open).toHaveBeenCalledWith({
        vaultId: adapter.getVaultId(),
        runtime,
        role: "direct",
      });
      expect(session.appDatabase).toBe(database);
      expect(session.appDatabaseState.status).toBe("ready");
      expect(session.appDatabaseState.lockSupported).toBe(false);
      await session.close();
      expect(close).toHaveBeenCalledOnce();
    },
  );
});
