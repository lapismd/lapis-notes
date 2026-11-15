import { expect, it, vi } from "vitest";
import { MemoryAppDatabase, MemoryVaultAdapter, Vault } from "../storage";
import { SyncHostService } from "../sync-host";

it("does not retry failed readiness after disposal", async () => {
  const database = new MemoryAppDatabase("disposed-sync-startup-retry");
  await database.open();
  const adapter = new MemoryVaultAdapter();
  vi.spyOn(adapter, "list").mockRejectedValueOnce(new Error("Offline"));
  const vault = new Vault(adapter);
  const service = new SyncHostService(database, vault);
  try {
    await expect(service.ready()).rejects.toThrow("Offline");
    await service.dispose();
    await vault.load({ retry: true });
    await expect(service.ready({ retry: true })).rejects.toThrow("Offline");
  } finally {
    await service.dispose();
    await database.close();
  }
});

it("retries failed initialization only after the host explicitly repairs discovery", async () => {
  const database = new MemoryAppDatabase("sync-startup-retry");
  await database.open();
  const adapter = new MemoryVaultAdapter({ "Note.md": "# Note" });
  vi.spyOn(adapter, "list").mockRejectedValueOnce(new Error("Offline"));
  const vault = new Vault(adapter);
  const service = new SyncHostService(database, vault);
  try {
    await expect(service.ready()).rejects.toThrow("Offline");
    await vault.load({ retry: true });
    await expect(service.ready()).rejects.toThrow("Offline");
    await expect(service.ready({ retry: true })).resolves.toBeUndefined();
  } finally {
    await service.dispose();
    await database.close();
  }
});
