# Node Server Host / Integration contracts

The retained Node browser adapter now supplies a private hosted connection to
the same production login/chooser/workspace. Its explicit profile keeps the
existing RPC, cookie, vault-management and plugin-asset behavior. The separately
selected Rust profile never falls back to this implementation after a failure.
Its [managed-vault intake](../architecture/rust-managed-vaults.md) keeps control
metadata and mutation authority in Rust while reusing the current hosted chooser.

The Node integration retains the current shared `.lapis` state directory under
LN-ARCH-140 and LN-PKG-165, including browser and authenticated plugin-asset
lookups. It preserves newer API workspace, conditional-write and owned-lifecycle
behavior when reconciling the previously qualified server workspace. The
[hosted parity plan](../../../AI_HISTORY_PARITY_PLAN.md) is sequenced separately;
this runtime reconciliation does not enable AI or repository-history services.

Hosted browser acceptance uses the Web package's declared, pinned Playwright
SDK CLI. Host-mode acceptance remains separate from Linux container qualification;
the shared Rust plan retains the final server replacement gate.

Portable paths, native database-worker dispatch and Markdown operations are
owned by `@lapis-notes/host-services`. Existing Deno host-service subpaths
forward those same implementations while the Node migration is qualified.

The Design Core dependency refresh consumes released `0.6.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

The served Web client interprets `plugins` App URLs through its owning application
profile ([LN-PLUG-106](../plugin-model/app-ownership.md#ln-plug-106)). Selected
release coordinates enter the verified Plugins browser; the URL does not grant
server access or supply an outbound archive source. Hosted installation continues
through the authenticated artifact route under LN-SRV-017.

LN-ARCH-114 through LN-ARCH-116 define dedicated security persistence and its
headless metadata contract. Server integration must keep wrapped keys outside
disposable indexes and supply independently protected wrapping material.

The shared native sync repository follows [LN-ARCH-105](../architecture/host-boundaries.md#ln-arch-105).
It stores opaque ciphertext independently of server indexes. Authenticated sync
routes and the enrolled server participant remain pending integration.
The portable kernel acceptance uses actual host membership and identity
rotation; it does not exercise server authentication, subscriptions or enrollment.
The shared guarded native vault adds encrypted mutation journaling and retained
preimages. Its paired-device engine acceptance runs without a network service;
it does not establish the Deno destination or server participant lifecycle.
LN-ARCH-109 bounds completed native journal work through independently encrypted
receipt records; it does not supply the server's signed-event history store.
LN-ARCH-110 guards native journal upgrades independently of server event formats
and prevents earlier non-indexed kernels from reopening compacted state.
LN-ARCH-111 allows caller-delivered pairing without relay addresses, and
LN-ARCH-112 supplies actual installed key epochs. Server rendezvous, enrollment
routes and persistent protected server keys remain separate integration work.
LN-ARCH-119 through LN-ARCH-122 supply scoped local capabilities and the shared
native file/storage adapter. A server participant can use this adapter with its
own admitted vault, inclusion policy, crypto and lifecycle; the adapter does not
supply server authentication, endpoint key provisioning or event/object routes.
The same physical-root and read-descriptor ports under LN-ARCH-123 can bind a
future participant to its managed directory. LN-ARCH-124 preserves expected
authority outside encrypted protocol objects; server admission/serialization
must enforce it when the participant is integrated.

## LN-SRV-001 — Private @lapis-notes/server-node: run on Node 24 LTS, serve the dedicated static

<a id="ln-srv-001"></a>

**Requirement.** Private `@lapis-notes/server-node` MUST run on Node 24 LTS, serve the dedicated static Web build and mount tRPC through the Fetch adapter. A Node HTTP adapter MUST preserve streaming and cancellation. It MUST NOT require SvelteKit, SSR or another application routing framework.

## LN-SRV-002 — Server: keep Markdown files authoritative under managed vaults/&lt;id&gt;/content

<a id="ln-srv-002"></a>

**Requirement.** The server MUST keep Markdown files authoritative under managed `vaults/<id>/content` directories. Per-vault Turso files under `vaults/<id>/state` MUST remain disposable generated state.

## LN-SRV-003 — Control Turso database: own users, credentials, sessions, vault identities, archive

<a id="ln-srv-003"></a>

**Requirement.** A control Turso database MUST own users, credentials, sessions, vault identities, archive state, and owner, editor, or viewer memberships. Every vault operation MUST resolve the authenticated membership.

## LN-SRV-004 — First user: bootstrapped only when no user exists, using

<a id="ln-srv-004"></a>

**Requirement.** The first user MUST be bootstrapped only when no user exists, using a username and password-file environment variable. Bootstrap MUST be idempotent and MUST NOT log or persist the plaintext password.

Browser acceptance supplies this input through stdin to a private Docker volume.
The fixture file stays mode 0600, belongs to the image's service user and is
mounted read-only, avoiding a dependency on the host runner's UID.

## LN-SRV-005 — Passwords: use bounded scrypt parameters and random salts

<a id="ln-srv-005"></a>

**Requirement.** Passwords MUST use bounded scrypt parameters and random salts. Sessions MUST use hashed opaque tokens, secure same-site HTTP-only cookies, idle and absolute expiry, strict configured-Origin checks, mutation CSRF validation, throttled login, and revocable subscriptions.

## LN-SRV-006 — TRPC: own the typed JSON control plane

<a id="ln-srv-006"></a>

**Requirement.** tRPC MUST own the typed JSON control plane for system, authentication, vault, filesystem metadata, AppDatabase, language-service, and event operations. The browser bundle MUST import only protocol types and the client factory.

## LN-SRV-007 — Protocol: expose a stable integer major, build id

<a id="ln-srv-007"></a>

**Requirement.** The protocol MUST expose a stable integer major, build id, JSON-compatible schemas, bounded inputs and outputs, and stable application error codes. A stale client MUST receive an explicit protocol mismatch instead of undefined behavior.

## LN-SRV-008 — Direct Fetch routes for file streams

<a id="ln-srv-008"></a>

**Requirement.** Streamed file bodies, append, import, export, resources, plugin assets, health, readiness, and static files MUST use direct Fetch routes. tRPC MUST NOT wrap those byte streams.

## LN-SRV-009 — Normalized relative vault paths

<a id="ln-srv-009"></a>

**Requirement.** Vault paths MUST be normalized relative paths and MUST reject absolute paths, traversal, NULs, and symlink escapes. Replacement writes MUST be atomic; conditional writes MUST enforce strong ETags.

## LN-SRV-010 — Remote DataAdapter.process(): transform one fetched text snapshot and commit

<a id="ln-srv-010"></a>

**Requirement.** Remote `DataAdapter.process()` MUST transform one fetched text snapshot and commit it with the matching ETag. A conflict MUST throw a typed error and MUST NOT rerun the caller callback automatically.

## LN-SRV-011 — Vault events: use one authenticated tracked subscription with {epoch}:{sequence}

<a id="ln-srv-011"></a>

**Requirement.** Vault events MUST use one authenticated tracked subscription with `{epoch}:{sequence}` ids and bounded replay. An old or unavailable cursor MUST emit `resync-required`, close, and require a full vault and database-revision refresh.

## LN-SRV-012 — AppDatabase access: use the shared remote method contract

<a id="ln-srv-012"></a>

**Requirement.** AppDatabase access MUST use the shared remote method contract and a host-owned native Turso worker. Renderers MUST NOT receive raw SQL, database paths, or methods outside that contract.

## LN-SRV-013 — Server: open vault runtimes lazily, serialize mutations per

<a id="ln-srv-013"></a>

**Requirement.** The server MUST open vault runtimes lazily, serialize mutations per vault, close idle runtimes, and close databases, watches, subscriptions, and imports during ordered shutdown. Initial operation is one Node process.

Browser acceptance stops and recreates the serving container against its
retained data volumes and requires clean shutdown. A separate test-owned
container retains the loopback-published network namespace across recreation,
so server recreation does not replace the network used by the browser's startup
module graph. Both containers are removed during test teardown.
The case owns a dedicated browser worker launched after network preparation;
initial navigation and server recreation retain the same startup assertions.
An explicit host acceptance profile runs this same browser flow against the
built Node 24 executable with private temporary storage and password file. It
supervises process shutdown and restart while retaining vault data. It requires
no Docker daemon and does not qualify Linux container identity or packaging;
the existing container profile retains those independent checks.
The bootstrap secret-file container has no network. Initial navigation retries
once only after an observed Chromium `ERR_NETWORK_CHANGED` abort of a same-origin
document or script. The retry writes JSON into the test output directory and
attaches that file; output remains available after successful recovery. A second failure,
other network errors and application readiness failures still fail acceptance.

## LN-SRV-014 — Health: report process liveness without authentication or secrets

<a id="ln-srv-014"></a>

**Requirement.** Health MUST report process liveness without authentication or secrets. Readiness MUST remain false until control migrations complete, the managed data root is writable, and the static client is available.

## LN-SRV-015 — Initial server-host scope

<a id="ln-srv-015"></a>

**Requirement.** The first server slice MUST NOT host AI, terminals, collaborative editing, arbitrary filesystem roots, invitations, public registration, or multi-instance coordination. Missing capabilities MUST be reported explicitly.

## LN-SRV-016 — Browser vault adapter: translate Lapis virtual-root paths such as /.lapis/plugins

<a id="ln-srv-016"></a>

**Requirement.** The browser vault adapter MUST translate Lapis virtual-root paths such as `/.lapis/plugins` to managed relative paths before tRPC requests. Direct server routes MUST continue to reject absolute paths, traversal, and host filesystem access.

## LN-SRV-017 — Hosted plugin installs: download signed first-party release bundles

<a id="ln-srv-017"></a>

**Requirement.** Hosted plugin installs MUST download signed first-party release bundles through an authenticated, editor-authorized same-origin Fetch route. The server MUST restrict outbound sources, bound response bytes, forward no session credentials upstream, and retain client-side signature and digest verification.

## LN-SRV-018 — Server static profile: serve the fixed Web plugin-host entries referenced

<a id="ln-srv-018"></a>

**Requirement.** The server static profile MUST serve the fixed Web plugin-host entries referenced by its initial import map, including `@lapis-notes/api/workspace-host`. Installed History runtime modules MUST resolve those entries through the same host module graph before activation.

## LN-SRV-019 — Server-mode Web client: use the public build-configured Nostr plugin source

<a id="ln-srv-019"></a>

**Requirement.** A server-mode Web client MAY use the public build-configured Nostr plugin source directly. The Node server MUST NOT become a registry database, relay trust root, curator, or proxy for the signed release evidence.

## LN-SRV-020 — Server delivery without Deno

<a id="ln-srv-020"></a>

**Requirement.** Server builds, tests, executable output and production containers MUST run without Deno. The server MUST consume portable host-service kernels and retain compatible HTTP, authentication and data contracts. Runtime containers MUST use a non-root user, read-only application files, explicit writable storage and mounted bootstrap secrets.

The image builds with Node 24.15.0 and runs portable/server tests plus the native
worker smoke before packaging. The runtime keeps UID/GID 1993 for existing data,
read-only application files, writable `/data`, temporary `/tmp` and a mounted
bootstrap secret. Compose grants twenty seconds for shutdown and retains prior
volume identity when operators supply their existing project name.

Standalone runtime packaging takes the external dependency list from the same
module as esbuild, retains the repository's frozen registry resolutions and
rejects missing or workspace resolutions. Bundled workspace code requires no
intermediate npm publication. Runtime staging also retains the root
package-manager pin. Only compiled output and its external dependency
graph enter the runtime image.

## LN-SRV-021 — Private native companion

<a id="ln-srv-021"></a>

**Requirement.** The Node host MUST supervise its native companion over a versioned, bounded Unix socket in a private directory. Companion exit or an uncertain response MUST reject pending work without automatic replay. Shutdown MUST drain native history workers before confirming success; forced termination MUST remain distinguishable from graceful completion.

## LN-SRV-022 — Hosted history admission

<a id="ln-srv-022"></a>

**Requirement.** Native history MUST resolve opaque managed-vault identities from the configured data root. Handles MUST bind the authenticated caller scope, vault, physical source and admission generation. Revocation MUST drain those scopes. Native request frames MUST NOT accept browser-supplied filesystem paths or caller authority.

## LN-SRV-023 — Preserved history transport

<a id="ln-srv-023"></a>

**Requirement.** The hosted companion MUST reuse the transport-independent `jj-history-service` for operation-pinned reads. It MUST retain version-one inner frames as exact text through JavaScript, enforce request and response limits, and reject unknown methods and protocol versions. Reading history MUST NOT initialize or reconcile repository state.

The first private bridge is not an HTTP feature. Authenticated browser routing,
automatic backup, restore and shared UI integration are H03 acceptance gates.
External history lives under the managed vault's persistent `history` directory,
separate from disposable `state/app.turso`. Original colocated repositories are
explicit read sources; absence never creates a repository.
