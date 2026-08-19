import { describe, expect, it, vi } from "vitest";
import { OpfsVaultAdapter } from "@lapis-notes/api";
import {
  canExportCurrentVault,
  canImportIntoCurrentVault,
  exportCurrentVaultToLocalFolder,
  importDirectoryHandleToNewOpfsVault,
  importLocalFolderIntoCurrentVault,
  runExportVaultCommand,
  runImportVaultCommand,
} from "./vault-transfer";

function createOpfsAdapter() {
  const adapter = Object.create(OpfsVaultAdapter.prototype) as OpfsVaultAdapter;
  Object.assign(adapter, {
    kind: "opfs",
    getName: () => "Notes",
    getVaultId: () => "opfs-notes-ab12",
    getCapabilities: () => ({ userVisibleFiles: false }),
  });
  return adapter;
}

function createApp(overrides: {
  adapter?: ReturnType<typeof createOpfsAdapter> | { kind: string };
  userVisibleFiles?: boolean;
} = {}) {
  const adapter =
    overrides.adapter ??
    Object.assign(createOpfsAdapter(), {
      getCapabilities: () => ({
        userVisibleFiles: overrides.userVisibleFiles ?? false,
      }),
    });
  const notify = vi.fn();
  const withProgress = vi.fn(
    async (
      _options: unknown,
      task: (progress: {
        report: (value: Record<string, unknown>) => void;
      }) => Promise<unknown> | unknown,
    ) =>
      task({
        report: vi.fn(),
      }),
  );
  return {
    vault: {
      adapter,
      getName: () => "Notes",
      reload: vi.fn().mockResolvedValue(undefined),
    },
    notifications: { notify, withProgress },
    metadataCache: {
      rebuild: vi.fn().mockResolvedValue(undefined),
    },
    workspace: {
      containerEl: { ownerDocument: document },
    },
    notify,
  };
}

describe("web vault transfer", () => {
  it("gates import to OPFS adapters and export to opaque vaults", () => {
    const opfs = createApp();
    expect(canImportIntoCurrentVault(opfs as never)).toBe(true);
    expect(canExportCurrentVault(opfs as never)).toBe(true);

    const folder = createApp({
      adapter: {
        kind: "file-system-access",
        getCapabilities: () => ({ userVisibleFiles: true }),
      } as never,
    });
    expect(canImportIntoCurrentVault(folder as never)).toBe(false);
    expect(canExportCurrentVault(folder as never)).toBe(false);
  });

  it("imports into the current OPFS vault, reloads, and confirms a page reload", async () => {
    const app = createApp();
    const handle = { name: "Source" };
    const pickDirectory = vi.fn().mockResolvedValue(handle);
    const importHandle = vi.fn().mockResolvedValue({
      totalFiles: 2,
      importedFiles: 2,
    });
    const confirmReload = vi.fn().mockResolvedValue(true);
    const reloadPage = vi.fn();

    await importLocalFolderIntoCurrentVault(app as never, {
      pickDirectory,
      importHandle,
      confirmReload,
      reloadPage,
    });

    expect(pickDirectory).toHaveBeenCalledWith({
      id: "lapis-notes-import-vault",
      mode: "readwrite",
    });
    expect(importHandle).toHaveBeenCalledWith(
      handle,
      app.vault.adapter,
      expect.objectContaining({ onProgress: expect.any(Function) }),
    );
    expect(app.vault.reload).toHaveBeenCalledOnce();
    expect(app.metadataCache.rebuild).toHaveBeenCalledOnce();
    expect(app.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Imported local folder into browser vault",
        message: expect.stringContaining(".obsidian settings"),
      }),
    );
    expect(app.notify.mock.calls[0][0].message).not.toMatch(/plugin/i);
    expect(confirmReload).toHaveBeenCalledOnce();
    expect(reloadPage).toHaveBeenCalledOnce();
  });

  it("swallows picker abort during import and export commands", async () => {
    const app = createApp();
    const abort = Object.assign(new Error("cancelled"), { name: "AbortError" });
    const pickDirectory = vi.fn().mockRejectedValue(abort);

    await expect(
      runImportVaultCommand(app as never, { pickDirectory }),
    ).resolves.toBeUndefined();
    await expect(
      runExportVaultCommand(app as never, { pickDirectory }),
    ).resolves.toBeUndefined();
    expect(app.notify).not.toHaveBeenCalled();
  });

  it("exports the current OPFS tree with determinate progress", async () => {
    const app = createApp();
    const handle = { name: "Backup" };
    const pickDirectory = vi.fn().mockResolvedValue(handle);
    const exportHandle = vi.fn().mockResolvedValue({
      totalFiles: 3,
      exportedFiles: 3,
    });

    await exportCurrentVaultToLocalFolder(app as never, {
      pickDirectory,
      exportHandle,
    });

    expect(pickDirectory).toHaveBeenCalledWith({
      id: "lapis-notes-export-vault",
      mode: "readwrite",
    });
    expect(exportHandle).toHaveBeenCalledWith(
      app.vault.adapter,
      handle,
      expect.objectContaining({ onProgress: expect.any(Function) }),
    );
    expect(app.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Exported browser vault",
        message: "Exported 3 files into Backup.",
      }),
    );
  });

  it("creates a new OPFS vault, copies the tree, and deletes it when copy fails", async () => {
    const adapter = createOpfsAdapter();
    const createVault = vi.fn().mockResolvedValue(adapter);
    const importHandle = vi.fn().mockRejectedValue(new Error("copy failed"));
    const deleteVault = vi.fn().mockResolvedValue(undefined);

    await expect(
      importDirectoryHandleToNewOpfsVault({
        handle: { name: "Source" } as never,
        name: "Imported Notes",
        createVault,
        importHandle,
        deleteVault,
      }),
    ).rejects.toThrow("copy failed");

    expect(createVault).toHaveBeenCalledWith({ name: "Imported Notes" });
    expect(deleteVault).toHaveBeenCalledWith({
      id: "opfs-notes-ab12",
      kind: "opfs",
    });
  });

  it("returns the new OPFS adapter after a successful launcher copy", async () => {
    const adapter = createOpfsAdapter();
    const createVault = vi.fn().mockResolvedValue(adapter);
    const importHandle = vi.fn().mockResolvedValue({
      totalFiles: 1,
      importedFiles: 1,
    });
    const deleteVault = vi.fn();

    await expect(
      importDirectoryHandleToNewOpfsVault({
        handle: { name: "Source" } as never,
        name: "Imported Notes",
        createVault,
        importHandle,
        deleteVault,
      }),
    ).resolves.toBe(adapter);
    expect(deleteVault).not.toHaveBeenCalled();
  });
});
