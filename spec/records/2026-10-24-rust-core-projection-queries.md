# Native projection query intake

Date: 2026-10-24. R1.3/R3 database-facade continuation after retained-provider
reference qualification at Notes `1723e7ad`. Host adoption remains separate.

Core now exposes `query_projection` and `query_related` through the existing
bounded database actor. These reads do not mutate the change revision or emit
changes. Generated Rust/JSON-schema/TypeScript contracts retain the existing
AST, selection, sort/null policy, numeric limit semantics, opaque cursor and
relationship fields without SQL or native root inputs.

ICU collation retains the fixture's Unicode/case and row-ID tie ordering.
Filtering, freshness and cursor admission precede the page cut. Limited reads
stream candidates and retain only their bounded selected payload and sort keys;
the lookahead count does not truncate the input scan. Reads retain the existing
32 MiB response and 100,000-row bounds. Incoming relationships resolve path-only
edges, filter targets before limits and reuse registered/private/current row
reads. Empty selections retain complete rows, and own JSON fields cannot acquire
prototype meaning.

Focused evidence:

- Initial exact target cannot compile: **12 missing-method diagnostics**, zero
  runtime cases. The facade previously had no AST reader.
- First implementation: **two passed / one failed**. The new test incorrectly
  expected an errored source's deleted rows to survive. It now distinguishes
  error cleanup from a separately changed file hash, preserving stale-read
  assertions against the retained storage contract.
- Relationship expansion: **four passed / one failed**. Its purported stale
  fixture accidentally used the current source hash. Using a genuinely changed
  hash preserves the empty-result assertion; no production check was relaxed.
- Protocol roundtrip first fails on JSON `1` versus the existing scalar DTO's
  `1.0`; the fixture now uses the DTO's floating numeric representation. Runtime
  unknown-field/operator/scalar rejection assertions remain intact.
- Final exact reads: **six passed / zero failed**. This includes all eleven
  retained JSON fixture scenarios, cursor/null/locale ties, browser cursor input,
  private/current targets and filtering-before-limit relationships. A 42 MiB
  corpus produces a small selected page; unbounded full payloads fail closed.
- The **one** collector boundary case scans 100,001 matches for a limited page
  while rejecting oversized unbounded/overlarge requested results.
- The **one** protocol case and generated schema/TypeScript drift/client gate
  pass, including valid and invalid client examples.

Exact commands and logs:

- `pnpm rust:core -- test --locked -p lapis-app-core --test database_projection_queries --test database_projection_related`
  — `.local/rust-projection-query-focused{,-final}.log`.
- `pnpm rust:core -- test --locked -p lapis-app-core --lib row_bounds_do_not_cap_the_input_scan_of_a_limited_query`
  — `.local/rust-projection-query-bounds-final.log`.
- `pnpm rust:core -- test --locked -p lapis-app-protocol --test projection_queries`
  — `.local/rust-projection-query-protocol{,-final}.log`.
- `pnpm check:protocol` — `.local/rust-projection-query-drift.log`.

Broader source qualification passes:

- `pnpm build`: native workspace build plus **11/11** package tasks.
- `pnpm check`: fresh Rust boundary, generated-client, format and strict
  workspace Clippy checks plus **20/20** package tasks.
- `pnpm test`: **118 native workspace cases**, five boundary regressions and
  **20/20** package tasks. Unchanged JavaScript lanes reuse their qualified Turbo
  results, including the 1,231 API tests from the preceding source slice.
- `pnpm spec:check`: configured lanes, ownership/query audits and **38**
  specification regressions pass.

Logs: `.local/rust-projection-query-root-{build,check,test}.log` and
`.local/rust-projection-query-spec.log`. The earlier source slice's **261** cold
Storybook cases remain separate UI evidence; no renderer source changed here.

The lock adds only two direct edges to already-selected Base64 and ICU packages;
no dependency versions changed. Consumer compatibility remains pending. Task
projection composition, the remaining database catalogue, hosted/desktop
adoption and original R1.3/R3 gates remain open. No provider, Linux, backup,
installed-app or distribution gate is claimed here.
