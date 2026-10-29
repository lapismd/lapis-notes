# Search reveal during workspace projection

LN-WS-005; enclosing Jujutsu change. The existing public reveal contract joins
in-flight host projection before committing selection and expanded dock state.
A newer explicit mutation fences an obsolete reveal; retired leaves stay closed.
No new public method, global App, layout wire format or storage authority.

Desktop's integrated Search reproduction found a populated detached Search view
while the live controller retained Files as the selected tab. A queued initial
host snapshot was already being applied with compatibility persistence
suppressed when Search activated. The new unit regression reproduces that exact
selection race without changing its assertions: before fails 1/1, after passes
1/1, with 131 other workspace cases unselected.

`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts
-t 'reveals the requested sidebar'`: logs
`.local/history-search-projection-before.log` and `history-search-projection-after.log`.
Earlier diagnostic tests compared incompatible width units and an absent
serialized field; those invalid assertions were discarded. The ordinary
collapsed-sidebar test passed unchanged and was also discarded; only the
in-flight selection regression is retained.

The full directly affected workspace tests, source build/types and refreshed
public archive acceptance are recorded below after completion. Wider native,
provider/platform/release and visual qualification remain deferred under the
user's focused functional-UI scope.

All 132 directly affected workspace tests pass. API Svelte/TypeScript checks,
public build, publint and packed declaration checks pass. Spec validation passes;
the first spec-first run required mapped architecture/package/plugin-model
confirmations, now supplied without changing those ownership contracts.

Final `pnpm spec:validate`, `pnpm spec:first` and `pnpm check:app-ownership`
pass. All 132 workspace cases pass; normal API checks, build/publint and packed
contract declarations pass. The consuming Desktop reproduction remains the next
public-package acceptance target. No original native/provider gate is closed.
