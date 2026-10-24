# Complete retained Search candidate evaluation

Date: 2026-10-24. Baseline Notes `dc973ceb`. This is a prerequisite reference
repair for native lexical/structured retrieval under R1.3/R3, not host adoption.

The Turso table-evaluation candidate query previously selected the first
`max(limit, 100)` paths before evaluating the query or ranking. With 111 eligible
documents, a matching or higher-scoring note after that cutoff disappeared from
case-sensitive, field, property, negative, provider and path queries. Degraded
lexical Search had the same problem. Filtering source providers/paths in SQL
did not fix truncation within an eligible scope.

`search-candidate-contract.test.ts` seeds 110 lower-ranked notes and a final
winning note under the same provider/path. It exercises Memory, native Turso
with FTS and native Turso without FTS. Each case checks both document and
path-only results with a final limit of one.

- Exact before command:
  `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/search-candidate-contract.test.ts`.
  **15 failures / seven passes**. Memory passes all seven; both Turso modes
  lose the later winner. Log `.local/rust-search-candidates-before.log`.
- Remove the premature table candidate limit. Keep SQL provider/path narrowing,
  complete shared evaluation/ranking and the existing final result limit.
  FTS/vector candidate algorithms and public interfaces are unchanged.
- The exact rerun passes **22 cases**, zero failures. Log
  `.local/rust-search-candidates-after.log`. LN-DB-059 records the complete
  table-evaluation contract for document and path-only results.

Native retrieval/inference, host adapters, unattended indexing, UI/OS, provider
and distribution gates remain separate. No package is published and no visual
baseline is updated.

The first `pnpm spec:first` attempt reports one missing architecture mapping:
API storage changes require their architecture chapter as well as the package
and database chapters. Add the retained-reference intake to
`architecture/rust-application-services.md`; no validator or mapping is changed.
Log `.local/rust-search-candidates-spec-first.log`.

The corrected `pnpm spec:first` passes **two protected files / four canonical
chapters**. `pnpm spec:validate` passes **10 validators, 175 chapters and 1,506
requirements**. Logs `.local/rust-search-candidates-spec-first-pass.log` and
`.local/rust-search-candidates-validate.log`.

Additional passing source checks:

- The exact regression rerun also asserts the advertised FTS capability in
  each fixture mode: **22 pass**, zero failures. Log
  `.local/rust-search-candidates-final.log`.
- Seven affected API targets pass **123 cases**: both complete database suites,
  metadata contracts, browser coordination and Search storage/preparation/
  candidate conformance. Log `.local/rust-search-candidates-affected.log`.
- A fresh `pnpm exec vitest run --project storybook stories/plugins/search/panels/Search.stories.ts`
  passes **six** interaction/accessibility cases. Log
  `.local/rust-search-candidates-search-stories.log`.
- `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm test` passes **153 Rust cases**,
  zero failed/ignored, and **20/20 package tasks**, all executed. The API passes
  **1,325 cases / 139 files**. Existing Deno skipped-case and Turbo no-output
  warnings remain unchanged. Log `.local/rust-search-candidates-root-test.log`.
- `TURBO_CONCURRENCY=1 pnpm test:storybook` passes all **261** interaction and
  accessibility cases in four cold Chromium/Vite shards (**93 + 71 + 42 + 55**).
  All five tasks execute. Log `.local/rust-search-candidates-root-stories.log`.
- `CARGO_BUILD_JOBS=2 pnpm spec:check` passes **nine lanes**, source ownership/
  metadata audits and **38 validator regressions**. Log
  `.local/rust-search-candidates-spec.log`.
- `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm build` passes native compilation
  and **11/11 package tasks** (two execute, nine reuse current output from the
  preceding qualification). Log `.local/rust-search-candidates-root-build.log`.
- The subsequent `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm check` passes
  strict native Clippy, generated protocol/client checks, source audits and
  **20/20 package tasks** (11 execute, nine builds are cached). Build, check and
  test output writers run sequentially. Log
  `.local/rust-search-candidates-root-check.log`.

The fresh native test build reduces disk headroom below the 30 GiB build guard.
Under standing cache-cleanup approval, remove **35 older test executables**, each
with a newer counterpart retained in this run, plus older Electron download ZIPs
and Cargo archive files. Retain current executables, extracted sources, libraries,
applications, vaults, profiles and models. Check compiler inactivity, open files
and unchanged file identities before deletion. The ignored inventory is
`.local/inactive-search-reference-caches.json`: **2,444 files / 3.50 GiB**,
leaving **31.92 GiB free**. No guard is bypassed.

Changed-file Prettier passes. Versions: Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11
and Rust 1.99.0. No dependency selection, lockfile, native engine or host adapter
changes. This completes the retained candidate-reference repair; native
lexical/structured retrieval remains the next R1.3/R3 database task.
