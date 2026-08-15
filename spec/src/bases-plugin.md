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
| LN-BASE-007 | Text, number, checkbox, date, tags, and supported metadata cells MUST edit the target file's frontmatter and refresh query results. Text-like cells MUST use normal autocomplete controls without search icons, offer existing metadata values, and paint an opaque table-cell surface. Tag and multivalue controls MUST wrap their values and expand the owning table row. File-derived and formula-derived fields MUST remain immutable, while file links MUST navigate through the injected App. |
| LN-BASE-008 | Markdown integration MUST render `.base` file embeds and `base` or `bases` fenced YAML blocks through a read-only Bases surface. Invalid YAML MUST render a bounded error state, and teardown MUST revoke created image URLs and dispose query resources. |
| LN-BASE-009 | The package MUST export default and named `BasesPlugin`, `BasesViewType`, `BasesViewSurface`, `parseBasesDocument`, `serializeBasesDocument`, and consumer document/view types. Its source and built entrypoints MUST import without changing static query-type metadata. `BasesViewSurface` MUST accept `app`, `document`, optional `onChange`, `readOnly`, `showHeader`, and optional `BasesViewRegistration` mappings. |
| LN-BASE-010 | Production presentation MUST compose public Design Core primitives with Bases-owned semantic classes, `data-ui-component` or `data-ui-part` markers, native CSS, and `--ui-bases-*` tokens. Runtime code MUST receive `App` explicitly and MUST NOT read a global application singleton. |
| LN-BASE-011 | Governed Storybook coverage MUST exercise public table, cards, grouped-list, map-unavailable, unknown-view, workflow, schema/settings, editable-cell, a real editor shell with File Explorer and visible indexed Search, real file-view, Markdown-embed, and disable/restore scenarios. Every scenario MUST include interaction assertions and remain `visual-pending` until human review. |
| LN-BASE-012 | The port MUST document real-map, Obsidian wrapper/formula, `this` binding, richer file/link, grouped-summary, duplicated runtime-model, stub-formula, and name-only parity gaps. It MUST NOT add Tasks-owned views or claim full Obsidian behavior. |
| LN-BASE-013 | Table, cards, and list presentation MUST retain the reference geometry and control density at the Bases boundary while using current Design Core theme tokens and accessible contrast. Editable table checkboxes MUST be centered 1rem squares. Table headers, rows, and summaries MUST share one ordered width model and remain aligned before, during, and after column resizing and horizontal scrolling. Wrapped variable-height rows MUST preserve shared cell boundaries and measured virtual and sticky-group offsets. |
| LN-BASE-014 | The bundled plugin MUST register the complete legacy surface: the `bases` view, `.base` and `.bases` editor association, extension aliases, read-only embeds and fenced blocks, preview/source toolbar actions, and Table, Unknown, Cards, List, and Map view items. It MUST NOT invent palette, ribbon, status, or settings commands absent from the legacy plugin. |
| LN-BASE-015 | Bases source mode MUST register and apply a CodeMirror YAML language pack through the `bases` editor view. The source editor host MUST expose `data-language="yaml"`, highlight YAML syntax for both `.base` and `.bases`, and restore the same extensions after mode changes without changing the file-view association. |
| LN-BASE-016 | A focused editable table cell MUST paint one continuous inset active boundary at all four corners. The boundary MUST be owned by the outer cell, MUST NOT be duplicated by nested editor wrappers, and MUST NOT alter the row's shared height or column geometry. |
| LN-BASE-017 | An autocomplete suggestion popover MUST close when focus leaves its field or an outside interaction dismisses it. Dismissal MUST NOT restore focus to the trigger and reopen the list. |
| LN-BASE-018 | Every cell in a wrapped variable-height row MUST align its primary content to the row start. Text, number, date, checkbox, file, folder, tag, and multivalue cells MUST share that vertical origin while checkboxes remain horizontally centered. |
| LN-BASE-019 | An open Bases autocomplete suggestion popover MUST imply an active editing input. Opening a field with an existing value MUST focus and select that value, initially expose alternative suggestions, and allow pointer or keyboard replacement without an extra activation click. Clicks targeting the cell surface or rendered value text MUST establish the same editing state. |
| LN-BASE-020 | The table viewport MUST fill the available vertical Bases surface and compose Design Core's public shadcn Scroll Area for horizontal and vertical overflow. Its styled horizontal scrollbar MUST remain visible at the bottom edge of that full-height container, and the Scroll Area viewport MUST remain the single scroll element that drives row and column virtualization. |
| LN-BASE-021 | Selected property, sort, and group indicators plus checked editable booleans MUST use the Bases accent fill with a white on-accent glyph. Unchecked controls MUST retain an opaque white surface and visible boundary in the Lapis light theme. |
| LN-BASE-022 | The filter popover MUST preserve the legacy 45svw width while remaining bounded by the available viewport. Its panel and segmented filter row MUST use the opaque workspace surface rather than sidebar paint. |
| LN-BASE-023 | All-views and this-view filter disclosure triggers MUST place their indicators at the inline start through the public Design Core Accordion contract. Indicators MUST point right when collapsed and down when expanded. Disclosure semantics and keyboard behavior MUST remain unchanged. |
| LN-BASE-024 | Filter-builder value editors MUST vertically align with their segmented row. Group and operator selects MUST retain a visible selected label and paint their option content above the parent filter popover at the trigger anchor. Advanced filter expressions MUST apply syntax-token colors to parsed CodeMirror spans. |
| LN-BASE-025 | The table MUST omit an outer bottom and inline-end container frame while retaining its internal row and column grid. The last row MUST retain its bottom separator. Scrollbar tracks MUST meet the container edge without reintroducing the outer frame. |
| LN-BASE-026 | An initial blank filter row MUST count as the first predicate. The first Add Filter activation MUST preserve that predicate and append a second visible row rather than replacing the placeholder with an indistinguishable placeholder. |
| LN-BASE-027 | The sticky table header MUST remain above scrolling table rows but below portaled filter panels. Opening Filter MUST produce an opaque hit-tested panel over every intersecting header cell, while its nested Select portals remain above the panel. |
| LN-BASE-028 | The Sort and Filter outer popovers MUST resolve the same 45svw width and the same viewport maximum. Sort's internal Scroll Area MUST fill that shared width rather than retaining the former 25svw constraint. |

## Public surface

`BasesViewSurface` is the focused rendering boundary. Consumers provide an
`App` and normalized document; file-view persistence, Markdown processors, and
managed-plugin lifecycle remain `BasesPlugin` responsibilities. Built-in view
registrations combine with App registrations unless an explicit mapping
overrides a matching type.
Focused view stories boot the optional bundled plugin against the canonical
Projects seed before mounting this public surface.

The port keeps query and TanStack-to-Svelte adapters private. Package evidence
retains the legacy 14-file / 142-test baseline and adds regressions for explicit
App flow, ordered and flushed writes, URL revocation, invalid read-only YAML,
and the published entrypoint without expanding the public surface.
Electron, web, and the real-App catalog import the plugin and stylesheet from
the package, register it as optional bundled and default-enabled, and load it
before metadata and persisted layout restoration.

## Presentation and workflow components

The table surface owns measured virtual rows, sortable and draggable columns,
wrapped multivalue editing, inline metadata editing, and summaries. Cards own
cover resolution and URL cleanup.
Card queries project the configured image property even when that property is
not displayed in the card field order.
List owns collapsible groups. Map and unknown surfaces are explicit bounded
fallbacks. Header and settings compounds own query controls, schema visibility,
formulas, summaries, limits, view management, new-file, and CSV workflows.
The Bases stylesheet keeps legacy density local to these surfaces; current
Design Core remains the authority for theme colors and typography. Source mode
uses a Bases-owned YAML editor registration rather than treating `yaml` as a
file view or relying on an unregistered extension alias.

## Intentional parity gaps

This intake preserves the legacy package rather than expanding it. A real map
provider, complete Obsidian value wrappers and method-style formula semantics,
`this` binding, richer file/link behavior, deeper grouped summaries, removal of
the compatibility/runtime duplication, and behavioral parity beyond exported
name comparison remain future work tracked in `MIGRATION.md`.
