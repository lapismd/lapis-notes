# Native single-row projection reads

Date: 2026-10-24. R1.3 catalogue prerequisite within R3, following native
projection storage `65a6c0e0`. This slice ports existing `getProjectionRow`
semantics; the AST and relationship query methods remain pending.

The owning native database worker checks active registration and explicit
private-owner access, then reads the existing normalized source/row/file join.
Public reads retain row-ID, source-path, document-ID and data-ID aliases. Source
status, hash, schema and configuration must match; a missing core file row retains
the existing permissive freshness rule. All caller strings remain bound data.
Reads do not write, change revisions or publish events. Responses retain the
32 MiB bound and existing JSON parse-to-null compatibility behavior.

## Verification

The exact `database_projection_rows` before run reports twelve missing-method
compiler diagnostics and runs zero cases. The after run and its cold follow-up
stop at the unchanged 30 GiB preflight, before compilation or cases. Under the
user's standing cache approval, inactive duplicate Rust artifacts and older Turbo
archives were removed after compiler/open-file and inode/size/mtime checks.
`.local/removed-projection-row-caches.json` lists the 4498 removed cache files
(8082825596 bytes). Application binaries, vaults, profiles, models and development
data remain.

`pnpm rust:core -- test -p lapis-app-core --test database_projection_rows
--test database_process --locked` then passes all five entries: three row-read
cases plus cold kill/reopen and its fixture. The cold owner now reads the stored
projection through the public facade, with a matching core source hash.

`pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/app-database.test.ts
src/lib/__tests__/turso-app-database.test.ts -t projection` passes all seven
selected cases; 32 unrelated cases are excluded by that name filter.

Focused logs: `.local/rust-db-projection-rows-{before,after,cold,retained}.log`.

Wider qualification passes:

- `pnpm test:rust-core`: 110 Rust cases and five boundary regressions, zero
  failures or ignored cases, including both cold hosted-process cases.
- `pnpm check:rust-core`: dependency/line audit, generated protocol/type drift,
  formatting and strict all-target Clippy.
- `pnpm build:rust-core`.
- `pnpm spec:check`: nine configured lanes, ownership/query audits and 38
  specification regressions.
- Changed-file Prettier.

Logs: `.local/rust-db-projection-rows-{tests,check,build,spec}.log`.

## Remaining gates

Projection AST and relationship reads, task composition, cross-domain mutations,
Search/memory storage and host database adoption remain. The earlier
[Desktop compatibility](2026-10-24-rust-core-projection-desktop.md) qualifies
`65a6c0e0` only. These source methods are not yet used by either host database
adapter. Native indexing, semantic Search, hosted shell, AI/provider, Linux and
distribution gates remain unchanged. R1.3 and R3 stay In progress.
