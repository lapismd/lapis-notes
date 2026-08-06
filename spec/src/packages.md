# Packages

## Requirements

| ID | Requirement |
| --- | --- |
| LN-PKG-001 | `@lapis-notes/api` MUST remain the shared runtime kernel: app container, vault/storage contracts, workspace model, plugins, commands, settings, metadata, and editor abstractions. |
| LN-PKG-002 | `@lapis-notes/api` MUST depend on `@lapis-notes/ui` as a peer for shared UI primitives used by kernel components. |
| LN-PKG-003 | `@lapis-notes/ui` MUST export only the pruned surface required by api (plus documented transitive dependencies). |
| LN-PKG-004 | Host apps, plugins, notebook, and language-service packages MUST NOT be added until their requirements are specified and tracked in `MIGRATION.md`. |
| LN-PKG-005 | Package public exports MUST stay source of truth in each package `package.json` `exports` map. |
| LN-PKG-006 | Vault profile storage kinds MUST be limited to `opfs`, `file-system-access`, and `desktop-folder`. LightningFS / legacy browser IndexedDB vault adapters and host-framework-specific kinds (for example former `tauri-folder`) MUST NOT be retained. |

## `@lapis-notes/api` (kernel slice)

Purpose (condensed from the full Lapis Notes api package):

- `App` as the root service container for workspace, vault, database, plugins,
  commands, settings, metadata, editor, notifications, and related services
- Workspace data model (splits, tabs, leaves, sidebars, ribbons, layout)
- Plugin runtime contracts and distribution primitives
- Vault/storage abstractions: browser OPFS and File System Access adapters,
  plus the desktop-neutral folder bridge (`desktop-folder`)
- Shared editor, menu, settings, and configuration UI building blocks

Out of scope for this minimal repo until specified: web/desktop hosts, bundled
plugins, and plugin-host module generation.

## `@lapis-notes/ui` (pruned)

Overlapping shadcn families are consumed from `@lapismd/design-core/shadcn/*`.
`@lapis-notes/ui` keeps Lapis compounds only: `modal`, `search`,
`confirm-dialog`, `sidebar-custom`, and `table-dnd` (plus helpers). Date/time
settings use design-core `forms` pickers via api `date-setting` (the old
`date-time-picker-dialog` ui compound is retired).
