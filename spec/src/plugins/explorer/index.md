# Explorer Plugin

The Design Core dependency refresh consumes released `0.4.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

File Explorer requires published Design Core `^0.3.2` alongside its API peer. Its public artifact remains independently versioned and the release consumes registry dependencies rather than local review tarballs.

File Explorer 0.1.1 records landing-leaf reuse in its independent changelog.
It consumes API 0.1.1 through a portable peer range and retains the existing
plugin identity and public package entry.

Explorer development compiles against the same qualified Svelte version as
the API and workspace under LN-PKG-149, preserving shared Design Core class
identity. Its published dependency ranges and source ownership remain portable.

Dependency acceptance now uses published Design Core `0.3.1` and Mira `0.0.3` through portable npm ranges. Source ownership and public contracts remain
unchanged; local overrides for these released packages are retired.

Explorer resolves Design Core through its portable published semver range and
the shared committed lockfile rather than a sibling source path.

Public `@lapis-notes/file-explorer@0.1.0` owns the reusable Explorer view and its canonical
command opener. Vault, file-manager, workspace navigation, and editor-demo
requirements remain defined at their owning API and host boundaries.

On conditional hosts, Explorer actions enter the owning App's admitted-operation
boundary before reading paths or starting IO. Creation remains admitted through
the existing open-file action, including the landing view's Create new note.
The API and host retain persistence and shutdown policy.

The package exports its production `ExplorerPanel` for Autodocs. Canonical
Storybook coverage remains registration-driven and demonstrates Explorer in
all six command-panel placements under `Plugins/Explorer/Panels/Explorer`.
For the current disposition, opening a file from an active landing root reuses
that root leaf before falling back to the App's normal main-area open policy.

## LN-EXP-001 — Native Copy Path variants

<a id="ln-exp-001"></a>

**Requirement.** When the vault adapter is `NativeDesktopVaultAdapter` and `file-system-actions` is available, Explorer MUST extend Copy Path with From system root and, for files, As Lapis URL. Web and memory vaults MUST NOT show those items.

## LN-EXP-002 — Under the same native gate, Explorer: offer Open in default app and Reveal

<a id="ln-exp-002"></a>

**Requirement.** Under the same native gate, Explorer MUST offer Open in default app and Reveal in Finder, File Explorer, or file manager using existing desktop path IPC. Those extras MUST be absent when the capability is unavailable.

## LN-EXP-003 — Explorer: persist Show hidden files, expose a palette

<a id="ln-exp-003"></a>

**Requirement.** Explorer MUST persist Show hidden files, expose a palette command that toggles it, and hide dotted names at any depth unless it is on, including `.lapis`, `.trash`, and `.lapis`.

### Acceptance details

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

## LN-EXP-004 — Lapis-vault-files provider: declare the Files tab. An empty query

<a id="ln-exp-004"></a>

**Requirement.** The `lapis-vault-files` provider MUST declare the Files tab. An empty query MUST return at most 25 visible recent files, or the first 25 visible paths in lexical order when no recents exist. Design Core MUST cap those provider rows to five in the combined All view. Typed queries MUST keep path filtering and the show-hidden setting.

## LN-EXP-005 — Selected-path navigation API

<a id="ln-exp-005"></a>

**Requirement.** FileExplorerView MUST expose `selectedPath`. `setSelectedPath`, `selectRoot`, and `revealPath` MUST trigger workspace event `file-explorer:selection-change` with that path. Vault root MUST use an empty path.

## LN-EXP-006 — Explorer: refresh its tree after the vault initial

<a id="ln-exp-006"></a>

**Requirement.** Explorer MUST refresh its tree after the vault initial `load` event and after create, delete, and rename events so desktop views mounted during vault startup do not retain a partial tree.

## LN-EXP-007 — Files palette extension allowlist: exposed as the flat workspace.fileExplorer.paletteFileExtensions list setting

<a id="ln-exp-007"></a>

**Requirement.** The Files palette extension allowlist MUST be exposed as the flat `workspace.fileExplorer.paletteFileExtensions` list setting. Its default MUST include Markdown, text, JSON, and YAML/YML source-editor extensions. Values MUST be normalized without leading dots and case-insensitively before filtering; an explicit empty list MUST yield no file results.

## LN-EXP-008 — Protected Explorer deletion

<a id="ln-exp-008"></a>

**Requirement.** Explorer deletion MUST use the owning App's FileManager writer guard. It MUST NOT bypass failed or dirty writers through low-level Vault trash. The existing action and notice presentation MUST remain available for retry after explicit persistence or conflict recovery.

LN-WS-096 projects notices from the explicit App into the existing shared
notification UI and removes that subscription on host disposal. Explorer passes
its owned App to Notice; native error handling keeps the existing presentation.

LN-PKG-178 and LN-PKG-179 add opt-in exclusive creation and source-owned new-file
intent. Existing low-level overwrite behavior and unsupported legacy hosts stay
explicit; Deno host source remains frozen. Admission spans creation projection.
