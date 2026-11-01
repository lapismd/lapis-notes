import { describe, expect, it, vi } from "vitest";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";

describe("vault startup discovery", () => {
  it("retains a failed discovery until an explicit retry succeeds", async () => {
    const adapter = new MemoryVaultAdapter({ "Note.md": "# Note" });
    const list = vi
      .spyOn(adapter, "list")
      .mockRejectedValueOnce(new Error("Offline"));
    const vault = new Vault(adapter);
    await expect(vault.load()).rejects.toThrow("Offline");
    await expect(vault.load()).rejects.toThrow("Offline");
    expect(list).toHaveBeenCalledTimes(1);
    await expect(vault.load({ retry: true })).resolves.toBeUndefined();
    expect(vault.getFileByPath("Note.md")?.path).toBe("Note.md");
    expect(list).toHaveBeenCalledTimes(2);
    await vault.load({ retry: true });
    expect(list).toHaveBeenCalledTimes(2);
  });
});
