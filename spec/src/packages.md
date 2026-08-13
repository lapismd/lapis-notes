# Packages

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-PKG-001 | `@lapis-notes/api` MUST remain the shared runtime kernel: app container, vault/storage contracts, workspace model, plugins, commands, settings, metadata, and editor abstractions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-PKG-002 | `@lapis-notes/api` MUST depend on `@lapis-notes/ui` as a peer for shared UI primitives used by kernel components.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| LN-PKG-003 | `@lapis-notes/ui` MUST export only the pruned surface required by api (plus documented transitive dependencies).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-PKG-004 | Notebook and unlisted plugin packages MUST NOT be added until specified and tracked in `MIGRATION.md`. The authorized hosts are Electron and web; authorized plugins are Markdown, Markdownlint, File Explorer, and Search. |
| LN-PKG-015 | `@lapis-notes/markdown` MUST live at `packages/plugins/plugin-markdown`, depend on `@lapis-notes/api` and sibling Mira packages, and preserve the existing Plugin registration and editor configuration/event contracts without forking them. |
| LN-PKG-005 | Package public exports MUST stay source of truth in each package `package.json` `exports` map.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| LN-PKG-006 | Vault profile storage kinds MUST be limited to `opfs`, `file-system-access`, and `desktop-folder`. LightningFS / legacy browser IndexedDB vault adapters and host-framework-specific kinds (for example former `tauri-folder`) MUST NOT be retained.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| LN-PKG-007 | `@lapis-notes/workspace` MUST expose the design-core shell around an application-supplied `App` without providing a production in-memory backend or invoking the Lapis plugin loader.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| LN-PKG-008 | `@lapis-notes/api` MUST configure the owned design-core controller with overridable plain Lapis application metadata and the notifications presentation as the minimal static shell plugin. This MUST remain separate from api plugin loading and distribution.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-PKG-009 | `@lapis-notes/api` MUST expose the design-core V3 bottom panel through Lapis-native workspace wrappers and controls without leaking design-core types through the root api export.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-PKG-010 | `@lapis-notes/api` MUST expose the reusable volatile vault and concrete source-text view required by the editor demo; application-specific source-editor and Explorer registration policy MUST remain outside the kernel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| LN-PKG-011 | CodeMirror Markdown and JSON language packages used by Storybook intake plugins MUST remain root development dependencies rather than runtime dependencies of api or workspace.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-PKG-012 | `@lapis-notes/api` MUST consume `@lapismd/mira` through the sibling checkout (`link:../mira-mde/packages/mira` at the repo root and pnpm override) and its built public exports for the shared source-editor CodeMirror shell; publishable package manifests MUST use a portable dependency range.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-PKG-013 | `@lapis-notes/api` MUST paint the source-editor inline filename title with public `--ui-editor-inline-title-*` tokens and MUST contribute file-view breadcrumbs, leaf history, and header title rename (`titleEditable` / `onTitleCommit`) through the workspace-host `getChrome` projection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| LN-PKG-014 | `@lapis-notes/api` `markupEditor` MUST accept a language ID for `data-language` host attributes and default the editor face to Mira monospace with Markdown and text sans overrides. |
| LN-PKG-016 | `@lapismd/storybook-addon-visual-delta` MUST remain a private root development dependency resolved from `link:../storybook-addon-visual-delta`; it MUST NOT enter api, ui, workspace, or plugin package manifests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-PKG-017 | `@lapis-notes/markdown` MUST publicly export app-only Svelte components for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags as documented by their owning panel pages. The public Outline and Tags surfaces MUST preserve their governed tree geometry without requiring consumer styling, and `@lapis-notes/workspace` MUST remain shell-only.                                                                                                                                                                                                                                                                                                                                                         |
| LN-PKG-043 | `@lapis-notes/file-explorer` MUST own the reusable File Explorer plugin implementation formerly co-located with Storybook. It MAY adapt API vault contracts to public Design Core presentation, but MUST NOT own vault selection, session boot, persistence policy, or source-editor fixtures. |
| LN-PKG-044 | `@lapis-notes/search` MUST publicly expose its plugin, grouped result panel, manager, settings model, semantic status, and settings tab. It MUST consume API database contracts and Design Core presentation without moving vault search policy into `@lapis-notes/workspace`. |
| LN-PKG-045 | `@lapis-notes/api` MUST export provider-neutral app-database descriptors, capabilities, factories, and session integration while retaining explicit database injection for tests and Storybook. |
| LN-PKG-046 | Private `@lapis-notes/web` version `2026.6.3` MUST live at `packages/web` and expose `dev`, `build`, `check`, and `test` scripts. |
| LN-PKG-047 | Production app-database persistence MUST use pinned Turso native or WASM packages. SQLite, sqlite-vec, and IndexedDB app-database implementations MUST NOT remain as importers or fallbacks. |
| LN-PKG-018 | `@lapis-notes/markdown` MUST expose its reusable Mira-backed `FileEmbed`, `MarkdownEmbed`, and `NoteLink` surfaces through the root package and the narrow `@lapis-notes/markdown/embed` export. |
| LN-PKG-019 | The public Lapis `FileEmbed` wrapper MUST add optional `editable` and bindable `editing` inputs while defaulting to its existing read-only behavior. Editable full-note rendering MUST compose Mira's public `EditableMarkdownPreview`; direct `MarkdownEmbed`, `NoteLink`, and ordinary `FileEmbed` consumers MUST remain source-compatible. The package adapter owns only Lapis vault resolution and persistence, while Mira owns activation, CodeMirror, autosave serialization, dirty-buffer protection, and preview/editor mode changes.                                                                                                                                                                                                                                                                                                                                                                                          |
| LN-PKG-020 | Editable `FileEmbed` MUST expose an imperative `exit()` that delegates to Mira's persistence-safe editable-preview exit contract and accept an additive `returnToPreviewOnBlur` input. Link-panel consumers MUST disable blur exit and use the imperative operation for outside-click dismissal; default and read-only consumers MUST remain source-compatible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-PKG-021 | The Lapis `FileEmbed` wrapper MUST establish `data-mira-theme="obsidian"` for its portable Mira descendants. Editable-card padding MUST target only the rendered preview branch of `EditableMarkdownPreview`; it MUST NOT match CodeMirror's nested rendered widgets or change live-edit frontmatter geometry. No new public component input is introduced.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| LN-PKG-022 | Retained `sidebar-custom` wrappers around design-core Input and Separator MUST publish portable component declarations. Their explicit public prop types MUST derive from design-core's public component contracts, and generated `@lapis-notes/ui` declarations MUST NOT name sibling-repository `node_modules` realpaths or dependency-internal Svelte/Bits UI installations. Runtime markup, bindings, and accepted props remain unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| LN-PKG-023 | `@lapis-notes/api` `markupEditor` MUST mount the configured CodeMirror fold gutter when language ranges and settings enable it. The Markdown integration MUST be able to suppress that gutter because Mira supplies inline fold controls. |
| LN-PKG-024 | The API-owned editor ScrollArea MUST fill without exceeding its workspace view and own long-document scrolling. Its nested CodeMirror scroller MUST expand without a vertical scrollbar. |
| LN-PKG-025 | `@lapis-notes/markdown` MUST export the real `AllProperties` Svelte component with only `app: App` as its input so Storybook documents the package interface rather than its placement harness. |
| LN-PKG-026 | Shared movable-panel chrome MUST consume design-core's resolved workspace-view foreground and background tokens without duplicating workspace placement detection or surface selectors. |
| LN-PKG-027 | Specialist Markdown panel content MUST shrink to the complete available inline size and MUST NOT request two-axis panel scrolling to preserve a fixed internal width. |
| LN-PKG-028 | Lapis embed wrappers MUST bind Mira's portable rendering contract to an explicit `app: App` without copying Mira's renderer or requiring consumer-owned source aliases. |
| LN-PKG-029 | Link-panel previews MUST compose Design Core Hover Card, use a viewport-capped 26rem width, follow the trigger document, and remain open during pointer or focus handoff from the full mention row into interactive content. |
| LN-PKG-030 | Ordinary document-link previews MUST remain owned by Mira's built package and receive only Lapis's `MiraFileAdapter`. The Markdown package MUST NOT add a consumer portal or clipping workaround. |
| LN-PKG-031 | `@tobilu/qmd` 2.5.3 MUST remain a pinned root development dependency. Its native build approvals and TypeScript peer MUST remain root tooling and MUST NOT enter workspace package manifests. |
| LN-PKG-032 | `@lapis-notes/api` MUST own the ordered adapter from compatibility `ItemView.actions` and `View.onPaneMenu` contributions to design-core workspace chrome. `@lapis-notes/workspace` remains a rendering host and MUST NOT add plugin-specific actions. |
| LN-PKG-033 | `@lapis-notes/markdown` MUST render grouped Boolean Settings through design-core's public `WorkspaceSettingGroup` toggle-table contract. It MUST NOT introduce a package-local settings table or stored group value. |
| LN-PKG-034 | `@lapis-notes/language-service` MUST live at `packages/language-service` as an internal provider-neutral Markdown client and worker package. It MUST expose build, check, and test scripts without owning workspace presentation or vault navigation. |
| LN-PKG-035 | `@lapis-notes/markdown-lint` MUST live at `packages/plugins/plugin-markdown-lint` as an enabled-by-default core plugin. It MUST depend on the API and internal language-service contracts without importing Design Core presentation. |
| LN-PKG-036 | `@lapis-notes/api` MUST provide compact, interactive CodeMirror diagnostic hover cards and centered severity gutter markers. The card MUST remain stable while the pointer enters its controls. The implementation MUST consume public Design Core icons without importing Problems presentation internals. |
| LN-PKG-037 | `@lapis-notes/api` MUST style the CodeMirror inline problem created by `View Problem` through the editor stylesheet and public workspace tokens. The widget MUST NOT depend on application-global utility CSS. |
| LN-PKG-038 | Executing `View Problem` MUST dismiss its originating hover card and clear the active diagnostic before rendering the inline problem. Closing the inline problem MUST leave later hover discovery operational. |
| LN-PKG-039 | `@lapis-notes/desktop-electron` MUST be a private package at `packages/desktop-electron`, retain version `2026.31.5`, and expose the common `build`, `check`, and `test` scripts. |
| LN-PKG-040 | `@lapis-notes/language-service` MUST export `./markdownlint/runtime` for the Electron Markdown sidecar. The desktop package MUST consume that export instead of copying the runtime or importing package source paths. |
| LN-PKG-041 | `@lapis-notes/desktop-electron` MUST consume launcher primitives from public Design Core exports and Lapis helpers from public package exports. It MUST keep launcher policy and native session switching inside the desktop package. |
| LN-PKG-042 | `@lapis-notes/workspace` MAY forward Design Core's generic workspace-navigation contract to its shell surface, but profile discovery, vault labels, selection, management, persistence, and lifecycle policy MUST remain consumer-owned. |

The API package delegates reusable diagnostic state and presentation to Design
Core while exporting only Lapis-owned structural types and lifecycle helpers.
Live Problems totals therefore use Design Core's structured, ephemeral view
badge and never enter Lapis layout state or package-owned panel markup.
Its narrow editor core and language-service subpaths let Markdown compose the
source shell and diagnostics without importing the editor component barrel or
its unrelated UI runtime.
The worker client uses a narrow API subpath so provider workers never load the
application manager or presentation modules.

The public Search panel keeps database snippet text paired with its highlight
ranges. Its package-owned result layout follows `LN-SRCH-023`; consumers do not
reposition counts, metadata badges, or child result surfaces with
placement-specific CSS. The package exposes semantic runtime state through its
status API and keeps the movable panel free of a persistent status tag. Content
matches expand from their indexed file offsets, while public Search tokens own
highlight paint and consumers remain free of result-row overrides. The panel
keeps expanded slices stable across recent-query persistence and resets them
only when search inputs change or the index explicitly refreshes. Expanded
result bodies use the workspace background in every placement, and navigation
does not replace a Search leaf that has been moved into the body.

## `@lapis-notes/api` (kernel slice)

Purpose (condensed from the full Lapis Notes api package):

- `App` as the root service container for workspace, vault, database, plugins,
  commands, settings, metadata, editor, notifications, and related services
- Workspace data model (splits, tabs, leaves, sidebars, bottom panel, ribbons,
  layout)
- Stable `WorkspaceBottomPanel` tabs wrapper plus bottom-leaf, open, size,
  toggle, and live alignment controls; root api exports remain design-core-free
- Host-only design-core controller binding at `./workspace-host`; the root api
  export remains the Lapis compatibility surface
- Compatibility view-action and pane-menu projection into design-core chrome,
  preserving plugin contributions without moving their policy into the shell
- Plain workspace-shell metadata overrides, with Lapis name/version/logo
  defaults and the design-core notification presentation
- Plugin runtime contracts and distribution primitives
- Vault/storage abstractions: browser OPFS and File System Access adapters,
  plus the desktop-neutral folder bridge (`desktop-folder`)
- Shared editor, menu, settings, and configuration UI building blocks
- Public deterministic in-memory vault storage and a policy-free source-text
  view for tests, Storybook, and explicitly volatile consumers

`MemoryVaultAdapter` implements the complete data-adapter surface, explicit
non-persistent capabilities, binary-safe copies, deterministic metadata, and a
stable vault identity. `SourceTextFileView` mounts the existing `NoteEditor` and
delegates language behavior to registered editor extensions.

`@lapis-notes/markdown` owns Mira-backed Markdown views and intaken Markdown
side panels. `@lapis-notes/markdown-lint` and the internal
`@lapis-notes/language-service` package are the focused diagnostics exceptions.
Other bundled plugins, notebook, and plugin-host module generation remain out
of scope until separately specified. Desktop and web hosts are authorized by
their canonical host chapters.
Storybook exercises those registered panel views through the separate
`@lapis-notes/workspace` shell adapter; movable-surface fixtures remain consumer
verification and do not move workspace rendering ownership into the markdown
package. Design-core's `WorkspaceViewHost` selects body, sidebar, bottom, and
grouped paint and exposes the resolved public view tokens; the shared markdown
panel shell consumes those tokens and carries no placement selectors or cached
placement state.

Brand palette and semantic tokens live in design-core `themes/lapis.css`.
`@lapis-notes/ui/theme.css` is an Obsidian-compatibility alias layer only.
Storybook theme controls and their manager dependencies remain root-only
development tooling rather than package exports or runtime dependencies.
Specification scripts and their tests remain root tooling under
`scripts/spec-validation/`; they do not belong to a runtime package.
The QMD CLI and its local native dependencies follow that root-only rule.
The editor demo's CodeMirror Markdown and JSON language packages follow that
same root-only rule; the source view and editor registry remain language-policy
neutral package contracts. The shared source-editor shell depends on sibling
`@lapismd/mira` for base CodeMirror extensions and Obsidian theme CSS. The
Markdown plugin composes the public Mira authoring stack with that duplicate
base layer disabled, imports the public Mira Editor stylesheet for its optional
toolbar, and preserves borderless Lapis editing and Reading surfaces. Toolbar
controls persist only through API configuration. Consumers must not reconstruct
the portable Mira feature stack from internal source modules.

The private desktop package consumes API, workspace, Design Core, the internal
language service, and Markdownlint only while building its bundled renderer and
Markdown child. Its packaged runtime dependencies are limited to `chokidar`,
the pinned native Turso driver, and the local Transformers runtime. Electron
main otherwise uses Electron and Node built-ins; Intel macOS consumes the
pinned Turso WASM driver declared by API. The API manifest
declares `dist/enhance.js` and its source counterpart as side effects so a
production consumer cannot tree-shake the compatibility DOM initialization
required before constructing `App`.

The private web package consumes the public API, current core plugins,
workspace, and Design Core presentation. It owns browser vault selection,
Workbox, window-controls overlay state, and web-session lifecycle; its
production database dependency remains the pinned API-owned Turso WASM
provider rather than a package-local persistence implementation.

Its launcher imports shadcn presentation from Design Core and profile/search
helpers from public Lapis exports. It does not add launcher policy to the
workspace package or copy a private UI implementation.
The renderer consumes Design Core's public `styles.css` and Lapis theme export
instead of reconstructing workspace CSS. The desktop-only Vite Tailwind pass is
limited to compiling the intaken launcher composition and does not move native
selection or session policy into a shared package. Scoped desktop CSS owns
launcher overlay geometry and class-selected native window-control clearance.
The development renderer adds the real linked Design Core package root to its
narrow Vite filesystem allowlist so public stylesheet assets remain available.

`@lapis-notes/language-service/markdownlint/runtime` is the Node-compatible
boundary for desktop diagnostics and code actions. Plugin asset URLs continue
to use public API helpers; their versioned Electron form stores path-bearing
vault IDs in a URL path segment and the parser retains legacy-host support.

## `@lapis-notes/workspace` (shell integration)

The workspace package is a thin Svelte adapter over
`@lapismd/design-core/workspace`. It receives an initialized api `App`, obtains
the host binding from `@lapis-notes/api/workspace-host`, and renders the default
design-core app-shell surface. It may forward Design Core's generic
workspace-navigation presentation contract, but contains no vault discovery or
selection policy, router, Lapis plugin bootstrap, persistence implementation,
or copied Lapis workspace renderer.
Its package contract exports `WorkspaceShell` and its component CSS, and its
mount test supplies a real initialized api `App` while asserting plugin loading
remains consumer-owned.

## `@lapis-notes/ui` (pruned)

Overlapping shadcn families are consumed from `@lapismd/design-core/shadcn/*`.
`@lapis-notes/ui` keeps Lapis compounds only: `modal`, `search`,
`confirm-dialog`, `sidebar-custom`, and `table-dnd` (plus helpers), each painted
with colocated CSS and `--ui-*` tokens (no Tailwind utilities in sources).
Date/time settings use design-core `forms` pickers via api `date-setting` (the
old `date-time-picker-dialog` ui compound is retired).
