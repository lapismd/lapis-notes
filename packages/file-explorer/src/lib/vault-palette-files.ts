import type { App, TFile } from "@lapis-notes/api";
import { EXPLORER_SETTING_IDS } from "./explorer-settings";
import { isVisibleExplorerPath } from "./vault-path-visibility";

export const VAULT_PALETTE_FILES_TAB = {
  id: "files",
  label: "Files",
  order: 20,
} as const;

export const VAULT_PALETTE_RECENT_GROUP = "Recent";

const SUPPORTED_EXTENSIONS = new Set([
  "md",
  "markdown",
  "txt",
  "text",
  "json",
  "data",
]);

function readShowHiddenFiles(app: App): boolean {
  return app.configuration
    .getConfiguration()
    .get(EXPLORER_SETTING_IDS.showHiddenFiles, false);
}

function isPaletteVisibleFile(app: App, file: TFile): boolean {
  return (
    isVisibleExplorerPath(file.path, {
      showHidden: readShowHiddenFiles(app),
    }) && SUPPORTED_EXTENSIONS.has(file.extension.toLocaleLowerCase())
  );
}

export function listVaultPaletteFiles(app: App, query: string): TFile[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) {
    return app.workspace.getRecentFiles().filter((file) =>
      isPaletteVisibleFile(app, file),
    );
  }
  return app.vault
    .getFiles()
    .filter((file) => isPaletteVisibleFile(app, file))
    .filter((file) => file.path.toLocaleLowerCase().includes(normalized))
    .sort((left, right) => left.path.localeCompare(right.path));
}
