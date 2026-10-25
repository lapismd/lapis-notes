# Search and History source integration

This combines committed Search `f9fe89674f15d8d8486bd5f7d062d547f7c698ed`
and History `cef143cf06775359b702f76244c2cc002cfc248f` on the completed R2
baseline `0b5ab69f`. Only tracker, architecture and verification prose conflicts
require resolution; implementation and test files merge unchanged.

Search qualification retains 13 native cases, 33 unchanged retained-manager
comparisons, 369 complete Rust cases and 1,590 final-cohort API cases. History
qualification retains nine backup cases, 364 complete Rust cases, 261 cold
catalog cases, complete specification and eight development/six static
navigation cases. Original failures and exact snapshots remain in their
[Search](2026-10-25-native-search-owner.md) and
[History](2026-10-25-native-history-index-owner.md) records. These are separate
qualified source reports, not runs against this combined revision.

The combined native check/test and canonical source gates run before main
intake. The warm former Search checkout supplies its already-qualified native
dependency cache; no active agent work is displaced. Source equality records
must verify every retained product file against its respective parent.

The equality receipt compares all 29 changed product/test/tooling paths with
their qualified parents and finds exact bytes. Strict combined native checks
pass at `dc32f67e-e328-4531-a6fa-e9bc8d161bdd`. Complete combined native tests
pass at `d1d96812-d418-49e2-a615-891fc524720c`: 377 passes, zero failures and
six unchanged intentional model ignores across 87 target/doctest summaries.
All five boundary guards pass too. Both runs
use combined source `18b8bcbba3bab0729eebd00911c9514b61e1e879`.

Complete combined `pnpm spec:check` passes at
`25b690f3-2b20-414a-b1f3-d9cc04cadfd4`, source
`06f1d03dba3af4933395a56b74ba8d94ac359db5`, including all 78 specification
regressions. Changes since the native run are tracker/evidence only; final
formatting, generated-progress and direct tracker checks retain that distinction.

The first local authoring wrapper stops before dispatch because this reused
checkout has no formatter. Its pinned documentation-tool links are installed
under the normal ignored directory. A direct tracker follow-up then reports
one missing validator dependency; linking that pinned authoring dependency makes
the exact tracker command pass all 11 cases. Product validation stays Docker-only.

Both selections stay off by default. Metadata/parser prerequisites, Tasks
transformations, Docs publication and both host adoptions remain. R3 stays
Working; R2 stays Complete. Node hosting and renderer AI remain defaults.
