# Plugin writer admission for the Tauri migration

Session-scoped targeted qualification for LN-PKG-174. Full repository and
consumer lanes are deferred until M7 implementation is complete at the user's
request. This record does not complete M4 or the final shared-package gate.

## Change

Core plugin choices, App Shell enablement and compatibility data files now use
retained App-owned conditional state writers. Hosts can await App Shell
transitions and PluginManager writes before the global editing guard. Runtime
recovery holds the owner lease without reentering its persistence queue and
revalidates disk before acknowledging. Failed or stale recovery keeps the draft.

The writer and its recovery callback register before initial state IO. Invalid
core configuration shapes reject disk recovery. Properties retains an admitted
transform after initial read failure and only acknowledges a recovered draft
after its projection succeeds. Plugin data and Vault creation join the App's
operation registry; Explorer retains the complete create/open action.

Design Core's public plugin-transition boundary is qualified separately in
`design-core-desktop-migration` change `74a94ed15dfe8ef2b72213489e0f0297a0962d21`.
No Deno host source changes, publication, signatures or visual baseline updates
are included.

## Before evidence

- Original PluginManager core transition: one failing regression. Original
  compatibility writer with corrected `.lapis/example.json` fixture: one failing
  regression. Earlier incorrect compatibility paths are retained in local logs.
- Initial Properties read and recovery queue reentry: two failing regressions.
  Disk changing during asynchronous runtime recovery: one failing regression.
  Rejected Properties reset barrier: one failing regression.
- Pending operation API: two failing regressions. Original Vault creation:
  three failing regressions through note, binary and folder creation.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/plugin-state-persistence.test.ts -t 'initial core
configuration|primitive core configuration'`: two failures after correcting
  the fixture's leading-slash handling. The earlier wrong root `--project api`
  invocation failed at startup; the first package invocation exposed that fixture
  path problem. Neither is claimed as separate product evidence.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/frontmatter-persistence.test.ts -t 'recovery projection
rejects'`: one failure; Keep after a rejected reset wrote external text instead
  of the retained Properties draft.

## Targeted after evidence

- The exact two plugin recovery edge cases pass; eight cases deselected.
- The exact rejected Properties projection case passes; nine cases deselected.
- `pnpm --filter @lapis-notes/api exec vitest run` with the following exact file
  selections: 71 cases pass across ten files, zero failures:
  `file-editing-sessions.test.ts`, `file-text-persistence.test.ts`,
  `frontmatter-persistence.test.ts`, `metadata-persistence.test.ts`,
  `plugin-state-persistence.test.ts`, `pending-file-operations.test.ts`,
  `pending-vault-operations.test.ts`, `app-state-persistence.test.ts`,
  `app-shell-plugin-persistence.test.ts`, `workspace-state-persistence.test.ts`.
  All paths are under `packages/api/src/lib/__tests__`.
- The earlier seven-file affected run passed 55 cases. The new writer producer
  run passed 11; the selected existing PluginManager configuration/core/pruning
  run passed 11 with 49 deselected. These are independent runs, not one sum of
  unique tests. A later six-file invocation passed 51 cases but omitted intended
  selections by using nonexistent filenames; the ten-file run above corrects
  that coverage without changing assertions.
- `pnpm check:app-ownership`: passes, including the explicit App boundary.
- `pnpm spec:first`: 18 protected paths and eleven canonical chapters pass in the final run.
- Prior File Explorer check and normal build/publint and Workspace normal
  build/publint pass. API final check reports zero errors/warnings; normal build, publint and
  dist-facing type contracts pass. The final selected PluginManager run passes
  14 cases with 46 deselected. `pnpm spec:validate` passes ten validators, 172
  chapters and 1,457 requirements.

Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64. Failure and after logs
remain under ignored `.local/`; durable cold native qualification and archive
identities belong to Desktop E-WRITERS-001. Three cold native plugin/creation
cases now pass against 12 verified archives; immediate close restores the core
choice and created note, and shell recovery preserves external bytes. Eight
related cold native Settings/Properties/type/hotkey cases also pass with zero
failures or skips.

## Deferred qualification

Before aggregate M4–M7 qualification, run Notes full check/test/build,
specification checks, the affected full Storybook interaction/accessibility and
web-host lanes, Design Core's full required lanes, and the complete Desktop
check/test/build/canonical cold native suite. Preserve every original milestone
gate. Deno is frozen; packaged Deno qualification and visual baseline work are
not part of this delivery session.
