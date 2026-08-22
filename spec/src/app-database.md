# App Database

`AppDatabase` is the stable generated-state boundary. Providers choose a local
engine and transport without exposing either choice to Search, Markdown, or the
workspace shell.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-DB-001 | Existing `AppDatabase` operations MUST remain available while session creation accepts an optional `AppDatabaseProvider`. Explicit database injection MUST remain supported. |
| LN-DB-002 | Every database MUST expose a descriptor with provider, engine, transport, role, storage mode, and query capabilities. Consumers MUST NOT infer capabilities from implementation names. |
| LN-DB-003 | The production local provider MUST use pinned Turso native storage where supported and Turso WASM with OPFS in browser-compatible runtimes. The WASM path MUST use a host-compatible driver entrypoint instead of a prebuilt worker-inline bundle. Memory MUST remain explicit test-only injection. |
| LN-DB-004 | Turso storage MUST persist metadata snapshots, indexed files, links, tags, properties, plugin projections, notifications, history, search documents, chunks, embedding state, and application metadata. |
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
| LN-DB-017 | AppDatabase MUST persist namespaced plugin projections as disposable rows with typed indexed values, source freshness, and edges. The vault file remains authoritative. |
| LN-DB-018 | AppDatabase MUST expose allowlisted `queryProjection`, `getProjectionRow`, and `queryRelated` over a serializable query AST. Callers MUST NOT receive raw SQL. |
| LN-DB-019 | Core Markdown indexing MUST store links as `reference`. A domain projection MAY derive `task-entry`, `list-entry`, or `navigation-item` only from its resolved document model; heading text alone MUST NOT assign structural meaning. |
| LN-DB-020 | Core file-index writes MUST commit independently of plugin projections. A failed projection MUST NOT block metadata and MUST hide stale rows. |
| LN-DB-021 | The query AST MUST support and, or, not, compare, in, exists, select, orderBy, limit, and cursor after. Default queries MUST return only current ready rows. |
| LN-DB-022 | Projection IDs MUST be namespaced by plugin id. Other plugins MAY query public projections and MUST NOT query private ones or write another plugin's rows. |
| LN-DB-023 | `queryTasks` and `getTaskRow` MAY wrap the public `tasks/task` projection. `listTaskDescendants` MUST follow resolved `task-entry` and `list-entry` projection edges rather than infer structure from generic indexed links. |
| LN-DB-024 | Public `tasks/task` projection version 3 MUST retain the complete RRULE and tracking contracts as disposable JSON, MUST index the current effective occurrence date and state plus the local date for which they were resolved, and task view queries MUST use those effective fields so Review contains only carried overdue occurrences and Upcoming contains one future occurrence per Task row. |
| LN-DB-025 | Public `tasks/occurrence` projection rows MUST be disposable observations sourced from exact daily Markdown ranges, MUST identify one task and occurrence date with pending, completed, or missed outcome data, and MUST retain quantitative value, unit, duration, and source offsets without becoming occurrence authority. |

The public `tasks/task` `planKind` field mirrors Tasks document `plan.at`:
`anytime`, `morning`, `afternoon`, `evening`, or `time`, with `planTime` for
clock values. Task YAML does not store `all-day`; that token is reserved for
a future calendar or event resource.

The task projection stores the recurrence object rather than expanding a task
into virtual rows. Its indexed `effectiveOccurrenceDate`,
`effectiveOccurrenceState`, and `effectiveForDate` fields are refreshable
runtime projections. The `tasks/occurrence` projection is separate: it records
what daily Markdown says happened and may be deleted and rebuilt without
changing either the Task document or the daily note.

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
Search path-prefix filtering uses exact directory boundaries and runs on the
shared candidate set before score calculation, ranking, and limiting. Turso
requests that carry a prefix fetch the complete candidate path set before the
shared evaluator; native and browser proxies forward the same typed option.

The Electron implementation opens one Turso handle per renderer and vault in
main on supported native targets. Its renderer client can invoke only the
fixed `AppDatabase` method catalogue. Intel macOS selects the same provider
contract over the self-contained Turso WASM bundle and OPFS instead of opening
a compatibility database. The WASM provider imports the driver's host-bundler
entry so web and renderer builds serve driver-owned worker and WASM assets
without inlining the package's prebuilt worker module. Session disposal drains
metadata-cache work and
cancels delayed writes before closing the owning Turso handle.

The browser coordinator opens that WASM provider only in the elected owner.
Proxy tabs obtain the owner's probed descriptor and delegate through a bounded
method catalogue that excludes lifecycle and raw-storage operations. Requests
validate vault, owner, method, argument count, identifiers, and payload size;
responses validate the expected responder. A promoted proxy replays pending
work against its newly opened Turso handle rather than selecting a fallback.
