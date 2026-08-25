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

| ID           | Requirement                                                                                                                                                                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-GRAPH-001 | Graph MUST be ported from `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-graph` while preserving package name `@lapis-notes/graph`, runtime id `lapis-graph`, view types `graph` and `graph-local`, command ids, and plugin-data identity.                                   |
| LN-GRAPH-002 | Graph MUST be an optional bundled plugin enabled by default in Deno desktop, web, editor-demo, workspace-shell, and audited Storybook hosts. A fresh default layout MUST NOT create either Graph leaf.                                                                                   |
| LN-GRAPH-003 | Global Graph MUST register `open-graph-view` through `ViewAccess.command` and create a main-area tab. Local Graph MUST register `open-local-graph` through `ViewAccess.command` and create a right-sidebar leaf. Each opener MUST reveal an existing moved instance before creating one. |
| LN-GRAPH-004 | Graph MUST build data through paged indexed metadata and link queries. It MUST NOT enumerate compatibility snapshots, hot caches, `resolvedLinks`, or `unresolvedLinks`. Global pages MUST be bounded to 256 rows.                                                                       |
| LN-GRAPH-005 | Graph MUST preserve note, tag, attachment, and unresolved nodes; link, embed, and tag-membership edges; reference counts; filters; groups; and local-depth semantics. Unresolved targets MUST remain non-navigable.                                                                      |
| LN-GRAPH-006 | Graph rebuilds MUST suppress stale async results, debounce committed metadata revisions, expose loading and error states, and recover after a later revision or manual refresh. Local rebuilds MUST follow active-file changes and bounded incoming and outgoing neighborhoods.          |
| LN-GRAPH-007 | The migrated UI MUST retain the legacy Graph components, control order, geometry, canvas renderer, and interactions. It MUST NOT introduce a replacement Graph panel or redesign. Existing controls MUST compose public Design Core primitives.                                          |
| LN-GRAPH-008 | Graph production styling MUST use semantic native CSS, stable `data-ui-component` and `data-ui-part` markers, and root-scoped public `--ui-graph-*` tokens. It MUST contain no Tailwind utilities or placement-specific selectors.                                                       |
| LN-GRAPH-009 | The renderer MUST preserve force layout, pan, zoom, drag, keyboard focus, hover, labels, arrows, fit, and resize alignment. Renderer colors and empty-state paint MUST resolve from `--ui-graph-*` tokens. Settings MUST persist through plugin data.                                    |
| LN-GRAPH-010 | Activating an existing note or attachment MUST retain legacy leaf selection and graph-history behavior. Global Graph MUST preserve its tab when another document leaf can open the file; Local Graph MUST use normal document navigation.                                                |
| LN-GRAPH-011 | Activating a tag MUST execute `search:open-search` with `tag:` followed by exactly one leading `#`. The same rule MUST drive the tag context-menu action. Missing or disabled Search MUST remain nonfatal, and Graph MUST NOT import Search internals.                                   |
| LN-GRAPH-012 | Storybook MUST demonstrate real global and local Graph views in all six governed panel placements over one deterministic indexed vault. Docs MUST use public `@lapis-notes/graph` imports, isolated 700px canvases, and `visual-pending` evidence.                                       |
| LN-GRAPH-013 | The package MUST publicly export GraphPlugin, GraphControlsOverlay, GraphEmbed, GraphRenderer, view types, settings helpers, graph types, embed entry point, and stylesheet entry points without exporting a story-only UI wrapper.                                                      |
| LN-GRAPH-014 | Graph stories and tests MUST cover populated, loading, query failure and recovery, filtering, local depth, note navigation, exact tag Search state, disabled Search, viewport controls, and settings persistence.                                                                        |

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
vault persistence remain application concerns.
