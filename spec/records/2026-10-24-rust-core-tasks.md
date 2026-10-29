# Native task database facade

Date: 2026-10-24. R1.3/R3 continuation after native projection query source
qualification. No host database adapter is switched by this slice.

Native Core exposes the existing six task methods: upsert/delete projection,
query, row lookup, child links and descendants. Typed protocol data retains the
v4 recurrence, tracking, optional/null and structural contracts. The shared
API-owned fixture independently checks retained Memory/Turso and native reads.
Task view predicates reuse the native AST engine. Legacy path lookup retains
`task_records`; ID lookup uses current public projections. Descendants retain
Turso's breadth-first task/list edges, path targets and cycle deduplication.
Child links retain normalized SQL order and their separate payload ordinals.

One accepted task write completes its definition, record and projection commit
stages without depending on its waiter. Core's commit publisher now queues every
committed stage in revision order. A later failed projection cannot discard the
earlier task event or metadata. Deletion retains one task/projection change;
rolled-back stages emit nothing. This is the retained staged commit boundary,
not a promise that all task-write stages are one SQL transaction.

Focused verification:

- New retained-provider fixture: **24 passed / zero failed** before native
  implementation. The final reference and recurrence-field run passes **28**.
- Native baseline: **nine missing-method diagnostics**, zero runtime cases.
- Initial native record/view/cancellation target: **two passed / zero failed**.
- Expanded graph target first passes one and fails one: the test confused a
  payload ordinal with normalized table order. Retained Turso and native core
  writes both use array position for that column. Corrected assertions verify
  the actual table order and preservation of the different payload ordinal.
- The next transaction suite passes two and fails one on omitted versus explicit
  false field flags. Comparison now applies the source contract's false default,
  retaining the full field-set/flag assertions; production code was unchanged.
- Final focused native target: **seven passed / zero failed**, covering all
  eleven view/filter fixture scenarios, full JSON roundtrip, cold reopen, all
  three stages after waiter cancellation, failed-stage event retention,
  deletion domains, finite-number admission, graph cycles and **1,001 links**.
- Protocol runtime: **two passed / zero failed**. Generated schema/TypeScript
  drift and positive/negative clients pass.

Commands and logs:

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/task-projection-contract.test.ts src/lib/storage/task-projection.test.ts`
  — `.local/rust-task-reference-{before,final}.log` (initial run selected only
  the new contract file).
- `pnpm rust:core -- test --locked -p lapis-app-core --test database_tasks --test database_task_graph --test database_task_transactions`
  — `.local/rust-task-focused{,-final,-pass}.log`; initial compile log
  `.local/rust-task-before.log` and two-case log
  `.local/rust-task-focused-first.log`.
- `pnpm rust:core -- test --locked -p lapis-app-protocol --test tasks` and
  `pnpm check:protocol` — `.local/rust-task-{protocol,drift}.log`.

Broader source verification:

- `pnpm build`: **11/11 tasks pass**; `pnpm check`: **20/20 tasks pass**,
  including native boundaries, generated protocol, formatting and strict Clippy.
- `pnpm test`: **127 Rust cases pass**, zero failed/ignored; **20/20 package
  tasks pass**, including **1,255 API cases**. The retained Deno suite runs
  unchanged; its one existing skipped case remains skipped.
- The first `pnpm spec:check` stopped before protocol compilation at the
  repository's 30 GiB free-space guard. With no compiler or test executable
  active and no listed file open, removed **53 obsolete integration-test
  executables (1.867 GiB)** from this checkout's Rust target. Kept the newest
  variant per stem and all variants newer than the slice baseline. No libraries,
  applications, vaults, profiles or model data were removed.
- The exact `pnpm spec:check` rerun passes, including **38 validator regression
  cases**, App ownership and metadata-query audits. Logs:
  `.local/rust-task-root-{build,check,test}.log` and
  `.local/rust-task-spec{,-final}.log`.

No UI/runtime TypeScript changes or host selection changes were made; the
preceding Storybook result is separate evidence, not a new run for this slice.
Desktop consumer compatibility remains pending. The native lock adds one direct
edge to the already-selected Chrono **0.4.45**, with no version changes.
Cross-domain indexed-file mutations, remaining Search/memory catalogue methods,
host intake, unattended services and original R1.3/R3 gates remain open.
