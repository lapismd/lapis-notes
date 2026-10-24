# Native AppDatabase file-history storage

Date: 2026-10-24. Baseline: Notes `27e1b01f`; implementation is the enclosing
source change. This ports the two existing file-history catalogue methods. It
does not qualify the separate JJ repository engine's hosted integration.

## Retained storage and publication

The native facade uses the existing history-files, path-map and ordered-revision
tables. It preserves stored file/revision IDs, content, hashes, captured/current
paths, event types and timestamps. Rename retains lineage, deletion retains its
snapshot and restore clears the file tombstone. Missing content/hash fields
retain the current fallback semantics. The legacy Unicode code-point hash
fallback matches JavaScript's golden `86fa74a6` for `日本語 🪨`; service file
versions still use their separate strong SHA-256 boundary.

Same-content deduplication adds no revision or change. Explicit latest-revision
replacement retains its exact revision ID. Retention preserves the current
minimum-one/floor semantics. Lineage, revisions and the `history` change journal
commit together; failed publication rolls back all of them and publishes no
event. Invalid/corrupt rows reject without rebuilding or discarding database-only
history. Messages/results retain the 32 MiB limit. No raw SQL or native path is
exposed to callers, and no repository algorithm is copied from JJ Store.

## Evidence

- `pnpm rust:core -- test -p lapis-app-core --test database_history --locked`
  initially reports fifteen missing-type/method compiler diagnostics; no cases
  run. With the native implementation, the exact two original cases pass.
  The complete target passes four cases covering Unicode/hash compatibility,
  deduplication, rename/delete/restore, captured paths, stable replacement pins,
  retention/cold reopen, failed-publication rollback and corrupt-data retention.
- `pnpm rust:core -- test -p lapis-app-core --test database_history
--test database_process --locked` passes six cases, including the real cold
  process and its fixture entry. The cold owner now commits history, a
  notification and Unicode metadata, is killed without graceful close, then a
  fresh process restores all three and their durable revision.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/app-database.test.ts -t 'file history'` passes the exact two
  retained browser cases, with 23 unrelated cases filtered. The complete same
  file subsequently passes all 25 cases. These independently retain the browser
  boundary; they do not prove native hosted presentation.

`pnpm check:rust-core`, `pnpm test:rust-core` and `pnpm build:rust-core`
pass. The complete native suite contains 92 Rust cases and five boundary
regressions; zero failures or ignored cases. Generated schema/TypeScript,
line/dependency audits, strict all-target Clippy, formatting and native build
pass. `pnpm spec:check` and changed-file Prettier pass. There are no dependency
or existing vault-frame changes. Toolchain: Rust 1.99.0, pnpm 10.34.5,
macOS ARM64.

## Original gates remain open

The remaining database catalogue/schema and host adapters still gate the R1.3
shell. R3 must still own native metadata, projections, semantic Search and
history-index scheduling without a client. This compatibility cache does not
complete JJ repository ownership, backup detach/Quit, hosted restore, provider,
Linux or distribution acceptance. R2–R7 and existing Desktop gates remain
unchanged; no Node retirement or presentation change is introduced.
