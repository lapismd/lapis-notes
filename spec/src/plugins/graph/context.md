# Graph Plugin / Context

The package consumes the published Design Core semver contract. Its public UI
boundary MUST NOT require a sibling-repository path or workspace `link:`
override.

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
command for tag navigation and the API path-only membership operation for
filters. Design Core owns reusable query, colour, sort, and popover controls;
Markdown owns read-only note rendering. Workspace placement and vault
persistence remain application concerns. Initial Global alignment is a
projection-wide fit; active-file focus is a separate, explicit camera action.

The coordinator treats the canonical snapshot as disposable generated state.
It reads database readiness separately from MetadataCache reconciliation,
publishes any valid snapshot before waiting for reconciliation, and advances
the snapshot only after a stable-fingerprint build completes. Metadata changes
during a build queue one follow-up instead of opening another native event
stream. Progress and telemetry contain aggregate pages, files, nodes, links,
durations, and outcomes only; paths, labels, tags, and query text remain local.
