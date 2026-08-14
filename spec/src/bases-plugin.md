# Bases Plugin

## Requirements

| ID | Requirement |
| --- | --- |
| LN-BASE-001 | `@lapis-notes/bases` MUST preserve the clean legacy package behavior from `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-bases` at revision `8ec68e18`. It MUST use runtime ID `bases`, ship as an optional bundled plugin, default enabled, and remain user-disableable through the core lifecycle. |
| LN-BASE-002 | The plugin MUST associate `.base` and `.bases` files with `BasesViewType`. A file view MUST switch between preview and YAML source, persist configuration edits, reopen through the editor association, and MUST NOT create a default Bases leaf. |
| LN-BASE-003 | Bases documents MUST normalize supported YAML into a stable document model while preserving unknown custom-view configuration. Writes MUST be serialized so rapid edits cannot reorder vault state, and the latest pending write MUST flush when a view or plugin unloads. |
| LN-BASE-004 | Query execution MUST push supported candidates into `AppDatabase`, apply final PEaQL evaluation, and invalidate results when relevant metadata changes. When no app database is available, metadata-cache enumeration MUST provide the compatible fallback instead of making the view unusable. |
| LN-BASE-005 | The renderer MUST provide table, cards, list, explicit map-unavailable, unknown-view, and API-registered custom layouts. Unknown layouts and unsupported map configuration MUST remain inspectable without silently changing the document's selected view type. |
| LN-BASE-006 | Bases workflows MUST support search, filters, sorting, grouping, property visibility, formulas, summaries, limits, view add/rename/duplicate/delete and layout changes, new-file creation, and CSV export. Custom view options MUST preserve text, number, toggle, select, slider, and property selectors. |
| LN-BASE-007 | Text, number, checkbox, date, tags, and supported metadata cells MUST edit the target file's frontmatter and refresh query results. File-derived and formula-derived fields MUST remain immutable, while file links MUST navigate through the injected App. |
| LN-BASE-008 | Markdown integration MUST render `.base` file embeds and `base` or `bases` fenced YAML blocks through a read-only Bases surface. Invalid YAML MUST render a bounded error state, and teardown MUST revoke created image URLs and dispose query resources. |
| LN-BASE-009 | The package MUST export default and named `BasesPlugin`, `BasesViewType`, `BasesViewSurface`, `parseBasesDocument`, `serializeBasesDocument`, and consumer document/view types. `BasesViewSurface` MUST accept `app`, `document`, optional `onChange`, `readOnly`, `showHeader`, and optional `BasesViewRegistration` mappings. |
| LN-BASE-010 | Production presentation MUST compose public Design Core primitives with Bases-owned semantic classes, `data-ui-component` or `data-ui-part` markers, native CSS, and `--ui-bases-*` tokens. Runtime code MUST receive `App` explicitly and MUST NOT read a global application singleton. |
| LN-BASE-011 | Governed Storybook coverage MUST exercise public table, cards, grouped-list, map-unavailable, unknown-view, workflow, schema/settings, editable-cell, real file-view, Markdown-embed, and disable/restore scenarios. Every scenario MUST include interaction assertions and remain `visual-pending` until human review. |
| LN-BASE-012 | The port MUST document real-map, Obsidian wrapper/formula, `this` binding, richer file/link, grouped-summary, duplicated runtime-model, stub-formula, and name-only parity gaps. It MUST NOT add Tasks-owned views or claim full Obsidian behavior. |

## Public surface

`BasesViewSurface` is the focused rendering boundary. Consumers provide an
`App` and normalized document; file-view persistence, Markdown processors, and
managed-plugin lifecycle remain `BasesPlugin` responsibilities. Built-in view
registrations combine with App registrations unless an explicit mapping
overrides a matching type.

## Presentation and workflow components

The table surface owns virtual rows, sortable and draggable columns, inline
metadata editing, and summaries. Cards own cover resolution and URL cleanup.
List owns collapsible groups. Map and unknown surfaces are explicit bounded
fallbacks. Header and settings compounds own query controls, schema visibility,
formulas, summaries, limits, view management, new-file, and CSV workflows.

## Intentional parity gaps

This intake preserves the legacy package rather than expanding it. A real map
provider, complete Obsidian value wrappers and method-style formula semantics,
`this` binding, richer file/link behavior, deeper grouped summaries, removal of
the compatibility/runtime duplication, and behavioral parity beyond exported
name comparison remain future work tracked in `MIGRATION.md`.
