# In-flight projection and explicit view state

Enclosing Jujutsu change; LN-WS-005/062. Desktop E-REPO-052 proves a queued
controller snapshot applies `{query:"",scope:"files"}` after the Search command
correctly applies `{query:"local-first",scope:"history"}`. The second setter
comes from restoreLayoutJson, not another command. The source-only Search
fresh-view case passes; the complete Desktop host exposes the projection race.

The existing revision fence checks only before starting asynchronous projection.
The regression must include an existing same-type view with nonempty default
state and a newer explicit transition before older replay finishes. The repair
rechecks the same revision after global activation, per-leaf activation and
asynchronous view preparation. Superseded candidates never replace the live
view; stale completion cannot reset tab selection or window chrome. Cleanup
retains reachable live owners and still releases removed owners. A newer API
transition suppressed during projection is committed back after replay drains.
Public signatures, layout formats, plugin ownership and file authority remain
unchanged; no Search-specific branch or consumer workaround is introduced.

## Before and after

- The original same-type query/scope regression fails before the global fence
  and passes afterward (`workspace-inflight-state-{before,after}.log`).
- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'fences stale leaf replay'`
  fails 1/1 with the global-only fence: holding the per-leaf activation lets
  older replay replace the newer view (`workspace-inflight-leaf-current-before.log`).
- The two exact timing cases pass 2/2 after guarding replay
  (`workspace-inflight-leaf-after.log`). A third regression holds the candidate's
  state preparation, then proves the newer live instance and selection survive.
- The initial four-file consumer run passes 143/145. Both failures are in the
  shared Settings fixture; temporarily restoring the parent implementation and
  rerunning only that file reproduces the same 2 failures/1 pass
  (`workspace-settings-parent-baseline.log`). Its fixture omitted the newly
  materialized `files.exclude` defaults under LN-PKG-185/LN-PKG-173. Seed those
  defaults, assert they survive exact saved-state comparisons, and keep the
  existing two-write recovery assertion unchanged. No production configuration
  behavior or persistence assertion is relaxed.
- The repaired four-file run passes 147/147
  (`workspace-inflight-state-consumers-final.log`).
- Final direct-consumer run passes 174/174 across eight files:
  `workspace.test.ts`, `workspace-layouts.test.ts`,
  `workspace-state-persistence.test.ts`, `workspace-close-guard.test.ts`,
  `workspace-layout-normalizer.test.ts`, `workspace-trust.test.ts`,
  `source-text-file-view.test.ts` and `editor-view-registry.test.ts` through
  `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/…`.
  Log: `.local/workspace-inflight-direct-consumers.log`.

The API package check reports zero Svelte errors/warnings and passes TypeScript.
Its public build, publint and packed-type contract also pass
(`workspace-inflight-check-final.log`, `workspace-inflight-build.log`).
Initial `pnpm spec:check` and `pnpm spec:first` correctly refuse the missing
mapped plugin-model confirmation. Add the unchanged lifecycle/registration
review; final `pnpm spec:check` passes all six lanes, App ownership,
metadata-query checking and the specification regression tests
(`workspace-inflight-spec-final.log`). Scoped formatting passes.

Consumer/archive results follow. Broader root suites, the full
catalog/platform matrix, publication and signing remain deferred under the
user's minimal-verification scope. This source fix does not promote Desktop's
M14.6 until its original cold native and affected catalog gates pass.
