# Native AppDatabase metadata foundation

Date: 2026-10-24. Baseline: `b8fe7629`; implementation is the enclosing source
change. This brings the first database portion of R3 forward for the R1.3 shell
dependency. It does not qualify the full database catalogue or either host's
database intake.

## Native ownership and retained storage

The core now supplies high-level metadata get/set, bounded prefix scans,
conditional transactions and change revisions. One worker serializes operations
on its native Turso connection. Cloned handles share one bounded admission queue
(64 requests) and a 32 MiB aggregate input budget. Messages/results are bounded
to 32 MiB; transactions allow at most 1024 checks and 1024 mutations.

Accepted operations run even when their waiter disappears. Close fences every
clone, drains accepted work, checkpoints, releases the native file lock and only
then reports completion. Dropping the final handle also drains queued work.
Database requests expose no SQL or native path. The host selects the private
profile and vault UUID; another native worker cannot open the same owned file.
Relative profiles, nil identities and database/lock symlinks reject.

The facade retains the serving schema's `app_meta`, `app_revision` and
`app_changes` tables, without marking the complete schema migrated. Existing
metadata/index data and schema version five remain intact. Conditional checks,
set/delete mutations, the revision and its change row share one immediate
transaction. Failed checks do not change revisions. Failed mutations roll back;
a rollback failure poisons the worker rather than allowing later writes.

Missing values retain deletion semantics; explicit JSON null remains a stored
value or check. JSON object insertion order is retained for the existing
`JSON.stringify` comparison boundary. Protocol-owned metadata DTOs generate
schema/TypeScript types with the correct camelCase pagination. Canonical schema
export sorts object keys explicitly so JSON map feature selection cannot create
unrelated schema-order drift.

## Before/after and focused evidence

- `pnpm rust:core -- test -p lapis-app-core --test database_metadata --locked`
  initially fails with five missing-module/dependency diagnostics; no cases run.
  The first dependency selection uses an unavailable exact Tokio pin and fails
  resolution. Using the existing workspace Tokio range retains its locked
  version; the implemented target passes all three cases.
- `pnpm rust:core -- test -p lapis-app-core --test database_metadata
--test database_lifecycle --test database_storage --locked` passes ten cases.
  They cover null/missing, pagination, cold reopen, 24 competing claims with one
  winner, cancelled waiters, cancelled close, final-handle drain, duplicate-owner
  rejection, queue/message/transaction bounds, literal keys, symlink rejection,
  serving-schema preservation and rollback/corrupt-data retention.
- `pnpm rust:core -- test -p lapis-app-core --test database_process --locked`
  passes the cold-process recovery case and its fixture entry. It commits Unicode
  metadata, kills that native owner without a graceful close, then launches a
  fresh process that restores the committed value/revision and checkpoints.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/app-database-metadata-contract.test.ts` passes all ten retained
  browser/native-SQL/coordination contract cases. These are supporting browser
  boundary evidence, not a claim that a renderer now uses the Rust facade.

## Qualification and remaining gates

`pnpm check:rust-core` passes native boundaries/line budgets, generated
schema/TypeScript drift, formatting and strict all-target Clippy.
`pnpm test:rust-core` passes 78 Rust cases and five boundary regressions;
zero fail or ignored. `pnpm build:rust-core` builds all native crates.
`pnpm spec:check` passes the nine configured lanes, canonical build/spec-first,
mirrors, ownership/query audits and all 38 specification regressions.
Changed-file Prettier passes. Toolchain: Rust 1.99.0, pnpm 10.34.5, macOS ARM64.

Remaining AppDatabase domains, full schema migration, vault-owner integration,
change subscriptions and actual hosted shell acceptance remain open. The native
indexer, semantic model, unattended reconciliation and history scheduling still
gate R3. No SQL endpoint, browser fallback, duplicate renderer scheduler, new
screen or Node cutover is introduced. Desktop source intake is qualified
separately after this source commit; no provider/Linux/distribution gate is
claimed here.
