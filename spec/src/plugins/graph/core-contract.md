# Graph Plugin / Graph behavior

## LN-GRAPH-001 — Graph: live at packages/graph in the sibling lapis-plugins

<a id="ln-graph-001"></a>

**Requirement.** Graph MUST live at `packages/graph` in the sibling `lapis-plugins` repository while preserving package name `@lapis-notes/graph`, runtime id `lapis-graph`, view types `graph` and `graph-local`, command ids, and plugin-data identity.

## LN-GRAPH-002 — Graph: an optional bundled plugin enabled by default

<a id="ln-graph-002"></a>

**Requirement.** Graph MUST be an optional bundled plugin enabled by default in Deno desktop, web, editor-demo, workspace-shell, and audited Storybook hosts. A fresh default layout MUST NOT create either Graph leaf.

## LN-GRAPH-003 — Global Graph: register open-graph-view through ViewAccess.command and create

<a id="ln-graph-003"></a>

**Requirement.** Global Graph MUST register `open-graph-view` through `ViewAccess.command` and create a main-area tab. Local Graph MUST register `open-local-graph` through `ViewAccess.command` and create a right-sidebar leaf. Each opener MUST reveal an existing moved instance before creating one.

## LN-GRAPH-004 — Graph: build data through 256-row indexed metadata pages

<a id="ln-graph-004"></a>

**Requirement.** Graph MUST build data through 256-row indexed metadata pages projected to file, tag, and link data. Provider-owned reads MUST be bounded by page and table. Graph MUST NOT enumerate compatibility snapshots, hot caches, `resolvedLinks`, `unresolvedLinks`, or per-file child records.

## LN-GRAPH-005 — Graph: preserve note, tag, attachment, and unresolved nodes

<a id="ln-graph-005"></a>

**Requirement.** Graph MUST preserve note, tag, attachment, and unresolved nodes; link, embed, and tag-membership edges; reference counts; filters; groups; and local-depth semantics. Unresolved targets MUST remain non-navigable.

## LN-GRAPH-006 — One plugin-owned coordinator: serialize global Graph builds, coalesce committed metadata

<a id="ln-graph-006"></a>

**Requirement.** One plugin-owned coordinator MUST serialize global Graph builds, coalesce committed metadata revisions and refresh pressure, cancel between pages, expose processed and total progress, and retain at most one pending follow-up. Local rebuilds MUST continue to suppress stale results and follow active-file changes plus bounded incoming and outgoing neighborhoods.

## LN-GRAPH-007 — Migrated UI: retain the legacy Graph components, control order

<a id="ln-graph-007"></a>

**Requirement.** The migrated UI MUST retain the legacy Graph components, control order, canvas renderer, and interactions. Its viewport-clamped settings panel MUST be 300px wide, with compact Group remove actions in its right padding rather than the query row. Accordion headers MUST preserve centered alignment, a 16px start inset, source spacing and weight, right/down disclosure glyphs, and no hover underline. Existing controls MUST compose public Design Core primitives.

## LN-GRAPH-008 — Graph production styling: use semantic native CSS, stable data-ui-component

<a id="ln-graph-008"></a>

**Requirement.** Graph production styling MUST use semantic native CSS, stable `data-ui-component` and `data-ui-part` markers, and root-scoped public `--ui-graph-*` tokens. Default note nodes MUST use the muted Graph theme token rather than the accent action token. It MUST contain no Tailwind utilities or placement-specific selectors.

## LN-GRAPH-009 — Renderer: preserve force layout, pan, pointer-centred wheel zoom

<a id="ln-graph-009"></a>

**Requirement.** The renderer MUST preserve force layout, pan, pointer-centred wheel zoom, drag, keyboard focus, hover, labels, arrows, fit, and resize alignment. Zoom MUST clamp to `1/128…8`; wheel, key, and button steps MUST use the `1.5` scale while retaining the persisted sensitivity. Renderer colors and empty-state paint MUST resolve from Graph semantic tokens and existing `--ui-graph-*` aliases.

## LN-GRAPH-010 — Activating an existing note or attachment: retain legacy leaf selection and graph-history behavior

<a id="ln-graph-010"></a>

**Requirement.** Activating an existing note or attachment MUST retain legacy leaf selection and graph-history behavior. Global Graph MUST preserve its tab when another document leaf can open the file; Local Graph MUST use normal document navigation.

## LN-GRAPH-011 — Activating a tag: execute search:open-search with tag: followed by exactly

<a id="ln-graph-011"></a>

**Requirement.** Activating a tag MUST execute `search:open-search` with `tag:` followed by exactly one leading `#`. The same rule MUST drive the tag context-menu action. Missing or disabled Search MUST remain nonfatal, and Graph MUST NOT import Search internals.

## LN-GRAPH-012 — Storybook: demonstrate real global and local Graph views

<a id="ln-graph-012"></a>

**Requirement.** Storybook MUST demonstrate real global and local Graph views in all six governed panel placements over one deterministic indexed vault. Docs MUST use public `@lapis-notes/graph` imports, isolated 700px canvases, and `visual-pending` evidence.

## LN-GRAPH-013 — Package: publicly export GraphPlugin, GraphControlsOverlay, GraphEmbed, GraphRenderer, view

<a id="ln-graph-013"></a>

**Requirement.** The package MUST publicly export GraphPlugin, GraphControlsOverlay, GraphEmbed, GraphRenderer, view types, settings helpers, graph types, embed entry point, and stylesheet entry points without exporting a story-only UI wrapper.

## LN-GRAPH-014 — Graph stories and tests: cover populated, loading, query failure and recovery

<a id="ln-graph-014"></a>

**Requirement.** Graph stories and tests MUST cover populated, loading, query failure and recovery, filtering, local depth, note navigation, exact tag Search state, disabled Search, viewport controls, and settings persistence.

## LN-GRAPH-015 — Global Graph: fit and center the complete visible graph

<a id="ln-graph-015"></a>

**Requirement.** Global Graph MUST fit and center the complete visible graph bounds when its panel first loads. It MUST NOT replace that initial whole-graph alignment with the active note. Local Graph MUST retain active-note centering.

## LN-GRAPH-016 — Focus active file: zoom to and center the active note

<a id="ln-graph-016"></a>

**Requirement.** `Focus active file` MUST zoom to and center the active note without changing Global Graph's initial whole-graph alignment. The focused node MUST use a compact ring. Node titles MUST remain hidden below the configured zoom threshold unless hovered, and hovered titles MUST use the stronger scoped hover-label token.

## LN-GRAPH-017 — Disposable canonical graph snapshot

<a id="ln-graph-017"></a>

**Requirement.** Graph MUST persist the versioned `graph.canonical-snapshot.v1` disposable projection in AppDatabase `app_meta` with its completion time and MetadataCache reconciliation fingerprint. A valid snapshot MUST render immediately. A matching fingerprint MUST skip the scan; a stale snapshot MUST remain visible while one background rebuild runs after MetadataCache reconciliation. Failed refreshes MUST retain cached data, while a first-load failure MUST remain retryable.

## LN-GRAPH-018 — Global Graph views: share the coordinator result. Display, force, filter

<a id="ln-graph-018"></a>

**Requirement.** Global Graph views MUST share the coordinator result. Display, force, filter, and Group settings MUST derive from the cached canonical graph without a database scan. Plugin-data persistence MUST debounce rapid controls and flush pending state during unload.

## LN-GRAPH-019 — New renderer instance: seed nodes deterministically in phyllotaxis order, run

<a id="ln-graph-019"></a>

**Requirement.** A new renderer instance MUST seed nodes deterministically in phyllotaxis order, run a bounded layout pre-warm, fit the camera once, and visibly animate the remaining force settlement without continuous auto-fit. Same-topology updates MUST preserve positions and use a gentle reheat. Reduced-motion renderers MUST settle before their first frame.

## LN-GRAPH-020 — Node screen radius: scale with the square root of zoom

<a id="ln-graph-020"></a>

**Requirement.** Node screen radius MUST scale with the square root of zoom. Link thickness MUST accept `0.1…5` screen pixels without reference-count widening. Arrows, focus rings, and pointer targets MUST remain usable and screen-stable across zoom. Rendering MUST cull off-screen geometry without removing it from simulation or hit-testing.

## LN-GRAPH-021 — Focused-node and hover emphasis

<a id="ln-graph-021"></a>

**Requirement.** Explicitly focused nodes MUST emphasize immediately. Pointer hover MUST reveal only the current label and cursor until its configured dwell elapses; then that node, direct neighbours, and incident links remain fully visible while unrelated node, link, and label opacity approaches `0.12`, `0.05`, and zero through elapsed-time-normalized exponential interpolation with decay `0.9` per 16.667ms. Reduced motion MUST snap paint only after the same delays.

## LN-GRAPH-022 — Graph: expose Obsidian-compatible --graph-\* colour roles. Idle notes

<a id="ln-graph-022"></a>

**Requirement.** Graph MUST expose Obsidian-compatible `--graph-*` colour roles. Idle notes and links MUST use neutral roles without accent outlines. Tags MUST remain green, attachments yellow, and unresolved nodes faint; only the emphasis source and incident links use accent paint. `--ui-graph-*` aliases and Group colour precedence MUST remain compatible.

## LN-GRAPH-023 — Graph settings: expose compact, always-active Groups containing a drag

<a id="ln-graph-023"></a>

**Requirement.** Graph settings MUST expose compact, always-active Groups containing a drag handle, structured query, Design Core icon-only colour popover with presets and an unrestricted picker, and remove action on one line. Pointer and Arrow-key ordering MUST preserve first-match colour precedence. Invalid or failed rules MUST show per-Group diagnostics without failing Graph loading. Settings version 2 MUST preserve legacy ids, queries, colours, and order while dropping names and activating formerly disabled rules.

## LN-GRAPH-024 — Display: expose an Animate action that becomes Stop

<a id="ln-graph-024"></a>

**Requirement.** Display MUST expose an Animate action that becomes Stop while a ten-second chronological time-lapse runs. Notes and attachments MUST use creation time, modification-time fallback, then undated-last order. Tag and unresolved nodes MUST appear with their first visible relationship, and links only when both endpoints are visible. Reveal work MUST be animation-frame-bounded and incrementally reheat the existing simulation.

## LN-GRAPH-025 — Complete graph restoration after animation

<a id="ln-graph-025"></a>

**Requirement.** Stopping, completing, changing the visible graph, or receiving a topology update MUST restore the complete current graph. Pan and zoom MUST remain usable during time-lapse. Normal first-load force settlement MUST remain independent and MUST NOT replay for same-session non-topology changes.

## LN-GRAPH-026 — Center and Link controls: accept 0…1 and map through (0.01^(1-v)-0.01)/0.99. Repel

<a id="ln-graph-026"></a>

**Requirement.** Center and Link controls MUST accept `0…1` and map through `(0.01^(1-v)-0.01)/0.99`. Repel MUST accept `0…20` and map to `-max(v³,1)`. Link distance MUST accept `30…500`. Defaults MUST be Center `0.518713…`, Repel `10`, Link `1`, and distance `250`.

## LN-GRAPH-027 — Persisted Graph settings: carry an internal version. Loading an unversioned

<a id="ln-graph-027"></a>

**Requirement.** Persisted Graph settings MUST carry an internal version. Loading an unversioned file MUST replace its force values with parity defaults and immediately persist the current version. Version-1 and unversioned Groups MUST migrate to the version-2 `{ id, query, color }` shape without changing query, colour, or order. Filters, remaining display settings, and Local Graph depth MUST remain unchanged; current-version reloads MUST be idempotent.

## LN-GRAPH-028 — Link force: use D3 degree normalization without reference-count weighting

<a id="ln-graph-028"></a>

**Requirement.** Link force MUST use D3 degree normalization without reference-count weighting. Charge MUST use minimum distance `30`; collision MUST use radius `60` and strength `0.5`. The simulation MUST retain standard D3 alpha and velocity decay.

## LN-GRAPH-029 — Local Graph: traverse note-link neighbourhoods only and split exact

<a id="ln-graph-029"></a>

**Requirement.** Local Graph MUST traverse note-link neighbourhoods only and split exact frontier metadata and link reads into bounded batches before querying AppDatabase. Tags, attachments, and unresolved targets MUST be rendered only as adjacent nodes permitted by the selected depth; shared tag membership MUST NOT expand the file frontier. A large active-file neighbourhood MUST preserve depth semantics without exceeding SQLite expression-depth, bind, or desktop event-channel limits.

## LN-GRAPH-030 — Graph build failures: publish one owner-scoped Problems diagnostic in addition

<a id="ln-graph-030"></a>

**Requirement.** Graph build failures MUST publish one owner-scoped Problems diagnostic in addition to the view error. Local failures MUST use the active note resource; global failures MUST be workspace-wide. A successful rebuild and plugin teardown MUST clear the owned diagnostic, and Graph MUST NOT open Problems automatically.

## LN-GRAPH-031 — Pointer emphasis: default to a 500 ms activation delay

<a id="ln-graph-031"></a>

**Requirement.** Pointer emphasis MUST default to a `500 ms` activation delay and `350 ms` release grace, expose both as `0…2000 ms` sliders in `50 ms` steps, retain the previous emphasis during the grace window, and safely replace or cancel timers across node changes, drag, pan, graph replacement, time-lapse, and teardown.

## LN-GRAPH-032 — Cmd/Ctrl-hover on an existing Markdown note: immediately open a read-only public Markdown FileEmbed

<a id="ln-graph-032"></a>

**Requirement.** Cmd/Ctrl-hover on an existing Markdown note MUST immediately open a read-only public Markdown `FileEmbed` preview at a continuously updated canvas anchor, independently from emphasis dwell. The owner-document popover MUST permit pointer handoff, remain after modifier release, and close after leaving both surfaces, on Escape, graph replacement, note removal, or teardown. Tags, unresolved nodes, and attachments MUST NOT preview.

## LN-GRAPH-033 — Compact Group rows: give the drag handle balanced inline space

<a id="ln-graph-033"></a>

**Requirement.** Compact Group rows MUST give the drag handle balanced inline space without a mouse-hover outline. Rounded focus paint MUST cover the handle, query, colour, and close action as one row. The close action MUST remain visible, retain a trailing gutter inside the row, and gain a visible background on hover. Idle rows MUST have no divider or shadow, and focused paint MUST retain an outer trailing gap.
