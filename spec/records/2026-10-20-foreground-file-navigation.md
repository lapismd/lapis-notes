# Foreground file navigation survives queued workspace projection

LN-WS-005/063; enclosing Jujutsu change, parent `a8e0cfa4`.

Desktop's ordinary automatic-backup acceptance exposed an existing Notes
navigation defect: selecting Note.md from Explorer while Repository History was
active updated the owned file selection but left the history tab visible.
The actual editor could not be reached. No Desktop navigation workaround is
added.

`App.openFile` now activates and awaits the existing projection-aware reveal
path for new and reused main note tabs. Existing view-state application follows
that navigation intent, so a newer selection can supersede it during the
await. The file content still loads into its original owned leaf. This uses
LN-WS-005's existing revision fence, preserves LN-WS-063's non-file/sidebar
exclusion and adds no public method, dependency, global App or permission.

## Exact regression and verification

- Before: `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'foreground file navigation'`
  fails both new/reused-note selection cases. The API selection reverts to the
  other tab after the queued controller projection.
  `/tmp/lapis-notes-file-foreground-before.log`.
- First fix passes those two cases in
  `/tmp/lapis-notes-file-foreground-after.log`.
- Added newer-navigation regressions to the same exact target. Its first run
  passes three and fails one: preparing an existing note's open state before
  recording activation let the earlier request overwrite a newer selection.
  `/tmp/lapis-notes-file-foreground-superseded-before.log`.
- Record activation/reveal before asynchronous view-state preparation. The same
  target passes all four cases, including both superseded requests.
  `/tmp/lapis-notes-file-foreground-final.log`.
- Affected direct surface:
  `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts src/lib/__tests__/open-file.test.ts src/lib/__tests__/app-state-persistence.test.ts`
  passes 149/149 across three files, including retained popup/window, layout,
  sidebar, file-open, persistence and App-state coverage.
  `/tmp/lapis-notes-file-foreground-affected.log`.
- `pnpm --filter @lapis-notes/api check` passes component utility audit,
  Svelte checking (zero errors/warnings) and TypeScript checking.
  `/tmp/lapis-notes-file-foreground-types.log`.
- `pnpm --filter @lapis-notes/api build` passes public Svelte packaging,
  generated public helper verification, publint and packaged contract types.
  `/tmp/lapis-notes-file-foreground-build.log`.

Source uses Node 26.9.0, pnpm 10.34.5 and API 0.1.4. The harmless existing
Node localStorage experimental warning remains in Vitest output. Formatting
passes. Initial spec-first requires five additional mapped regions for the
shared App entry: architecture, packages, plugin model, Markdown and Problems.
Their unchanged-boundary confirmations accompany the existing workspace
chapters; no unrelated requirement is changed. Final `pnpm spec:check` passes
all six configured lanes, App ownership, metadata-query audit and specification
validation tests, in `/tmp/lapis-notes-file-foreground-spec-final.log`.
`pnpm check:app-ownership` also passes independently.

`pnpm --dir packages/api pack --out /Users/stevejuma/code/lapismd/lapis-notes/.local/packages/foreground-file-navigation/lapis-notes-api-0.1.4.tgz`
prepares the public archive in `/tmp/lapis-notes-file-foreground-pack.log`.
Its SHA-256 is
`314a83c8f88e340dd22d624971a85c8fd855604b97250ece0b6f5134d1889ad5`.

Desktop must install the verified new API archive after normal guarded review
app shutdown, then rerun its original cold ordinary-backup case. The separate
native pop-out work requires the already verified Design Core archive as well.
This source proof does not promote Desktop's pending M7.3 or M14 capture/recovery
gates. Package publication, full repository/browser matrices and visual
baselines remain deferred under the user's minimal-testing and release scope.
