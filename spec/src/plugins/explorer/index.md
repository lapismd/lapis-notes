# Explorer Plugin

`@lapis-notes/file-explorer` owns the reusable Explorer view and its canonical
command opener. Vault, file-manager, workspace navigation, and editor-demo
requirements remain defined at their owning API and host boundaries.

The package exports its production `ExplorerPanel` for Autodocs. Canonical
Storybook coverage remains registration-driven and demonstrates Explorer in
all six command-panel placements under `Plugins/Explorer/Panels/Explorer`.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-EXP-001 | When the vault adapter is `NativeDesktopVaultAdapter` and `file-system-actions` is available, Explorer MUST extend Copy Path with From system root and, for files, As Lapis URL. Web and memory vaults MUST NOT show those items. |
| LN-EXP-002 | Under the same native gate, Explorer MUST offer Open in default app and Reveal in Finder, File Explorer, or file manager using existing desktop path IPC. Those extras MUST be absent when the capability is unavailable.         |
| LN-EXP-003 | Explorer MUST persist Show hidden files, expose a palette command that toggles it, and hide dotted names at any depth unless it is on, including `.obsidian`, `.trash`, and `.lapis`.                                             |

### LN-EXP-003 acceptance details

Show-hidden visibility is one preference:

- The Workspace setting and toolbar MUST share `workspace.fileExplorer.showHiddenFiles` with default false.
- The command MUST flip that key and refresh every Explorer view.
- Palette file search MUST honor the same setting.
- Explorer MUST pass every vault path except root to Design Core and MUST NOT pre-filter dotted names.
