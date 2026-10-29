# R1.3 streamed file bodies and bounded HTTP drain

Date: 2026-10-24. Baseline: `5ae59c7c`; implementation is the enclosing source
change. This record qualifies native byte-stream and HTTP transfer behaviour.
Desktop dependency intake is recorded separately; the overall R1.3 shell and
backup gates remain open.

## Shared native writer and snapshots

The existing content-version text writer now delegates its byte publication to
the same shared helper used by streamed binary writes. Retained physical roots,
relative-path/alias checks, foreign/detached dirty claims, exact expected content,
exclusive creation, mtime, permissions and atomic staging remain authoritative.
The old text-policy implementation is extracted rather than retained as a second
writer. A source failure or a size failure never publishes its staged bytes.

Native reads capture a bounded immutable temporary file and its SHA-256/length
under the shared owner. The host streams that representation after releasing the
vault lock. The ETag, ranges, length and body therefore describe the same bytes
even if an external writer changes the source. Native handles are not serialized.

## HTTP transfer behaviour

Authenticated client routes expose GET/HEAD/PUT file bodies and GET/HEAD resource
bodies. Uploads spool at most 64 MiB outside the vault lock and publish only after
the request completes. Chunked bodies do not pass through the JSON command limit.
Missing/exact-version conditions, optional mtime, strong ETags, If-None-Match,
single byte ranges/suffix ranges and If-Range retain their standard contracts.
Stale conditional writes return 412; dirty-writer guards still return 409.

Resources permit images, audio/video and PDF with nosniff and sandbox CSP.
Ordinary file downloads use attachment disposition. Reads/puts renew the
attachment lease; retired clients cannot start a transfer. Incomplete uploads
do not acquire a second authoritative writer or replace a file.

The native leave gate still runs first. After it passes, HTTP connections get a
ten-second drain window. A stalled network reader cannot retain the standalone
server process indefinitely. A dirty editor still blocks that native leave gate
and keeps the original host available for recovery. Maintenance has explicit
stop/drop ownership on both success and failure paths.

## Before/after evidence

- `pnpm rust:core -- test -p lapis-app-core --test service_streams --locked`
  initially reports 13 missing-method compiler diagnostics; no cases run.
  After the shared native implementation, the exact source target with offline
  resolution passes four cases. They cover binary versions/mtime, immutable
  snapshots, dirty aliases/detached writers, external changes during staging,
  broken/oversized sources, and physical-root/symlink containment.
- `pnpm rust:core -- test -p lapis-server --test http_files large_file_read
--locked` initially fails one real HTTP case (404 instead of 200). The matching
  implemented target passes one case.
- `pnpm rust:core -- test -p lapis-server --test http_files streams --locked`
  passes all five transfer cases. They include a six-MiB chunked binary upload,
  byte-for-byte disk assertions, mtime, headers/ranges/cache validators, external
  changes after response headers, stale saves, detached dirty claims, interrupted
  TCP uploads, declared and actual oversized bodies, and resource admission.
- `pnpm rust:core -- test -p lapis-server --test process sigterm_has --locked`
  initially fails one case after a non-reading client retains the response past
  the twelve-second observation deadline. With bounded transport drain, that
  exact cold-binary case passes and the process exits successfully after its
  native leave gate and ten-second drain.

Qualification: `pnpm check:rust-core` passes dependency/source/size audits,
generated schema/TypeScript drift, Rust formatting and strict all-target Clippy.
`pnpm test:rust-core` passes all 52 Rust cases and five boundary regressions;
zero fail or ignored. `pnpm build:rust-core` builds every native crate.
`pnpm spec:check` passes all nine lanes, mdBook/spec-first, 175 current mirrors
and all 38 specification regressions. Changed-file Prettier passes.

Toolchain: Rust 1.99.0, pnpm 10.34.5, macOS ARM64. Existing locked dependency
versions are retained; the HTTP streaming dependencies are additive. Desktop
intake, Linux packaging and browser/provider journeys are not claimed by these
source results.

## Retained gates

No existing renderer/browser caller changes in this source slice. Browser
login/session integration, App/Vault/database adapters and actual shell read/edit
acceptance remain required. Native backup lifetime after detach/Quit also remains
R1.3. Raw append and transfer/installation endpoints retain their existing Node
serving baseline until their complete Rust host intake; no Node retirement is
claimed. R2–R7, provider and platform/distribution gates remain unchanged.
