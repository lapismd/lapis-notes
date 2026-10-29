# R1.3 native browser authentication

Date: 2026-10-24. Baseline: `e615d1b5`; implementation is the enclosing
source change. This qualifies the Rust authentication boundary, not the browser
shell or hosted cutover.

## Behaviour and ownership

The existing one-owner policy now has native bootstrap, scrypt verification,
hashed opaque sessions, idle/absolute expiry, revocation and login throttling.
The private Turso store is `<LAPIS_SERVER_DATA_ROOT>/control/auth.turso`, outside
admitted vaults. Its distinct filename preserves the serving Node control store;
Node owner/session migration is not claimed. Bootstrap is idempotent, so the
initial password file can be removed and later restarts need no credentials.

Production cookies require HTTPS and use the `__Host-` prefix, HttpOnly,
SameSite=Lax and Path=/. Explicit insecure development is limited to an
`http://localhost` origin. Login requires exact Origin and protocol major three;
cookie mutations also require CSRF. A supplied invalid bearer never falls back
to a valid cookie. Peer throttling derives from the connected peer, ignoring
untrusted forwarded headers. One bounded native hash worker retains its permit
even when its awaiting request disconnects.

Attachments bind to their authenticated session or explicit operator token.
Logout revokes the persisted session and detaches only its clients. Accepted
work and detached dirty claims remain service-owned. Browser media GET/HEAD can
omit the custom protocol header, while supplied stale headers still reject.
Passwords and session tokens are never stored in plaintext or logged. The
Node-compatible hash format retains the existing bounded scrypt parameters.

## Before/after and focused evidence

- `pnpm rust:core -- test -p lapis-server --test auth_control --locked`
  initially fails to compile with one unresolved `control` import; no cases run.
  The first implementation exposes three inference diagnostics in the attempt
  store. After fixing their explicit error type, the exact target passes four
  cases: Node golden-hash interoperability/bounds, hashed storage and expiry,
  bootstrap/private roots, and throttle/login. The final `auth.turso` path is
  requalified by the same four cases.
- `pnpm rust:core -- test -p lapis-server --test http_files hosted_info_is_public
--locked` initially fails one case with 401 rather than 200; the exact target
  now passes one case.
- `pnpm rust:core -- test -p lapis-server --test http_files browser_auth --locked`
  passes seven cases covering public info, cookies/current/logout, HTTPS/local
  mode, Origin/protocol/shape/throttle, CSRF/invalid-bearer admission, principal
  isolation, retained dirty claims and browser media headers.
- `pnpm rust:core -- test -p lapis-server --test browser_process --locked`
  passes one real cold-executable case. It bootstraps, logs in without an operator
  token, saves Unicode content, stops, deletes the bootstrap file, restarts with
  no bootstrap credentials, restores the old cookie/CSRF, reads the note through
  a fresh attachment and revokes the session. It checks 0700/0600 permissions.
  The final control-store filename is requalified by this exact case.

## Qualification

`pnpm check:rust-core` passes dependency/source/size audits, generated
schema/TypeScript drift, Rust formatting and strict all-target Clippy. Initial
Clippy found three test-only cloned-reference-to-slice findings; the callers now
use `std::slice::from_ref`, without suppressions.

`pnpm test:rust-core` passes 65 Rust cases and five boundary regressions, with
zero failures or ignored cases. `pnpm build:rust-core` builds all native crates.
`pnpm spec:check` passes canonical validation, mdBook/spec-first, mirrors,
ownership/query audits and all 38 specification regressions. Changed-file
Prettier passes. Toolchain: Rust 1.99.0, pnpm 10.34.5, macOS ARM64.

Browser DTOs are additive and generated from Rust. Existing vault commands and
error variants are unchanged. Desktop consumes none of the new authentication
DTOs; no Desktop source or dependency intake is changed by this slice.

## Retained gates

The existing login UI, App/Vault/database adapters and actual browser shell
read/edit journey remain pending. R1.3 needs the high-level native AppDatabase
catalogue first; exposing raw SQL or adding a browser fallback is forbidden.
Native backup detach/Quit remains open. R2–R7, real provider acceptance, Linux
packaging, publication and deployment remain unqualified by this source record.
