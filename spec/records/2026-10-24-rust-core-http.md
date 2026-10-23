# R1.3 authenticated Rust HTTP file adapter

Date: 2026-10-24. Notes baseline: `8a918d38`; implementation is the enclosing
Jujutsu change. The source-private `lapis-server` crate joins the existing Cargo
workspace and embeds the same `lapis-app-core` owner used by Desktop. The
protocol adds generated managed-vault and attach DTOs. Existing locked package
versions are retained; the HTTP dependencies are additive.

## Delivered boundary

An operator-owned file admits one to twenty opaque vault IDs and physical
roots. The API lists only IDs/names, creates bounded attachments, dispatches the
typed protocol, detaches clients and explicitly closes a vault. HTTP cannot
choose native roots, OS actions, credentials or executables. Blocking core calls
run on Tokio's blocking workers without holding the global attachment registry
through file IO or drain.

Every route requires an owner bearer token and exact protocol-major header.
Token digests use constant-time comparison. Browser Origin values must match
the configured public origin; no CORS grant is emitted. Unknown input fields,
foreign vaults/generations, old attachments and bodies over 2 MiB reject before
effects. Core replies retain correlation, typed errors and no native paths.

The real HTTP file scenario exercises the same operations as Desktop's native
acceptance: Unicode/binary/range IO, metadata, mtime, directories, exclusive
creation, append, copy/rename/remove, conditional saves and independent clients.
Detached dirty claims remain discoverable and block other writers/close/Quit
until explicit recovery. SIGINT/SIGTERM uses the shared shutdown fence; a blocked
leave keeps HTTP available for recovery and a later shutdown attempt.

The binary defaults to loopback. The owner token comes from its environment;
configuration remains outside admitted vaults. An explicit operator address and
public origin support later hosting without introducing Docker execution.

## Before and after

- `pnpm rust:core -- test -p lapis-server --test http_files --locked` initially
  fails because the package does not exist; no cases run.
- First implementation compile finds two fixture errors: missing append options
  and treating optional stat as a required value. Corrected the fixture to use
  the existing protocol. The next compile catches moving optional stat inside a
  pattern guard; changed the assertion to borrow it.
- Adding process-test Tokio features makes `--locked` correctly refuse a lock
  update. `--offline` updates only the new dependency graph; no previous locked
  package version is removed. Subsequent qualification uses `--locked`.
- The exact HTTP target then passes six cases. Expanded it with physical-root
  replacement/symlink rejection and assertions on every successful operation;
  the final exact target passes all seven cases, zero failures.
- `pnpm rust:core -- test -p lapis-server --test process --locked` passes one
  real cold-binary case. SIGTERM is blocked by dirty state, the original service
  remains usable, explicit discard permits exit, and a fresh process reads the
  exact persisted Unicode bytes while refusing the old attachment.
- First `pnpm check:rust-core` finds one strict-Clippy fixture finding for an
  ineffective struct update. Removed that update without suppressing the lint;
  the exact HTTP target and complete owning checks pass afterwards.

## Qualification

- `pnpm check:rust-core`: dependency/source boundaries, schema/TypeScript drift,
  positive/negative client compilation, formatting and strict workspace
  all-target Clippy pass.
- `pnpm test:rust-core`: 38 Rust cases and five boundary-audit cases pass; zero
  fail or ignored. The server contributes seven real-HTTP cases, one startup
  configuration case and one cold-process case.
- `pnpm build:rust-core`: core, protocol, exporter and server build successfully.
- `pnpm spec:check`: all configured lanes, mdBook, spec-first, App ownership,
  metadata-query ownership, 175 current mirrors and 38 specification regressions
  pass. Changed Markdown and TypeScript fixture formatting pass.
- Toolchain: Rust 1.99.0, pnpm 10.34.5, macOS ARM64. The generated protocol
  includes positive attach/managed-vault and negative remote-root client fixtures.

These are native source and real-process HTTP results on macOS ARM64. No existing
browser/renderer caller changes, UI story changes, provider journey, Linux
packaging, deployment or release is claimed. Desktop intake is separately
qualified by its `E-CORE-003` record.

## Remaining R1.3 and later gates

R1.3 remains In progress. Existing browser login/session and App/Vault adapter
intake, current shell read/edit acceptance, automatic attachment expiry,
streamed file/resource bodies and service-owned backup after detach/controlled
Quit remain open. An explicitly closed vault currently reopens only on host
restart. SSE/jobs arrive with their owning service slices.

This API is private staging, not the hosted cutover. Node continues serving the
browser. Dirty editor claims and jobs still need later durable restart journals;
only saved file bytes are qualified through cold restart here. R2–R7, Desktop
M15.1, real-provider and distribution gates retain their original scope. The
standalone browser and frozen Deno host are unchanged.
