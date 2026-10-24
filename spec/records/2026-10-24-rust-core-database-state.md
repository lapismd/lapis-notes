# Native AppDatabase saved state and change publication

Date: 2026-10-24. Baseline: Notes `a654ff05`; implementation is the enclosing
source change. This extends the [metadata foundation](2026-10-24-rust-core-database.md)
with ten existing catalogue methods and native change subscriptions. Full
database and hosted-shell adoption remain pending.

## Retained contracts

Notebook state retains cell outputs, inputs, execution phases and source timing
under the existing `notebook.state:` keys. Notifications retain their own normalized
table, severity, timestamps, read/cleared fields, descending creation order and
idempotent upsert identity. Missing read/clear targets do not produce revisions;
bulk clearing produces one revision, including an empty table. Invalid numeric
values, malformed state and inconsistent notification identities reject without
clearing or republishing data.

Deprecated snapshot load/save remain explicit compatibility methods. The read can
recover the existing `app_state.metadataSnapshot` value; a newer compatibility
metadata key takes precedence. Neither operation becomes a startup/indexing
fallback or a replacement for normalized data. Existing stored state remains
intact. No legacy SQLite file is discovered or imported.

One native transaction commits each mutation and its domain/path change journal.
Only a successful commit publishes the generated `ChangeSet`. Failed checks and
rolled-back writes publish nothing. The bounded 128-event broadcast never waits
for subscribers; lag is explicit and requires refresh. Detail above 64 KiB or
500 paths becomes a complete-domain reset. Durable rows retain the existing
domain/path journal representation; empty path detail invalidates that domain.
Closing drains work and closes event publishers before acknowledging completion.

## Evidence

- `pnpm rust:core -- test -p lapis-app-core --test database_state --locked`
  initially reports 27 missing-type/method compiler diagnostics; no cases run.
  The first implementation reports one generic transaction-return type mismatch.
  After correcting its error branch, the exact original three cases pass. The
  completed target passes all five cases without relaxed assertions.
- `pnpm rust:core -- test -p lapis-app-core --test database_state
--test database_events --test database_process --locked` passes twelve cases:
  five state/storage cases, five commit/event cases and the cold-process case
  plus its fixture entry. They cover preserved outputs, explicit deprecated
  snapshot precedence, notification read/clear/bulk semantics, corrupt-record
  retention, committed domains/paths, absent subscribers, explicit lag, event
  closure, invalid numbers, large-detail reset and failed-batch rollback.
- The real cold-process case now commits a notification as well as Unicode
  metadata, kills the native owner without graceful closure, then restores both
  and their revision in a fresh native process.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/turso-app-database.test.ts
src/lib/__tests__/notifications.test.ts` passes nineteen retained browser/SQL
  cases. These qualify the existing browser boundary independently; they are
  not evidence of a hosted Rust adapter or native UI intake.

`pnpm check:rust-core` passes dependency/source/line audits, generated
schema/TypeScript drift, formatting and strict all-target Clippy.
`pnpm test:rust-core` passes 88 Rust cases and five boundary regressions, with
zero failures or ignored cases. `pnpm build:rust-core` builds every crate.
`pnpm spec:check` and changed-file Prettier pass. No dependency edge/version or
existing vault command/response shape changes. Toolchain: Rust 1.99.0,
pnpm 10.34.5, macOS ARM64.

## Remaining original gates

Native AppDatabase still needs the remaining catalogue, complete schema and
vault-owner integration before the existing hosted shell can switch. R3's
unattended indexing, semantic Search and history scheduling remain required.
Database SSE/replay and desktop database-facade adoption are unqualified here.
The existing Desktop file-service dependency intake remains separately recorded
in E-CORE-005; this slice adds no renderer/OS behavior or installed application.
R1.3 backup lifetime, R2–R7, real provider, Linux and distribution gates remain
unchanged. No custom screen, raw SQL endpoint, fallback writer or Node retirement
is introduced.
