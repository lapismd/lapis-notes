import { expect, it, vi } from "vitest";
import { SyncHostService } from "../sync-host";
import { MemoryAppDatabase, MemoryVaultAdapter, Vault } from "../storage";

it("queues observed file changes behind initial identity reconciliation", async () => {
  const database = new MemoryAppDatabase("startup-ordering");
  await database.open();
  const vault = new Vault(new MemoryVaultAdapter({ "Note.md": "initial" }));
  await vault.load();
  const transact = database.transactMeta.bind(database);
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  let writes = 0;
  vi.spyOn(database, "transactMeta").mockImplementation(async (transaction) => {
    if (
      transaction.checks?.some(
        (check) => check.key === "sync-host:v1:change-sequence",
      )
    ) {
      writes++;
      if (writes === 1) {
        entered.resolve();
        await release.promise;
      }
    }
    return transact(transaction);
  });
  const service = new SyncHostService(database, vault);
  try {
    await entered.promise;
    const note = vault.getFileByPath("Note.md")!;
    await vault.modify(note, "changed during reconciliation");
    // The initialization transaction stays held while queued event work runs.
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(writes).toBe(1);
  } finally {
    release.resolve();
    await service.ready();
    await service.dispose();
  }
  expect(writes).toBe(2);
  const sequence = await database.getMeta("sync-host:v1:change-sequence");
  expect(sequence).toBe(2);
});
