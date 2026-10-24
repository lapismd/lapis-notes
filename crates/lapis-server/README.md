# Rust file-service adapter

Private R1.3 staging for the shared application-service migration. This executable
embeds `lapis-app-core`; it contains no JavaScript application runtime. It has
one owner and up to twenty operator-configured vaults. The current Node server
continues to serve the browser until its replacement gates pass.

Create an operator-owned configuration **outside every admitted vault**:

```json
{
  "vaults": [
    {
      "id": "07715e7e-f969-4ade-9d48-c65b9f2d0ebf",
      "name": "Notes",
      "root": "/absolute/path/to/notes"
    }
  ]
}
```

Set `LAPIS_SERVER_TOKEN` to a private random owner token of at least 32 printable
ASCII characters. Keep that secret in the host environment. Start the service:

```sh
pnpm rust:core -- run -p lapis-server -- /path/to/server.json
```

The default listen address is `127.0.0.1:8787`. A second positional argument may
select a different socket address. `LAPIS_SERVER_ORIGIN` selects the exact public
HTTP(S) origin when using a reverse proxy. Terminate TLS at that proxy before
exposing a non-loopback listener. No CORS permission is granted. The native file
engine currently targets the qualified Unix platform boundary.

Every API request requires `Authorization: Bearer <owner-token>` and
`x-lapis-protocol: 3`. Requests with a browser `Origin` must match the configured
public origin. Routes:

| Method       | Route                                       | Result                                           |
| ------------ | ------------------------------------------- | ------------------------------------------------ |
| GET          | `/api/v3/vaults`                            | Opaque vault IDs and names                       |
| POST         | `/api/v3/vaults/{vault}/clients`            | Attach with `{ "protocol_version": 3 }`          |
| POST         | `/api/v3/clients/{client}/commands`         | Generated protocol `Request` and `Reply`         |
| POST         | `/api/v3/clients/{client}/heartbeat`        | Renew the current client attachment              |
| GET/HEAD/PUT | `/api/v3/clients/{client}/files/{path}`     | Streamed file bodies and conditional replacement |
| GET/HEAD     | `/api/v3/clients/{client}/resources/{path}` | Scoped media/PDF with range and sandbox policy   |
| DELETE       | `/api/v3/clients/{client}`                  | Detach, retaining accepted work/dirty state      |
| DELETE       | `/api/v3/vaults/{vault}`                    | Explicitly close; unresolved edits block         |

The operator configuration is never an HTTP input. Command bodies are limited
to 2 MiB in this staging adapter. Non-success HTTP statuses carry `ServiceError`,
or the command's correlated `Reply` when the core produced one. Error messages
omit native roots. Every command uses the existing core owner and writer guard;
there is no fallback writer. Attachments are bounded by the core's 128-client
limit per vault. Commands and heartbeats renew a five-minute idle lease. A native
maintenance task reaps expired clients every thirty seconds. Expiry detaches the
client without closing the vault, cancelling jobs or clearing dirty claims.
Browser clients should heartbeat every thirty seconds while attached and detach
explicitly during normal teardown. An expired attachment requires a fresh attach. Explicit close keeps that vault
closed until the host restarts.

SIGINT/SIGTERM asks the core to fence admission and drain work. An unresolved
dirty editor keeps the server available for explicit recovery; resolve it and
send the signal again. File bytes survive a cold restart. Dirty editor claims
and jobs do not yet have the durable restart journal required by later slices.

File/resource bodies stream through native temporary snapshots; raw uploads are
bounded to 64 MiB and cannot publish an incomplete body. PUT accepts a quoted
SHA-256 `If-Match` or `If-None-Match: *`, and optional `x-lapis-mtime` milliseconds.
GET/HEAD support strong ETags and single/suffix byte ranges. Resources permit
images, audio/video and PDF with a sandbox CSP; ordinary file reads download as
attachments. After native shutdown succeeds, network drain is limited to ten
seconds.

Browser login/session integration, existing App/Vault adapters and shell
acceptance, raw append, SSE jobs and native backup ownership remain required. This private adapter is not a hosted cutover or distribution
qualification. See [the migration plan](../../RUST_CORE_MIGRATION_PLAN.md).
