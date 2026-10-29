# R2 and R3 delivery checkpoint

This refresh separates passing application behaviour from pending integration
and commit gates. It changes no product source, default, API or acceptance gate.

## R2 actual-provider screens

Hosted real-provider composer, running detach, completion without its browser
and cold History/reload recovery are committed in the
[hosted screen record](2026-10-25-hosted-provider-screen.md).

Fresh Desktop E-CORE-027 now passes the same retained-screen boundary through
the actual macOS app: composer submission, ordinary reload teardown while the
turn is Running, completion without the observer, reload History and clean
Quit/cold History. One native turn journal, complete record and transcript hash
remain exact. Its original native fixture passes separately; explicit provider
opt-out skips without launch. The native binary SHA-256 is
`7386432b00de597ffdcf38382b62091611352986a64faeb2b200de6ccf2d9a10`.

The original five harness failures remain recorded rather than overwritten.
The final receipt is Desktop ignored
`.local/native-test/core-provider-screen-DXIO88/receipt.json`. Final dependency/
catalog and specification qualification, the Desktop screen commit and Notes
aggregate review remain pending. This checkpoint does not complete R2 or M10.2.

## R3 Tasks source and service intake

Complete Tasks source is integrated in clean Tasks default `fcb2a8b5`. Its
[source record](../../../lapis-plugin-tasks/spec/records/2026-10-25-native-task-index.md)
qualifies 210 hrefs, 30 target lookups and 174 complete index outcomes; the final
source gate passes 1,035 TypeScript, 14 native and 62 cold catalog cases plus
check/build/publint/static/specification checks. Earlier parsing, recurrence,
normalization, per-document structure and whole-vault graph evidence is retained.

Notes service intake is active in `native-tasks-index-20261025`. It connects
admitted physical snapshots to source-owned resolution/graph and the existing
Tasks schema/rows, idempotent publication/pruning and owner close/drain. It does
not enable a second writer or change host defaults. Both unattended host
selections, Tasks mutations/materialization, Docs/custom processors and native
Search/History scheduling remain separate R3 gates.

## Validation

Focused formatting, all eleven existing tracker tests and generated progress
drift pass. The default Docker `pnpm spec:check` passes every canonical lane,
App ownership/metadata audits and all 78 specification-tool cases. Its receipt
is `.local/validation/runs/lapis-notes-validation-2648d077-6739-422f-baac-57bceaab9fbf`.
No product test success is inferred from these documentation checks.
