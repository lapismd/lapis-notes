import type { App, TFile } from "@lapis-notes/api";
import {
  DEFAULT_VAULT_PALETTE_FILE_EXTENSIONS,
  EXPLORER_SETTING_IDS,
} from "./explorer-settings";
import { isVisibleExplorerPath } from "./vault-path-visibility";

export const VAULT_PALETTE_FILES_TAB = {
  id: "files",
  label: "Files",
  order: 20,
} as const;

export const VAULT_PALETTE_RECENT_GROUP = "Recent";
export const VAULT_PALETTE_EMPTY_QUERY_LIMIT = 25;

function readShowHiddenFiles(app: App): boolean {
  return app.configuration
    .getConfiguration()
    .get(EXPLORER_SETTING_IDS.showHiddenFiles, false);
}

function readPaletteFileExtensions(app: App): Set<string> {
  const configured = app.configuration
    .getConfiguration()
    .get<unknown>(EXPLORER_SETTING_IDS.paletteFileExtensions, [
      ...DEFAULT_VAULT_PALETTE_FILE_EXTENSIONS,
    ]);
  if (!Array.isArray(configured)) {
    return new Set(DEFAULT_VAULT_PALETTE_FILE_EXTENSIONS);
  }

  return new Set(
    configured
      .filter((extension): extension is string => typeof extension === "string")
      .map((extension) => extension.trim().replace(/^\.+/, "").toLowerCase())
      .filter(Boolean),
  );
}

function isPaletteVisibleFile(
  file: TFile,
  showHiddenFiles: boolean,
  paletteFileExtensions: ReadonlySet<string>,
): boolean {
  return (
    isVisibleExplorerPath(file.path, {
      showHidden: showHiddenFiles,
    }) && paletteFileExtensions.has(file.extension.toLowerCase())
  );
}

export function listVaultPaletteFiles(app: App, query: string): TFile[] {
  const normalized = query.trim().toLocaleLowerCase();
  const showHiddenFiles = readShowHiddenFiles(app);
  const paletteFileExtensions = readPaletteFileExtensions(app);
  const isVisible = (file: TFile) =>
    isPaletteVisibleFile(file, showHiddenFiles, paletteFileExtensions);
  if (!normalized) {
    const recent = app.workspace
      .getRecentFiles()
      .filter(isVisible)
      .slice(0, VAULT_PALETTE_EMPTY_QUERY_LIMIT);
    if (recent.length > 0) return recent;
  }
  return app.vault
    .getFiles()
    .filter(isVisible)
    .filter((file) => file.path.toLocaleLowerCase().includes(normalized))
    .sort((left, right) => left.path.localeCompare(right.path))
    .slice(0, normalized ? undefined : VAULT_PALETTE_EMPTY_QUERY_LIMIT);
}
