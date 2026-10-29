# Native Search document preparation

Date: 2026-10-24. R1.3/R3 continuation from Search storage `3aa8abaa`.

The shared database now normalizes raw Search documents before atomic
publication. It preserves retained tag ordering/hierarchy, frontmatter text,
scored section and fallback breakpoints, heading association, code-fence
suppression and JavaScript whitespace. Metadata text retains JavaScript number
formatting and array-index/object key order. Chunk IDs and offsets remain UTF-16
based. Source metadata is retained; caller-supplied chunks remain unchanged when
source metadata is absent.

The retained API chunker could bisect an emoji at a target cutoff, producing two
unpaired surrogate halves. LN-DB-058 now advances that cutoff to the pair's end.
This source repair applies to retained Memory and Turso, and the native
implementation shares its 17-record reference fixture. It changes no screens or
host selection or automatically rewrite existing derived rows; rebuilding and
service reconciliation remain R3. Native invalid settings/offsets and excessive output reject
before storage admission and leave existing rows/revisions unchanged.

This slice covers preparation with semantic inference disabled. Native ONNX
inference, lexical/structured/semantic retrieval, cross-domain indexing and host
adoption remain required. Existing standalone browser preparation remains its
intentional implementation, with the same conformance fixture.

Focused evidence:

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/search-preparation-contract.test.ts -t 'surrogate pair'`
  initially reports **zero pass / two fail**. Both providers store `AB` followed
  by an unpaired high surrogate, then a second chunk beginning with an unpaired
  low surrogate. After the API repair, the exact target passes **two**. Logs
  `.local/rust-search-preparation-reference-{before,unicode}.log`.
- The complete retained fixture run passes **36 cases**: 17 golden records
  and the explicit Unicode regression in each provider. Every generated chunk
  also retains its exact source slice and offset length, and encoding rejects
  no chunk. The caller's input remains unchanged. Log
  `.local/rust-search-preparation-reference.log`.
- Existing chunk derivation/scoring acceptance passes **two**, with 23 cases
  unselected. Log `.local/rust-search-preparation-existing.log`.
- `CARGO_BUILD_JOBS=2 pnpm rust:core -- test --locked -p lapis-app-core --test database_search_preparation`
  initially reports **three missing-method diagnostics**, zero runtime cases.
  The first implementation passes **two native cases**, including all 17 golden
  records and rejected settings with unchanged storage. Logs
  `.local/rust-search-preparation-native-{before,first}.log`.
- An expanded bounds test incorrectly uses 300,000 one-character chunks:
  their JSON is **30.761 MiB**, below the 32 MiB guard. Sampling confirms the
  native owner is correctly inserting those accepted rows, rather than stuck
  in normalization. Terminate that isolated test process after the two
  preparation cases pass, then correct the input to 400,000 characters so its
  generated output exceeds the actual bound. Keep the rejection/revision/valid
  retry assertions unchanged. Logs
  `.local/rust-search-preparation-native-final.log` and
  `.local/rust-search-preparation-sample.txt`.
- The exact expanded native rerun passes **13 cases**: three preparation and
  ten existing Search storage/transaction cases. The bounds/rejection case now
  completes in the ordinary focused run, preserving storage, revision, valid
  retry and closed admission. Log
  `.local/rust-search-preparation-native-pass.log`.
- All four affected API targets pass **81 cases**, including the complete
  Memory/Turso database suite and both Search conformance fixtures. Log
  `.local/rust-search-preparation-reference-affected.log`.
- A fresh headless Chromium/Vite run of
  `pnpm exec vitest run --project storybook stories/plugins/search/panels/Search.stories.ts`
  passes **six interaction/accessibility cases**. Log
  `.local/rust-search-preparation-search-stories.log`.

Broader source qualification and consumer intake are recorded separately as
their commands finish. No package publication, application replacement or
native UI acceptance is implied by the source fixture.

The initial full `pnpm check` and `pnpm build` overlap their API package builds.
Both own the same `.svelte-kit/__package__` and `dist` output: check fails with
one `ENOTEMPTY` packaging error, while build's concurrent `publint` observes
61 missing-output errors and four unmatched-wildcard warnings. This is validation
scheduling, not an accepted package failure. Finish the already-running test
lane, then rerun build and check sequentially with one package-output writer.
Logs `.local/rust-search-preparation-root-{check,build}.log` retain the failures.

The first `pnpm spec:check` passes its earlier lanes but stops at spec-first:
the API production edit also needs the owning package chapter, beyond its
database/architecture maps. Update `spec/src/packages/vault-and-storage.md`
with the unchanged public-interface boundary and new fixture/Unicode intake.
No validator mapping or assertion is relaxed. Log
`.local/rust-search-preparation-spec.log`.

Broader passing source evidence:

- `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm test`: **153 Rust cases**
  pass, zero failed/ignored. **20/20 package tasks** pass, including **1,303 API
  cases** across 138 files. Nineteen tasks execute and one build task is cached.
  The retained Deno suite's existing skipped case remains unchanged. Log
  `.local/rust-search-preparation-root-test.log`.
- `TURBO_CONCURRENCY=1 pnpm test:storybook`: all **261** interaction and
  accessibility cases pass in four fresh headless Chromium/Vite shards
  (**93 + 71 + 42 + 55**). All five Turbo tasks execute. Log
  `.local/rust-search-preparation-root-stories.log`.
- The sequential `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm build` rerun
  passes native compilation and **11/11 package tasks**. Public API exports,
  `publint` and consumer type checks pass through its normal prepack build.
  Log `.local/rust-search-preparation-root-build-pass.log`.
- The sequential `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm check` rerun
  passes strict native Clippy, generated protocol/client checks, source audits
  and **20/20 package tasks** (11 execute, nine builds are cached). No package
  output race remains. Log `.local/rust-search-preparation-root-check-pass.log`.
- The corrected `pnpm spec:first` passes **nine protected files / five canonical
  chapters**. The complete `CARGO_BUILD_JOBS=2 pnpm spec:check` rerun passes
  **nine canonical lanes** and **38 validator regressions**. Logs
  `.local/rust-search-preparation-spec-first.log` and
  `.local/rust-search-preparation-spec-pass.log`.

Versions: Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, Rust/Cargo 1.99.0.
No Cargo dependency, lockfile, host adapter or renderer presentation changes.
Native UI/OS, Desktop dependency intake, semantic model output and unattended
indexing remain separate gates; no visual baseline is updated.
