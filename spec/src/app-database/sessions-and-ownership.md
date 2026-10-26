# App Database / Sessions and ownership

An explicit `rust-server` session uses its admitted HTTP AppDatabaseProvider in
the direct role. It requires that provider and never opens browser storage;
session teardown closes the database view before its hosted attachment.

LN-DB-001's public remote catalogue supports both literal methods and a runtime
method union. Argument inference distributes over the catalogue instead of
intersecting incompatible tuples into `never`. Packed positive/negative fixtures
retain required literal arguments and reject unknown methods; runtime parsing,
allowlists, DTOs and native authority remain unchanged.

LN-PKG-180 and LN-PKG-181 project complete disk snapshots through existing
Vault events, including folder descendants needed by metadata ownership.
Retired generations cannot publish a snapshot into the next session.

Conditional hosts retain database/session ownership until admitted file creation
and plugin-data operations have drained through their App. File-tree projection
and the owning UI continuation finish before destructive host teardown. This
does not change provider selection, database paths or SQL authority.

LN-PKG-176 keeps native watcher cleanup awaitable for session owners. Retired
subscriptions ignore queued callbacks and incomplete polling retains its last
complete snapshot; no database provider or authority is introduced.

## LN-DB-001 — Existing AppDatabase operations: remain available while session creation accepts

<a id="ln-db-001"></a>

**Requirement.** Existing `AppDatabase` operations MUST remain available while session creation accepts an optional `AppDatabaseProvider`. Explicit database injection MUST remain supported.

## LN-DB-003 — Production local provider: use pinned Turso native storage where supported

<a id="ln-db-003"></a>

**Requirement.** The production local provider MUST use pinned Turso native storage where supported and Turso WASM with OPFS in browser-compatible runtimes. The WASM path MUST use a host-compatible driver entrypoint instead of a prebuilt worker-inline bundle. Memory MUST remain explicit test-only injection.

## LN-DB-011 — Browser coordination: use Web Locks for ownership and BroadcastChannel

<a id="ln-db-011"></a>

**Requirement.** Browser coordination MUST use Web Locks for ownership and BroadcastChannel for heartbeats and typed RPC. A surviving proxy MUST promote after the owner closes or becomes stale.

## LN-DB-012 — Missing OPFS, isolation, locks, or channels: produce an explicit blocked state with accurate

<a id="ln-db-012"></a>

**Requirement.** Missing OPFS, isolation, locks, or channels MUST produce an explicit blocked state with accurate capabilities rather than opening a non-Turso app-database fallback.

## LN-DB-013 — Authoritative local storage

<a id="ln-db-013"></a>

**Requirement.** Local storage MUST remain authoritative. A future synced provider MAY be injected, but this intake MUST NOT configure credentials, remote databases, or note upload.

## LN-DB-026 — Production Turso providers: execute reads and row-scoped writes directly against

<a id="ln-db-026"></a>

**Requirement.** Production Turso providers MUST execute reads and row-scoped writes directly against Turso. They MUST NOT inherit the memory provider, hydrate `app_state`, or rewrite unaffected tables after one mutation.

## LN-DB-029 — Browser owner/proxy transports: relay database change sets without exposing raw

<a id="ln-db-029"></a>

**Requirement.** Browser owner/proxy transports MUST relay database change sets without exposing raw SQL. Browser promotion and renderer reconnection MUST compare durable revisions before resuming incremental invalidation.

## LN-DB-034 — Deno-desktop vault session: open a host-owned native Turso provider

<a id="ln-db-034"></a>

**Requirement.** A `deno-desktop` vault session MUST open a host-owned native Turso provider through an allowlisted bridge. The renderer MUST NOT receive raw SQL, database paths, or non-AppDatabase operations.

## LN-DB-040 — AppDatabase: expose typed memory source, candidate, origin, recall-signal

<a id="ln-db-040"></a>

**Requirement.** AppDatabase MUST expose typed memory source, candidate, origin, recall-signal, and job records through Memory and Turso providers plus browser and native allowlisted bridges. These records MUST remain derived state and MUST NOT become transcript or curated-memory authority.

## LN-DB-045 — Node-server vault session: use a server-owned native Turso provider over

<a id="ln-db-045"></a>

**Requirement.** A `node-server` vault session, including the deprecated `deno-server` compatibility value, MUST use a server-owned native Turso provider over `http-rpc`. Remote access MUST use one shared typed method contract, preserve committed change revisions, reset consumers after an unavailable tracked cursor, and reconnect without the rejected cursor. It MUST expose neither raw SQL nor database paths.

The Node container retains the prior service UID/GID 1993 and managed database
locations. Replacing the process does not introduce a schema conversion or
change the typed remote method contract. Native worker smoke remains part of
the Deno-free container build and CI acceptance.

## LN-DB-053 — Identity and change contracts across providers

<a id="ln-db-053"></a>

**Requirement.** Stable identity, change cursor, external binding, and generated-state operations MUST cross memory, direct Turso, browser-proxy, and desktop-native providers through typed allowlists without raw SQL or whole-database snapshots.

## LN-DB-054 — Startup file identity reconciliation: treat a missing path during fingerprint opening

<a id="ln-db-054"></a>

**Requirement.** Startup file identity reconciliation MUST treat a missing path during fingerprint opening or streaming as a deletion and continue reconciling remaining files. It MUST NOT publish a present identity from a failed fingerprint or suppress unrelated read failures.

## LN-DB-055 — Tauri database provider admission

<a id="ln-db-055"></a>

**Requirement.** A `tauri-desktop` session MUST require an explicitly injected AppDatabase provider and open it with the direct role. Missing providers MUST fail before opening browser or memory storage. Explicit test database injection MAY remain supported.

## LN-DB-056 — Direct Turso close ownership

<a id="ln-db-056"></a>

**Requirement.** Direct Turso close MUST drain accepted mutations and retain its connection until the driver closes successfully. Concurrent close calls MUST share completion. A failed close MUST remain observable and permit retry against the same owned driver without reopening it.

LN-PKG-177 exposes optional watch registration readiness before initial
reconciliation. Array adapters preserve it; the frozen Deno host is unchanged.

LN-PKG-178 and LN-PKG-179 add opt-in exclusive creation and source-owned new-file
intent. Existing low-level overwrite behavior and unsupported legacy hosts stay
explicit; Deno host source remains frozen. Admission spans creation projection.

## Native Task service observation

The optional `VaultSession.nativeTasks` port uses the same admitted native owner as its database and vault. A session-supplied port wins over an explicit App option. [CORE013–015](../architecture/rust-task-host-port.md#ln-core-013) governs source-derived actions, startup reconciliation and detached observation; neither metadata-cache disposal nor window closure disables accepted native work.
