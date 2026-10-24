# Native projection definition and source storage

Date: 2026-10-24. R1.3 database catalogue prerequisite, within R3. This slice
ports the existing five projection write methods from the API Turso provider
into Notes-owned native storage. It does not switch a host database adapter.

## Retained contracts

- Register/unregister definitions; replace, mark-error and delete source rows.
- Existing normalized definition/source/row/value/edge tables and formats.
- Optional writer namespace enforcement, active-definition admission and at most
  64 rows per source. Internal host calls retain their existing authority.
- First 64 indexed/sortable fields in JavaScript property order; own-property
  lookup, cardinality, scalar conversion and 4096 UTF-16-unit text limit.
- One transaction for replacement/cleanup and its committed revision. Failed
  writes roll back all domains and emit no event. Core metadata remains intact.
- Native accepted work, close/drain and bounded admission retain the same owner.

The protocol uses an ordered typed field map; its new `indexmap` dependency
retains JSON insertion order rather than alphabetically changing the field cap.
Array-index property keys retain JavaScript's numeric-first enumeration. Generated
schema and TypeScript bindings include the existing typed definition/source DTOs.
The shared fixture lives under the owning API test package, so ordinary package
test cache keys include its content without a new root-task cache exception.

## Verification

The exact `database_projections` before run compiled zero cases and reported 19
missing-method diagnostics. The first implementation ran four cases: three
failed because native INTEGER-affinity values need explicit integer/real
decoding. Fixing that source conversion makes the original four pass unchanged.
Two generated TypeScript enum-case diagnostics were corrected in the Rust type
annotations, retaining lowercase public wire values.

- `pnpm rust:core -- test -p lapis-app-core --test database_projections
--test database_projection_values --test database_process --locked`: eight
  entries pass, including six projection cases, cold kill/reopen and its fixture.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/projection-values-contract.test.ts`: three cases pass against
  the same scalar fixture and field/text bounds as native storage, including an
  actual write/read through the retained Turso provider.

Logs are `.local/rust-db-projections-{before,after,fixed,focused,cold}.log` and
`.local/rust-db-projection-browser-values.log`. Earlier failures remain recorded.

Wider source qualification passes:

- `pnpm test:rust-core`: 107 Rust cases plus five boundary regressions; no
  failures or ignored cases. This includes the separately recorded
  [HTTP upload connection repair](2026-10-24-rust-http-upload-connections.md)
  exposed by the first full run, with its original failure retained.
- `pnpm check:rust-core`: dependency/line audit, generated protocol/type fixtures,
  native formatting and strict all-target Clippy.
- `pnpm build:rust-core`.
- `pnpm spec:check`: all nine configured lanes, App ownership/query audits and
  38 specification regressions pass.
- `pnpm --filter @lapis-notes/api check`, `test` and `build`: zero Svelte/type
  diagnostics, all 1191 cases in 132 files, package lint and packed-type checks.

Logs: `.local/rust-db-projections-{tests-final,check-final,build}.log` and
`.local/rust-db-projections-api-{check,tests,build}.log`.
Specification validation initially rejected the missing mapped package chapter;
the shared conformance fixture is now documented in the owning storage chapter.
The shared fixture also exposed a Unicode whitespace conversion difference:
Rust's generic whitespace set parsed U+0085 as numeric padding, unlike JavaScript.
The exact scalar case failed once, then passes with the ECMAScript whitespace
set. Both retained TypeScript and real SQL-provider cases pass unchanged;
`.local/rust-db-projection-whitespace-{before,after}.log` records that regression.

## Remaining gates

Projection query/get/related reads and their private/stale visibility,
task composition, cross-domain rename/delete, Search and memory storage remain.
The complete database schema marker is unchanged. This slice does not qualify
native indexing, host database adoption, the retained hosted shell, AI/provider
journeys, Linux or distribution. R1.3 and R3 remain In progress; the full R0–R7
completion gates are unchanged.
