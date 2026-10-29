# Explicit close persistence scope

Enclosing Jujutsu change; LN-WS-101 retains global editor and application
protection while allowing an explicitly declared view with no file writers to
close after its layout is saved. Desktop E-CATALOG-016 reproduces a real native
problem: the retained note's global barrier blocks closing its merge review,
even though the staged merge belongs to the App rather than the review UI.

Keep the safe default for old plugins, unknown and mixed targets, and all
application shutdown. Capture and revalidate view identity after asynchronous
blur/settlement/layout work. No native grant or registry lifetime is waived.
Add the generic method in the public View contract before Desktop opts its
presentation-only review in. Publication remains deferred.

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace-close-guard.test.ts`:
  before 1 fail/5 pass (`.local/layout-only-close-before.log`); after 6/6 pass
  (`layout-only-close-after.log`). The failing case is a real retained writer
  rejecting closure of an unrelated, explicitly layout-only view.
- Add a seventh regression fencing a policy getter that changes while layout
  flush yields. The complete direct surface passes 153/153 across
  `workspace-close-guard.test.ts`, `workspace.test.ts`,
  `workspace-layouts.test.ts`, `workspace-state-persistence.test.ts` and
  `source-text-file-view.test.ts`, using `pnpm --filter @lapis-notes/api exec
vitest run` with those five `src/lib/__tests__/` paths.
  Log: `.local/layout-only-close-consumers.log`.
- `pnpm --filter @lapis-notes/api check`: zero Svelte errors/warnings and
  passing TypeScript (`.local/layout-only-close-check.log`).
- `pnpm --filter @lapis-notes/api build`: public packaging, publint and packed
  contract types pass (`.local/layout-only-close-build.log`).
- `pnpm spec:check`: all six specification lanes, explicit App ownership,
  metadata-query checking and 38 specification regressions pass
  (`.local/layout-only-close-spec.log`). Scoped formatting passes.

The additive public method defaults to `application`; old/missing methods,
unknown and mixed targets retain the prior global guard. `layout` requires no
file writers and staged state retained outside the UI. Target identity and both
initial/current policies are checked after operation settlement and durable
layout flush. Rejected layout persistence still prevents removal. Whole-App
teardown keeps the original global registry guard, proven to reject the same
retained writer after a layout-only view closes. No registry or native authority
changes. LN-WS-099 now explicitly references this bounded LN-WS-101 exception.

Desktop must consume the verified public archive and prove the original native
merge-review closure, retained stage and later writer saving. Its M8.5 gate
remains open until then. Broad root/catalog/platform suites, signing and
publication remain deferred under the user's focused-verification scope.
