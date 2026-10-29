# Generated master migration status groups

## Scope and before state

The Notes master `MIGRATION.md` had hand-maintained, area-based Rust task tables.
Desktop's separate generator already produced status groups and passed
`pnpm check:progress` for 50 tasks and 282 evidence records. This change repairs
the master tracker; Desktop source and its qualification remain unchanged.

The exact regression command was:

```sh
node --test --test-name-pattern='master tracker groups gates' scripts/spec-validation/migration-progress.test.mjs
```

Before implementation: one failure, because no gate-status groups existed.
After regeneration: one pass, zero failures. The complete new generator target
passes ten cases, covering grouping, numeric ordering, spec links, source-only
qualification, deferred status, malformed metadata, drift detection,
idempotence, and preservation of authored checkpoints and historical intake.

## Change and preservation

`spec/migration-progress.json` owns the 46 existing task records and UTC stamp.
`pnpm progress:generate` projects the managed task block and timestamp only.
`pnpm check:progress` rejects drift, duplicate/invalid IDs, unknown statuses,
invalid timestamps and unresolved canonical spec requirements. Normal and
specification checks include that gate; the agent guide documents the workflow.

The generated tables have two Working, fourteen Waiting, twenty-three Source
complete and seven Complete entries. Empty statuses are omitted; Complete is
last. Tasks retain their area, work description and evidence/next gate, gain
stable hierarchical IDs, sort naturally and link to their canonical contract.
These IDs subdivide the existing checklist; they introduce no new feature work.

A one-time comparison against the original tracker confirms exact preservation
of all 46 work/status/evidence triples. The historical section beginning with
`Hosted AI and history parity (2026-10-21)` is byte-identical. Source complete
continues to mean source qualification, independently of host adoption.

## Qualification and remaining work

Focused generator tests: ten pass, zero failures. Full `pnpm spec:check` passes
all ten lanes, ownership/metadata audits and all 48 specification regressions.
`pnpm check:progress` and changed-file Prettier checks pass. The exact regression
improves from one failure to zero; no functional or accessibility failure is
introduced. Logs: `.local/migration-progress-spec-check-final.log` and
`.local/migration-progress-final-docs.log`.

The first full specification run passes metadata, generator, source-boundary,
documentation, audit and mdBook lanes, then reports two missing spec-first
chapter mappings for the root command change. The Architecture and Packages
chapters now document the root development commands and drift gate; no mapping
or acceptance requirement is weakened. The final spec-first gate passes for six
protected files and four canonical chapters. The initial failure remains in
`.local/migration-progress-spec-check.log`.

This is tracking/tooling work. No application source, dependency archives or
product gates changed, so native, renderer, provider and model suites are not
repeated. Tauri selects the shared file service only; both hosts retain their
old database adapters and hosted access remains Node. Runtime/model cache
installation remains the next implementation slice, followed by both adapters
and the existing R1.3/R2–R7 gates. Desktop M11 remains Deferred and M12 remains
Planned with its M11 prerequisite.
