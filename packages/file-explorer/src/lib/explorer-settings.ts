export const EXPLORER_SETTINGS_SECTION_ID = "lapis-file-explorer";

export const EXPLORER_SETTING_IDS = {
  autoRevealCurrentFile: "workspace.fileExplorer.autoRevealCurrentFile",
  showHiddenFiles: "workspace.fileExplorer.showHiddenFiles",
  paletteFileExtensions: "workspace.fileExplorer.paletteFileExtensions",
} as const;

export const DEFAULT_VAULT_PALETTE_FILE_EXTENSIONS = [
  "md",
  "markdown",
  "txt",
  "text",
  "json",
  "data",
  "yaml",
  "yml",
] as const;
