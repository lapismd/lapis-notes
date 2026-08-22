import { describe, expect, it, vi } from "vitest";

const { FakeOpfsVaultAdapter } = vi.hoisted(() => ({
  FakeOpfsVaultAdapter: class FakeOpfsVaultAdapter {
    kind = "opfs";
  },
}));

vi.mock("@lapis-notes/api", () => ({
  OpfsVaultAdapter: FakeOpfsVaultAdapter,
  Notice: class Notice {},
  createOpfsVault: vi.fn(),
  deleteBrowserLocalVault: vi.fn(),
  exportAdapterToDirectoryHandle: vi.fn(),
  importDirectoryHandleToAdapter: vi.fn(),
  pickFileSystemAccessDirectoryHandle: vi.fn(),
  promptConfirm: vi.fn(),
}));

import { OpfsVaultAdapter } from "@lapis-notes/api";
import {
  canExportCurrentVault,
  canImportIntoCurrentVault,
  exportCurrentVaultToLocalFolder,
  formatVaultCopyProgressMessage,
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
  const report = vi.fn();
  const withProgress = vi.fn(
    async (
      _options: unknown,
      task: (progress: {
        report: (value: Record<string, unknown>) => void;
      }) => Promise<unknown> | unknown,
    ) =>
      task({
        report,
      }),
  );
  return {
    vault: {
      adapter,
      getName: () => "Notes",
      reload: vi.fn().mockResolvedValue(undefined),
    },
    notifications: { notify, withProgress },
    report,
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
  it("formats scanning and file-level copy progress messages", () => {
    expect(
      formatVaultCopyProgressMessage({
        verb: "Importing",
        current: 0,
        total: 0,
        currentPath: null,
        scanningLabel: "Scanning Source...",
      }),
    ).toBe("Scanning Source...");
    expect(
      formatVaultCopyProgressMessage({
        verb: "Importing",
        current: 1,
        total: 2,
        currentPath: "Notes/A.md",
        scanningLabel: "Scanning Source...",
      }),
    ).toBe("Importing 1 of 2: Notes/A.md");
    expect(
      formatVaultCopyProgressMessage({
        verb: "Exporting",
        current: 3,
        total: 3,
        currentPath: null,
        scanningLabel: "Scanning Notes...",
      }),
    ).toBe("Exporting 3 of 3");
  });

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
    const importHandle = vi.fn(
      async (
        _handle: unknown,
        _adapter: unknown,
        options?: {
          onProgress?: (progress: {
            importedFiles: number;
            totalFiles: number;
            currentPath: string | null;
          }) => void;
        },
      ) => {
        await options?.onProgress?.({
          importedFiles: 0,
          totalFiles: 0,
          currentPath: null,
        });
        await options?.onProgress?.({
          importedFiles: 1,
          totalFiles: 2,
          currentPath: "Notes/A.md",
        });
        return {
          totalFiles: 2,
          importedFiles: 2,
          currentPath: "Notes/A.md",
        };
      },
    );
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
    expect(app.report).toHaveBeenCalledWith({
      current: 0,
      total: 0,
      message: "Scanning Source...",
    });
    expect(app.report).toHaveBeenCalledWith({
      current: 1,
      total: 2,
      message: "Importing 1 of 2: Notes/A.md",
    });
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
    const exportHandle = vi.fn(
      async (
        _adapter: unknown,
        _handle: unknown,
        options?: {
          onProgress?: (progress: {
            exportedFiles: number;
            totalFiles: number;
            currentPath: string | null;
          }) => void;
        },
      ) => {
        await options?.onProgress?.({
          exportedFiles: 2,
          totalFiles: 3,
          currentPath: "Daily/Today.md",
        });
        return {
          totalFiles: 3,
          exportedFiles: 3,
          currentPath: "Daily/Today.md",
        };
      },
    );

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
    expect(app.report).toHaveBeenCalledWith({
      current: 2,
      total: 3,
      message: "Exporting 2 of 3: Daily/Today.md",
    });
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
    const onProgress = vi.fn();
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
        onProgress,
      }),
    ).resolves.toBe(adapter);
    expect(importHandle).toHaveBeenCalledWith(
      { name: "Source" },
      adapter,
      { onProgress },
    );
    expect(deleteVault).not.toHaveBeenCalled();
  });
});
