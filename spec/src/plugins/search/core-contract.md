# Search Plugin / Search queries and results

## LN-SRCH-001 — Search: owned by the sibling lapis-plugins repository, retain

<a id="ln-srch-001"></a>

**Requirement.** Search MUST be owned by the sibling `lapis-plugins` repository, retain runtime ID and public package compatibility, and consume API database and query-parser contracts without copying their implementations. Lapis Notes MUST consume its released npm package in the application-owned profile.

## LN-SRCH-002 — Plugin: register the canonical search view and commands

<a id="ln-srch-002"></a>

**Requirement.** The plugin MUST register the canonical `search` view and commands for opening Search, searching selected text, rebuilding generated state, and refreshing the vault index.

## LN-SRCH-003 — AppDatabase indexing and refresh

<a id="ln-srch-003"></a>

**Requirement.** Search indexing MUST write through `AppDatabase`, refresh files accepted by registered search-document providers after metadata loads, prune stale documents, and track later provider-owned vault, metadata, or provider changes. Vault changes that no registered Search provider accepts MUST NOT invalidate the Search checkpoint.

## LN-SRCH-004 — Search view: compose Design Core SearchFilterBar in CodeMirror mode

<a id="ln-srch-004"></a>

**Requirement.** The Search view MUST compose Design Core `SearchFilterBar` in CodeMirror mode with the API search-query language, query diagnostics, field/value completion, and expandable facets.

## LN-SRCH-005 — Search results: render a file-grouped tree in which every

<a id="ln-srch-005"></a>

**Requirement.** Search results MUST render a file-grouped tree in which every level-one result is collapsible and owns at least one level-two child. Explicit content, tag, metadata, and path snippets MUST remain children; a hit without one MUST receive a `name` child from its filename snippet or file name. The tree MUST highlight explicit ranges, expose totals and sorting, and open a selected file or source position through the API workspace.

## LN-SRCH-006 — Search: retain bounded recent queries, match-case state, result-limit

<a id="ln-srch-006"></a>

**Requirement.** Search MUST retain bounded recent queries, match-case state, result-limit and snippet-length settings, and MUST dispose indexing listeners and pending searches when disabled.

## LN-SRCH-007 — Markdown Tags: open Search with a tag: query. All

<a id="ln-srch-007"></a>

**Requirement.** Markdown Tags MUST open Search with a `tag:` query. All Properties MUST open Search with an escaped bracket-property query while remaining recoverable when Search is disabled.

## LN-SRCH-008 — Sibling lapis-plugins Storybook: demonstrate the real Search plugin in all

<a id="ln-srch-008"></a>

**Requirement.** The sibling `lapis-plugins` Storybook MUST demonstrate the real Search plugin in all governed panel placements over an indexed in-memory vault and verify query, facet, highlight, and navigation behavior. Lapis Notes Storybook MUST retain only profile and plugin-management integration coverage.

## LN-SRCH-009 — Deno desktop: load Search before metadata and layout restoration

<a id="ln-srch-009"></a>

**Requirement.** Deno desktop MUST load Search before metadata and layout restoration so a persisted `search` leaf restores as available and uses the app database search boundary.

## LN-SRCH-010 — Search panel styling: use native CSS and public Design Core

<a id="ln-srch-010"></a>

**Requirement.** Search panel styling MUST use native CSS and public Design Core or workspace tokens. It MUST fill the owning `WorkspaceViewHost` without placement-specific selectors or Tailwind utilities. Its nested `SearchFilterBar` MUST NOT add a second inset inside the padded panel chrome.

## LN-SRCH-011 — Search view: expose persisted Design Core toggles for Match

<a id="ln-srch-011"></a>

**Requirement.** The Search view MUST expose persisted Design Core toggles for Match case, Collapse results, Show more context, and Explain search terms inside `SearchFilterBar`'s single expandable filter area. It MUST NOT render an independent settings trigger.

## LN-SRCH-012 — Collapse results: set the default disclosure state of every

<a id="ln-srch-012"></a>

**Requirement.** Collapse results MUST set the default disclosure state of every file group while preserving later per-file disclosure changes until the result set changes.

## LN-SRCH-013 — Show more context: request longer result snippets. Explain search terms

<a id="ln-srch-013"></a>

**Requirement.** Show more context MUST request longer result snippets. Explain search terms MUST show or hide a plain-language summary of the active query.

## LN-SRCH-014 — Search: expose auto, lexical, vector, and hybrid retrieval

<a id="ln-srch-014"></a>

**Requirement.** Search MUST expose `auto`, `lexical`, `vector`, and `hybrid` retrieval modes and label results with the mode actually applied by `AppDatabase`.

## LN-SRCH-015 — Disabled semantic-search default

<a id="ln-srch-015"></a>

**Requirement.** Semantic search MUST default to disabled. Selecting Transformers.js MUST NOT initialize or download the configured model before the first semantic indexing or query operation, and vault contents MUST remain local.

## LN-SRCH-016 — Search settings: configure the embedding provider, model, remote-model permission

<a id="ln-srch-016"></a>

**Requirement.** Search settings MUST configure the embedding provider, model, remote-model permission, local path, chunking, result bounds, and explicit rebuild.

## LN-SRCH-017 — Search: expose semantic provider, model, indexing progress, error

<a id="ln-srch-017"></a>

**Requirement.** Search MUST expose semantic provider, model, indexing progress, error, and readiness through its database-neutral status API.

## LN-SRCH-018 — Structured queries: remain lexical unless the persisted semantic-structured-query toggle

<a id="ln-srch-018"></a>

**Requirement.** Structured queries MUST remain lexical unless the persisted semantic-structured-query toggle is enabled. Shared API evaluation MUST preserve filters, negation, comparisons, and case behavior.

## LN-SRCH-019 — Search summary: expose result copy, legacy sorting, retrieval badges

<a id="ln-srch-019"></a>

**Requirement.** The Search summary MUST expose result copy, legacy sorting, retrieval badges, and match keys. Search MAY retain bounded recent queries as settings data, but an empty query MUST NOT render result or recent-search rows.

## LN-SRCH-020 — Proxy browser tabs: execute indexing, semantic configuration, status, and queries

<a id="ln-srch-020"></a>

**Requirement.** Proxy browser tabs MUST execute indexing, semantic configuration, status, and queries through the owning app-database session.

## LN-SRCH-021 — Local-LLM query expansion, reranking, and embedded Markdown: remain excluded from this intake

<a id="ln-srch-021"></a>

**Requirement.** Local-LLM query expansion, reranking, and embedded Markdown query blocks MUST remain excluded from this intake.

## LN-SRCH-022 — Search panel facets: use Design Core FilterCommandPicker controls beneath

<a id="ln-srch-022"></a>

**Requirement.** Search panel facets MUST use Design Core `FilterCommandPicker` controls beneath the query, keeping file type and retrieval mode compact while preserving their existing settings.

## LN-SRCH-023 — Search result groups: keep inset parent rows, place an unbordered

<a id="ln-srch-023"></a>

**Requirement.** Search result groups MUST keep inset parent rows, place an unbordered transparent match count at top-right, and keep match-field badges in bottom-left metadata rows. The results surface MUST use the resolved view background, while expanded children MUST use its contrasting secondary background, span the parent width without tree indentation, and retain a border.

## LN-SRCH-024 — Search result-copy and sort controls: retain visible hover and focus paint on

<a id="ln-srch-024"></a>

**Requirement.** Search result-copy and sort controls MUST retain visible hover and focus paint on every workspace surface.

## LN-SRCH-025 — Search retrieval and match-field badges: remain visually distinct while their containing result

<a id="ln-srch-025"></a>

**Requirement.** Search retrieval and match-field badges MUST remain visually distinct while their containing result row is hovered.

## LN-SRCH-026 — Transient semantic-search status

<a id="ln-srch-026"></a>

**Requirement.** The movable Search panel MUST NOT render a persistent semantic-status tag.

## LN-SRCH-027 — Content-match rows: provide top-right before and bottom-right after controls

<a id="ln-srch-027"></a>

**Requirement.** Content-match rows MUST provide top-right before and bottom-right after controls while more source context exists. Each activation MUST reveal additional complete lines, grow the row, preserve the original highlight and navigation target, and stop at the file boundary. Expanded context MUST remain stable until search inputs change or the index explicitly refreshes.

## LN-SRCH-028 — Search match highlighting: use configurable public --ui-search-highlight-background and --ui-search-highlight-foreground tokens

<a id="ln-srch-028"></a>

**Requirement.** Search match highlighting MUST use configurable public `--ui-search-highlight-background` and `--ui-search-highlight-foreground` tokens with a yellow-background Lapis default.

## LN-SRCH-029 — Search result counts: use the workspace sans-serif face

<a id="ln-srch-029"></a>

**Requirement.** Search result counts MUST use the workspace sans-serif face and a faint foreground without a border or background fill.

## LN-SRCH-030 — Result activation preserves panel placement

<a id="ln-srch-030"></a>

**Requirement.** Result activation MUST preserve a Search view hosted in the body by opening the target in a separate body tab. Sidebar-hosted Search MAY continue to reuse the selected body leaf.

## LN-SRCH-031 — Search result parent rows: show only a regular-weight filename without

<a id="ln-srch-031"></a>

**Requirement.** Search result parent rows MUST show only a regular-weight filename without its extension. Expanded result bodies MUST begin with a metadata header containing the full vault path and applied retrieval-mode badge.

## LN-SRCH-032 — Empty-query presentation

<a id="ln-srch-032"></a>

**Requirement.** An empty Search query MUST keep the result surface blank and MAY show only a neutral instruction such as `Type to search.`.

## LN-SRCH-033 — API: expose a lifecycle-managed search-document provider registry. Providers

<a id="ln-srch-033"></a>

**Requirement.** The API MUST expose a lifecycle-managed search-document provider registry. Providers MUST match files and extract normalized content, optional metadata, and tags without writing generated search state.

## LN-SRCH-034 — Search: register Markdown and Canvas as built-in providers

<a id="ln-srch-034"></a>

**Requirement.** Search MUST register Markdown and Canvas as built-in providers and MUST select one provider deterministically by priority. Equal-priority matches MUST fail that file without stopping other files from indexing.

## LN-SRCH-035 — Provider registration and removal: reconcile the index. Registrations completed before MetadataCache

<a id="ln-srch-035"></a>

**Requirement.** Provider registration and removal MUST reconcile the index. Registrations completed before MetadataCache startup MUST be covered by the single startup reconciliation rather than scheduling competing scans. Removing or disabling a provider MUST prune its documents, while provider extraction failures MUST leave the remaining index usable.

## LN-SRCH-036 — Property values: use the canonical ["name"]:value spelling while legacy

<a id="ln-srch-036"></a>

**Requirement.** Property values MUST use the canonical `["name"]:value` spelling while legacy `[name:value]` queries remain readable.

## LN-SRCH-037 — Provider metadata: support property filters even when the vault

<a id="ln-srch-037"></a>

**Requirement.** Provider metadata MUST support property filters even when the vault metadata parser does not index that file extension.

## LN-SRCH-038 — Search Manager: stamp indexed documents with the selected source-provider

<a id="ln-srch-038"></a>

**Requirement.** Search Manager MUST stamp indexed documents with the selected source-provider id, pass optional provider allowlists to `AppDatabase`, and prune only documents owned by its registered providers so independent disposable projections remain intact.

## LN-SRCH-039 — Search: register notes_search through the application tool registry

<a id="ln-srch-039"></a>

**Requirement.** Search MUST register `notes_search` through the application tool registry. It MUST query only Markdown documents inside the trusted conversation path prefix, apply the requested limit before returning, and expose bounded snippets with portable vault-relative paths.

## LN-SRCH-040 — Search: register composer /search as a tool-dispatch command

<a id="ln-srch-040"></a>

**Requirement.** Search MUST register composer `/search` as a tool-dispatch command for `notes_search`. The command MUST pass the raw arguments as `query`, MUST NOT add a workspace palette command, and MUST dispose on unload. An empty query MUST be a visible usage error.

## LN-SRCH-041 — Search: register the notes_search result view. A hit

<a id="ln-srch-041"></a>

**Requirement.** Search MUST register the `notes_search` result view. A hit row MUST open that vault file in a workspace leaf without closing the chat. The view MUST consume `structuredContent.results` paths and snippets.

## LN-SRCH-042 — Warm Search startup: reconcile lightweight document manifests against metadata hashes

<a id="ln-srch-042"></a>

**Requirement.** Warm Search startup MUST reconcile lightweight document manifests against metadata hashes and provider versions. Unchanged documents MUST NOT read vault bodies, enumerate complete Search documents, regenerate chunks, or recompute embeddings.

## LN-SRCH-043 — Search syntax facets: query indexed metadata tags and properties asynchronously

<a id="ln-srch-043"></a>

**Requirement.** Search syntax facets MUST query indexed metadata tags and properties asynchronously. Revision-aware refresh MUST suppress stale results and MUST NOT enumerate `MetadataCache.getAllItems`.

## LN-SRCH-044 — Active Search view: subscribe to revisioned AppDatabase changes and debounce

<a id="ln-srch-044"></a>

**Requirement.** An active Search view MUST subscribe to revisioned AppDatabase changes and debounce re-execution of its current query after committed Search-domain changes or reset invalidation. It MUST suppress stale results and release the subscription on teardown.

## LN-SRCH-045 — Search startup: schedule exactly one reconciliation after the MetadataCache

<a id="ln-srch-045"></a>

**Requirement.** Search startup MUST schedule exactly one reconciliation after the MetadataCache load promise completes and all configured startup providers are registered, and MUST keep persisted results queryable while that work runs. A matching checkpoint MUST skip the full scan even when unrelated configuration or workspace files change; missing or stale state MUST reconcile in bounded yielding batches and expose non-blocking indexing progress. A first index MUST reveal committed batches incrementally, and manual Refresh MUST force reconciliation.

## LN-SRCH-046 — Search: instrument query duration, requested and applied retrieval

<a id="ln-srch-046"></a>

**Requirement.** Search MUST instrument query duration, requested and applied retrieval mode, result count, checkpoint outcome, refresh reason, aggregate reconciliation counts, provider-failure count, cancellation, and failure through the App telemetry contract. Telemetry MUST NOT include the query term, path prefix value, filenames, snippets, documents, provider payloads, or error messages, and matching warm checkpoints MUST produce no reconciliation span.

## LN-SRCH-047 — AppDatabase path-only Search: preserve the structured-query grammar, retrieval mode, ranking

<a id="ln-srch-047"></a>

**Requirement.** AppDatabase path-only Search MUST preserve the structured-query grammar, retrieval mode, ranking, provider, path-prefix, and limit semantics of document Search while returning only ordered vault-relative paths. Graph Filters and Groups MAY consume this operation for membership without importing Search package internals or transferring document bodies and snippets.

## LN-SRCH-048 — Search tag filters: accept / after a normal word start

<a id="ln-srch-048"></a>

**Requirement.** Search tag filters MUST accept `/` after a normal word start, retain leading `/.../` regex syntax, and use quoted phrases for values containing spaces. API-owned dynamic-value formatting and Search autocomplete MUST insert parser-safe tag, path, and filename values while keeping their labels human-readable. A completed predicate facet MUST render the entire accepted value inside its chip.

## LN-SRCH-049 — Search completion popups: portal into their owner document outside workspace

<a id="ln-srch-049"></a>

**Requirement.** Search completion popups MUST portal into their owner document outside workspace clipping, remain above adjacent panels, keep every visible option hit-testable, and use Design Core's compact 18rem viewport-bounded layout with row labels and details wrapping when needed.

## LN-SRCH-050 — Public vault-filter syntax factory

<a id="ln-srch-050"></a>

**Requirement.** API MUST export one vault Search-filter syntax factory that owns the canonical fields, examples, notes, human-readable labels, and parser-safe filename, path, and tag insertion values. Search and Graph MUST provide their vault-derived values to that factory and compose the public Design Core query input with the API language support rather than duplicating syntax catalogs.

## LN-SRCH-051 — Provider-owned search results

<a id="ln-srch-051"></a>

**Requirement.** The API MUST expose an App-owned, plugin-lifecycle search-result provider registry. Providers MUST declare query capabilities, return cancellable paginated results with stable identities and opaque navigation targets, and own activation and optional context expansion. Invalidations MUST be disposable and late callbacks MUST NOT revive removed providers. Existing search-document providers and current-file query contracts remain independent.
