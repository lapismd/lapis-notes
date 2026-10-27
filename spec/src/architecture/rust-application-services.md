# Architecture / Rust application services

The [shared Rust plan](../../../RUST_CORE_MIGRATION_PLAN.md) supersedes future
Node-specific hosted parity implementation. Existing hosts stay supported until
their replacement gates pass. See [current status](../../../MIGRATION.md) and
[hosted provider-screen evidence](../../records/2026-10-25-hosted-provider-screen.md).

The main Notes `default` workspace owns that R0–R7 master tracker. Desktop's
separate M-series tracker points here for shared-core activity. R3.1.18 native
runtime/model installation has [independent source evidence](../../records/2026-10-24-rust-core-model-cache.md).
Source database conformance and vault lifetime are qualified. HTTP and retained
Web staging qualify R1.3.9: [managed vaults](rust-managed-vaults.md), bounded
transfers and signed plugins. [Committed Tauri intake](../../records/2026-10-25-rust-desktop-intake.md) completes R1.3; [current-profile R3 is complete](../../records/2026-10-27-r3-completion.md), while R4–R7 remain.

R1.1 extracts Desktop's existing vault file engine into `lapis-app-core` and
updates native callers directly. The low-level engine retains the caller-owned
IO gate; extracting it does not claim cross-client serialization or new job
lifetime. R1.2/R1.3 retain those gates. Native directory witnesses are explicit
capability handles, never renderer or HTTP values. Watch/resource/profile policy
remains in Desktop while the common engine owns checked IO and publication.

[Native indexing](rust-indexing-lifetime.md) returns an explicit refresh's completed-pass snapshot independently of later live activity and stages qualified Markdown/Canvas metadata and Search, Tasks and Docs on one admitted worker with explicit client-writer fencing; ordered Task lifecycle, typed cold recovery and explicit default-daily tracked-today selection are source-qualified separately. [Daily locale source](../../records/2026-10-26-native-daily-locale-parity.md) qualifies the declared English contexts; actual host and timezone gates remain separate.
Guarded Task transformations reuse the existing writer and shared private turn-record IO, retaining pinned before/desired bytes and bounded typed cold failures; [History scheduling](rust-history-indexing-lifetime.md) retains paused/cold reads, final backup notifications and shared admitted transport; [Repository reads](rust-history-reader.md) retain admitted scopes and native retirement; [remaining History parity](rust-history-parity.md) separates guarded restore with fixed path-free diagnostics and redacted unknown failures, native backup selection/passive status, [independent original scopes](rust-history-parity.md#ln-core-024) and deferred optional legacy capture.
[Native editor intents](native-editor-intents.md) add pre-edit native fencing and App-owned protected handoff. [LN-CORE-026](native-editor-intents.md#ln-core-026) scopes clean noninteractive state to admitted operations while preserving HTTP caller identity and foreign-editor fencing. Captured-state explicit recovery preserves file bytes and refuses stale decisions; host adoption and combined intake retain separate gates. Current-profile host/provider gates are qualified in [R3 completion](../../records/2026-10-27-r3-completion.md); unknown custom processors remain client-dependent and optional Docs host/UI stays separate; [admitted Tasks](rust-task-host-port.md) supplies shared commands and observation; [staged hosted acceptance](../../records/2026-10-26-hosted-native-tasks.md) is qualified separately.

The core boundary audit runs in normal checks and canonical specification checks; protocol export helpers are grouped by contract family. [Native queue transport](rust-turn-admission.md#ln-core-032) stages generated commands; [shared queue hosts](rust-turn-admission.md#ln-core-036) adapt existing screens without transferring durable ownership. [Native participants](rust-participants.md) retain one authored parent, coordinated publication and declared-profile observation through admitted ports; complete host/provider gates remain separate.
It rejects transport dependencies/source references, bare renderer globals and host
source routing while permitting ordinary Rust member fields; source/test limits remain enforced. Native builds retain checkout-owned output and the
30 GiB free-space preflight, without automatic cache cleanup.

R1.2 adds one service owner for each admitted vault ID and physical directory.
Clients attach with fresh IDs and a service generation; their removal leaves
admitted work alive. The owner serializes conditional writes, rejects foreign or
stale generations, and fences new work before draining closure. Explicit close
refuses unresolved dirty editors without retiring the original service. Detached
dirty claims remain blockers until explicitly recovered or discarded. Saved
editor acknowledgements cannot clear a newer edit generation. Reconnecting clients
can discover retained dirty claims and explicitly take ownership before resolving
them. Client saves cannot bypass another client's claim; native writes also
check file identity so hard-link aliases cannot bypass that guard.

Protocol major three replaces the previous hosted control plane only when both
host adapters qualify in R1.3. Rust types generate the JSON schema and TypeScript
bindings. R1.2 establishes in-process ownership and transport conformance, not
[durable turns, typed commands, explicit continuation and feature activation](rust-turn-admission.md), or final hosted cutover.
Native target `default_mode` follows [trusted mode authority](rust-turn-admission.md#ln-core-009);
[source qualification](../../records/2026-10-25-native-target-modes.md) keeps adapter/provider gates separate.

R1.3 stages the existing portable shell file actions through that same owner.
Reads retain their bounded text/binary/range contracts; mutations retain mtime,
exclusive destinations, byte-conditional publication and readable directory sync. Rename/removal fence dirty
descendants, including aliases of an ancestor directory. OS open/reveal/trash,
absolute-path conversion and native capability witnesses remain host policy.
Native adapters hand their existing retained physical root to `admit_root`;
service admission must not reopen a potentially replaced path. This capability
is a native Rust value and never a transport field.
The staged command contract does not itself qualify either adapter or backup
lifetime; their acceptance remains required before R1.3 completes.

R1.3 HTTP staging adds a private Axum adapter around the same service owner.
An operator-owned startup configuration admits opaque vault IDs and roots;
requests cannot select native paths. A required owner bearer token and exact
protocol-major header protect every API route. Browser Origin requests must
match the configured public origin; no cross-origin permission is granted.
Client attachments span requests; detach retains dirty claims and accepted work.
Typed errors omit native paths and distinguish file permissions from client denial.
Blocking file operations run outside the async executor. Bounded JSON commands
qualify the initial adapter only; later R1.3 receipts qualify streamed bodies,
browser login/shell and native backup. SSE and final delivery remain R7.

Hosted attachment leases expire after five minutes without an admitted command,
byte transfer or explicit heartbeat. Expiry detaches only the client; the vault,
accepted jobs and unresolved dirty claims remain service-owned. A stale client
cannot renew itself after expiry. Native maintenance reaps idle clients without
waiting for an HTTP subscriber, and clients can attach afresh to discover
retained claims. Shutdown stops maintenance after the service leave gate passes.

Raw HTTP file bodies use the same native writer guard and atomic publication.
Uploads spool bounded bytes outside the vault lock and publish only after the
body completes; interrupted or oversized bodies cannot replace a note. Strong
ETags select missing/exact-version writes. Read responses stream an immutable,
bounded native snapshot with a matching ETag, content length and byte ranges.
Resource routes retain restrictive MIME/CSP policy. Slow network consumers do
not own vault jobs, and HTTP shutdown has a bounded drain after the native leave
gate passes. Native paths and file handles never become protocol fields.
Rejected file uploads and oversized JSON bodies close the HTTP/1 connection:
unread bytes may still be in flight. Clients must not reuse an uncertain upload
connection.

Rust hosted browser authentication retains LN-SRV-004/005: idempotent owner
bootstrap from a private password file, bounded scrypt, hashed opaque sessions,
seven-day idle/thirty-day absolute expiry, exact Origin/CSRF checks, login
throttling and revocation. The initial host has one installation owner. A private
control Turso database stays outside admitted vaults; raw credentials/tokens are
never persisted or logged. Client attachments bind to their authenticated
session, and logout detaches them without clearing retained dirty claims or
cancelling accepted work. Bearer access remains an explicit operator option.
The existing hosted AppDatabase method allowlist remains required; browser
intake must not replace it with a raw SQL interface.

The native AppDatabase facade starts with the existing high-level metadata
catalogue: get/set, bounded prefix scans, conditional transactions and change
revisions. It retains the existing `app_meta`, `app_revision` and `app_changes`
tables. Native open and explicit `migrate` initialize the current normalized
Turso v5 schema and both version markers in one transaction, preserving stored
payloads and the change revision without publishing a user mutation. Explicit
migration shares the bounded worker's admission and drain. Failed schema initialization
rolls back schema and markers. Unsupported versioned formats fail without
rewriting or importing them; the pre-release unversioned native schema remains
admissible. Full legacy migration remains in the retained provider.
One bounded native worker owns each opened database. Accepted operations outlive their waiters;
close fences admission, drains accepted operations and checkpoints. Conditional
checks, mutations and their change revision commit in one native transaction.
No browser endpoint exposes SQL or a database path. The full catalogue and its
vault-lifetime integration remain prerequisites for the R1.3 hosted shell.

The native call boundary retains the complete AppDatabase method allowlist and
four-argument/32 MiB bounds. Tagged JavaScript values preserve omitted/undefined
slots independently of explicit JSON null, including optional middle arguments.
Dispatch decodes existing domain DTOs and calls the same owned operations;
it introduces no SQL, root selection or alternate engine. Missing getters and
void results remain undefined; nullable domain results remain null. Omitted
queries retain their existing defaults. The method set is checked against the
retained public allowlist. Adapter selection and vault-lifetime adoption remain
separate gates.

Native database selection is installation policy. An admitted vault lazily opens
one database worker under its opaque identity in the host's retained profile;
clients share that owner and cannot select storage or model paths. Client detach
does not close it. Vault close and Quit fence its queue and wait for accepted
operations, checkpoint and lock release before retiring the service generation.
Unpolled client replies cannot hold that drain open.
Dirty-editor preflight leaves every database live when Quit is refused. Cancelled
initialization cannot strand close, and replaced physical roots fail admission.
File-only service profiles report an unavailable database without a fallback.
The R1.3.7 source gate does not itself switch either application adapter.

R1.3.8 HTTP database calls use the same authenticated, leased client attachment,
protocol version, exact Origin and mutation CSRF policy as file commands. Native
startup selects database/model directories outside vault content from installation
policy. Calls retain the high-level method catalogue and tagged JavaScript values,
with a 32 MiB request bound; ordinary JSON commands keep their 2 MiB bound.
Detaching a browser client does not close its shared database. Neither SQL nor
storage/model paths become request inputs. Existing shell and Tauri adoption
have separate passing R1.3 acceptance receipts.

R1.3.8 clients subscribe through the admitted service to its bounded committed
database changes. A passive receiver owns neither a work lease nor database
admission; detach and slow consumption cannot delay writes or close. Closed or
replaced vaults and unselected databases retain their existing errors. Lag remains
explicit so host adapters can publish a complete refresh before resuming.
The public `@lapis-notes/api/app-database` entry exports the Rust-generated call,
value, method and change DTOs; generation and packed type checks reject drift
from the retained AppDatabase method and change contracts. Runtime catalogue
dispatch retains the union of each method's argument tuples.

Search call conformance retains the existing optional query-enhancement request
and skip diagnostics. Unsupported runtime, strong-signal and unavailable-provider
outcomes keep their prior order and complete-result signals before final limits.
The request does not admit model files, install assets or add an expansion/rerank
engine; portable provider paths are never native execution authority.

The facade also retains notebook state and notification records in their
existing domains. Deprecated metadata-snapshot methods remain explicit
compatibility operations and must never become startup or normalized-storage
fallbacks. Mutations journal their domain/path detail atomically and publish
bounded native change notifications only after commit. Missing notification
updates produce no change; clearing all notifications retains its existing
single committed revision. Slow or absent subscribers never own database work.
Native change buffers hold 128 entries. Path detail above 64 KiB or 500 paths
becomes a complete-domain reset; a lagged subscriber must refresh before resuming.

AppDatabase file-history storage retains its database-only revisions, lineage,
deduplication, rename/delete/restore, latest-revision replacement and retention
contracts. Its native mutations journal and publish through the same transaction
owner. This compatibility storage is distinct from the existing JJ repository
engine and does not qualify repository scheduling, restore or backup lifetime.

Native core metadata publication stores per-file records and normalized
tag/property/link columns independently of plugin projections (LN-DB-020).
Native reads retain per-file/materialized-domain selection, bounded manifests,
typed indexed filters/sorts, facets and incoming/outgoing link queries. Core
publication is a lower-level processor boundary; the complete AppDatabase
upsert and rename/delete operations must also retain their separate task,
projection, Search and notebook effects before host intake.

Native projection storage retains the existing plugin namespaces, active
definitions, atomic source replacement and error/delete/unregister cleanup.
Each source keeps at most 64 rows; typed indexed values retain the first 64
indexed/sortable fields in JavaScript property order and the 4096 UTF-16-unit
text bound. Definition, source, row, value, edge and change-journal updates share
the native writer. Single-row reads retain explicit private-owner checks,
identity/path aliases and source hash/schema/config freshness without writing.
Projection AST/relationship source qualification is recorded in the
[native query intake](../../records/2026-10-24-rust-core-projection-queries.md).
Task composition, host adoption and unattended scheduling remain separate gates.

The retained API providers first qualify the shared projection-query fixture.
Their complete evaluator owns scalar/null comparison, own-field selection,
locale ordering and cursor/page cuts; SQL narrows only provable candidates.
Native query intake uses that reference rather than reproducing provider
prefilter or cursor-order mismatches. This reference repair does not adopt a
native database adapter or complete the R1.3/R3 gates.

Native projection query intake retains the serializable AST and complete
filter/order/cursor semantics of that reference. Locale collation and explicit
null placement apply before page cuts. Limited queries retain bounded selected
rows and sort keys; result messages remain below 32 MiB and at most 100,000 rows.
Relationship reads retain target registration, private-reader authority and
freshness, including incoming path-only edges and filtering before limits.

Task facade intake retains the public v4 record, full recurrence/tracking and
structural JSON, effective-occurrence view predicates, legacy path lookup and
resolved task/list descendant traversal. One accepted actor operation completes
all retained commit stages even after its waiter detaches. Accepted generated facades retain database admission through close, including before their task starts. The publisher drains
every committed stage in revision order, including stages committed before a
later projection failure; a rolled-back stage never publishes.

Native memory storage retains source checkpoints, candidates with exact origins,
salted daily recall aggregates and renewable job leases. Claims and updates
check and mutate inside one native transaction; rejected claims do not advance
revisions. Bounded attempts, same-owner renewal, exact expiry boundaries and
terminal completion retain the existing provider behavior. These derived tables
remain separate from R5 scheduling and durable transcript/Markdown authority.

Search storage intake first qualifies prepared document/chunk JSON, body-free
manifests and complete index totals against retained Memory and Turso providers.
LN-DB-057 governs their shared statistics, including absent embedding state and
empty error strings. This reference does not select native storage, inference or
retrieval, or qualify unattended indexing and host adoption.

Native Search storage retains those prepared records, normalized document/chunk
columns, float-vector blobs, manifests and totals through the existing database
actor. Replacement/deletion and their Search revision commit together; failures
roll back the complete publication. Manifest/statistics reads avoid document
bodies. This lower-level publication boundary accepts already prepared records;
native preparation, semantic inference/retrieval and host intake remain required
before the full AppDatabase Search facade is selected.
The pinned Turso engine includes FTS and enables its existing index-method
feature so previously indexed databases retain their lexical index on writes.

Native Search preparation reuses the retained metadata-driven normalization and
scored chunking contract: tag hierarchy, frontmatter text, source sections,
heading association and code-fence suppression. Generated offsets and chunk IDs
remain UTF-16-based, including LN-DB-058's scalar-safe cutoffs. Prepared-record
publication remains distinct from semantic inference and retrieval; no host is
switched until the complete facade is qualified.

The retained Search retrieval reference evaluates every eligible table candidate
before scoring and final limits (LN-DB-059). Provider/path SQL narrowing cannot
truncate the remaining scope. Conformance covers more than 100 records in
Memory, native FTS and degraded Turso before native retrieval intake; it does not
select either host's native database adapter.

Native lexical/structured retrieval intake uses the retained full-result fixture,
including query grammar, scoped/property evaluation, scores, UTF-16 snippets and
source/provider filtering. Native FTS preserves its candidate contract; complete
table evaluation retains LN-DB-059. Query compilation and selected result buffers
remain bounded. This intake does not qualify native semantic inference or select
either host adapter.

R1.3.9 connects the existing hosted login/chooser/workspace through an explicit
`rust-server` profile. That profile requires its admitted HTTP database provider;
it cannot open browser storage or fall back to Node after failure. Node remains
a separately selected serving baseline until cutover. Source transport fixtures
and retained-screen acceptance are recorded separately.

R1.3.10 reuses the native coordinator and scoped host commands under the [backup lifetime contract](rust-backup-lifetime.md).

## LN-CORE-001 — Native application service independence

<a id="ln-core-001"></a>

**Requirement.** Notes-owned native application services MUST be independent of
Tauri, HTTP, renderer frameworks and browser globals. Host adapters MUST own
caller admission and transport. Generic ACP and repository algorithms MUST
remain in their source packages rather than be copied into the application core.

## LN-CORE-002 — Shared native vault file engine

<a id="ln-core-002"></a>

**Requirement.** The shared native vault engine MUST preserve the admitted
physical-root boundary, bounded IO, relative-path checks, conditional byte
comparison, atomic publication and exclusive create/rename semantics. Desktop
MUST consume that engine directly after extraction, retaining host-owned profiles,
resource admission and OS actions without a second file implementation.

## LN-CORE-003 — Service-owned work lifetime

<a id="ln-core-003"></a>

**Requirement.** A selected native vault service MUST own accepted jobs, writers,
indexes and maintenance independently of client subscriptions. Detaching clients
MUST NOT terminate accepted work. Explicit vault close, disable and Quit MUST
fence admission and drain or cancel owned work. Restart MUST preserve interrupted
or uncertain outcomes without automatically replaying prompts or uncertain effects.

## LN-CORE-004 — Coordinated typed transport

<a id="ln-core-004"></a>

**Requirement.** Tauri and hosted adapters MUST expose the same typed service
commands, queries, job state, capabilities and progress. Rust protocol types MUST
generate checked client schemas/types. The coordinated HTTP/SSE replacement MUST
reject stale protocol versions and retain streamed byte routes. Remote callers
MUST NOT select host roots, credentials or executables.

## LN-CORE-005 — Explicit execution placement

<a id="ln-core-005"></a>

**Requirement.** Native first-party background tools and processors MUST execute
without a renderer. Extension capabilities MUST distinguish service-owned from
client-dependent execution. A missing required client MUST report unavailability
or an uncertain in-flight outcome without automatic retry. The initial native
application service MUST NOT require an embedded JavaScript application runtime.

## LN-CORE-006 — One authoritative writer

<a id="ln-core-006"></a>

**Requirement.** A migrated service MUST have one authoritative implementation
per admitted vault. It MUST NOT dual-write or fall back after an uncertain
failure. Editor revisions, dirty-buffer guards, ordinary saves, tools, restore
and undo MUST share the selected writer boundary. Client disconnection MUST NOT
silently authorize overwriting unresolved dirty buffers.

## LN-CORE-007 — Retained presentation and stored formats

<a id="ln-core-007"></a>

**Requirement.** Native service migration MUST preserve existing public production
screens, live-view capture barriers, exact history pins, notes, conversation
formats/hashes, Markdown memory and repository history. Durable job authority
MUST remain separate from disposable indexes. Deno-era imports and the deferred
native conversation-store experiment MUST NOT become migration prerequisites.

## LN-CORE-008 — Standalone browser boundary

<a id="ln-core-008"></a>

**Requirement.** The standalone local/offline browser application MUST retain its
browser-owned implementation and plugins. Desktop and hosted clients using native
services MUST NOT construct duplicate authoritative schedulers. Shared conformance
fixtures MUST verify the retained browser and native contracts independently.

Native semantic inference intake first qualifies the actual ONNX encoder against
the retained model/tokenizer and mean-pooling/normalization contract. Model and
runtime file inputs are native host authority, never deserialized renderer or
HTTP fields. The inference component does not select a database adapter or
qualify model download/configuration, vector/hybrid retrieval or scheduling. Frozen source-reference vectors and tolerances belong to their qualified CPU/runtime context.
The installed ONNX environment is process-owned and shared by independent model
sessions. Reopening a session must retain inference after earlier sessions close;
a different runtime installation cannot silently replace an initialized library.

Native Search provider intake connects this encoder to the database actor.
Native hosts register model/cache files separately from portable configuration;
clients cannot nominate filesystem roots or libraries. Configuration and vector
invalidation commit together before the runtime selection changes. Accepted
indexing owns inference through publication and close drains it. Public status
is an observation of that owner, including errors, without a second scheduler.

Managed native Search assets use a host-admitted, installation-owned cache
outside vault authority. The built-in MiniLM q8 model and CPU ONNX runtime have
pinned byte lengths and SHA-256 digests. Portable configuration selects only
admitted model/revision/dtype identities, never download URLs or cache paths.
The accepted embedding worker verifies cached files and serializes installers. It
creates its persistent lease exclusively and reopens an existing lease without
creation, truncation or symlink following. Competing initial installers share it.
Bounded HTTPS downloads use private staging and verified atomic publication,
syncing a readable parent directory; partial assets remain unloadable.
Offline configuration forbids downloads and retains explicit missing/corrupt
asset errors; verified cache files work after a cold reopen. Download progress
uses the existing observable Search status, and detach/close retain the same
accepted-work/drain boundary. This source gate does not select either host or
qualify another operating system's runtime.

Native Search batch controls retain the direct-Turso no-op begin/end contract
through admitted owner barriers. Rebuild re-prepares stored documents in bounded
100-record pages, uses the selected provider, and atomically commits each
page and its Search revision. The existing actor emits committed page changes
in revision order when the operation returns, including on later-page failure.
Empty rebuild still publishes one change. A
detached waiter does not cancel accepted pages; a later failure retains earlier
commits and rolls back its current page. Close drains the accepted operation.

The semantic retrieval reference fixes the retained Memory and native Turso
result envelopes before Rust intake: configured vector/hybrid/auto modes,
reciprocal-rank fusion, full-scope filters, chunk previews and diagnostics. The
reference uses explicitly selected token-hash data for deterministic ranking; it
does not replace the separate real ONNX model or qualify native semantic queries.

Native semantic retrieval uses the selected admitted encoder, native Turso
float-vector candidates and retained complete evaluation before final ranking.
Vector scores, threshold, preferred chunks and reciprocal-rank fusion retain
the shared reference. Candidate scores and selected records remain bounded;
path-only reads do not retain bodies. Query inference failure retains the
existing lexical degradation without substituting a model. Accepted queries
share the database owner and close/drain boundary; queries do not journal writes.
