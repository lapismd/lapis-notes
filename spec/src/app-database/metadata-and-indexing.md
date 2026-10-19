# App Database / Metadata and indexing

LN-PKG-185 filters the core Vault enumeration used by discovery consumers.
The retained resource map, explicit metadata reads and database persistence
formats remain unchanged; discovery exclusions are not backup or access policy.

## LN-DB-002 — Database: expose a descriptor with provider, engine, transport

<a id="ln-db-002"></a>

**Requirement.** Every database MUST expose a descriptor with provider, engine, transport, role, storage mode, and query capabilities. Consumers MUST NOT infer capabilities from implementation names.

## LN-DB-004 — Turso storage: persist indexed files, metadata, links, tags, properties

<a id="ln-db-004"></a>

**Requirement.** Turso storage MUST persist indexed files, metadata, links, tags, properties, plugin projections, notifications, history, search documents, chunks, embedding state, and application metadata in normalized tables. Metadata and other durable domains MUST NOT depend on a whole-database compatibility snapshot.

## LN-DB-005 — Lexical retrieval: use Turso full-text search when available. Unsupported

<a id="ln-db-005"></a>

**Requirement.** Lexical retrieval MUST use Turso full-text search when available. Unsupported optimizations MAY degrade to Turso table evaluation while reporting the degraded capability.

## LN-DB-006 — Semantic retrieval: store float vectors in Turso and use

<a id="ln-db-006"></a>

**Requirement.** Semantic retrieval MUST store float vectors in Turso and use Turso vector distance or indexes. Active query paths MUST NOT load sqlite-vec.

## LN-DB-007 — Document and query embeddings: generated locally through the provider-neutral embedding contract

<a id="ln-db-007"></a>

**Requirement.** Document and query embeddings MUST be generated locally through the provider-neutral embedding contract. Configuration MUST remain lazy until the first semantic index or query, and changing model identity or dimensions MUST invalidate affected vectors.

## LN-DB-008 — Hybrid retrieval: combine lexical and vector candidates

<a id="ln-db-008"></a>

**Requirement.** Hybrid retrieval MUST combine lexical and vector candidates through the shared API result contract and reciprocal-rank fusion. Structured-query correctness MUST remain API-owned.

## LN-DB-009 — Legacy SQLite files remain untouched

<a id="ln-db-009"></a>

**Requirement.** Legacy SQLite files MUST NOT be opened, imported, migrated, or deleted. Removing backward compatibility MUST also remove their runtime dependencies and query paths.

## LN-DB-014 — API-owned property evaluation: merge indexed vault properties with normalized search-document

<a id="ln-db-014"></a>

**Requirement.** API-owned property evaluation MUST merge indexed vault properties with normalized search-document metadata without persisting provider fields into the metadata index.

## LN-DB-015 — Search document: retain its singular domain source-provider id,

<a id="ln-db-015"></a>

**Requirement.** Each search document MUST retain its singular domain source-provider id, and search queries MUST support an optional allowlist of source-provider ids across memory, Turso, and browser-proxy transports. Provider filtering MUST occur before result limits are applied, while an absent or empty allowlist MUST preserve unfiltered search behavior.

## LN-DB-016 — Search queries: support one normalized vault-relative path prefix across

<a id="ln-db-016"></a>

**Requirement.** Search queries MUST support one normalized vault-relative path prefix across memory, Turso, and browser-proxy transports. Prefix filtering MUST occur before ranking and result limits, match only the selected path or descendants, and preserve unfiltered behavior when absent.

## LN-DB-017 — AppDatabase: persist namespaced plugin projections as disposable rows

<a id="ln-db-017"></a>

**Requirement.** AppDatabase MUST persist namespaced plugin projections as disposable rows with typed indexed values, source freshness, and edges. The vault file remains authoritative.

## LN-DB-018 — AppDatabase: expose allowlisted queryProjection, getProjectionRow, and queryRelated over

<a id="ln-db-018"></a>

**Requirement.** AppDatabase MUST expose allowlisted `queryProjection`, `getProjectionRow`, and `queryRelated` over a serializable query AST. Callers MUST NOT receive raw SQL.

## LN-DB-019 — Core Markdown indexing: store links as reference. A domain projection

<a id="ln-db-019"></a>

**Requirement.** Core Markdown indexing MUST store links as `reference`. A domain projection MAY derive `task-entry`, `list-entry`, or `navigation-item` only from its resolved document model; heading text alone MUST NOT assign structural meaning.

## LN-DB-020 — Core file-index writes: commit independently of plugin projections. A failed

<a id="ln-db-020"></a>

**Requirement.** Core file-index writes MUST commit independently of plugin projections. A failed projection MUST NOT block metadata and MUST hide stale rows.

## LN-DB-021 — Query AST: support and, or, not, compare, in, exists

<a id="ln-db-021"></a>

**Requirement.** The query AST MUST support and, or, not, compare, in, exists, select, orderBy, limit, and cursor after. Default queries MUST return only current ready rows.

## LN-DB-022 — Plugin namespaces for projection IDs

<a id="ln-db-022"></a>

**Requirement.** Projection IDs MUST be namespaced by plugin id. Other plugins MAY query public projections and MUST NOT query private ones or write another plugin's rows.

## LN-DB-023 — Public task projection queries

<a id="ln-db-023"></a>

**Requirement.** `queryTasks` and `getTaskRow` MAY wrap the public `tasks/task` projection. `listTaskDescendants` MUST follow resolved `task-entry` and `list-entry` projection edges rather than infer structure from generic indexed links.

## LN-DB-024 — Public tasks/task projection version 4: retain the complete RRULE and tracking contracts

<a id="ln-db-024"></a>

**Requirement.** Public `tasks/task` projection version 4 MUST retain the complete RRULE and tracking contracts as disposable JSON, MUST index the current effective occurrence date and state plus the local date for which they were resolved, and task view queries MUST use those effective fields so Review contains only carried overdue occurrences and Upcoming contains one future occurrence per Task row.

## LN-DB-025 — Public tasks/occurrence projection rows: disposable observations sourced from exact daily Markdown

<a id="ln-db-025"></a>

**Requirement.** Public `tasks/occurrence` projection rows MUST be disposable observations sourced from exact daily Markdown ranges, MUST identify one task and occurrence date with pending, completed, or missed outcome data, and MUST retain quantitative value, unit, duration, and source offsets without becoming occurrence authority.

## LN-DB-027 — Indexed metadata: expose async per-file, paginated, tag-facet, property-facet, incoming-link

<a id="ln-db-027"></a>

**Requirement.** Indexed metadata MUST expose async per-file, paginated, tag-facet, property-facet, incoming-link, outgoing-link, resolved-link, and unresolved-link queries. Queryable tag, property, and link fields MUST use typed indexed columns rather than JSON scans.

## LN-DB-030 — Turso v2 migration: validate normalized metadata, Search, History, task, notification

<a id="ln-db-030"></a>

**Requirement.** The Turso v2 migration MUST validate normalized metadata, Search, History, task, notification, and projection rows before activating direct SQL. Failure MUST preserve the prior database and MUST NOT rebuild or discard database-only History.

## LN-DB-031 — Warm metadata startup: make persisted queries available before background vault

<a id="ln-db-031"></a>

**Requirement.** Warm metadata startup MUST make persisted queries available before background vault reconciliation. A matching reconciliation checkpoint MUST skip the full manifest scan, and an unchanged vault MUST NOT read note bodies, metadata payload JSON, Search content, or History payloads during database open.

## LN-DB-032 — 50,000-note warm-vault performance lane: enforce bounded metadata memory and native/WASM readiness

<a id="ln-db-032"></a>

**Requirement.** A 50,000-note warm-vault performance lane MUST enforce bounded metadata memory and native/WASM readiness and query budgets. A 100,000-note lane MUST report non-blocking stress results.

### Acceptance details

The dedicated performance runner verifies a warm 50,000-note vault:

- Database open plus queryable metadata readiness MUST complete within 1 second for native Turso and 2.5 seconds for WASM/OPFS at p95 over five runs.
- Per-file lookup MUST complete within 25ms native and 75ms WASM/OPFS at p95.
- Indexed tag, property, and backlink queries MUST complete within 200ms native and 500ms WASM/OPFS at p95.
- The metadata hot cache MUST retain at most 512 entries, and unchanged warm startup MUST read zero Markdown bodies.
- A 100,000-note run MUST report the same measurements without blocking the required lane.

The vault side of warm reconciliation MUST iterate loaded files without
constructing a second vault-sized collection. Exact-path manifest lookups are
bounded to 500 paths so new files can be found without hydrating metadata JSON.
The recorded 2026-08-23 native and WASM/OPFS results are retained in
`performance/metadata-database-2026-08-23.md`.

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

## LN-DB-033 — Compatibility metadata snapshot import and export: remain deprecated for one release. Production startup

<a id="ln-db-033"></a>

**Requirement.** Compatibility metadata snapshot import and export MAY remain deprecated for one release. Production startup MUST NOT invoke either operation or maintain the snapshot after normalized writes.

## LN-DB-035 — Metadata and Search reconciliation: store independent versioned checkpoints in app_meta. Metadata

<a id="ln-db-035"></a>

**Requirement.** Metadata and Search reconciliation MUST store independent versioned checkpoints in `app_meta`. Metadata fingerprints MUST cover processable path, mtime, size, and parser signature and MAY restrict those inputs to consumer-selected files; Search fingerprints MUST additionally cover provider identity and version, projection signature, and chunk settings. A checkpoint MUST advance only after successful reconciliation or a drained incremental update, while missing, stale, failed, or cancelled work MUST remain fail-closed.

## LN-DB-036 — Opt-in desktop telemetry: trace bounded native database lifecycle, manifest, query

<a id="ln-db-036"></a>

**Requirement.** Opt-in desktop telemetry MAY trace bounded native database lifecycle, manifest, query, and indexing-boundary operations. It MUST preserve the AppDatabase method contract and MUST NOT export database identifiers, arguments, paths, Search text, document rows, or result contents.

## LN-DB-037 — Metadata and Search reconciliation telemetry: distinguish checkpoint hit, miss, completion, cancellation,

<a id="ln-db-037"></a>

**Requirement.** Metadata and Search reconciliation telemetry MUST distinguish checkpoint hit, miss, completion, cancellation, and failure without changing `app_meta` checkpoint semantics. It MAY report bounded totals, processed, changed, deleted, result, provider-failure, and batch counts, but MUST NOT export manifest rows, fingerprints, paths, Search terms, snippets, or exception messages.

## LN-DB-038 — Indexed metadata paging: accept an optional metadata-domain projection while preserving

<a id="ln-db-038"></a>

**Requirement.** Indexed metadata paging MUST accept an optional metadata-domain projection while preserving the complete-row default. Direct Turso providers MUST materialize each requested page with bounded table-level reads and bind-safe path chunks rather than per-file child queries. AppDatabase MUST also expose an allowlisted path-only Search operation so consumers that need membership sets do not receive document bodies, snippets, or metadata payloads.

## LN-DB-039 — Indexed metadata path-prefix filters: remain valid for large bounded sets. Direct

<a id="ln-db-039"></a>

**Requirement.** Indexed metadata path-prefix filters MUST remain valid for large bounded sets. Direct SQLite providers MUST compile disjunctions with bounded expression depth instead of a linear `OR` tree, while callers that expand graph neighbourhoods MUST still split path sets below the provider bind budget.

## LN-DB-041 — Episodic and curated memory Search documents: use distinct provider ids and scope-bearing synthetic

<a id="ln-db-041"></a>

**Requirement.** Episodic and curated memory Search documents MUST use distinct provider ids and scope-bearing synthetic paths. Provider and scope filters MUST apply before candidate limits, while embedding identity changes MUST retain the existing disposable reindex behavior.

## LN-DB-042 — Memory recall signals: store only a per-vault salted query fingerprint

<a id="ln-db-042"></a>

**Requirement.** Memory recall signals MUST store only a per-vault salted query fingerprint, day, bounded score, and count. Raw queries MUST NOT enter memory state, telemetry, job errors, or review artifacts.

## LN-DB-043 — Memory jobs: support one renewable owner lease, bounded attempts

<a id="ln-db-043"></a>

**Requirement.** Memory jobs MUST support one renewable owner lease, bounded attempts, resumable cursors, and post-commit `memory` change notifications. Losing a lease or failing a job MUST leave published Search rows and durable vault files intact.

## LN-DB-044 — Memory schema migration: additive and transactional. Deleting all derived memory

<a id="ln-db-044"></a>

**Requirement.** The memory schema migration MUST be additive and transactional. Deleting all derived memory tables and Search rows MUST permit a deterministic rebuild from transcripts, curated Markdown, revision files, reviews, and exclusions without touching unrelated AppDatabase domains.
