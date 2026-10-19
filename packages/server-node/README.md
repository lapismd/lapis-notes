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

Container packaging and its cold browser acceptance are tracked as N3 in the
[approved migration plan](../../spec/records/2026-10-19-server-node-migration.md).
