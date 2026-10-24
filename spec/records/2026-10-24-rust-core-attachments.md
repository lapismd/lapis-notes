# R1.3 hosted attachment lifetime

Date: 2026-10-24. Baseline: `a1807cd7`; source revision is the enclosing change.
This completes the HTTP attachment-expiry prerequisite recorded in the previous
R1.3 HTTP record. It does not close the browser-shell, streaming or backup gates.

## Behaviour

Commands and authenticated heartbeats renew a five-minute idle client lease.
The native host reaps expired entries every thirty seconds, without relying on
a browser subscriber. Admission reaps before checking the core's client limit.
After expiry, old commands/heartbeats fail; a fresh attachment observes the same
vault generation and any retained dirty claims.

The host drops retired native clients outside its attachment-registry mutex.
Dirty claims become detached and remain discoverable. Expiry neither closes the
vault nor clears writers/jobs. Already accepted operations retain their existing
native client/work leases. Controlled shutdown stops maintenance only after the
core leave gate succeeds. A blocked leave keeps the original host available.

## Verification

- Before: `pnpm rust:core -- test -p lapis-server --test http_files
heartbeat_keeps --locked` fails one real HTTP case: the missing endpoint returns
  404 instead of 204. Authentication rejection remains intact.
- After: the exact command passes one case, zero failures.
- `pnpm rust:core -- test -p lapis-server --test http_files attachments
--locked` passes four cases: authenticated heartbeat, deadline renewal and
  irreversibility, retained dirty-claim recovery/blocked Quit, and reclamation of
  all 128 expired native client slots. Deadlines use explicit monotonic instants;
  no long sleeps or shortened production lease are needed.
- `pnpm check:rust-core` passes dependency/source/size boundaries, generated
  protocol drift, typed client fixtures, formatting and strict all-target Clippy.
- `pnpm test:rust-core` passes 42 Rust cases and five boundary regressions,
  with zero failures/ignored cases. The real cold binary SIGTERM/blocked-leave and
  restart case passes with native maintenance active.
- `pnpm build:rust-core` builds the workspace successfully.
- `pnpm spec:check` passes all nine lanes, mdBook/spec-first, 175 current
  mirrors and 38 specification regressions. Changed document formatting passes.
- Toolchain remains Rust 1.99.0, pnpm 10.34.5, macOS ARM64.

No renderer or existing Desktop caller changes in this slice. No new visible
screen is introduced, and browser/Storybook/provider/Linux qualification is not
claimed. Native core work/claim conformance remains covered independently.
R1.3 and R2–R7 remain open as recorded in the master migration ledger.
