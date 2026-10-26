# Node Server Host / Integration contracts

Managed editor recovery uses the existing admitted Rust client command route.
Captured generation/revision checks follow LN-CORE-025; legacy ID-only commands
cannot recover or discard managed intents. Origin, client/vault admission and
physical-root checks remain unchanged, and recovery never writes file content.

The staged Rust chat retains History in its workspace sidebar and reopens exact
scope/conversation pairs through the shared App-owned navigator. Cold hosted
acceptance reopens the managed vault through the existing chooser and verifies
that restarting the Rust service does not replay the accepted prompt. This
continues the [native turn gate](../architecture/rust-turn-admission.md); Node
remains the serving baseline.

Staged Rust targets declare the trusted operator's bounded `default_mode` under
[LN-CORE-009/010](../architecture/rust-turn-admission.md#ln-core-009). The retained
native observer refreshes that exact target's metadata before submission and
refuses unavailable modes before writing. Node's existing AI restriction and
serving default remain unchanged.

The opt-in Rust-hosted provider-screen gate uses the existing composer and
History, observes explicit client release during Sign out, then verifies native
completion without a browser and exact recovery after a cold service restart.
Its native-only credentials and isolated profile never enter portable snapshots.
This qualifies conversation recovery separately from R7 server delivery.

The staged Rust renderer may inject the private native-chat observer into the
retained workspace. The Node serving baseline keeps its AI restriction and
existing profile; it neither registers the native observer nor selects a second
writer. The standalone browser and frozen Deno paths retain their own contracts.

The staged Rust service exposes native turn commands under its admitted client
route. Operator configuration selects native helpers; authenticated clients use
opaque targets and generated portable DTOs. The existing Node serving baseline
retains its current behavior while R2 host/chat adoption and R7 cutover continue.

The retained Node browser adapter now supplies a private hosted connection to
the same production login/chooser/workspace. Its explicit profile keeps the
existing RPC, cookie, vault-management and plugin-asset behavior. The separately
selected Rust profile never falls back to this implementation after a failure.
Its [managed-vault intake](../architecture/rust-managed-vaults.md) keeps control
metadata and mutation authority in Rust while reusing the current hosted chooser.
The same intake retains folder/ZIP import and export with bounded native
streaming. Node transfer behavior remains the baseline until Rust cutover. Installed asset
delivery follows the extracted native verifier and authenticated Rust adapters;
R6 retains native installation transaction/recovery.

R1.3.11 starts/drains the shared Web vault-change lifecycle in Node and Rust
profiles. Internal file-view projection reuses the existing App service; the
Node RPC, watcher transport and source engines remain unchanged.

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

The staged Rust HTTP host exposes admitted, generated background-indexing
controls under LN-CORE-004. Authentication, protocol/origin admission and vault
isolation apply equally to selection, progress and refresh. This source endpoint
does not select hosted startup or the default backend.

The explicit hosted native-metadata profile under
[LN-WEB-066](../web-host/startup-and-plugins.md#ln-web-066) observes those controls
through the existing client admission. Node remains the serving baseline;
metadata staging does not switch final hosted or Search defaults.

Selected hosted Search reuses the native metadata/indexing port and qualified
plugin adapter. Its existing refresh and semantic-rebuild controls use native
work; App replacement reconciles persisted disable through the shared observer.
The ordinary hosted build keeps renderer ownership until explicit cutover.

## LN-SRV-024 — Same-client indexed History transport

<a id="ln-srv-024"></a>

**Requirement.** Rust hosted indexed History MUST use the existing authenticated vault client and its physical source/generation checks. Typed start, status, query and context calls MUST retain the native selection and failure semantics. Revoked, foreign or detached clients MUST lose access; no browser request may supply a filesystem root, profile, exclusion policy or caller scope.

The Rust hosted optional History renderer port reuses its existing admitted
client and the generated History-index route. App construction does not select
native work, create another attachment or fall back after failure. This changes
neither Node serving nor ordinary Rust defaults; complete Repository reader and
screen adoption remain a separate R3 gate.

## LN-SRV-025 — Same-client native Tasks transport

<a id="ln-srv-025"></a>

**Requirement.** Rust hosted Tasks MUST use the existing authenticated vault attachment, physical-root and generation admission. Typed commands MUST retain shared native selection, writer, journal and explicit-retry semantics. Revoked, expired or foreign clients MUST lose access. No request may supply a physical root, profile, caller scope or renderer callback.

The native Task route also exercises the source-qualified English default daily contexts (en-GB 1/4 and en-US 7/4 or 7/1) through the existing journal and writer. Locale support follows the [retained daily source gate](../../records/2026-10-26-native-daily-locale-parity.md); host defaults and signed-plugin adoption remain separate.

## LN-SRV-026 — Admitted Rust Repository transport

<a id="ln-srv-026"></a>

**Requirement.** Rust hosted Repository methods MUST reuse the authenticated
vault attachment, protocol, Origin and CSRF policy. Raw text frames MUST obey
native byte limits and method allowlisting. Lease retirement during an await
MUST prevent data delivery. Unknown methods, malformed frames and foreign vaults
MUST fail without fallback to the Node companion or browser-supplied authority.

## LN-SRV-027 — Same-client guarded Repository restore

<a id="ln-srv-027"></a>

**Requirement.** Rust hosted restore MUST use bounded typed actions on the existing authenticated vault attachment, protocol, Origin and CSRF policy. Admission and post-await delivery MUST reject retired or foreign clients. Requests MUST NOT supply roots, storage, generations or caller scopes. A lost acknowledgement MUST retain the native stable request and require explicit recovery rather than transport replay.

## LN-SRV-028 — Admitted native backup controls

<a id="ln-srv-028"></a>

**Requirement.** Hosted backup status, manual capture and explicit selection MUST use the existing authenticated client, protocol, Origin and CSRF admission. Setting writes MUST carry only a Boolean and an opaque expected configuration version. Post-await delivery MUST reject revoked leases while accepted native work completes. Status MUST remain passive and MUST NOT accept filesystem or configuration authority.

## LN-SRV-029 — Admitted original repository scopes

<a id="ln-srv-029"></a>

**Requirement.** Hosted original-source commands MUST require bounded authenticated, same-origin, live-client admission. Opening a source MUST NOT accept caller paths, witnesses or replacement scope tokens. Reply delivery MUST recheck client retirement, and returned tokens MUST grant only that client's immutable reads. Optional managed-backup startup failure MUST NOT prevent admitted original-source access.
