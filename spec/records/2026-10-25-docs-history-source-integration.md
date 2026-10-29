# Qualified Docs and History integration

This combines the existing R3 source gates without changing host defaults or
adding scope. Parents are capture-independent History `0b05c990` and native
Docs publication `fedf7b16`. During qualification, main stayed at the qualified History parent. The
combined commit is integrated only after the following source gate passes.

## Exact intake boundary

All 29 product/input paths are byte-identical to their qualified parents:
eighteen Docs paths (including Cargo inputs and the native-source manifest)
and eleven final History implementation/test paths. The retired flat
`backup/history_tests.rs` is absent. There are no product conflicts.
Ignored receipt: `.local/validation/docs-history-integration-equality.json`.

Only `MIGRATION.md`, its structured ledger, the native-services overview and
the CORE verification table conflicted. The merge retains both evidence sets,
the latest 76-row ledger, capture-independent History and explicit Docs staging.
The owning architecture overview remains 400 physical lines.

## Qualification

Each parent already passes its full source check/test/build: History has 380
Rust and 2,253 package passes; Docs has 388 Rust and 2,253 package passes. The
combined changed boundary is native source lifetime, so intake runs affected
indexing first, the complete native workspace, strict generated/native checks,
complete specification checks and tracker regressions. Identical unchanged
TypeScript/UI packages are not retested. Neither parent changes UI or Storybook
configuration; both host adoptions remain separate.

The immutable Docker worker uses four CPUs/12 GiB, the same qualified ten npm
archives and exact pinned native snapshots. Private Cargo/target volumes are
seeded from inactive Docs caches using read-only source mounts; they are not
shared concurrently with another compiler.

The immutable run `43bf717b-2d4e-4497-8299-257e51f28f6c`, source
`7a28efcd3e9c1620e261acd0856db774e5832bd8`, passes every command:

- All 36 affected indexing cases.
- All 391 complete Rust cases across 87 target/doctest summaries; zero failures
  and six unchanged model-dependent ignores.
- Strict locked workspace/all-target Clippy, formatting, generated protocol and
  native dependency/source guards.
- Complete specification, mdBook/navigation, source ownership and all 78
  specification regressions.
- All 11 tracker regressions; local generation/drift and formatting also pass.

There are no failed product/check attempts in this integration. The final delta
from the qualified source contains only ledger/evidence prose. R3 stays Working;
source publication is integrated, while native host selection and removal of
client schedulers/writers remain separate active work.
