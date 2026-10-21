# Node Server Host / Context

Node server installation and builds use the committed pnpm lockfile and published npm ranges. The frozen desktop Deno lock remains independent of server delivery.

The dedicated Web client uses the shared four-plugin application profile from
LN-WEB-004. Community is parked and does not become a server-host default;
verified configured-plugin loading remains available.

Server-rendered application presentation resolves Design Core through the
repository's portable npm range and committed lockfile.

The Node server host provides an authenticated, online Lapis runtime over the
same public vault-session and `AppDatabase` boundaries used by the desktop and
browser hosts. It serves a dedicated Web build and managed vault directories;
it does not expose arbitrary server filesystem roots or make generated database
state authoritative over Markdown.

The portable host-services package owns normalized paths, native AppDatabase
worker dispatch and Markdown operations. The Node host owns filesystem execution,
managed roots, authentication, membership, HTTP policy and process lifetime.
Retained Deno compatibility subpaths serve the frozen desktop independently.

## Runtime topology

```text
Browser server-mode build
  |-- tRPC JSON queries and mutations -----------+
  |-- tRPC tracked SSE subscription -------------+--> Node server host
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

The reusable Deno vault-filesystem kernel also exposes cancellable ranged reads
and atomic staged writes with optimistic identity guards. The server retains
session lifecycle and cancellation ownership, but those primitives do not grant
it sync-key custody, plugin protocol policy, or ambient credential authority.

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

Registry release bundles cross a separate editor-authorized route because
third-party release hosts do not consistently expose browser CORS headers. The
server accepts only the declared first-party GitHub release repositories,
streams at most 64 MiB without forwarding browser credentials, and leaves the
existing signed-manifest, size, and SHA-256 verification in the client.

The browser entry constructs `ServerVaultAdapter` and
`ServerAppDatabaseProvider` directly. The vault adapter maps metadata and
directory operations to tRPC and byte operations to Fetch; `process()` reads
one ETag snapshot and performs one conditional write. Both adapters share one
resumable vault event stream and never install a native desktop bridge.

The matching static build gates on `system.info` before session restoration,
then provides login and managed-vault lifecycle UI. It ships without Workbox or
a service worker and mounts the ordinary workspace shell only after the remote
vault and application-database session are ready.

The container builds the static profile and executable Node ESM in separate
stages, then runs as a non-root user. Application files are read-only, managed
storage is writable and bootstrap credentials enter through a mounted password
file. Node process APIs and worker threads own bounded shutdown; HTTP responses
retain streamed cancellation and backpressure without a second routing framework.
The service's dependency graph and executable output require no Deno runtime.

The server profile marks the document runtime as `node-server` before mounting
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

AI execution for server-backed browser vaults uses the same explicit external
controller connection as the web host. The vault server does not embed an AI
executor or receive the browser-owned App tool and memory authority.

The dedicated Web build consumes the same four-plugin `notesPluginProfile` as
other Notes hosts (LN-WEB-004 and LN-PLUG-006). Community is parked for this
release and excluded from its constructor, style and dependency composition.

Local fixture trust from LN-PLUG-095 is ignored by server-mode clients. The
explicit authenticated host distribution options remain authoritative.

The Web module entries required by LN-SRV-018 derive from LN-PKG-146 rather than
a two-entry host inventory; server delivery uses the same emitted files.

Server-mode Web uses the static application profile and API-owned registry
schema under LN-PKG-150. Concrete Community NIP-29 composition remains deferred
outside the active profile.

Server-backed browser sessions inherit the default Plugins browser registration from the shared web workspace session (LN-PLUG-098–103). Production registry/trust configuration stays with the host; development fixture configuration remains ignored in server mode.

## Node delivery and development

The server-only CI job installs pnpm dependencies, builds the server dependency
closure and runs native and hosted-browser acceptance on Node 24 without Deno
setup or a dependency on desktop builds. Hosted acceptance uses a fresh image,
read-only root filesystem, writable `/data`, temporary `/tmp`, and a read-only
bootstrap secret. It checks persisted content after server recreation.

Container service UID/GID remains 1993 to preserve existing managed-volume
ownership. The Compose project name controls volume identity: existing operators
retain their prior project name when switching the Compose file location.
Node has no Deno-style per-API permission flags; container mounts, the non-root
identity and existing application authorization/containment define this boundary.
