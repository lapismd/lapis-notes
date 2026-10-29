# Qualified native Tasks service main-workspace intake

Updated 2026-10-25 22:42:30 UTC. Notes source commit
`0c9d6b2a66a45d85734bf1fa04af013782fee2a5` is integrated with master status
commit `1f1d1c826e7a5bf5a997dbe1042c94decb6b63d8`. Both original commits remain
parents; generated tracker conflicts are resolved from the structured ledgers,
preserving active Search and current Desktop qualification.

## Source qualification

The [source record](2026-10-25-native-task-documents-intake.md) retains all
before/after attempts, including the repaired binary-target freshness case.
Ten exact Tasks tests pass. The final `pnpm check:all` run
`23fad5f7-1c7b-4b86-a60d-a2db4073dd35` on `d2d23a9e` passes all checks,
356 ordinary Rust tests, 2,220 package tests and Rust/package builds with zero
failures. Six existing Rust ignores and one frozen Deno integration skip remain.

The final source `pnpm spec:check` run
`2f820b9f-c427-4d3f-8809-dbe59c08b053` on `07a85a08` passes all ten lanes and
78 specification-tool regressions. Product files are identical to the full-run
source; final source/evidence changes are documentation only.

## Main integration boundary

This merge changes no product or source dependency bytes relative to the
qualified Tasks commit. It refreshes source/host distinctions, starts the
separate private History source lane and preserves the approved native-only
Search selection scope. Its own formatting, all 11 tracker regressions, progress consistency and
canonical validation pass (11 validators, 181 chapters, 1,517 requirements). Product suites are not repeated
for a documentation-only merge. Neither host default nor renderer ownership
switches here. Tasks mutation/materialization, Docs/custom processors and both
application adoption gates remain R3 work.
