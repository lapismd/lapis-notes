# Explorer Plugin

`@lapis-notes/file-explorer` owns the reusable Explorer view and its canonical
command opener. Vault, file-manager, workspace navigation, and editor-demo
requirements remain defined at their owning API and host boundaries.

The package exports its production `ExplorerPanel` for Autodocs. Canonical
Storybook coverage remains registration-driven and demonstrates Explorer in
all six command-panel placements under `Plugins/Explorer/Panels/Explorer`.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-EXP-001 | When the vault adapter is `NativeDesktopVaultAdapter` and `file-system-actions` is available, Explorer MUST extend Copy Path with From system root and, for files, As Lapis URL. Web and memory vaults MUST NOT show those items. |
| LN-EXP-002 | Under the same native gate, Explorer MUST offer Open in default app and Reveal in Finder, File Explorer, or file manager using existing desktop path IPC. Those extras MUST be absent when the capability is unavailable. |
