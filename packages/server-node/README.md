# Lapis Node server

The private `@lapis-notes/server-node` package runs the authenticated, online-only
Lapis server on Node 24 LTS. It owns the control database, managed vaults, tRPC
control plane, direct byte routes and static server-mode Web client.

## Build and run

Build the portable dependencies, executable server and browser client:

```sh
pnpm install --frozen-lockfile --ignore-pnpmfile
pnpm exec turbo run build --filter=@lapis-notes/server-node...
pnpm --filter @lapis-notes/web build:server
```

Create a password file outside the repository and restrict it to your user.
Configure absolute storage and static-client paths before starting:

```sh
export LAPIS_SERVER_DATA_ROOT=/absolute/path/to/lapis-server-data
export LAPIS_SERVER_STATIC_ROOT="$PWD/packages/web/dist-server"
export LAPIS_SERVER_ORIGIN=http://localhost:8787
export LAPIS_SERVER_INSECURE_COOKIE=1
export LAPIS_SERVER_BOOTSTRAP_USERNAME=owner
export LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE=/absolute/path/to/bootstrap-password
pnpm --filter @lapis-notes/server-node start
```

The password file is used only when the control database has no users. Remove
or unmount it after bootstrap. The password is never persisted as plaintext or
logged. Existing control/vault directories remain readable without conversion.
Keep one server process per data root and back up `control` and `vaults` together.

`pnpm --filter @lapis-notes/server-node test:smoke` exercises built Node output,
native Turso and its worker, authentication, file preconditions and the browser
adapters against an ephemeral HTTP listener and temporary data root.

## HTTP and lifecycle

The service preserves tRPC and direct file/asset/transfer routes. It uses the
Node Fetch adapter without a second application routing layer. Database workers
use Node worker threads; portable host kernels are owned by
`@lapis-notes/host-services`.

`GET /healthz` reports liveness. Readiness at `GET /readyz` requires a writable
data root, static client, control migrations and completed bootstrap. SIGINT and
SIGTERM stop admission, end subscriptions, drain HTTP/file work and close vault
workers before the control database. Stalled HTTP connections are bounded by a
ten-second grace period.

For production, terminate HTTPS at a reverse proxy, set `LAPIS_SERVER_ORIGIN` to
the exact public origin and `LAPIS_SERVER_INSECURE_COOKIE=0`. Enable
`LAPIS_SERVER_TRUST_PROXY=1` only behind a proxy that replaces forwarded headers.
Node runtime artifacts require no Deno executable. Retained Deno desktop/sync
packages remain independent consumers of the portable kernels.

Delivery steps are preserved in the
[completed migration plan](../../spec/archive/2026-10-19-server-node-migration.md).
The [verification record](../../spec/records/2026-10-19-server-node-migration.md)
retains exact commands and acceptance results.

## Container and Compose

`pnpm build:server:container` builds the local `lapis-server:node-e2e` acceptance
image. The renderer build needs at least 8 GiB available to Docker; its default
Node build heap is 8 GiB, using the existing Web build command. Runtime memory
is independent of that build allocation. `pnpm test:server:e2e` runs the headless browser against that image,
including file editing, peer events, import/export, plugin loading and restart
with retained storage. The test owns temporary containers and volumes.

The image uses Node 24.15.0 and runs as `node` with UID/GID **1993**, matching the
previous service. It contains no Deno runtime. `/app` is read-only; `/data` is
persistent storage and `/tmp` is temporary scratch space. Compose enforces a
read-only root filesystem and permits twenty seconds for graceful stop.

For a new local installation, create `packages/server-node/secrets/bootstrap-password`
with a strong password, restrict access, and make it readable by container UID 1993. Docker Compose file secrets are bind mounts, so host ownership/ACLs must
allow that UID to read the file; Compose's secret `uid`/`mode` fields do not fix
bind-mount ownership. The directory is excluded from Docker build contexts and
package deployment. Then run:

```sh
docker compose -f packages/server-node/compose.example.yaml up --build -d
```

The default project name is `lapis-server`. For an existing installation, stop
the old service and **retain its exact Compose project name** to reopen its
existing named volume. The previous default was `server-deno`:

```sh
docker compose -p server-deno -f packages/server-node/compose.example.yaml up --build -d
```

Use your actual previous `-p` value if different. Do not run old and new servers
against the same volume concurrently. Back up first; neither a format conversion
nor a recursive data ownership change is required. The control/vault layouts,
environment variables, HTTP port and credentials remain compatible.

Node does not implement Deno's per-API permission flags. Runtime isolation comes
from the non-root identity, read-only filesystem, explicit data/secret mounts
and deployment network policy. Application authorization, managed-path checks
and outbound plugin-source restrictions remain enforced by the server. Apply
network egress restrictions at deployment if required.

The image stages the compiled ESM bundle with only its declared external runtime
dependencies. A generated standalone importer preserves the exact resolutions,
integrities, overrides and patch policy from the repository lockfile. It installs
with `--frozen-lockfile`; unpublished workspace packages are already bundled and
are not fetched from npm during runtime packaging.
