# Queued workspace projection and plugin view creation

Native Graph intake motivated an exact API ordering probe under LN-WS-005.
A controller sidebar-open projection queued before creation/activation of a
local ItemView previously removed the newer view. The baseline fails once;
the exact repaired case passes. All 128 workspace cases pass afterward.

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'retains new ItemViews while sidebar projection and activation overlap'
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts
pnpm --filter @lapis-notes/api check
pnpm --filter @lapis-notes/api build
```

The private per-workspace mutation revision changes for explicit view-state
transitions and activation. A queued older controller snapshot yields before
reconciliation. Internal layout replay carries a private transition marker so
it cannot invalidate itself. Public method signatures and plugin policy remain
unchanged; no consumer delay or retry conceals the race.

The exact case asserts retained main/local leaf identity, one local load, no
local unload, preserved root selection and persisted local view state. Normal
API check reports zero Svelte errors and warnings; public build, publint and
packed type contracts pass. Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64.

Initial spec-first reports three missing architecture/package/plugin-model
chapters. Add their owning contracts and preserve the original failure result.
Full source/Storybook/axe/web and consumer lanes remain deferred until M7
implementation under the active session instruction. Deno stays frozen;
publication and signing remain deferred. Consumer archive/native qualification
is still required for the final source snapshot.

Affected state/plugin/editor persistence passes all 36 cases across four files.
The first canonical check rejects a new four-line release note on the already
400-line release chapter. Move that new explanation into the owning workspace
API chapter, preserving the original release document and its limit.

The corrected canonical check passes all six lanes, App/metadata audits and
38 specification-tooling cases. API check/build and all packed type contracts
pass. The remaining native archive refresh and full end-of-M7 lanes stay open.
