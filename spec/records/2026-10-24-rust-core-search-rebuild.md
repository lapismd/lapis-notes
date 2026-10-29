# Native Search batch and rebuild controls

Date: 2026-10-24. Baseline Notes `9b23f027`; qualified provider source `e6de56ef`.
R1.3/R3 remains active. This record qualifies the source slice in its enclosing commit.

Retain the existing direct-Turso Search control contract through the native
actor. Begin/end are admitted no-op barriers: they neither hold a transaction
nor batch unrelated callers together. Rebuild walks ordered 100-record pages,
reuses normalization and the selected provider, then atomically publishes each
page with its Search revision. An empty rebuild publishes one Search change.
The existing actor emits committed page changes in revision order when the
operation returns, including after a later failure. This is not a new job-progress
stream. Dropping a reply receiver does not cancel accepted pages; close fences new
operations and drains the existing operation. A failed later page retains prior
commits and produces no revision for its rolled-back page.

Implementation is isolated in `database/search/controls.rs`, with the existing
actor action dispatch in `search/mod.rs`. Raw page reads and prepared output
retain the 32 MiB bounds. There is no second scheduler, dependency, protocol DTO,
renderer change or new configuration. Native host adoption and ordinary model
asset installation remain separate.

## Before/after evidence

- The first exact test attempt stops at the 30 GiB free-space guard, before
  compilation. Use the user's standing cache cleanup authorization; inspect
  compiler inactivity and open files and retain the newest executable/static
  library variants. The ignored manifests are
  `.local/obsolete-rebuild-test-caches.json` and
  `.local/obsolete-rebuild-library-caches.json`. Remove 48 older test binaries,
  4,429 older static compiler files and the inactive JJ Store incremental cache.
  The first cleanup is insufficient for the subsequent build guard; after the
  second, actual available space is 34.04 GiB. Preserve app bundles, latest
  binaries, model/runtime assets and all application data.
- The admitted exact baseline fails compilation with **10 missing-method
  diagnostics** and no runtime cases. Log
  `.local/rust-core-search-rebuild-before-admitted.log`.
- Exact final target: `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm rust:core --
test -p lapis-app-core --test database_search_rebuild --locked`.
  All **five cases pass**, zero failed/ignored. Log
  `.local/rust-core-search-rebuild-after.log`.

The five scenarios cover no-op batch nesting, empty rebuild/change publication,
closed admission, 103 records with changed source metadata/chunks and selected
embeddings, detach/drain/cold reopen, a malformed later page after an earlier
commit, full current-page rollback on journal failure, and explicit unavailable
model errors without a fallback vector. Deterministic token-hash is explicitly
selected for orchestration tests; actual MiniLM model qualification remains in
[the prior provider receipt](2026-10-24-rust-core-search-provider.md).

## Complete source qualification

Root `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm check`
passes **20/20 tasks**, 19 cached, native boundaries, protocol drift, Rust
formatting and strict all-target workspace Clippy. Specification validation
retains **175 chapters / 1,511 requirements**. Log
`.local/rust-core-search-rebuild-root-check.log`. Sequential root `pnpm test`
passes **185 ordinary Rust cases**, zero failed,
with the **two asset-dependent model cases ignored** as before; their separately
qualified actual-model receipt is unchanged. All **20/20** package test tasks
pass, 19 cached. Root `pnpm build` passes the native workspace and **11/11**
package tasks, all 11 cached. Logs use
`.local/rust-core-search-rebuild-root-{test,build}.log`. Root lanes ran
sequentially; no affected source implementation is changed after those passes.

The standalone exact target has five passes, the full workspace has 185 passes,
and existing browser/Node serving qualification remains at the prior provider
receipt. This slice changes the native Search owner only; neither host selects
its facade yet. It does not claim a new browser, Desktop API/OS or real-model
rebuild journey.

Final `pnpm spec:check` passes **nine lanes** and **38 regressions**, preserving
175 chapters / 1,511 requirements; spec-first passes **three protected files /
two chapters**. Selected-document Prettier and final metadata/spec-first checks
pass. Logs `.local/rust-core-search-rebuild-final-{format,spec,metadata}.log`.

## Remaining gates

Vector/hybrid retrieval, asset installation/download, complete facade conformance, both actual
host adapters, unattended indexing and R1.3 shell/backup lifetime remain open.
The separate Desktop intake still qualifies the earlier `e6de56ef` provider
revision. Neither host has adopted the native AppDatabase facade; hosted access
continues to use Node. R2 and R4–R7 are unchanged.
