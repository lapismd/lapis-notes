# Rust hosted-service adapter

Private R1.3 staging for the shared application-service migration. This executable
embeds `lapis-app-core`; it contains no JavaScript application runtime. It has
one owner and up to twenty configured or created vaults. The current Node server
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

For operator-only access, set `LAPIS_SERVER_TOKEN` to a private random owner token
of at least 32 printable ASCII characters. Keep that secret in the host
environment. Start the service:

```sh
pnpm rust:core -- run -p lapis-server -- /path/to/server.json
```

The default listen address is `127.0.0.1:8787`. A second positional argument may
select a different socket address. `LAPIS_SERVER_ORIGIN` selects the exact public
HTTP(S) origin when using a reverse proxy. Terminate TLS at that proxy before
exposing a non-loopback listener. No CORS permission is granted. The native file
engine currently targets the qualified Unix platform boundary.

For browser sessions, configure these installation-owned environment variables:

- `LAPIS_SERVER_DATA_ROOT`: absolute private profile outside admitted vaults.
- `LAPIS_SERVER_ORIGIN`: exact public HTTPS origin.
- `LAPIS_SERVER_BOOTSTRAP_USERNAME` and
  `LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE`: first owner credentials. The private
  password file must be outside admitted vaults and contain 12–1024 characters.

Bootstrap creates the owner once. Later starts need no bootstrap credentials or
password file. Native authentication data lives in `control/auth.turso` beneath
the profile (directory mode 0700, database mode 0600 on Unix). This is separate
from Node's control database; importing its owners or sessions is not claimed.
The optional operator token can coexist with browser authentication. Explicit
local development may set `LAPIS_SERVER_INSECURE_COOKIE=1` only with an
`http://localhost` origin. Production cookies require HTTPS.

Login uses bounded scrypt and username/peer throttling. Opaque session tokens are
stored only as SHA-256 hashes. Cookies are HttpOnly, SameSite=Lax, Path=/ and
Secure; production uses the `__Host-` prefix. Sessions expire after seven idle
days or thirty absolute days. Login requires the exact Origin and protocol
header. Cookie mutations additionally require the returned `x-lapis-csrf` token.
Logout revokes the session and detaches only its clients, preserving dirty claims
and accepted work. All configured vaults belong to the single installation owner.

Profile-backed startup enables the retained chooser's Create, Rename, Archive
and Restore controls. A fresh installation may configure `{"vaults": []}`.
Created content lives under `vaults/<host-generated-id>/content` in the private
profile; names never select directories. The control database persists names,
archive state and physical identities. Restart retains renamed configured
entries and rejects replaced storage. Archived content is preserved, while its
shared file/database/backup owner is drained and old clients are revoked.
Dirty-editor claims block archive. Restore retains the original vault and
history identity. Catalogue mutations complete independently of HTTP response
waiters and drain before shutdown. Operator-only staging without a profile
continues to require at least one configured vault and cannot manage vaults.

API requests use `x-lapis-protocol: 3` and either the session cookie or
`Authorization: Bearer <owner-token>`. Cookie file/resource GET/HEAD requests may
omit that custom header for browser media loading; a supplied stale header is
always rejected. Any browser `Origin` must match the configured public origin.
Routes:

| Method       | Route                                       | Result                                           |
| ------------ | ------------------------------------------- | ------------------------------------------------ |
| GET          | `/api/v3/system/info`                       | Public protocol/build/auth availability          |
| POST         | `/api/v3/auth/login`                        | Public owner login; sets cookie and returns CSRF |
| GET          | `/api/v3/auth/current`                      | Current browser session and CSRF token           |
| POST         | `/api/v3/auth/logout`                       | Revoke browser session and clear its cookie      |
| GET          | `/api/v3/vaults`                            | Opaque vault IDs and names                       |
| POST         | `/api/v3/vaults`                            | Create with `{ "name": "Notes" }`                |
| POST         | `/api/v3/vaults/{vault}/name`               | Rename with a bounded display name               |
| POST         | `/api/v3/vaults/{vault}/archive`            | Drain and archive, preserving content            |
| POST         | `/api/v3/vaults/{vault}/restore`            | Restore the original physical vault              |
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

The retained browser login, configured-vault read/edit shell and native backup
lifetime have separate qualified receipts. Managed chooser acceptance is tracked
under R1.3.9. Transfers, installation delivery, durable AI, unattended indexing,
native operations and final SSE/static delivery remain required. This private adapter is not a hosted cutover or distribution
qualification. See [the migration plan](../../RUST_CORE_MIGRATION_PLAN.md).
