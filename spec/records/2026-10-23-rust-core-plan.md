# Shared Rust plan and current Desktop review

Date: 2026-10-23. Source change: enclosing Jujutsu change.

The user approved the shared-core plan and requested recent Desktop review before
implementation. The saved plan retains both hosts, standalone local web,
service-owned accepted work until Quit, native first-party background extensions
and a coordinated hosted protocol upgrade. No release or deployment is implied.

Reviewed Desktop default `40a5d97c`, including E-SHARED-007, shared screens, exact
queue effort, first-send recovery and live-view capture/awaited teardown. Notes
default is `e159faad`; committed hosted branch `593abc65` and unfinished change
`vlvosxvo` remain separate. The unfinished Node experiment was not modified.

## Verification

- `pnpm spec:mirrors`: 175 mirrors generated, including the new canonical service
  chapter and verification table. Existing source-driven navigation is retained.
- First `pnpm spec:check`: validation, docs, three view-command regressions,
  21 structure regressions and mdBook passed. Spec-first reported one missing
  owning Storybook chapter for generated preview navigation. Added the explicit
  navigation contract; no gate was disabled.
- Document formatting covers the saved plan, review, guide, ledger, canonical
  requirements, verification, navigation and this record.
- Final `pnpm spec:check`: pass. Validation, 175 current documentation mirrors,
  view-command/structure lanes, mdBook, spec-first, App ownership, metadata-query
  audit and all 38 specification regressions pass. Spec-first failures: 1 to 0.

R0 owns documentation and governance only. Native vault baseline checks are
supporting preparation for R1.1, not a hosted acceptance result. M15.1 and all
original provider/platform gaps retain their existing status.
