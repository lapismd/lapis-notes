# Search Plugin

`@lapis-notes/search` owns vault search indexing, query presentation, result
navigation, and the `search` workspace view. Query parsing and generated search
state remain API contracts, while reusable search chrome remains Design Core.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-SRCH-001 | Search MUST be ported from `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-search` at commit `8ec68e18` without copying API database or query-parser implementations. |
| LN-SRCH-002 | The plugin MUST register the canonical `search` view and commands for opening Search, searching selected text, rebuilding generated state, and refreshing the vault index. |
| LN-SRCH-003 | Search indexing MUST write through `AppDatabase`, refresh searchable Markdown and Canvas files after metadata loads, prune stale documents, and track later vault or metadata changes. |
| LN-SRCH-004 | The Search view MUST compose Design Core `SearchFilterBar` in CodeMirror mode with the API search-query language, query diagnostics, field/value completion, and expandable facets. |
| LN-SRCH-005 | Search results MUST group snippets by file, highlight explicit match ranges, expose result totals and sorting, and open the selected file or source position through the API workspace. |
| LN-SRCH-006 | Search MUST retain bounded recent queries, match-case state, result-limit and snippet-length settings, and MUST dispose indexing listeners and pending searches when disabled. |
| LN-SRCH-007 | Markdown Tags MUST open Search with a `tag:` query. All Properties MUST open Search with an escaped bracket-property query while remaining recoverable when Search is disabled. |
| LN-SRCH-008 | Storybook MUST demonstrate the real Search plugin in all six governed panel placements over an indexed in-memory vault and MUST verify query, facet, highlight, and navigation behavior. |
| LN-SRCH-009 | Electron MUST load Search before metadata and layout restoration so a persisted `search` leaf restores as available and uses the native app database search boundary. |
| LN-SRCH-010 | Search panel styling MUST use native CSS and public Design Core or workspace tokens. It MUST fill the owning `WorkspaceViewHost` without placement-specific selectors or Tailwind utilities. |

## Runtime flow

```text
vault + metadata events
        ↓
SearchManager → API AppDatabase generated search state
        ↓
Design Core SearchFilterBar → API search-query grammar → Search results
        ↓
API workspace file navigation
```

The plugin owns indexing policy and presentation state. It does not own native
SQLite, embeddings, workspace layout, vault selection, or Markdown metadata
parsing. Tags and Properties depend only on the registered Search command, not
on Search package internals.
