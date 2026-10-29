# Hosted Server / Integration contracts

The ordinary hosted application now selects the Rust executable and existing
Web UI under [native delivery](../architecture/rust-hosted-delivery.md).
The public Notes web build and typecheck do not compile the hosted Rust client
([LN-CORE-070](../architecture/rust-hosted-delivery.md#ln-core-070)).
The historical `server-node-host` chapter path and LN-SRV IDs remain stable for
links and evidence. The Node application package and its private Unix companion
are retired; Node/pnpm remain build tooling only. Publication and deployment keep
separate gates from this runtime cutover.

The initial operator profile is single-user with multiple managed vaults. Native
metadata, History and Tasks are selected together. AI reuses native target modes,
participants and queue admission; original source/provider qualifications remain
separate from final coherent host acceptance. The standalone local/offline Web
and frozen Deno profiles retain their own contracts.

Authentication, protocol/Origin admission, physical roots, conditional writes,
interactive editor claims and uncertain-effect recovery remain fail-closed.
Streamed database observation follows LN-CORE-066–068. Browser acceptance must
leave clean editing sessions through the guarded UI before an ordinary restart;
lost-client recovery journeys retain their explicit claim recovery.

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

## LN-SRV-001 — Native hosted application

<a id="ln-srv-001"></a>

**Requirement.** The hosted application MUST run as the compiled Rust executable, serve the dedicated static Web build and mount admitted native HTTP routes. It MUST preserve streaming and cancellation without a Node or Deno application runtime, SvelteKit or SSR.

## LN-SRV-002 — Server: keep Markdown files authoritative under managed vaults/&lt;id&gt;/content

<a id="ln-srv-002"></a>

**Requirement.** The server MUST keep Markdown files authoritative under managed `vaults/<id>/content` directories. Per-vault Turso files under `vaults/<id>/state` MUST remain disposable generated state.

## LN-SRV-003 — Single-owner managed control state

<a id="ln-srv-003"></a>

**Requirement.** The native control store MUST own initial owner credentials, sessions, managed vault identities and archive state. Every vault operation MUST resolve the authenticated owner and admitted vault. Initial operation MUST remain single-user with multiple vaults.

## LN-SRV-004 — First user: bootstrapped only when no user exists, using

<a id="ln-srv-004"></a>

**Requirement.** The first user MUST be bootstrapped only when no user exists, using a username and password-file environment variable. Bootstrap MUST be idempotent and MUST NOT log or persist the plaintext password.

Browser acceptance supplies this input through stdin to a private Docker volume.
The fixture file stays mode 0600, belongs to the image's service user and is
mounted read-only, avoiding a dependency on the host runner's UID.

## LN-SRV-005 — Passwords: use bounded scrypt parameters and random salts

<a id="ln-srv-005"></a>

**Requirement.** Passwords MUST use bounded scrypt parameters and random salts. Sessions MUST use hashed opaque tokens, secure same-site HTTP-only cookies, idle and absolute expiry, strict configured-Origin checks, mutation CSRF validation, throttled login, and revocable subscriptions.

## LN-SRV-006 — Native typed JSON control plane

<a id="ln-srv-006"></a>

**Requirement.** Native HTTP routes MUST own the typed JSON control plane for system, authentication, vault, filesystem metadata, AppDatabase and service commands. Browser clients MUST use generated portable contracts and MUST NOT import native server implementation or obtain SQL/native paths.

## LN-SRV-007 — Protocol: expose a stable integer major, build id

<a id="ln-srv-007"></a>

**Requirement.** The protocol MUST expose a stable integer major, build id, JSON-compatible schemas, bounded inputs and outputs, and stable application error codes. A stale client MUST receive an explicit protocol mismatch instead of undefined behavior.

## LN-SRV-008 — Direct Fetch routes for file streams

<a id="ln-srv-008"></a>

**Requirement.** Streamed file bodies, append, import, export, resources, plugin assets, health, readiness, and static files MUST use direct HTTP routes. A JSON command envelope MUST NOT wrap those byte streams.

## LN-SRV-009 — Normalized relative vault paths

<a id="ln-srv-009"></a>

**Requirement.** Vault paths MUST be normalized relative paths and MUST reject absolute paths, traversal, NULs, and symlink escapes. Replacement writes MUST be atomic; conditional writes MUST enforce strong ETags.

## LN-SRV-010 — Remote DataAdapter.process(): transform one fetched text snapshot and commit

<a id="ln-srv-010"></a>

**Requirement.** Remote `DataAdapter.process()` MUST transform one fetched text snapshot and commit it with the matching ETag. A conflict MUST throw a typed error and MUST NOT rerun the caller callback automatically.

## LN-SRV-011 — Hosted change observation

<a id="ln-srv-011"></a>

**Requirement.** Hosted vault changes MUST remain observable to admitted sessions while native services retain sole write authority. Lost observation MUST reconcile current state without replaying mutations. Closing or revoking a session MUST retire its observers.

Native database streams use the admitted revision/reset protocol in
LN-CORE-066–068. The existing App-owned DirectoryWatcher retains scoped file
polling when a host has no native watch adapter. The retired Node epoch/sequence
wire is not a second compatibility transport in the new protocol-major3 host.

## LN-SRV-012 — AppDatabase access: use the shared remote method contract

<a id="ln-srv-012"></a>

**Requirement.** AppDatabase access MUST use the shared remote method contract and a host-owned native Turso worker. Renderers MUST NOT receive raw SQL, database paths, or methods outside that contract.

## LN-SRV-013 — Server: open vault runtimes lazily, serialize mutations per

<a id="ln-srv-013"></a>

**Requirement.** The server MUST open vault runtimes lazily, serialize mutations per vault, close idle runtimes, and close databases, watches, subscriptions, and imports during ordered shutdown. Initial operation is one native server process.

Acceptance stops and recreates the Rust runtime against its retained data and
requires clean shutdown. The compiled host profile and actual Linux image have
separate receipts; a host-mode pass cannot qualify container identity or runtime
packaging. Browser fixtures use disposable secrets and test-owned data. Native
shutdown guards remain production authority rather than test-specific behavior.

## LN-SRV-014 — Health: report process liveness without authentication or secrets

<a id="ln-srv-014"></a>

**Requirement.** Health MUST report process liveness without authentication or secrets. Readiness MUST remain false until control migrations complete, the managed data root is writable, and the static client is available.

## LN-SRV-015 — Initial server-host scope

<a id="ln-srv-015"></a>

**Requirement.** The hosted server MUST admit AI only through trusted operator-declared native targets and existing turn/participant/queue authorities. Initial operation MUST NOT offer terminals, collaborative editing, arbitrary filesystem roots, invitations, public registration or multi-instance coordination. Missing capabilities MUST be reported explicitly.

## LN-SRV-016 — Browser vault adapter: translate Lapis virtual-root paths such as /.lapis/plugins

<a id="ln-srv-016"></a>

**Requirement.** The browser vault adapter MUST translate Lapis virtual-root paths such as `/.lapis/plugins` to managed relative paths before native HTTP requests. Direct server routes MUST continue to reject absolute paths, traversal, and host filesystem access.

## LN-SRV-017 — Hosted plugin installs: download signed first-party release bundles

<a id="ln-srv-017"></a>

**Requirement.** Hosted plugin installs MUST download signed first-party release bundles through an authenticated, editor-authorized same-origin Fetch route. The server MUST restrict outbound sources, bound response bytes, forward no session credentials upstream, and retain client-side signature and digest verification.

## LN-SRV-018 — Server static profile: serve the fixed Web plugin-host entries referenced

<a id="ln-srv-018"></a>

**Requirement.** The server static profile MUST serve the fixed Web plugin-host entries referenced by its initial import map, including `@lapis-notes/api/workspace-host`. Installed History runtime modules MUST resolve those entries through the same host module graph before activation.

## LN-SRV-019 — Server-mode Web client: use the public build-configured Nostr plugin source

<a id="ln-srv-019"></a>

**Requirement.** A server-mode Web client MAY use the public build-configured Nostr plugin source directly. The hosted server MUST NOT become a registry database, relay trust root, curator, or proxy for the signed release evidence.

## LN-SRV-020 — Server delivery without Deno

<a id="ln-srv-020"></a>

**Requirement.** Server builds, tests, executable output and production containers MUST run without Deno. The server MUST consume portable host-service kernels and retain compatible HTTP, authentication and data contracts. Runtime containers MUST use a non-root user, read-only application files, explicit writable storage and mounted bootstrap secrets.

lapis-server builds the Rust executable and hosted screen from exact
tracked source and pinned siblings. Node24/pnpm are build-only tools. Runtime
keeps UID/GID1993, read-only application files, persistent `/data`, temporary
`/tmp` and mounted bootstrap credentials. Image/browser acceptance verifies
actual identity, absent Node/Deno, clean stop and cold persisted content.

## LN-SRV-021 — Integrated native service authority

<a id="ln-srv-021"></a>

**Requirement.** The Rust host MUST invoke shared native services directly rather than supervise the retired Node companion. Uncertain work MUST remain explicit without automatic replay. Shutdown MUST drain service-owned work before confirming success, preserve unresolved editor recovery and distinguish forced termination from graceful completion.

## LN-SRV-022 — Hosted history admission

<a id="ln-srv-022"></a>

**Requirement.** Native history MUST resolve opaque managed-vault identities from the configured data root. Handles MUST bind the authenticated caller scope, vault, physical source and admission generation. Revocation MUST drain those scopes. Native request frames MUST NOT accept browser-supplied filesystem paths or caller authority.

## LN-SRV-023 — Preserved history transport

<a id="ln-srv-023"></a>

**Requirement.** The native host MUST reuse the transport-independent `jj-history-service` for operation-pinned reads. It MUST retain version-one inner frames as exact text through JavaScript, enforce request and response limits, and reject unknown methods and protocol versions. Reading history MUST NOT initialize or reconcile repository state.

The first private bridge is not an HTTP feature. Authenticated browser routing,
automatic backup, restore and shared UI integration are H03 acceptance gates.
External history lives under the managed vault's persistent `history` directory,
separate from disposable `state/app.turso`. Original colocated repositories are
explicit read sources; absence never creates a repository.

The staged Rust HTTP host exposes admitted, generated background-indexing
controls under LN-CORE-004. Authentication, protocol/origin admission and vault
isolation apply equally to selection, progress and refresh. This source endpoint
retains native admission independently of the selected hosted defaults.

The explicit hosted native-metadata profile under
[LN-WEB-066](../web-host/startup-and-plugins.md#ln-web-066) observes those controls
through the existing client admission. The retired Node profile is no longer selected;
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

The staged Rust browser backend reuses its existing `RustVaultClient` for this
port and passes it into the owning vault session. It introduces no task retry,
client-supplied filesystem authority or renderer writer. The initial single-user
operator date policy is an explicit process `TZ` with a matching browser zone;
[hosted Tasks acceptance](../../records/2026-10-26-hosted-native-tasks.md) tracks
actual default-date/day-boundary and unsupported zone mismatch separately.
The retained hosted Properties acceptance reuses this staged Rust backend and
the same installed-plugin fixture; its focused configuration adds no Node
server route, task retry or renderer writer, and leaves the original hosted
Tasks journeys unchanged.

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

The file-icon dependency intake keeps API and hosted validation on the same
patched Zod package through its public v3 entry. Router inputs, vault-role
admission and typed remote-database schemas retain their existing behavior;
no host policy or default changes follow from this dependency alignment.

Optional trusted `queue_selection` metadata follows [LN-CORE-037](../architecture/rust-queue-admission.md#ln-core-037). Hosts keep the exact saved recipient and ACP choices separate from opaque execution-target authority; absent metadata leaves shared UI capture unavailable while preserving R2 operation.

Staged Rust chat observes optional declared logical profiles and exact native
request receipts through its existing admitted participant route under
[LN-CORE-046–048](../architecture/rust-participants.md#ln-core-046). The shared
Agent screen retains native publication and independent outcomes; logical IDs
never derive from runtime labels. Busy group queue interoperability and complete
both-host/profile/provider acceptance retain their separate gates.

R7's [native database stream](../architecture/rust-hosted-delivery.md#ln-core-066)
reuses current caller/vault/generation authority, bounded native commit receivers
and per-frame/idle authentication. The retained hosted provider observes that
stream instead of revision polling; reset/cursor and close/revocation remain
explicit. This adds no renderer writer or automatic effect replay.
