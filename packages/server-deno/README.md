# Lapis Deno server

This private package runs the authenticated, online-only Lapis server. It owns
the control database, managed vaults, tRPC control plane, direct byte routes,
and the static server-mode Web build. It does not expose arbitrary filesystem
roots and does not host AI or terminal processes.

## Local development

Build the dedicated static client first:

```sh
pnpm --filter @lapis-notes/web build:server
```

Create a password file outside the repository, make it readable only by your
user, and start the server with explicit permissions:

```sh
export LAPIS_SERVER_DATA_ROOT=/absolute/path/to/lapis-server-data
export LAPIS_SERVER_STATIC_ROOT="$PWD/packages/web/dist-server"
export LAPIS_SERVER_ORIGIN=http://localhost:8787
export LAPIS_SERVER_INSECURE_COOKIE=1
export LAPIS_SERVER_BOOTSTRAP_USERNAME=owner
export LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE=/absolute/path/to/bootstrap-password

deno run --no-check --no-prompt --sloppy-imports --unstable-no-legacy-abort \
  --allow-read="$PWD,$LAPIS_SERVER_DATA_ROOT,$LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE" \
  --allow-write="$LAPIS_SERVER_DATA_ROOT" \
  --allow-net=127.0.0.1:8787 \
  --allow-env=LAPIS_SERVER_BOOTSTRAP_USERNAME,LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE,LAPIS_SERVER_DATA_ROOT,LAPIS_SERVER_STATIC_ROOT,LAPIS_SERVER_HOST,LAPIS_SERVER_PORT,LAPIS_SERVER_ORIGIN,LAPIS_SERVER_INSECURE_COOKIE,LAPIS_SERVER_TRUST_PROXY,LAPIS_SERVER_BUILD_ID \
  --allow-ffi \
  packages/server-deno/src/main.ts
```

The password file is used only when the control database has no users. Remove
or unmount it after the first successful bootstrap. The password itself is
never logged.

## Container

The build context is the repository root:

```sh
docker build -f packages/server-deno/Dockerfile -t lapis-server:local .
```

For the example Compose file, create
`packages/server-deno/secrets/bootstrap-password`, restrict its permissions,
then run from that directory:

```sh
mkdir -p secrets
chmod 700 secrets
chmod 600 secrets/bootstrap-password
docker compose -f compose.example.yaml up --build
```

The image runs as the non-root `deno` user. Deno permissions limit reads to the
application, data volume, Deno cache, mounted secrets, and the system `ldd`
file used only to select the glibc Turso binding; writes to `/data`; network
binding to port 8787; named server and dependency environment variables; and
FFI to the dependency caches containing the native Turso library. No
subprocess or general system-information permission is granted.

For production, terminate HTTPS at a reverse proxy, set
`LAPIS_SERVER_ORIGIN` to the exact public origin, and set
`LAPIS_SERVER_INSECURE_COOKIE=0`. Enable `LAPIS_SERVER_TRUST_PROXY=1` only when
requests can arrive exclusively through a trusted proxy that replaces
forwarded headers. Persist `/data` and back up its `control` and `vaults`
directories together.

`GET /healthz` reports process liveness. `GET /readyz` becomes successful only
after the data root is writable, the static build is present, control
migrations finish, and bootstrap completes. SIGINT and SIGTERM stop new
requests, close vault workers and databases, and then exit.
