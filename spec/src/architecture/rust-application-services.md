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
