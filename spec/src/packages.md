# Packages

## Requirements

| ID | Requirement |
| --- | --- |
| LN-PKG-001 | `@lapis-notes/api` MUST remain the shared runtime kernel: app container, vault/storage contracts, workspace model, plugins, commands, settings, metadata, and editor abstractions. |
| LN-PKG-002 | `@lapis-notes/api` MUST depend on `@lapis-notes/ui` as a peer for shared UI primitives used by kernel components. |
| LN-PKG-003 | `@lapis-notes/ui` MUST export only the pruned surface required by api (plus documented transitive dependencies). |
| LN-PKG-004 | Host apps, plugins, notebook, and language-service packages MUST NOT be added until their requirements are specified and tracked in `MIGRATION.md`; the specified workspace integration package is not a host application. |
| LN-PKG-005 | Package public exports MUST stay source of truth in each package `package.json` `exports` map. |
| LN-PKG-006 | Vault profile storage kinds MUST be limited to `opfs`, `file-system-access`, and `desktop-folder`. LightningFS / legacy browser IndexedDB vault adapters and host-framework-specific kinds (for example former `tauri-folder`) MUST NOT be retained. |
| LN-PKG-007 | `@lapis-notes/workspace` MUST expose the design-core shell around an application-supplied `App` without importing optional plugin packages or providing a production in-memory backend. |

## `@lapis-notes/api` (kernel slice)

Purpose (condensed from the full Lapis Notes api package):

- `App` as the root service container for workspace, vault, database, plugins,
  commands, settings, metadata, editor, notifications, and related services
- Workspace data model (splits, tabs, leaves, sidebars, ribbons, layout)
- Host-only design-core controller binding at `./workspace-host`; the root api
  export remains the Lapis compatibility surface
- Plugin runtime contracts and distribution primitives
- Vault/storage abstractions: browser OPFS and File System Access adapters,
  plus the desktop-neutral folder bridge (`desktop-folder`)
- Shared editor, menu, settings, and configuration UI building blocks

Out of scope for this minimal repo until specified: web/desktop hosts, bundled
plugins, and plugin-host module generation.

Brand palette and semantic tokens live in design-core `themes/lapis.css`.
`@lapis-notes/ui/theme.css` is an Obsidian-compatibility alias layer only.
Storybook theme controls and their manager dependencies remain root-only
development tooling rather than package exports or runtime dependencies.

## `@lapis-notes/workspace` (shell integration)

The workspace package is a thin Svelte adapter over
`@lapismd/design-core/workspace`. It receives an initialized api `App`, obtains
the host binding from `@lapis-notes/api/workspace-host`, and renders the default
design-core app-shell surface. It contains no vault selector, router, plugin
bootstrap, persistence implementation, or copied Lapis workspace renderer.
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
