# App Database / Sessions and ownership

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

## LN-DB-045 — Deno-server vault session: use a server-owned native Turso provider over

<a id="ln-db-045"></a>

**Requirement.** A `deno-server` vault session MUST use a server-owned native Turso provider over `http-rpc`. Remote access MUST use one shared typed method contract, preserve committed change revisions, reset consumers after an unavailable tracked cursor, and reconnect without the rejected cursor. It MUST expose neither raw SQL nor database paths.

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
