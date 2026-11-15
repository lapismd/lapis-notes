import { describe, expect, it, vi } from "vitest";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";

describe("vault startup discovery", () => {
  it("joins discovery that is still active when retry is requested", async () => {
    const adapter = new MemoryVaultAdapter();
    let resume!: () => void;
    const pending = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const list = vi.spyOn(adapter, "list").mockImplementationOnce(async () => {
      await pending;
      return { files: [], folders: [] };
    });
    const vault = new Vault(adapter);
    const first = vault.load();
    expect(vault.load({ retry: true })).toBe(first);
    expect(list).toHaveBeenCalledTimes(1);
    resume();
    await first;
    await vault.load({ retry: true });
    expect(list).toHaveBeenCalledTimes(1);
  });
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
