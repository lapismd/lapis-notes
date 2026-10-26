# Architecture / Native History indexing lifetime

R3.2.3 applies LN-CORE-003/005/006/007/008 to the retained historical Search
engine. `jj-store` owns checkpoint traversal, exact immutable identities,
Tantivy formats, bounded batches, query semantics and cache recovery. Notes
owns selection and scheduler lifetime; it MUST consume `jj-vault` directly,
without copying the engine or moving application policy upstream.

## Selected owner

History indexing is explicitly selected and off by default during staging.
The approved Rust-only selection is `BackupStorage::with_history_indexing(bool)`.
`VaultService::start_history_indexing()` admits only derived work over existing
history; `stop_history_indexing()` drains that work explicitly.
`VaultService::history_indexing_status()` returns cached progress or the actual
unavailable/closed state without starting work. The staged shared contract below
extends this source boundary; full host adoption remains separate and MUST remove the
corresponding renderer scheduler when selected.

One selected vault service MUST retain one History-index worker per admitted
vault. It performs the existing bounded `index_step`, drains pending pages with
brief yields, wakes after checkpoint publication and periodically reconciles.
The worker MUST continue with zero attached clients and no status receiver.
It MUST NOT capture files, transfer Git state, publish repository history or
take the backup command/writer lease. Queries remain immutable and preserve
exact revision/path identities and the existing exclusion namespace.

## Failure and close

Every batch MUST revalidate the admitted physical vault and installation-owned
history storage, resolving its current installed layout without recovery or
initialization. A pending storage transition MUST suspend derived publication. A replaced root MUST fail closed with observable owner error;
derived failure MUST NOT disable capture or invoke a renderer fallback. Retrying
derived work is allowed because it cannot replay authoritative effects.

Pausing backup capture MUST retain the index owner and immutable Search access.
Closing the backup-status sender MUST trigger one final derived reconciliation,
including when its last publication was not yet observed. The worker MUST retire
that closed receiver after the notification; closure MUST NOT create a busy loop
or wait for periodic repair. This MUST NOT capture files or step from a query.
Cold read admission and cache repair MUST NOT start capture, initialize a
repository, run storage recovery or include unsnapshotted disk bytes. Explicit
History-index disable and vault close MUST retire and join the index worker.
Already accepted batches participate in the vault drain. A failed final backup
capture MUST retain the original owners for repaired close; a successful close
MUST leave no index writer or background thread. Startup resumes the retained
frontier; deleting disposable index bytes MUST rebuild from immutable history
without modifying saved files or checkpoint identities.

## Qualification

The source gate uses real native backup checkpoints and the existing engine.
It proves initial publication, external edits after client detach, cold reopen,
cache loss/rebuild, unchanged default selection, paused/cold read-only rebuild and explicit close/disable.
Failure/recovery and multiple-vault cases retain separate observations. Source
qualification alone does not qualify Tauri/HTTP selection, presentation,
renderer-scheduler removal, all historical filters or final R3 completion.

## LN-CORE-011 — Admitted indexed History service

<a id="ln-core-011"></a>

**Requirement.** Selected indexed History controls and reads MUST use the same admitted vault and installation-owned backup source. Start MUST retain the existing native index owner; status, query and context MUST NOT schedule indexing or capture. Client detach MUST stop observation without stopping native work. Missing saved history MUST remain empty without repository initialization; unavailable or replaced sources MUST fail without renderer fallback.

## LN-CORE-012 — Bounded immutable History requests

<a id="ln-core-012"></a>

**Requirement.** The shared History protocol MUST bound expression depth, terms, cursors, result pages and saved-text context. Requests MUST NOT select physical paths, storage, exclusions, caller authority or a renderer `step` scheduler. Query results MUST retain exact saved revision identities and coverage; context MUST read that immutable saved content with explicit line bounds.

The staged Rust host selects indexed History only with installation-owned
`LAPIS_SERVER_NATIVE_HISTORY=1` and its existing data profile. This is separate
from hosted default cutover. Missing selection reports `UNSUPPORTED`; retired
or foreign attachments use the existing `PERMISSION_DENIED` policy. Generated
DTOs and the public API `native-history-index` type boundary retain Desktop's
query/page/context shape. Complete retained-screen and Desktop extraction gates
remain separate from source and HTTP qualification.
