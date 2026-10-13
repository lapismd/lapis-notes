# Search Plugin / Context

`@lapis-notes/search` owns vault search indexing, query presentation, result
navigation, and the `search` workspace view. Query parsing and generated search
state remain API contracts, while reusable search chrome remains Design Core.
The package consumes that Design Core boundary through its published semver
contract and MUST NOT assume a sibling-repository path or workspace `link:`
override.

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

- The plugin owns provider selection, indexing policy, local embedding configuration, and presentation state.

- It does not own Turso drivers, workspace layout, vault selection, Markdown metadata parsing, or domain file parsers.

- Domain plugins contribute normalized documents through the public API registry without importing Search internals.

- Tags and Properties depend only on the registered Search command, not on Search package internals.

- Its bundled `notes_search` callback captures `SearchManager`, requests only the `search:markdown` source under the trusted scope prefix, and projects bounded path, score, and snippet data without exposing database or MCP objects.

- The tool description names indexed vault search and tells the agent to prefer it over host-cwd shell lookup (LN-AI-108).

- The tool also enforces an aggregate structured-result budget after database ranking, so a high requested limit cannot expand transport or durable tool projection beyond the host's bounded-result contract.

- Composer `/search` is the user-facing tool-dispatch path for the same `notes_search` callback; it stays off the workspace palette and disappears when Search unloads (LN-SRCH-040).

- The same plugin registers the `notes_search` chat result view so hit rows open the matching vault file (LN-SRCH-041).

- `@lapis-notes/search/agent-tools` exposes only the portable factory used by the explicit real-agent probe; indexing ownership and plugin registration remain in the Search root package.

- The canonical palette opener is `Search: Open Search` (`search:open-search`); it accepts the existing optional query argument, reuses a moved Search leaf, or creates, activates, and reveals the default left-sidebar leaf.

- Vault refresh and embedding rebuild report each file path through `notifications.withProgress`.

- App `app:rebuild-generated-state` executes `search:rebuild-search-index` when Search is loaded (LN-PKG-098).

- Web vault copy progress stays on that same notification or startup-detail surface (LN-WEB-042, LN-WEB-043).

- Warm refresh merge-compares sorted Search and metadata manifests with the vault stat manifest.

- Matching provider version, projection signature, stat, and metadata hash skip body reads, metadata hydration, chunking, and embedding.

- Startup performs this work once after MetadataCache finishes its own load and all configured providers have registered.

- Provider registrations from that initial plugin-loading phase are absorbed into the one startup fingerprint; unrelated vault configuration writes do not dirty it.

- The scan is skipped entirely when the versioned Search checkpoint matches.

- Persisted rows remain queryable throughout a stale or first-index reconciliation, whose bounded batches yield to renderer input and report through the status progress surface.

- Manual Refresh remains a forced reconciliation.

- Search syntax tag suggestions use revision-aware indexed facets.

- The governed Search panel story starts from persisted indexed facets, exposes a failed facet query as an alert, and proves a later committed invalidation recovers without enumerating Search documents or MetadataCache snapshots.

- Path-only Search remains an API database capability rather than a Search-plugin presentation API.

- Consumers receive membership paths only; indexing, structured-query semantics, and Search-domain revision ownership remain here.

- Search query words may contain `/` after their first character, so hierarchical tags such as `tag:#team/project` remain bare while a leading slash continues to start a regex.

- Values containing whitespace use quoted field syntax, for example `tag:"#project alpha"`.

- Dynamic tag, path, and filename suggestions retain their plain labels and delegate insertion escaping to the API formatter so selected values always round-trip through the shared parser.

- The API vault-syntax factory is the single catalog consumed by Search and Graph; each plugin owns only its value discovery, diagnostics, and query consequences.
