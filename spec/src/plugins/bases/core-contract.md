# Bases Plugin / Bases queries and views

Retained Notes acceptance consumes the published Bases package. Its picker
accessibility repair belongs to the sibling plugin source and must reach Notes
through a registry release. Consumer plays wait for visible suggestions and
settled popover geometry while keeping their existing assertions and axe gate.
Property visibility acceptance targets the named toggle buttons in the public
picker grid and preserves the selected-marker and theme-colour assertions.
Retained Mobile shell acceptance uses the published count-bearing tab-dock name.

## LN-BASE-001 — Legacy Bases behavior preservation

<a id="ln-base-001"></a>

**Requirement.** `@lapis-notes/bases` MUST preserve the clean legacy package behavior in `packages/bases` of the sibling `lapis-plugins` repository. It MUST use runtime ID `bases`, support static composition or registry installation, and remain user-disableable through the static lifecycle.

## LN-BASE-002 — Plugin: associate .base and .bases files with BasesViewType

<a id="ln-base-002"></a>

**Requirement.** The plugin MUST associate `.base` and `.bases` files with `BasesViewType`. A file view MUST switch between preview and YAML source, persist configuration edits, reopen through the editor association, and MUST NOT create a default Bases leaf.

## LN-BASE-003 — Bases documents: normalize supported YAML into a stable document

<a id="ln-base-003"></a>

**Requirement.** Bases documents MUST normalize supported YAML into a stable document model while preserving unknown custom-view configuration. Writes MUST be serialized so rapid edits cannot reorder vault state, and the latest pending write MUST flush when a view or plugin unloads.

## LN-BASE-004 — Query execution: push supported candidates into paginated AppDatabase metadata

<a id="ln-base-004"></a>

**Requirement.** Query execution MUST push supported candidates into paginated `AppDatabase` metadata queries, apply final PEaQL evaluation, and invalidate results from revisioned metadata changes. Memory injection MAY satisfy the same database contract in tests; first-party runtime MUST NOT enumerate the synchronous metadata cache.

## LN-BASE-005 — Renderer: provide table, cards, list, explicit map-unavailable, unknown-view

<a id="ln-base-005"></a>

**Requirement.** The renderer MUST provide table, cards, list, explicit map-unavailable, unknown-view, and API-registered custom layouts. Unknown layouts and unsupported map configuration MUST remain inspectable without silently changing the document's selected view type.

## LN-BASE-006 — Bases workflows: support search, filters, sorting, grouping, property visibility

<a id="ln-base-006"></a>

**Requirement.** Bases workflows MUST support search, filters, sorting, grouping, property visibility, formulas, summaries, limits, view add/rename/duplicate/delete and layout changes, new-file creation, and CSV export. Custom view options MUST preserve text, multitext, toggle, slider, dropdown, file, folder, formula, property, and grouped option contracts.

## LN-BASE-007 — Text, number, checkbox, date, tags, and supported: edit the target file's frontmatter and refresh

<a id="ln-base-007"></a>

**Requirement.** Text, number, checkbox, date, tags, and supported metadata cells MUST edit the target file's frontmatter and refresh query results. Text-like cells MUST use normal autocomplete controls without search icons, offer existing metadata values, and paint an opaque table-cell surface. Tag and multivalue controls MUST wrap their values and expand the owning table row. File-derived and formula-derived fields MUST remain immutable, while file links MUST navigate through the injected App.

## LN-BASE-008 — Markdown integration: render .base file embeds and base

<a id="ln-base-008"></a>

**Requirement.** Markdown integration MUST render `.base` file embeds and `base` or `bases` fenced YAML blocks through a read-only Bases surface. Invalid YAML MUST render a bounded error state, and teardown MUST revoke created image URLs and dispose query resources.

## LN-BASE-009 — Package: export default and named BasesPlugin, BasesViewType, BasesViewSurface

<a id="ln-base-009"></a>

**Requirement.** The package MUST export default and named `BasesPlugin`, `BasesViewType`, `BasesViewSurface`, `parseBasesDocument`, `serializeBasesDocument`, and consumer document/view types. Its source and built entrypoints MUST import without changing static query-type metadata. `BasesViewSurface` MUST accept `app`, `document`, optional `onChange`, `readOnly`, `showHeader`, and optional `BasesViewRegistration` mappings.

## LN-BASE-010 — Production presentation: compose public Design Core primitives with Bases-owned

<a id="ln-base-010"></a>

**Requirement.** Production presentation MUST compose public Design Core primitives with Bases-owned semantic classes, `data-ui-component` or `data-ui-part` markers, native CSS, and `--ui-bases-*` tokens. The packaged stylesheet MUST NOT redefine host root typography tokens such as `--font-sans` or `--font-mono`. Runtime code MUST receive `App` explicitly and MUST NOT read a global application singleton.

## LN-BASE-011 — Governed Storybook coverage: exercise public table, cards, grouped-list, map-unavailable, unknown-view

<a id="ln-base-011"></a>

**Requirement.** Governed Storybook coverage MUST exercise public table, cards, grouped-list, map-unavailable, unknown-view, workflow, schema/settings, editable-cell, Desktop and Mobile real editor shells with Explorer visible and indexed Search retained collapsed, real file-view, Markdown-embed, and disable/restore scenarios. Standalone shell previews MUST fill the viewport without padding or page scrolling while Docs remain isolated at 700px. File-view and pointer acceptance MUST wait for explicit preview readiness before interacting with persisted layout controls. Every scenario MUST include interaction assertions and remain `visual-pending` until human review.

## LN-BASE-012 — Port: document real-map, Obsidian wrapper/formula, this binding, richer

<a id="ln-base-012"></a>

**Requirement.** The port MUST document real-map, Obsidian wrapper/formula, `this` binding, richer file/link, grouped-summary, duplicated runtime-model, stub-formula, and name-only parity gaps. It MUST NOT add Tasks-owned views or claim full Obsidian behavior.

## LN-BASE-013 — Table, cards, and list presentation: retain the reference geometry and control density

<a id="ln-base-013"></a>

**Requirement.** Table, cards, and list presentation MUST retain the reference geometry and control density at the Bases boundary while using current Design Core theme tokens and accessible contrast. Editable table checkboxes MUST be centered 1rem squares. Table headers, rows, and summaries MUST share one ordered width model and remain aligned before, during, and after column resizing and horizontal scrolling. Wrapped variable-height rows MUST preserve shared cell boundaries and measured virtual and sticky-group offsets.

## LN-BASE-014 — Bundled plugin: register the complete legacy surface: the bases

<a id="ln-base-014"></a>

**Requirement.** The bundled plugin MUST register the complete legacy surface: the `bases` view, `.base` and `.bases` editor association, extension aliases, read-only embeds and fenced blocks, preview/source toolbar actions, and Table, Unknown, Cards, List, and Map view items. It MUST NOT invent palette, ribbon, status, or settings commands absent from the legacy plugin.

## LN-BASE-015 — Bases source mode: register and apply a CodeMirror YAML language

<a id="ln-base-015"></a>

**Requirement.** Bases source mode MUST register and apply a CodeMirror YAML language pack through the `bases` editor view. The source editor host MUST expose `data-language="yaml"`, highlight YAML syntax for both `.base` and `.bases`, and restore the same extensions after mode changes without changing the file-view association.

## LN-BASE-016 — Focused editable table cell: paint one continuous inset active boundary at

<a id="ln-base-016"></a>

**Requirement.** A focused editable table cell MUST paint one continuous inset active boundary at all four corners. The boundary MUST be owned by the outer cell, MUST NOT be duplicated by nested editor wrappers, and MUST NOT alter the row's shared height or column geometry.

## LN-BASE-017 — Autocomplete suggestion popover: close when focus leaves its field

<a id="ln-base-017"></a>

**Requirement.** An autocomplete suggestion popover MUST close when focus leaves its field or an outside interaction dismisses it. Dismissal MUST NOT restore focus to the trigger and reopen the list.

## LN-BASE-018 — Cell in a wrapped variable-height row: align its primary content to the row

<a id="ln-base-018"></a>

**Requirement.** Every cell in a wrapped variable-height row MUST align its primary content to the row start. Text, number, date, checkbox, file, folder, tag, and multivalue cells MUST share that vertical origin while checkboxes remain horizontally centered.

## LN-BASE-019 — Open Bases autocomplete suggestion popover: imply an active editing input. Opening

<a id="ln-base-019"></a>

**Requirement.** An open Bases autocomplete suggestion popover MUST imply an active editing input. Opening a field with an existing value MUST focus and select that value, initially expose alternative suggestions, and allow pointer or keyboard replacement without an extra activation click. Clicks targeting the cell surface or rendered value text MUST establish the same editing state.

## LN-BASE-020 — Table viewport: fill the available vertical Bases surface

<a id="ln-base-020"></a>

**Requirement.** The table viewport MUST fill the available vertical Bases surface and compose Design Core's public shadcn Scroll Area for horizontal and vertical overflow. Its styled horizontal scrollbar MUST remain visible at the bottom edge of that full-height container, and the Scroll Area viewport MUST remain the single scroll element that drives row and column virtualization.

## LN-BASE-021 — Selected property, sort, and group indicators plus: use the Bases accent fill

<a id="ln-base-021"></a>

**Requirement.** Selected property, sort, and group indicators plus checked editable booleans MUST use the Bases accent fill with a white on-accent glyph. Unchecked controls MUST retain an opaque white surface and visible boundary in the Lapis light theme.

## LN-BASE-022 — Filter popover: preserve the legacy 45svw width while remaining

<a id="ln-base-022"></a>

**Requirement.** The filter popover MUST preserve the legacy 45svw width while remaining bounded by the available viewport. Its panel and segmented filter row MUST use the opaque workspace surface rather than sidebar paint.

## LN-BASE-023 — All-views and this-view filter disclosure triggers: place their indicators at the inline start

<a id="ln-base-023"></a>

**Requirement.** All-views and this-view filter disclosure triggers MUST place their indicators at the inline start through the public Design Core Accordion contract. Indicators MUST point right when collapsed and down when expanded. Disclosure semantics and keyboard behavior MUST remain unchanged.

## LN-BASE-024 — Filter-builder value editors: vertically align with their segmented row. Group

<a id="ln-base-024"></a>

**Requirement.** Filter-builder value editors MUST vertically align with their segmented row. Group and operator selects MUST retain a visible selected label and paint their option content above the parent filter popover at the trigger anchor. Advanced filter expressions MUST apply syntax-token colors to parsed CodeMirror spans.

## LN-BASE-025 — Table: omit an outer bottom and inline-end container

<a id="ln-base-025"></a>

**Requirement.** The table MUST omit an outer bottom and inline-end container frame while retaining its internal row and column grid. The last row MUST retain its bottom separator. Scrollbar tracks MUST meet the container edge without reintroducing the outer frame.

## LN-BASE-026 — Initial blank filter row: count as the first predicate. The first

<a id="ln-base-026"></a>

**Requirement.** An initial blank filter row MUST count as the first predicate. The first Add Filter activation MUST preserve that predicate and append a second visible row rather than replacing the placeholder with an indistinguishable placeholder.

## LN-BASE-027 — Sticky table header: remain above scrolling table rows but below

<a id="ln-base-027"></a>

**Requirement.** The sticky table header MUST remain above scrolling table rows but below portaled filter panels. Opening Filter MUST produce an opaque hit-tested panel over every intersecting header cell, while its nested Select portals remain above the panel.

## LN-BASE-028 — Sort and Filter outer popovers: resolve the same 45svw width

<a id="ln-base-028"></a>

**Requirement.** The Sort and Filter outer popovers MUST resolve the same 45svw width and the same viewport maximum. Sort's internal Scroll Area MUST fill that shared width rather than retaining the former 25svw constraint.

## LN-BASE-029 — Advanced filter expressions: use the shared Lapis CodeMirror completion popover

<a id="ln-base-029"></a>

**Requirement.** Advanced filter expressions MUST use the shared Lapis CodeMirror completion popover chrome in Storybook and production hosts. Focusing the inline query editor MUST NOT paint CodeMirror's default dotted outline; the surrounding segmented filter row remains the visible focus boundary.

## LN-BASE-030 — Advanced filter source mode: validate non-empty expressions without preventing correction. Invalid

<a id="ln-base-030"></a>

**Requirement.** Advanced filter source mode MUST validate non-empty expressions without preventing correction. Invalid drafts MUST mark the CodeMirror textbox invalid, show a destructive error label beneath it, and MUST NOT replace the last valid applied filter. Correcting the draft MUST clear the error and apply the valid expression.

## LN-BASE-031 — Governed Bases Storybook coverage: start from persisted indexed rows, surface

<a id="ln-base-031"></a>

**Requirement.** Governed Bases Storybook coverage MUST start from persisted indexed rows, surface an async metadata query failure, and recover after a later committed invalidation without enumerating a MetadataCache snapshot.
