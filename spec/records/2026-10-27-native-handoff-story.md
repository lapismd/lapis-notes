# Native handoff recovery in the real workspace catalog

Prepared 2026-10-27 for the existing LN-CORE-020/027/028 recovery contract and
the requested minimal-shell catalog coverage. The source API repair remains
owned and qualified separately; this slice changes only stories and their
catalog/specification evidence.

## Scenario

`Workspace/Editing recovery/Handoff Failure` uses the existing App,
WorkspaceShell, native editing registry and Problems menu. Disposable transport
and storage seed an external saved-file change before a clean producer yields.
The refused operation never executes. The failed handoff stays visible and
protected after cleanup. Once the fixture producer observes the external save,
explicit retry completes the same handoff/rearm and releases protection without
replaying the original operation or writing saved bytes.

There is no custom recovery screen or debug output. The existing detached-claim
and admission-failure stories retain their scenarios. All three remain
`visual-pending`, with independent nested PNG paths declared but not captured,
following the existing catalog policy. No visual baseline is changed.

## Exact regression

```sh
pnpm exec vitest run --project storybook stories/workspace/EditingRecovery.stories.ts -t 'Handoff Failure'
```

Before snapshot `1048c502300d9433d07ee9729de99c486ce0e9cb` uses the original
pre-repair native session/cleanup source with the new scenario. Receipt
`bb2daf55-1f26-4c90-92a1-775f107ce135` reports zero passes/one failure: the
real Problems surface lacks `Editing handoff failed` after cleanup. The two
other story exports are intentionally excluded by that exact selector. The
worker exits one without OOM; no assertion or timeout is changed.

## Repaired catalog qualification

Frozen after source `3dff2675f1110c4971f6c0a4f9f631110079603c` uses the
package-qualified scoped repair `0e42a318` unchanged. API source files are
byte-identical to that candidate; its public archive identity is `89e81a5f`.
The earlier broad error-deduplication candidate is superseded and excluded.

Receipt `d7d3d4ae-ad37-4393-b8a3-4523dcf97669` passes:

| Boundary                                         | Result                       |
| ------------------------------------------------ | ---------------------------- |
| Exact Handoff Failure regression                 | 1/1, after original 0/1      |
| Complete Editing recovery family                 | 3/3                          |
| Workspace package units                          | 32/32                        |
| API and Workspace checks                         | Strict, zero errors/warnings |
| Public internal dependency builds                | Five successful builds       |
| App ownership and catalog parity                 | Pass                         |
| Exact spec-first and specification validation    | Pass                         |
| Complete fresh interaction/accessibility catalog | 265/265, shards95+67+46+57   |
| Static Storybook                                 | Pass                         |
| Grouped/sorted/spec-linked progress              | All104 rows pass             |

The worker exits0 without OOM at2026-10-27T04:34:27Z. Its collected private
receipt is under `.local/validation/runs/lapis-r3-adapters-handoff-scoped-after-d7d3d4ae-ad37-4393-b8a3-4523dcf97669/`.
The exact, family and full-catalog commands each start fresh Vite/browser state;
no assertion or timing budget is weakened. Tests validate retained protection,
existing Problems retry, no replay and exact external saved-byte preservation.

This worker intentionally qualifies the catalog/static slice without Cargo.
Full canonical protocol/boundary/specification closure passes in the
source owner's native-equipped follow-up with all six pinned sibling sources;
the immutable documentary snapshot and receipt are recorded below. Full API, native and
complete hosted repair qualification remain in their separate owner receipts;
the passing story does not close R3, host adoption or main integration.

## Committed-source composition

The story is rebased onto stable duplicate `2f77f68e` of committed handoff source
`000aef52d870d6812038b9877854926cd39ee344`. Runtime, test, story and dependency
inputs remain byte-identical to the passing265 snapshot. Changes since that UI
qualification are documentary: current source receipts/statuses, the authored
tracker checkpoint and this supporting record. All104 task IDs are retained.
Final canonical protocol/boundary/specification closure uses this combined
source and all six pinned native siblings; no product suite is repeated for
these documentary-only changes.

## Final canonical closure

Snapshot `dc28e17c1b2575117fbf5173f508ce89cf04cc48`, receipt
`1decd30e-40ef-4c66-a8a3-ecaae5520f41`, passes all11 commands and exits0
without OOM at2026-10-27T04:48:45Z. Six exact native source pins and16 public
archives are restored and verified. Dependency builds, exact spec-first,
104-row progress and the complete unmodified canonical specification gate,
including Rust protocol/boundaries and78 governance cases, pass.

The worker's default Prettier cannot infer a Svelte parser despite exit0;
that output alone is not Svelte formatting evidence. A separate local check of
`EditingRecoveryDemo.svelte` with the actual `prettier-plugin-svelte` passes;
all other authored paths also pass Prettier. No source or story bytes changed
for that check. Later changes append this receipt and current tracker facts only.
Native99, full API1716 and hosted42 remain separate qualified owner receipts.
This closes the story slice; final Desktop catalog/main adoption and full R3
completion remain separate.
