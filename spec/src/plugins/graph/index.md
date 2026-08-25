# Graph Plugin

`@lapis-notes/graph` owns the global and local graph views over indexed vault
metadata. It preserves the legacy canvas presentation and control structure
while adapting data, theme, and workspace integration to current Lapis APIs.

## Conceptual model

Graph data is a derived, disposable projection. Markdown and attachment files
remain vault-owned, while `MetadataCache` indexed queries provide note tags and
resolved or unresolved links. A node is a note, tag, attachment, or unresolved
target. A directed edge is a link or embed; a tag-membership edge is undirected.

The global view pages the complete indexed Markdown projection. The local view
starts at the active note and follows indexed incoming and outgoing links to the
configured depth. Both views retain filters, grouping, force settings, and
canvas positions only as presentation state.

## Requirements

| ID           | Requirement                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-GRAPH-001 | Graph MUST be ported from `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-graph` while preserving package name `@lapis-notes/graph`, runtime id `lapis-graph`, view types `graph` and `graph-local`, command ids, and plugin-data identity.                                                                                                                                                   |
| LN-GRAPH-002 | Graph MUST be an optional bundled plugin enabled by default in Deno desktop, web, editor-demo, workspace-shell, and audited Storybook hosts. A fresh default layout MUST NOT create either Graph leaf.                                                                                                                                                                                                   |
| LN-GRAPH-003 | Global Graph MUST register `open-graph-view` through `ViewAccess.command` and create a main-area tab. Local Graph MUST register `open-local-graph` through `ViewAccess.command` and create a right-sidebar leaf. Each opener MUST reveal an existing moved instance before creating one.                                                                                                                 |
| LN-GRAPH-004 | Graph MUST build data through 256-row indexed metadata pages projected to file, tag, and link data. Provider-owned reads MUST be bounded by page and table. Graph MUST NOT enumerate compatibility snapshots, hot caches, `resolvedLinks`, `unresolvedLinks`, or per-file child records.                                                                                                                                                                                       |
| LN-GRAPH-005 | Graph MUST preserve note, tag, attachment, and unresolved nodes; link, embed, and tag-membership edges; reference counts; filters; groups; and local-depth semantics. Unresolved targets MUST remain non-navigable.                                                                                                                                                                                      |
| LN-GRAPH-006 | One plugin-owned coordinator MUST serialize global Graph builds, coalesce committed metadata revisions and refresh pressure, cancel between pages, expose processed and total progress, and retain at most one pending follow-up. Local rebuilds MUST continue to suppress stale results and follow active-file changes plus bounded incoming and outgoing neighborhoods.                                                                                                                          |
| LN-GRAPH-007 | The migrated UI MUST retain the legacy Graph components, control order, geometry, canvas renderer, and interactions. Accordion headers MUST preserve centered alignment, a 16px start inset, source spacing and weight, right/down disclosure glyphs, and no hover underline. It MUST NOT introduce a replacement Graph panel or redesign. Existing controls MUST compose public Design Core primitives. |
| LN-GRAPH-008 | Graph production styling MUST use semantic native CSS, stable `data-ui-component` and `data-ui-part` markers, and root-scoped public `--ui-graph-*` tokens. Default note nodes MUST use the muted Graph theme token rather than the accent action token. It MUST contain no Tailwind utilities or placement-specific selectors.                                                                          |
| LN-GRAPH-009 | The renderer MUST preserve force layout, pan, pointer-centred wheel zoom, drag, keyboard focus, hover, labels, arrows, fit, and resize alignment. Zoom MUST clamp to `1/128…8`; wheel, key, and button steps MUST use the `1.5` scale while retaining the persisted sensitivity. Renderer colors and empty-state paint MUST resolve from Graph semantic tokens and existing `--ui-graph-*` aliases.                                                       |
| LN-GRAPH-010 | Activating an existing note or attachment MUST retain legacy leaf selection and graph-history behavior. Global Graph MUST preserve its tab when another document leaf can open the file; Local Graph MUST use normal document navigation.                                                                                                                                                                |
| LN-GRAPH-011 | Activating a tag MUST execute `search:open-search` with `tag:` followed by exactly one leading `#`. The same rule MUST drive the tag context-menu action. Missing or disabled Search MUST remain nonfatal, and Graph MUST NOT import Search internals.                                                                                                                                                   |
| LN-GRAPH-012 | Storybook MUST demonstrate real global and local Graph views in all six governed panel placements over one deterministic indexed vault. Docs MUST use public `@lapis-notes/graph` imports, isolated 700px canvases, and `visual-pending` evidence.                                                                                                                                                       |
| LN-GRAPH-013 | The package MUST publicly export GraphPlugin, GraphControlsOverlay, GraphEmbed, GraphRenderer, view types, settings helpers, graph types, embed entry point, and stylesheet entry points without exporting a story-only UI wrapper.                                                                                                                                                                      |
| LN-GRAPH-014 | Graph stories and tests MUST cover populated, loading, query failure and recovery, filtering, local depth, note navigation, exact tag Search state, disabled Search, viewport controls, and settings persistence.                                                                                                                                                                                        |
| LN-GRAPH-015 | Global Graph MUST fit and center the complete visible graph bounds when its panel first loads. It MUST NOT replace that initial whole-graph alignment with the active note. Local Graph MUST retain active-note centering.                                                                                                                                                                               |
| LN-GRAPH-016 | `Focus active file` MUST zoom to and center the active note without changing Global Graph's initial whole-graph alignment. The focused node MUST use a compact ring. Node titles MUST remain hidden below the configured zoom threshold unless hovered, and hovered titles MUST use the stronger scoped hover-label token.                                                                               |
| LN-GRAPH-017 | Graph MUST persist the versioned `graph.canonical-snapshot.v1` disposable projection in AppDatabase `app_meta` with its completion time and MetadataCache reconciliation fingerprint. A valid snapshot MUST render immediately. A matching fingerprint MUST skip the scan; a stale snapshot MUST remain visible while one background rebuild runs after MetadataCache reconciliation. Failed refreshes MUST retain cached data, while a first-load failure MUST remain retryable. |
| LN-GRAPH-018 | Global Graph views MUST share the coordinator result. Display, force, filter, and Group settings MUST derive from the cached canonical graph without a database scan. Plugin-data persistence MUST debounce rapid controls and flush pending state during unload. |
| LN-GRAPH-019 | A new renderer instance MUST seed nodes deterministically in phyllotaxis order, run a bounded layout pre-warm, fit the camera once, and visibly animate the remaining force settlement without continuous auto-fit. Same-topology updates MUST preserve positions and use a gentle reheat. Reduced-motion renderers MUST settle before their first frame. |
| LN-GRAPH-020 | Node screen radius MUST scale with the square root of zoom. Links, arrows, strokes, focus rings, and pointer targets MUST remain usable and visually stable across the zoom range. Rendering MUST cull off-screen nodes, labels, and non-intersecting links without removing them from simulation or hit-testing. |
| LN-GRAPH-021 | Hovered and focused nodes, their direct neighbours, and incident links MUST remain fully visible. During emphasis, unrelated nodes MUST reach opacity `0.12`, unrelated links `0.05`, and unrelated labels zero. Entry MUST animate over 140ms and restoration over 180ms unless reduced motion is active. The emphasis source MUST use the focused-node colour while neighbours retain type or Group colours. |
| LN-GRAPH-022 | Graph MUST expose Obsidian-compatible `--graph-text`, `--graph-line`, `--graph-node`, `--graph-node-unresolved`, `--graph-node-focused`, `--graph-node-tag`, and `--graph-node-attachment` roles mapped to Lapis theme tokens. Existing `--ui-graph-*` variables MUST remain compatibility aliases, and explicit Group colours MUST continue to override base type colours except for the current emphasis source. |

## Runtime flow

```text
MetadataCache indexed rows + link queries
                    ↓
       global paging / local bounded BFS
                    ↓
        GraphData nodes and typed edges
                    ↓
       legacy controls + canvas renderer
                    ↓
file navigation or search:open-search
```

Graph owns graph derivation, settings, and presentation. Search owns query
state and results; Graph crosses that boundary only through the registered
command. Design Core owns reusable controls, while workspace placement and
vault persistence remain application concerns. Initial Global alignment is a
projection-wide fit; active-file focus is a separate, explicit camera action.

The coordinator treats the canonical snapshot as disposable generated state.
It reads database readiness separately from MetadataCache reconciliation,
publishes any valid snapshot before waiting for reconciliation, and advances
the snapshot only after a stable-fingerprint build completes. Metadata changes
during a build queue one follow-up instead of opening another native event
stream. Progress and telemetry contain aggregate pages, files, nodes, links,
durations, and outcomes only; paths, labels, tags, and query text remain local.
