# Native indexed metadata storage and queries

Date: 2026-10-24. Baseline: Notes `c8c5e89a`; implementation is the enclosing
source change. This qualifies normalized core publication and six existing
read methods. Full database/host adoption and unattended indexing remain open.

## Storage and query boundary

The native core retains the current per-file, metadata, legacy-domain and
normalized tag/property/link table definitions. Core publication replaces all
its per-file domains in one transaction, journals `metadata` and publishes after
commit. A failed normalized write rolls back file stats, hashes and every
domain. Invalid identities/numbers reject without deleting prior state.

This is the independent core-publication boundary required by LN-DB-020. Its
`CoreIndexedFile` excludes plugin task output. The complete AppDatabase
`upsertIndexedFile` must compose its separate projection stage; this lower-level
primitive does not silently discard one. Cross-domain rename/delete are also
not implemented or claimed by this slice.

Reads retain normalized extension/tag matching, nested object/array property
paths, typed scalar/date comparisons, existence predicates, hidden-path policy,
resolved-link filters, sort direction and path cursors. Prefixes match the
selected path or descendants and escape SQL wildcard characters. Manifests can
restrict exact paths and include parser signatures without returning bodies.
Selective metadata-domain reads skip unrequested JSON; materialization batches
at 400 paths and preserves the requested result order. Facets count distinct
paths through typed normalized columns, and link queries preserve direction,
resolution, order and counts. Optional explicit null positions/headings survive.

Query columns/operators come from enums; caller text is always bound data.
No raw SQL, database path, JSON metadata filtering, whole-database snapshot or
in-memory provider fallback is exposed. Responses retain the 32 MiB/100,000-row
bounds. Native metadata work remains independent of change subscribers.

## Before/after and regression evidence

- `pnpm rust:core -- test -p lapis-app-core --test database_indexed --locked`
  initially reports seventeen missing-type/method compiler diagnostics; no
  cases run. The implemented exact target passes all three original cases.
- `pnpm rust:core -- test -p lapis-app-core --test database_indexed
--test database_indexed_queries --test database_process --locked` first passes
  the three basic cases, then aborts the advanced process with one stack overflow
  in its 2,000-prefix case. A balanced OR tree still overflows the native SQL
  compilation stack. The corrected compiler uses a bound `VALUES` set in an
  indexed-column predicate, preserving the same inputs and match semantics.
- The exact focused command with filter `literal_prefixes` passes the unchanged
  2,000-prefix/wildcard/injection regression on the default stack. No larger test
  stack or reduced query/assertion is used. Obsolete expression construction is
  removed, and all prefix consumers use the corrected compiler.
- The completed three-target command passes ten cases: eight metadata/query
  cases and the real cold process plus its fixture entry. Coverage includes
  typed/nested filters, sorts/facets, exact prefix boundaries, selective loading
  despite corrupt unrequested metadata, rollback, domain replacement, 405-row
  batched materialization, bounded exact manifests and null preservation.
- The cold process now commits indexed metadata, history, notifications and
  Unicode application metadata, is killed without graceful closure, then a fresh
  native process restores all four and the durable revision.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/turso-app-database.test.ts -t 'large path-prefix'` passes the
  exact retained browser/SQL regression (one pass; thirteen filtered).
  The complete Turso, application-database and metadata-contract files then pass
  all 49 cases. This retains independent browser evidence without claiming
  native hosted presentation.

## Qualification

`pnpm check:rust-core` passes native dependency/line audits, generated
schema/TypeScript drift, formatting and strict all-target Clippy.
`pnpm test:rust-core` passes 100 Rust cases and five boundary regressions;
zero failures or ignored cases. `pnpm build:rust-core` builds every native crate.
The build guard initially stops one rerun below 30 GiB free, before any cases run.
With standing cache approval, inactive older source/Desktop compiler and test
caches are checked for open files and removed; newest variants, app binaries and
user data remain intact. Qualification reruns retain the unmodified build guard.

`pnpm spec:check` and changed-file Prettier pass. There are no dependency changes
or modifications to existing vault request/response variants. Toolchain: Rust
1.99.0, pnpm 10.34.5, macOS ARM64.

## Remaining original gates

The full AppDatabase catalogue/schema and host integration remain pending.
Projection/task effects and cross-domain metadata rename/delete still need their
own implementations and conformance. R3 must still index external changes without
clients and qualify actual semantic-model output/retrieval and history-index
scheduling. This storage/query slice does not qualify a renderer index owner,
SSE replay, hosted shell, backup detach/Quit, providers, Linux or distribution.
R1.3/R2–R7 retain their original acceptance gates; Node continues serving the
existing browser until the complete replacement qualifies.
