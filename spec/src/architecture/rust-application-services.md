# Architecture / Rust application services

The [shared Rust plan](../../../RUST_CORE_MIGRATION_PLAN.md) supersedes future
Node-specific hosted parity implementation. Existing hosts remain supported
until their replacement gates pass. Current migration status is in
[MIGRATION.md](../../../MIGRATION.md).

R1.1 extracts Desktop's existing vault file engine into `lapis-app-core` and
updates native callers directly. The low-level engine retains the caller-owned
IO gate; extracting it does not claim cross-client serialization or new job
lifetime. R1.2/R1.3 retain those gates. Native directory witnesses are explicit
capability handles, never renderer or HTTP values. Watch/resource/profile policy
remains in Desktop while the common engine owns checked IO and publication.

The core boundary audit runs in normal checks and canonical specification checks.
It rejects transport dependencies/source references, host source routing and new
oversized source/test files. Native builds retain checkout-owned output and the
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
durable ACP recovery, an HTTP endpoint or the final hosted cutover.

R1.3 stages the existing portable shell file actions through that same owner.
Reads retain their bounded text/binary/range contracts; mutations retain mtime,
exclusive destinations and byte-conditional publication. Rename/removal fence dirty
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
Client attachments survive separate requests, and explicit detach retains dirty
claims and accepted work. Core errors remain typed and omit native paths.
Blocking file operations run outside the async executor. Bounded JSON commands
qualify the initial adapter only; streamed bodies/resources, existing browser
login/shell intake, SSE and native backup lifetime remain later R1.3/R7 gates.

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
