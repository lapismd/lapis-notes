# Explorer Plugin

Public `@lapis-notes/file-explorer@0.1.0` owns the reusable Explorer view and its canonical
command opener. Vault, file-manager, workspace navigation, and editor-demo
requirements remain defined at their owning API and host boundaries.

The package exports its production `ExplorerPanel` for Autodocs. Canonical
Storybook coverage remains registration-driven and demonstrates Explorer in
all six command-panel placements under `Plugins/Explorer/Panels/Explorer`.
For the current disposition, opening a file from an active landing root reuses
that root leaf before falling back to the App's normal main-area open policy.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-EXP-001 | When the vault adapter is `NativeDesktopVaultAdapter` and `file-system-actions` is available, Explorer MUST extend Copy Path with From system root and, for files, As Lapis URL. Web and memory vaults MUST NOT show those items.                                                                                                                                                         |
| LN-EXP-002 | Under the same native gate, Explorer MUST offer Open in default app and Reveal in Finder, File Explorer, or file manager using existing desktop path IPC. Those extras MUST be absent when the capability is unavailable.                                                                                                                                                                 |
| LN-EXP-003 | Explorer MUST persist Show hidden files, expose a palette command that toggles it, and hide dotted names at any depth unless it is on, including `.obsidian`, `.trash`, and `.lapis`.                                                                                                                                                                                                     |
| LN-EXP-004 | The `lapis-vault-files` provider MUST declare the Files tab. An empty query MUST return at most 25 visible recent files, or the first 25 visible paths in lexical order when no recents exist. Design Core MUST cap those provider rows to five in the combined All view. Typed queries MUST keep path filtering and the show-hidden setting. |
| LN-EXP-005 | FileExplorerView MUST expose `selectedPath`. `setSelectedPath`, `selectRoot`, and `revealPath` MUST trigger workspace event `file-explorer:selection-change` with that path. Vault root MUST use an empty path.                                                                                                                                                                           |
| LN-EXP-006 | Explorer MUST refresh its tree after the vault initial `load` event and after create, delete, and rename events so desktop views mounted during vault startup do not retain a partial tree.                                                                                                                                                                                               |
| LN-EXP-007 | The Files palette extension allowlist MUST be exposed as the flat `workspace.fileExplorer.paletteFileExtensions` list setting. Its default MUST include Markdown, text, JSON, and YAML/YML source-editor extensions. Values MUST be normalized without leading dots and case-insensitively before filtering; an explicit empty list MUST yield no file results. |

### LN-EXP-003 acceptance details

Show-hidden visibility is one preference:

- The Workspace setting and toolbar MUST share `workspace.fileExplorer.showHiddenFiles` with default false.
- The command MUST flip that key and refresh every Explorer view.
- Palette file search MUST honor the same setting.
- Explorer MUST pass every vault path except root to Design Core and MUST NOT pre-filter dotted names.

The Files palette tab starts with a bounded recent-file set, falling back to a
bounded lexical file list for a fresh vault. The combined All view receives at
most five of those rows. A typed query keeps today's path filter. Landing Go to
file opens that tab through `app:go-to-file`.

The extension allowlist is independent from hidden-file visibility. A hidden
YAML file such as `.lapis/**/metadata.yaml` is eligible by extension by default,
but appears in the Files palette only while Show hidden files is enabled.
