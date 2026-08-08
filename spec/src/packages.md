# Packages

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-PKG-001 | `@lapis-notes/api` MUST remain the shared runtime kernel: app container, vault/storage contracts, workspace model, plugins, commands, settings, metadata, and editor abstractions.                                                                              |
| LN-PKG-002 | `@lapis-notes/api` MUST depend on `@lapis-notes/ui` as a peer for shared UI primitives used by kernel components.                                                                                                                                               |
| LN-PKG-003 | `@lapis-notes/ui` MUST export only the pruned surface required by api (plus documented transitive dependencies).                                                                                                                                                |
| LN-PKG-004 | Host apps, notebook, and language-service packages MUST NOT be added until their requirements are specified and tracked in `MIGRATION.md`. The sole authorized plugin package is `@lapis-notes/markdown` (see `markdown-plugin.md`); the workspace integration package is not a host application. |
| LN-PKG-015 | `@lapis-notes/markdown` MUST live at `packages/plugins/plugin-markdown`, depend on `@lapis-notes/api` and sibling Mira packages for document rendering, and MUST preserve the existing Plugin registration and editor config/event contracts without forking them. |
| LN-PKG-005 | Package public exports MUST stay source of truth in each package `package.json` `exports` map.                                                                                                                                                                  |
| LN-PKG-006 | Vault profile storage kinds MUST be limited to `opfs`, `file-system-access`, and `desktop-folder`. LightningFS / legacy browser IndexedDB vault adapters and host-framework-specific kinds (for example former `tauri-folder`) MUST NOT be retained.            |
| LN-PKG-007 | `@lapis-notes/workspace` MUST expose the design-core shell around an application-supplied `App` without providing a production in-memory backend or invoking the Lapis plugin loader.                                                                           |
| LN-PKG-008 | `@lapis-notes/api` MUST configure the owned design-core controller with overridable plain Lapis application metadata and the notifications presentation as the minimal static shell plugin. This MUST remain separate from api plugin loading and distribution. |
| LN-PKG-009 | `@lapis-notes/api` MUST expose the design-core V3 bottom panel through Lapis-native workspace wrappers and controls without leaking design-core types through the root api export.                                                                              |
| LN-PKG-010 | `@lapis-notes/api` MUST expose the reusable volatile vault and concrete source-text view required by the editor demo; application-specific source-editor and Explorer registration policy MUST remain outside the kernel.                                       |
| LN-PKG-011 | CodeMirror Markdown and JSON language packages used by Storybook intake plugins MUST remain root development dependencies rather than runtime dependencies of api or workspace.                                                                                 |
| LN-PKG-012 | `@lapis-notes/api` MUST consume `@lapismd/mira` through the sibling checkout (`file:../mira-mde/packages/mira` at the repo root and pnpm override) for the shared source-editor CodeMirror shell; publishable package manifests MUST use a portable dependency range. |
| LN-PKG-013 | `@lapis-notes/api` MUST paint the source-editor inline filename title with public `--ui-editor-inline-title-*` tokens and MUST contribute file-view breadcrumbs, leaf history, and header title rename (`titleEditable` / `onTitleCommit`) through the workspace-host `getChrome` projection. |
| LN-PKG-014 | `@lapis-notes/api` `markupEditor` MUST accept a language id for `data-language` host attributes, default the editor face to Mira monospace with Markdown/text sans overrides, and mount the Mira-styled CodeMirror fold gutter for language-provided fold ranges when fold settings are enabled. |

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

`@lapis-notes/markdown` is the authorized plugin package for Mira-backed
Markdown views and intaken markdown side panels. Out of scope until specified:
web/desktop hosts, other bundled plugins, notebook, language-service, and
plugin-host module generation.

Brand palette and semantic tokens live in design-core `themes/lapis.css`.
`@lapis-notes/ui/theme.css` is an Obsidian-compatibility alias layer only.
Storybook theme controls and their manager dependencies remain root-only
development tooling rather than package exports or runtime dependencies.
The editor demo's CodeMirror Markdown and JSON language packages follow that
same root-only rule; the source view and editor registry remain language-policy
neutral package contracts. The shared source-editor shell depends on sibling
`@lapismd/mira` for base CodeMirror extensions and Obsidian theme CSS; Mira
Markdown live-preview, toolbars, and rich widgets stay out of the kernel until
separately specified.

## `@lapis-notes/workspace` (shell integration)

The workspace package is a thin Svelte adapter over
`@lapismd/design-core/workspace`. It receives an initialized api `App`, obtains
the host binding from `@lapis-notes/api/workspace-host`, and renders the default
design-core app-shell surface. It contains no vault selector, router, Lapis
plugin bootstrap, persistence implementation, or copied Lapis workspace
renderer.
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
