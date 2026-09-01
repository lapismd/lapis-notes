# Deno Server Host

The Deno server host provides an authenticated, online Lapis runtime over the
same public vault-session and `AppDatabase` boundaries used by the desktop and
browser hosts. It serves a dedicated Web build and managed vault directories;
it does not expose arbitrary server filesystem roots or make generated database
state authoritative over Markdown.

The reusable Deno host-services dependency is established before the HTTP host:
it owns root-bound filesystem execution, file watches, resource and plugin
assets, Markdown language operations, and native database worker dispatch. The
server layer will add managed-root resolution, authentication, membership, and
HTTP policy around these kernels.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-SRV-001 | Private `@lapis-notes/server-deno` MUST run on `Deno.serve`, serve the dedicated static Web build, and mount tRPC through the native Fetch adapter. It MUST NOT require SvelteKit, SSR, or another HTTP framework.                                                            |
| LN-SRV-002 | The server MUST keep Markdown files authoritative under managed `vaults/<id>/content` directories. Per-vault Turso files under `vaults/<id>/state` MUST remain disposable generated state.                                                                                    |
| LN-SRV-003 | A control Turso database MUST own users, credentials, sessions, vault identities, archive state, and owner, editor, or viewer memberships. Every vault operation MUST resolve the authenticated membership.                                                                   |
| LN-SRV-004 | The first user MUST be bootstrapped only when no user exists, using a username and password-file environment variable. Bootstrap MUST be idempotent and MUST NOT log or persist the plaintext password.                                                                       |
| LN-SRV-005 | Passwords MUST use bounded scrypt parameters and random salts. Sessions MUST use hashed opaque tokens, secure same-site HTTP-only cookies, idle and absolute expiry, strict configured-Origin checks, mutation CSRF validation, throttled login, and revocable subscriptions. |
| LN-SRV-006 | tRPC MUST own the typed JSON control plane for system, authentication, vault, filesystem metadata, AppDatabase, language-service, and event operations. The browser bundle MUST import only protocol types and the client factory.                                            |
| LN-SRV-007 | The protocol MUST expose a stable integer major, build id, JSON-compatible schemas, bounded inputs and outputs, and stable application error codes. A stale client MUST receive an explicit protocol mismatch instead of undefined behavior.                                  |
| LN-SRV-008 | Streamed file bodies, append, import, export, resources, plugin assets, health, readiness, and static files MUST use direct Fetch routes. tRPC MUST NOT wrap those byte streams.                                                                                              |
| LN-SRV-009 | Vault paths MUST be normalized relative paths and MUST reject absolute paths, traversal, NULs, and symlink escapes. Replacement writes MUST be atomic; conditional writes MUST enforce strong ETags.                                                                          |
| LN-SRV-010 | Remote `DataAdapter.process()` MUST transform one fetched text snapshot and commit it with the matching ETag. A conflict MUST throw a typed error and MUST NOT rerun the caller callback automatically.                                                                       |
| LN-SRV-011 | Vault events MUST use one authenticated tracked subscription with `{epoch}:{sequence}` ids and bounded replay. An old or unavailable cursor MUST emit `resync-required`, close, and require a full vault and database-revision refresh.                                       |
| LN-SRV-012 | AppDatabase access MUST use the shared remote method contract and a host-owned native Turso worker. Renderers MUST NOT receive raw SQL, database paths, or methods outside that contract.                                                                                     |
| LN-SRV-013 | The server MUST open vault runtimes lazily, serialize mutations per vault, close idle runtimes, and close databases, watches, subscriptions, and imports during ordered shutdown. Initial operation is one Deno process.                                                      |
| LN-SRV-014 | Health MUST report process liveness without authentication or secrets. Readiness MUST remain false until control migrations complete, the managed data root is writable, and the static client is available.                                                                  |
| LN-SRV-015 | The first server slice MUST NOT host AI, terminals, collaborative editing, arbitrary filesystem roots, invitations, public registration, or multi-instance coordination. Missing capabilities MUST be reported explicitly.                                                    |

## Runtime topology

```text
Browser server-mode build
  |-- tRPC JSON queries and mutations -----------+
  |-- tRPC tracked SSE subscription -------------+--> Deno server host
  `-- direct Fetch file and asset streams -------+        |
                                                          |-- control.turso
                                                          `-- managed vault
                                                               |-- content/ Markdown
                                                               `-- state/app.turso
```

The server and its static client ship together. `system.info` exposes protocol
major and build identity before the client opens a vault. Browser HTTP caching
may retain hashed assets, but the server-mode build does not register the PWA
service worker or offer an offline fallback.

Authentication context is created once per Fetch request. Public procedures are
limited to system information and login. Protected procedures resolve a live
session, while vault procedures additionally enforce the minimum membership
role. Mutation middleware validates both Origin and the session-bound CSRF
header.

Direct file responses preserve HTTP behavior that is not naturally RPC-shaped:
content type, byte ranges, length, ETag, conditional replacement, and streaming.
Append and replacement acquire the same per-vault mutation queue as tRPC
filesystem mutations. Resource and plugin-asset responses require vault access
and retain the verified asset metadata checks.

The first account owns each vault it creates. The schema retains multi-user
identity and membership keys from the first migration, but the product exposes
no registration, invitation, or membership-management UI in this slice.

The server implementation uses exact matching tRPC client/server versions and
generates each domain procedure from the API-owned remote database contract.
Control migrations create users, hashed credentials, sessions, vaults,
memberships, and login-throttle state before readiness. Managed file routes
enforce membership, Origin and CSRF on writes, strong ETags, conditional atomic
replacement, serialized append, ranges, and symlink-aware root containment.
Native per-vault Turso calls execute in a dedicated worker; database and file
changes enter the same bounded replay hub.

ZIP imports stream into a bounded temporary file, reject absolute paths,
traversal, excessive expansion, and excessive entry counts, and publish a new
managed vault only after extraction succeeds. Failed imports remove their
upload and provisional vault. Exports include only regular managed-content
files and reject symlinks.

Installed plugin assets retain their version-and-SHA-addressed public URL. The
server revalidates installed metadata, byte size, and digest before returning
an authenticated immutable response with range and ETag support.

The browser entry constructs `ServerVaultAdapter` and
`ServerAppDatabaseProvider` directly. The vault adapter maps metadata and
directory operations to tRPC and byte operations to Fetch; `process()` reads
one ETag snapshot and performs one conditional write. Both adapters share one
resumable vault event stream and never install a native desktop bridge.

The matching static build gates on `system.info` before session restoration,
then provides login and managed-vault lifecycle UI. It ships without Workbox or
a service worker and mounts the ordinary workspace shell only after the remote
vault and application-database session are ready.

The container builds that static profile and caches Deno dependencies in
separate stages, then runs as a non-root user. Runtime permissions name the
read, write, bind, environment, and FFI boundaries and grant no subprocess
access. The data volume is the only writable persistent location; bootstrap
credentials enter through a mounted password file.

The server profile marks the document runtime as `deno-server` before mounting
the application. It does not publish PWA-host attributes or register a service
worker, which keeps host detection explicit for application and acceptance
code.

The static client presents login and managed vaults through the same branded
Design Core composition as the other Lapis launchers. A supported browser may
pick a local directory and create its ZIP in the client, but the result enters
through the same authenticated, bounded import route as a selected ZIP file.
The server never receives an arbitrary client filesystem root or handle.
When several active managed vaults exist, the host uses the shared Command View
to search and open them. Entering management from an open vault retains that
live session behind a hidden, inert chooser and exposes a vault-named return
control; server storage and membership authority do not move into that UI.

Production sessions use the `__Host-` cookie prefix together with `Secure`,
`HttpOnly`, `SameSite=Lax`, and `Path=/`. The explicit localhost-only insecure
development mode uses an unprefixed cookie because browsers reject a
`__Host-` cookie without `Secure`; that exception is not accepted for any
non-localhost origin.
