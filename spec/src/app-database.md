# App Database

`AppDatabase` is the stable generated-state boundary. Providers choose a local
engine and transport without exposing either choice to Search, Markdown, or the
workspace shell.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-DB-001 | Existing `AppDatabase` operations MUST remain available while session creation accepts an optional `AppDatabaseProvider`. Explicit database injection MUST remain supported. |
| LN-DB-002 | Every database MUST expose a descriptor with provider, engine, transport, role, storage mode, and query capabilities. Consumers MUST NOT infer capabilities from implementation names. |
| LN-DB-003 | The production local provider MUST use pinned Turso native storage where supported and Turso WASM with OPFS in browser-compatible runtimes. Memory MUST remain explicit test-only injection. |
| LN-DB-004 | Turso storage MUST persist metadata snapshots, indexed files, links, tags, properties, notifications, history, search documents, chunks, embedding state, and application metadata. |
| LN-DB-005 | Lexical retrieval MUST use Turso full-text search when available. Unsupported optimizations MAY degrade to Turso table evaluation while reporting the degraded capability. |
| LN-DB-006 | Semantic retrieval MUST store float vectors in Turso and use Turso vector distance or indexes. Active query paths MUST NOT load sqlite-vec. |
| LN-DB-007 | Document and query embeddings MUST be generated locally through the provider-neutral embedding contract. Configuration MUST remain lazy until the first semantic index or query, and changing model identity or dimensions MUST invalidate affected vectors. |
| LN-DB-008 | Hybrid retrieval MUST combine lexical and vector candidates through the shared API result contract and reciprocal-rank fusion. Structured-query correctness MUST remain API-owned. |
| LN-DB-009 | Legacy SQLite files MUST NOT be opened, imported, migrated, or deleted. Removing backward compatibility MUST also remove their runtime dependencies and query paths. |
| LN-DB-010 | Electron database IPC MUST expose bounded allowlisted operations, validate renderer and vault ownership, and never expose raw SQL or filesystem paths. |
| LN-DB-011 | Browser coordination MUST use Web Locks for ownership and BroadcastChannel for heartbeats and typed RPC. A surviving proxy MUST promote after the owner closes or becomes stale. |
| LN-DB-012 | Missing OPFS, isolation, locks, or channels MUST produce an explicit blocked state with accurate capabilities rather than opening a non-Turso app-database fallback. |
| LN-DB-013 | Local storage MUST remain authoritative. A future synced provider MAY be injected, but this intake MUST NOT configure credentials, remote databases, or note upload. |
| LN-DB-014 | API-owned property evaluation MUST merge indexed vault properties with normalized search-document metadata without persisting provider fields into the metadata index. |
| LN-DB-015 | Each search document MUST retain its singular domain source-provider id, and search queries MUST support an optional allowlist of source-provider ids across memory, Turso, native IPC, and browser-proxy transports. Provider filtering MUST occur before result limits are applied, while an absent or empty allowlist MUST preserve unfiltered search behavior. |
| LN-DB-016 | Search queries MUST support one normalized vault-relative path prefix across memory, Turso, native IPC, and browser-proxy transports. Prefix filtering MUST occur before ranking and result limits, match only the selected path or descendants, and preserve unfiltered behavior when absent. |

## Runtime topology

```text
App / plugins
     ↓ AppDatabase
AppDatabaseProvider
     ├─ Electron main → Turso native
     ├─ Electron Intel renderer worker → Turso WASM + OPFS
     ├─ browser owner worker → Turso WASM + OPFS
     └─ browser proxy → BroadcastChannel RPC → owner
```

`storeFileHistoryRevision` MAY replace the latest same-path revision when the
caller sets `replaceLatest`. History uses that option for the modify merge
window so rapid edits do not append a new snapshot.

The provider persists generated state outside the user-visible vault. Memory is
an explicitly injected test and Storybook double; production sessions do not
select it and never select SQLite or IndexedDB app-database implementations.

Vault filename and path glob discovery does not read or populate the app
database. It evaluates the API-owned in-memory vault tree; indexed metadata and
property evaluation remain separate database-backed contracts.

The Electron implementation opens one Turso handle per renderer and vault in
main on supported native targets. Its renderer client can invoke only the
fixed `AppDatabase` method catalogue. Intel macOS selects the same provider
contract over the self-contained Turso WASM bundle and OPFS instead of opening
a compatibility database. Session disposal drains metadata-cache work and
cancels delayed writes before closing the owning Turso handle.

The browser coordinator opens that WASM provider only in the elected owner.
Proxy tabs obtain the owner's probed descriptor and delegate through a bounded
method catalogue that excludes lifecycle and raw-storage operations. Requests
validate vault, owner, method, argument count, identifiers, and payload size;
responses validate the expected responder. A promoted proxy replays pending
work against its newly opened Turso handle rather than selecting a fallback.
