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
| LN-SRCH-005 | Search results MUST render a file-grouped tree whose collapsible file items own child match items. The tree MUST highlight explicit ranges, expose totals and sorting, and open a selected file or source position through the API workspace. |
| LN-SRCH-006 | Search MUST retain bounded recent queries, match-case state, result-limit and snippet-length settings, and MUST dispose indexing listeners and pending searches when disabled. |
| LN-SRCH-007 | Markdown Tags MUST open Search with a `tag:` query. All Properties MUST open Search with an escaped bracket-property query while remaining recoverable when Search is disabled. |
| LN-SRCH-008 | Storybook MUST demonstrate the real Search plugin in all six governed panel placements over an indexed in-memory vault and MUST verify query, facet, highlight, and navigation behavior. |
| LN-SRCH-009 | Electron MUST load Search before metadata and layout restoration so a persisted `search` leaf restores as available and uses the native app database search boundary. |
| LN-SRCH-010 | Search panel styling MUST use native CSS and public Design Core or workspace tokens. It MUST fill the owning `WorkspaceViewHost` without placement-specific selectors or Tailwind utilities. |
| LN-SRCH-011 | The Search view MUST expose persisted Design Core toggles for Match case, Collapse results, Show more context, and Explain search terms inside `SearchFilterBar`'s single expandable filter area. It MUST NOT render an independent settings trigger. |
| LN-SRCH-012 | Collapse results MUST set the default disclosure state of every file group while preserving later per-file disclosure changes until the result set changes. |
| LN-SRCH-013 | Show more context MUST request longer result snippets. Explain search terms MUST show or hide a plain-language summary of the active query. |
| LN-SRCH-014 | Search MUST expose `auto`, `lexical`, `vector`, and `hybrid` retrieval modes and label results with the mode actually applied by `AppDatabase`. |
| LN-SRCH-015 | Semantic search MUST default to disabled. Selecting Transformers.js MUST NOT initialize or download the configured model before the first semantic indexing or query operation, and vault contents MUST remain local. |
| LN-SRCH-016 | Search settings MUST configure the embedding provider, model, remote-model permission, local path, chunking, result bounds, semantic status visibility, and explicit rebuild. |
| LN-SRCH-017 | Search MUST expose semantic provider, model, indexing progress, error, and readiness state without importing a concrete database implementation. |
| LN-SRCH-018 | Structured queries MUST remain lexical unless the persisted semantic-structured-query toggle is enabled. Shared API evaluation MUST preserve filters, negation, comparisons, and case behavior. |
| LN-SRCH-019 | The Search summary MUST expose result copy, legacy sorting, retrieval badges, match keys, and selectable bounded recent queries. |
| LN-SRCH-020 | Proxy browser tabs MUST execute indexing, semantic configuration, status, and queries through the owning app-database session. |
| LN-SRCH-021 | Local-LLM query expansion, reranking, and embedded Markdown query blocks MUST remain excluded from this intake. |
| LN-SRCH-022 | Search panel facets MUST use Design Core `FilterCommandPicker` controls beneath the query, keeping file type and retrieval mode compact while preserving their existing settings. |

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

The plugin owns indexing policy, local embedding configuration, and presentation
state. It does not own Turso drivers, workspace layout, vault selection, or
Markdown metadata parsing. Tags and Properties depend only on the registered
Search command, not on Search package internals.
