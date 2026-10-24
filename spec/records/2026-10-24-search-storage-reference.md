# Search storage reference conformance

Date: 2026-10-24. Retained-provider qualification before native storage intake.

The API-owned fixture checks complete prepared Search documents, Unicode
content, optional/null source metadata, chunk embedding states/vectors,
body-free manifest cursors, replacement/delete cleanup and index statistics.
Turso already retains these cases. Memory's derived statistics skipped chunks
with no embedding state and discarded the valid empty error string, including
fallback to another document after the current error owner is deleted.

Fix the owning Memory implementation: unknown/missing embedding state is
pending, and error presence uses null checks. No Turso implementation,
embedding configuration, normalization, query semantics or transport changes.
Memory remains explicit test/catalog injection; production hosts select Turso.
Native Search storage, inference, retrieval and host adoption remain separate.

Focused verification:

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/search-storage-contract.test.ts`
  initially passes **five** and fails **one** on Memory statistics. Turso passes
  every reference case. Log `.local/rust-search-reference-before.log`.
- The exact rerun passes **six**. An added lifecycle assertion creates another
  error document, deletes it and verifies the original empty error is retained.
  Logs `.local/rust-search-reference-{pass,final}.log`.
- `pnpm exec vitest run --project storybook stories/api/Search.stories.ts stories/plugins/search/panels/Search.stories.ts`
  cold-starts the Vite/Vitest browser harness and passes **seven** interaction
  and accessibility cases. Log `.local/rust-search-reference-stories-focused.log`.

The new LN-DB-057 gives index statistics their own independently verifiable
contract. The first `pnpm spec:check` reports two spec-first mapping failures:
the AppDatabase context edit is not a mapped requirements chapter, and the
architecture chapter is missing. Add the owning requirement/verification row
and architecture context; the exact rerun passes **nine lanes** and **38
validator regressions**. Logs `.local/rust-search-reference-spec{,-final}.log`.

`pnpm build` passes **11/11 tasks**. The first `pnpm check` stops before
compilation at the 30 GiB storage guard. Under standing cache approval, with no
compiler/linker running and no candidate libraries open, remove **229 older
Rust library cache files** (retain the latest per library) and the checkout's
Turbo cache. The exact library inventory is
`.local/search-reference-library-cleanup.json`; free space becomes **31.15 GiB**.
The exact check rerun passes **20/20 tasks**, including strict native Clippy,
protocol drift, package types and Svelte warnings-as-errors. Logs
`.local/rust-search-reference-root-{build,check,check-final}.log`.

The first broad test run passes **138 Rust cases**, then encounters **one**
five-second timeout in retained sync-vault receipt coverage; Turbo cancels the
unfinished API/workspace workers. Its exact unchanged case passes on rerun
(one selected, 41 unselected); the complete check lane also passes all 90 host
service cases. The first catalog shard has **91 passes / two failures** because
Markdown Problems and Loft Boarding receive no lint diagnostics. Both exact
unchanged cases pass in a fresh focused process (two selected, 16 unselected).
Logs `.local/rust-search-reference-{root-test,receipts-retry,all-stories,markdown-retry}.log`.
No assertion, timeout or product code is changed to address these failed runs.
Complete tests and the catalog are rerun sequentially after the other source
checks finish. `TURBO_CONCURRENCY=1 pnpm test` passes **20/20 tasks**, including
**1,267 API cases**, all **90** retained host-service cases and **138 Rust
cases**. The unchanged frozen Deno host's existing skipped case remains skipped.
Log `.local/rust-search-reference-root-test-final.log`.

`TURBO_CONCURRENCY=1 pnpm test:storybook` then passes **261/261** interaction
and accessibility cases across **59 files**, with shard counts **93 / 71 / 42 /
55**. Both earlier failing Markdown cases also pass in their complete family.
Log `.local/rust-search-reference-all-stories-final.log`. Changed-file Prettier
and the final document specification checks pass; the latter retains nine lanes
and 38 validator regressions.

Versions: Node **26.9.0**, pnpm **10.34.5**, Vitest **4.1.11**,
Rust/Cargo **1.99.0**. Provider results move from **five passed / one failed**
to **six passed / zero failed**. The transient receipt timeout resolves to zero
failures in all 90 host-service cases; catalog failures fall from two to zero in
all 261 cases.

This reference correction does not switch any host database adapter or complete
R1.3/R3. Native storage/inference/retrieval and consumer adoption remain separate.
No visual baselines change.
