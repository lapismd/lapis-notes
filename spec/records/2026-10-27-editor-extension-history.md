# Editor extension history during native protection

Recorded 2026-10-27. This source slice implements LN-ED-063/064 and repairs the
original Desktop Metadata Cmd-Z regression. R3 remains Working until its other
native, hosted and adoption gates finish.

## Cause and bounded repair

Typing records a normal CodeMirror history event. The embedded surface's
extension effect then indirectly reads the editor's reactive protection state
while constructing its extensions. Acquiring and releasing native edit
protection reruns that effect. `Editor.updateExtensions` previously replaced
the entire EditorState, clearing Undo history on both transitions.

Extension refresh now dispatches CodeMirror's reconfiguration effect using the
same private extension builder as initial state creation. The existing state
retains history, selection, edit protection and pending persistence. Explicit
document replacement still uses its established history-reset boundary.
Embedded surfaces resolve their declared inputs reactively and apply the
resolved extensions within Svelte `untrack`; protection and persistence reads
cannot become incidental effect dependencies. Mode, configuration and plugin
registration remain explicit dependencies. No public signature, Markdown/Mira
source, driver behavior or native mutation policy changes.

## Exact before and after

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-extension-history.test.ts
```

Before source `05a4868c`, receipt
`5b7f07d7-557b-4411-829f-4e9b58ac7d27`: **one pass, two failures**.
After source `3a6b623d39c63c3603f72a94a5f0639d9975ebf2`, receipt
`54148b2c-77fe-4c5a-bb9c-abe7ac26d2f1`: **three passes, zero failures**.

The tests cover Undo/Redo and selection across refresh, protected writes,
pending-save completion, explicit replacement reset, absence of incidental
protection subscriptions and continued explicit mode reactivity.

## Broader source qualification

Worker `b648ed29-733d-4295-ad0a-74901842732b` is frozen on the after source.
It has passed the exact three cases, all 118 cases across thirteen affected
API files, all 1,708 API cases, public package builds/publint/pack and all
check20/test20/build11 lanes. All 264 cold catalog/accessibility cases, static build and all 41 actual
browser journeys pass (four History, one metadata/Search, eight ordinary Rust,
one Node, twelve local Web and fifteen installed Tasks/editor/leave).
The final specification command stops with two mapped-chapter omissions:
the public API change also requires architecture and package annotations.
This failed receipt remains preserved; both existing editor chapters now link
the same LN-ED-063/064 contract. Final documentary/specification closure is
required before committing the otherwise qualified slice.

The public `@lapis-notes/api` 0.1.4 archive is SHA256
`d178b9d4e12b6590b952386cf2382585c133c415cf0f253a5176bbb3f37df522`.
Its package identity and bytes were checked before Desktop selection. It
replaces the earlier `09939582` candidate that retained this defect. Both are
private local validation artifacts; no registry or lockfile substitution is
committed.

## Actual Desktop acceptance

Desktop's unchanged original native Metadata/Undo case passes **one of one**
on the repaired API with acceptance bundle `ecc53e8e`. Navigation, external
changes and cold restore assertions remain intact. The complete Desktop
catalog/native/build and remaining R3 acceptance are separate running gates.

## Shared compiler target coordination

After cold source catalog/static qualification, the Undo worker is deliberately
paused while the parallel Core restore-diagnostic worker owns the shared native
target. The already-built Undo server is preserved with its build-time and
SHA256 receipt. Before resuming browser acceptance, restore or rebuild that
exact frozen-source server after the diagnostic worker releases the target.
Do not restart either job because an observation call times out, or qualify a
server executable overwritten by a different source revision.

The source worker exited after those specification findings, with no OOM.
The compiler-target pause ended only after the diagnostic owner released its
target; the exact frozen server SHA256 was restored and verified before browser
acceptance resumed. The stored `native-target-resume.json` retains that proof.

## Final source closure

Documentary snapshot `a7d72002d69740a56600436fe92439a84495c654` differs from
qualified product `3a6b623d` only in six documentary paths. Receipt
`4e1a1c52-de36-4c2b-8da4-5d21ef9d6756` passes the exact previously failing
`pnpm spec:first`, generated 104-task progress check and complete ten-lane
canonical specification closure with all 78 governance regressions. It exits
zero at 2026-10-27 02:51:31 UTC with no OOM. The two original mapped-chapter
findings remain in the earlier failed receipt; no gate was waived.

This completes the bounded Undo source/native gate. Final Core composition,
remaining actual-host acceptance and main adoption continue under R3. The API
archive remains `d178b9d4`; documentary closure changes none of its bytes.
