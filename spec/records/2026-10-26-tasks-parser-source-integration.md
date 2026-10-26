# Guarded Tasks and Markdown parser main integration

This main-workspace intake combines qualified one-file Tasks source `9f99eee8`
with current main `12916c1c` (including parser intake `de44b905`). It does not
change either implementation. A single canonical overview conflict combines the
qualified parser and guarded-writer statements. Both native source pins and
their minimal locked dependency edges remain selected.

The [Tasks source record](2026-10-25-native-task-writes.md) qualifies all 404
native and 2,253 package cases, complete check/test/build and specification
lanes. The [parser source record](2026-10-25-markdown-parser-cache-intake.md)
qualifies all 392 native and 54 retained API reference cases with native
build/strict/specification gates. Combined qualification must exercise all
405 ordinary Rust cases, affected indexing/Tasks cases, strict native build
and complete specification gates. Npm source and package inputs stay unchanged.

The ledger distinguishes source-qualified one-file transformations from the
remaining daily-provider/two-file coordination. Both application selections,
full Search/custom-processor parity and the R3 host gate remain pending.

## Combined acceptance

Immutable run `b74dbca6-9453-4735-9243-b6d9e731e61a`, snapshot
`c9ee22a5842ca5b25347f3c19018a6964a14d154`, passes every command:

- Ten exact Task writer cases and 37 affected native indexing cases.
- All 405 Rust workspace cases, zero failures and six unchanged ignores.
- Complete locked native build, source boundaries, generated protocol,
  formatting and strict all-target Clippy.
- All 54 retained API indexing/Search reference cases.
- Complete specification gates, App-ownership/query audits and all
  78 governance regressions.

Fourteen native product/test/fixture paths match their qualified parents
byte-for-byte. The lock preserves only the reviewed Plugins and Tasks dependency
edges; both exact source revisions remain pinned. No product or input edits
follow the qualified snapshot. Final evidence and tracker prose run their own
format/progress/11-case checks. Daily/two-file Tasks coordination is now an
explicit Working row, with both host adoptions still separate.
