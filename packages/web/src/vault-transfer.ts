import {
  OpfsVaultAdapter,
  createOpfsVault,
  deleteBrowserLocalVault,
  exportAdapterToDirectoryHandle,
  importDirectoryHandleToAdapter,
  pickFileSystemAccessDirectoryHandle,
  promptConfirm,
  type App,
  type BrowserDirectoryImportProgress,
  type BrowserFileSystemDirectoryHandle,
  type VaultAdapter,
} from "@lapis-notes/api";

export const IMPORT_CURRENT_COMMAND_ID = "app:import-local-vault";
export const EXPORT_CURRENT_COMMAND_ID = "app:export-current-vault";
export const IMPORT_CURRENT_PICKER_ID = "lapis-notes-import-vault";
export const EXPORT_PICKER_ID = "lapis-notes-export-vault";
export const IMPORT_NEW_PICKER_ID = "lapis-notes-import-new-vault";

export interface VaultTransferDependencies {
  pickDirectory?: typeof pickFileSystemAccessDirectoryHandle;
  importHandle?: typeof importDirectoryHandleToAdapter;
  exportHandle?: typeof exportAdapterToDirectoryHandle;
  createVault?: typeof createOpfsVault;
  deleteVault?: typeof deleteBrowserLocalVault;
  confirmReload?: (hostDocument: Document) => Promise<boolean>;
  reloadPage?: () => void;
}

function resolveDependencies(
  overrides: VaultTransferDependencies = {},
): Required<VaultTransferDependencies> {
  return {
    pickDirectory:
      overrides.pickDirectory ?? pickFileSystemAccessDirectoryHandle,
    importHandle: overrides.importHandle ?? importDirectoryHandleToAdapter,
    exportHandle: overrides.exportHandle ?? exportAdapterToDirectoryHandle,
    createVault: overrides.createVault ?? createOpfsVault,
    deleteVault: overrides.deleteVault ?? deleteBrowserLocalVault,
    confirmReload:
      overrides.confirmReload ??
      ((hostDocument) =>
        promptConfirm(hostDocument, {
          title: "Apply imported settings",
          description:
            "Reload the app to apply imported .obsidian settings.",
          confirmLabel: "Reload now",
          cancelLabel: "Later",
        })),
    reloadPage:
      overrides.reloadPage ??
      (() => {
        globalThis.location?.reload();
      }),
  };
}

export function isAbortError(error: unknown): boolean {
  return (error as { name?: string } | undefined)?.name === "AbortError";
}

export function canImportIntoCurrentVault(app: App): boolean {
  return app.vault.adapter instanceof OpfsVaultAdapter;
}

export function canExportCurrentVault(app: App): boolean {
  const adapter = app.vault.adapter as VaultAdapter;
  return adapter.getCapabilities?.().userVisibleFiles === false;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function hostDocument(app: App): Document {
  return app.workspace.containerEl?.ownerDocument ?? globalThis.document;
}

export function formatVaultCopyProgressMessage(options: {
  verb: "Importing" | "Exporting";
  current: number;
  total: number;
  currentPath: string | null;
  scanningLabel: string;
}): string {
  if (options.total <= 0) {
    return options.scanningLabel;
  }
  const path = options.currentPath?.trim();
  return path
    ? `${options.verb} ${options.current} of ${options.total}: ${path}`
    : `${options.verb} ${options.current} of ${options.total}`;
}

export async function importLocalFolderIntoCurrentVault(
  app: App,
  overrides: VaultTransferDependencies = {},
): Promise<void> {
  if (!canImportIntoCurrentVault(app)) {
    throw new Error(
      "Vault import is only available for browser vaults stored in OPFS",
    );
  }

  const deps = resolveDependencies(overrides);
  const handle = await deps.pickDirectory({
    id: IMPORT_CURRENT_PICKER_ID,
    mode: "readwrite",
  });

  try {
    const result = await app.notifications.withProgress(
      {
        title: "Importing local folder",
        message: `Scanning ${handle.name}...`,
        source: "Import",
        location: "notification",
        persistOnError: true,
      },
      async (progressHandle) => {
        return deps.importHandle(handle, app.vault.adapter, {
          onProgress: (progress) => {
            progressHandle.report({
              current: progress.importedFiles,
              total: progress.totalFiles,
              message: formatVaultCopyProgressMessage({
                verb: "Importing",
                current: progress.importedFiles,
                total: progress.totalFiles,
                currentPath: progress.currentPath,
                scanningLabel: `Scanning ${handle.name}...`,
              }),
            });
          },
        });
      },
    );

    await app.notifications.withProgress(
      {
        title: "Refreshing imported vault",
        message: `Refreshing ${app.vault.getName()}...`,
        source: "Import",
        location: "status",
        persistOnError: true,
      },
      async (progressHandle) => {
        progressHandle.report({
          current: result.importedFiles,
          total: result.totalFiles,
          message: `Refreshing ${app.vault.getName()}...`,
        });
        await app.vault.reload();
      },
    );

    void app.metadataCache.rebuild().catch((error) => {
      app.notifications.notify({
        title: "Metadata refresh failed",
        message: errorMessage(
          error,
          "Imported files, but metadata refresh failed",
        ),
        severity: "error",
        source: "Import",
      });
    });

    const imported =
      result.totalFiles > 0
        ? `Imported ${result.importedFiles} files from ${handle.name}. Metadata refresh continues in the background.`
        : `Imported ${handle.name}. Metadata refresh continues in the background.`;
    app.notifications.notify({
      title: "Imported local folder into browser vault",
      message: `${imported} Reloading applies imported .obsidian settings.`,
      source: "Import",
    });

    if (await deps.confirmReload(hostDocument(app))) {
      deps.reloadPage();
    }
  } catch (error) {
    app.notifications.notify({
      title: "Failed to import local folder",
      message: errorMessage(error, "An unexpected error occurred during import."),
      severity: "error",
      source: "Import",
    });
    throw error;
  }
}

export async function runImportVaultCommand(
  app: App,
  overrides: VaultTransferDependencies = {},
): Promise<void> {
  try {
    await importLocalFolderIntoCurrentVault(app, overrides);
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }
    app.notifications.notify({
      title: "Failed to import local folder",
      message: errorMessage(error, "Failed to import local folder"),
      severity: "error",
      source: "Import",
    });
  }
}

export async function exportCurrentVaultToLocalFolder(
  app: App,
  overrides: VaultTransferDependencies = {},
): Promise<void> {
  if (!canExportCurrentVault(app)) {
    throw new Error("Vault export is only available for browser-local vaults");
  }

  const deps = resolveDependencies(overrides);
  const handle = await deps.pickDirectory({
    id: EXPORT_PICKER_ID,
    mode: "readwrite",
  });

  try {
    const result = await app.notifications.withProgress(
      {
        title: "Exporting browser vault",
        message: `Scanning ${app.vault.getName()}...`,
        source: "Export",
        location: "notification",
        persistOnError: true,
      },
      async (progressHandle) => {
        return deps.exportHandle(app.vault.adapter, handle, {
          onProgress: (progress) => {
            progressHandle.report({
              current: progress.exportedFiles,
              total: progress.totalFiles,
              message: formatVaultCopyProgressMessage({
                verb: "Exporting",
                current: progress.exportedFiles,
                total: progress.totalFiles,
                currentPath: progress.currentPath,
                scanningLabel: `Scanning ${app.vault.getName()}...`,
              }),
            });
          },
        });
      },
    );

    app.notifications.notify({
      title: "Exported browser vault",
      message:
        result.totalFiles > 0
          ? `Exported ${result.exportedFiles} files into ${handle.name}.`
          : `Exported ${app.vault.getName()} into ${handle.name}.`,
      source: "Export",
    });
  } catch (error) {
    app.notifications.notify({
      title: "Failed to export browser vault",
      message: errorMessage(
        error,
        "An unexpected error occurred during export.",
      ),
      severity: "error",
      source: "Export",
    });
    throw error;
  }
}

export async function runExportVaultCommand(
  app: App,
  overrides: VaultTransferDependencies = {},
): Promise<void> {
  try {
    await exportCurrentVaultToLocalFolder(app, overrides);
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }
    app.notifications.notify({
      title: "Failed to export browser vault",
      message: errorMessage(error, "Failed to export browser vault"),
      severity: "error",
      source: "Export",
    });
  }
}

export async function importDirectoryHandleToNewOpfsVault(options: {
  handle: BrowserFileSystemDirectoryHandle;
  name: string;
  createVault?: typeof createOpfsVault;
  importHandle?: typeof importDirectoryHandleToAdapter;
  deleteVault?: typeof deleteBrowserLocalVault;
  onProgress?: (
    progress: BrowserDirectoryImportProgress,
  ) => void | Promise<void>;
}): Promise<OpfsVaultAdapter> {
  const createVault = options.createVault ?? createOpfsVault;
  const importHandle = options.importHandle ?? importDirectoryHandleToAdapter;
  const deleteVault = options.deleteVault ?? deleteBrowserLocalVault;
  const adapter = await createVault({ name: options.name });
  try {
    await importHandle(options.handle, adapter, {
      onProgress: options.onProgress,
    });
    return adapter;
  } catch (error) {
    await deleteVault({
      id: adapter.getVaultId(),
      kind: "opfs",
    });
    throw error;
  }
}
