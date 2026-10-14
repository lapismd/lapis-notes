# Deno Server Host / Integration contracts

The served Web client interprets `plugins` App URLs through its owning application
profile ([LN-PLUG-106](../plugin-model/app-ownership.md#ln-plug-106)). Selected
release coordinates enter the verified Plugins browser; the URL does not grant
server access or supply an outbound archive source. Hosted installation continues
through the authenticated artifact route under LN-SRV-017.

## LN-SRV-001 — Private @lapis-notes/server-deno: run on Deno.serve, serve the dedicated static

<a id="ln-srv-001"></a>

**Requirement.** Private `@lapis-notes/server-deno` MUST run on `Deno.serve`, serve the dedicated static Web build, and mount tRPC through the native Fetch adapter. It MUST NOT require SvelteKit, SSR, or another HTTP framework.

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

**Requirement.** The server MUST open vault runtimes lazily, serialize mutations per vault, close idle runtimes, and close databases, watches, subscriptions, and imports during ordered shutdown. Initial operation is one Deno process.

Browser acceptance stops and recreates the serving container against its
retained data volumes and requires clean shutdown. A separate test-owned
container retains the loopback-published network namespace across recreation,
so Linux browser network-change notifications cannot abort the startup module
graph. Both containers are removed during test teardown.
The case owns a dedicated browser worker launched after network preparation;
initial navigation and server recreation retain the same startup assertions.
The bootstrap secret-file container has no network. Initial navigation retries
once only after an observed Chromium `ERR_NETWORK_CHANGED` abort of a same-origin
document or script. The retry records a diagnostic attachment; a second failure,
other network errors and application readiness failures still fail acceptance.

## LN-SRV-014 — Health: report process liveness without authentication or secrets

<a id="ln-srv-014"></a>

**Requirement.** Health MUST report process liveness without authentication or secrets. Readiness MUST remain false until control migrations complete, the managed data root is writable, and the static client is available.

## LN-SRV-015 — Initial server-host scope

<a id="ln-srv-015"></a>

**Requirement.** The first server slice MUST NOT host AI, terminals, collaborative editing, arbitrary filesystem roots, invitations, public registration, or multi-instance coordination. Missing capabilities MUST be reported explicitly.

## LN-SRV-016 — Browser vault adapter: translate Lapis virtual-root paths such as /.obsidian/plugins

<a id="ln-srv-016"></a>

**Requirement.** The browser vault adapter MUST translate Lapis virtual-root paths such as `/.obsidian/plugins` to managed relative paths before tRPC requests. Direct server routes MUST continue to reject absolute paths, traversal, and host filesystem access.

## LN-SRV-017 — Hosted plugin installs: download signed first-party release bundles

<a id="ln-srv-017"></a>

**Requirement.** Hosted plugin installs MUST download signed first-party release bundles through an authenticated, editor-authorized same-origin Fetch route. The server MUST restrict outbound sources, bound response bytes, forward no session credentials upstream, and retain client-side signature and digest verification.

## LN-SRV-018 — Server static profile: serve the fixed Web plugin-host entries referenced

<a id="ln-srv-018"></a>

**Requirement.** The server static profile MUST serve the fixed Web plugin-host entries referenced by its initial import map, including `@lapis-notes/api/workspace-host`. Installed History runtime modules MUST resolve those entries through the same host module graph before activation.

## LN-SRV-019 — Server-mode Web client: use the public build-configured Nostr plugin source

<a id="ln-srv-019"></a>

**Requirement.** A server-mode Web client MAY use the public build-configured Nostr plugin source directly. The Deno server MUST NOT become a registry database, relay trust root, curator, or proxy for the signed release evidence.
