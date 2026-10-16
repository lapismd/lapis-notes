# Application-state writer admission

This is the next M4 component after the committed Properties/metadata work.
LN-PKG-173 serializes calculation and persistence of settings, plugin-data
changes, removals and schema defaults. LN-PKG-174 governs lifecycle admission of
application-state writers. This component integrates configuration and hotkeys;
core/plugin enablement and App Shell plugin-state writers remain separate audit
items. It does not complete M4.

## Before and exact evidence

`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/app-state-persistence.test.ts`
initially fails all five cases: concurrent configuration and plugin updates lose
keys, shutdown passes a pending write, failed settings drafts are unowned, and
hotkeys overwrite external state. After the first repair all five pass; the
five affected suites pass all 48 cases.

A sixth regression rejects malformed external configuration during explicit
recovery. Before the repair, five cases pass and one fails: recovery has already
cleared its conflict before the reset callback rejects. Retain the old baseline
and conflict until reset succeeds. All seven affected writer/command suites then
pass all 75 cases, including the six exact regressions.

## Shared Workspace Settings admission

The initial API-only change passed all 1,616 package cases (1,035 API), the root
check/build tasks and all 256 cold catalog interaction/axe cases. Initial
consumer checks, 800 plugin cases and public builds also passed. The first
native run still passed only the hotkey case: the shared Settings controller's
debounce had not admitted its draft before shutdown protected Configuration.
One failure also exposed a test-fixture assumption: a schema default need not
already exist in app.json. The native fixture now explicitly seeds its expected
true value; disk and recovery assertions remain unchanged. Against that same
bundle, two native cases pass and the immediate-close and post-recovery-save
cases still fail.

`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace-state-persistence.test.ts`
reproduces the integration boundary: the first two cases fail; adding the
independent queued API field case produces three failures. All three pass after
the API Workspace bridge admits the public Settings change event immediately.
Only the changed field is submitted when supplied; API recovery projection does
not feed back into persistence. Conditional hosts do not defer admission to the
presentation controller's save callback. Existing non-conditional hosts retain
their shared deferred callback.

An attempted cross-repository Prettier invocation could not resolve the source
repository's JSDoc plugin. Its own formatter handles TS/Markdown; the desktop's
explicit formatter configuration handles the new standalone Svelte harness.
No formatter configuration was changed.

The widened final source run passes all 1,038 API cases but stops on one
unchanged deno-host-services build test: `keeps completed receipts outside the
bounded active journal` exceeds its 5,000ms deadline. The exact target
`pnpm --filter @lapis-notes/deno-host-services exec vitest run src/sync-vault.test.ts -t 'keeps completed receipts outside the bounded active journal'`
then passes in 2.17 seconds. Repeat the complete original root lane without
source changes, skips or timeout adjustments; the initial interruption is not
accepted as a passing root run.

## Final source and targeted consumer qualification

All nine affected writer/workspace suites pass 190 cases. The final uncached
root check passes 18 tasks; the complete repeated root test passes 18 tasks and
1,619 package cases, including all 1,038 API cases. The root build passes all
10 tasks. The complete fresh Notes interaction/axe catalog passes 256 cases.

The five Notes public outputs are packed after their normal prepack lanes pass.
The API archive records snapshot `ebcb151ce59afb5cd783d3da3e490f6374f31ddc`
and SHA256 `004e0d180ef0e4ebf49917ce36312a935247495818f641761f6bfea406734275`.
The ten-archive desktop cohort verifies ten installed routes; the plugin
consumer's nine core archives verify 28 routes. Its full check, 800 unit cases
and public build pass. The real native Settings/hotkey target passes all four
cases across six cold processes in 12.8 seconds, with unchanged assertions and
deadlines. The complete plugin interaction/axe catalog passes all 235 cases.
Its specification and explicit App-ownership checks pass; existing audit ignores
remain unchanged.

The first complete native run passes startup but has one conditional-fixture
after-all animation-frame timeout and five subsequent Notes failures. Fresh,
unassisted exact fixture reruns pass all three conditional and seven Notes cases
without source, harness or deadline changes. The repeated original
`CARGO_BUILD_JOBS=2 pnpm test:desktop` then passes all 53 cases: 27 WebView plus
26 cold cases, including startup. The final cold continuation passes 24 cases in
95.3 seconds. Desktop E-STATE-001 retains each failure and the unresolved precise
activation cause rather than treating the earlier interruption as a pass.

The final `pnpm spec:check` initially stops in spec-first with two missing mapped
chapter findings for the Workspace bridge. The owning workspace persistence
and plugin controlled-source notes retain their existing separation and link
the application-state contracts. The same specification command then passes,
including all 38 specification regression cases. No implementation or test
change is required for these documentation findings.

LN-PKG-173 is Implemented; LN-PKG-174 remains Partial. Core/plugin enablement,
App Shell plugin state, compatibility plugin-data files and the remaining M4
writer audit are not completed by this component. The user requested a pause
after committing it and reopening the ordinary app for review. No source payload
changed after the recorded archive snapshot.

Tracked manifests and registry lockfiles remain portable. No Deno desktop source
change, publication, production signing or visual approval is included.
