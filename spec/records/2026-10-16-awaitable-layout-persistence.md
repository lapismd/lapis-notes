# Awaitable workspace layout persistence

The Tauri M4 lifecycle needs one awaited layout writer before close, Quit,
reload or vault switching. LN-WS-095 adds `Workspace.flushLayout()` to the owning
public API. The existing 1,000 ms writer remains the normal background path.
Explicit saves join controller projection, serialize with earlier writes and
permit a later retry. Disposal joins accepted writes and cancels old timers.
Background failure reports through the existing console boundary without an
unhandled rejection. Hosts still own user-facing close/error policy.

The shared `.lapis` default remains application-wide. The Notes migration
tracker's stale Bookmarks pathname is corrected to match its canonical contract.
Signing and package publication remain deferred.

## Regressions and repairs

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'flush|serializes an in-flight layout'`
  initially fails all four selected tests because the method is absent.
- The first implementation run also fails four fixture assertions: a closed
  bottom dock serializes zero height, and sidebar persistence represents open
  state through width rather than a `collapsed` property. Open the real dock
  and assert exact public width semantics; retain the intended save assertions.
  The same command then passes four tests.
- Extend the target with `accepted layout writes|background layout` to cover
  disposal drain and observed background failure. All six pass. The complete
  workspace file then passes all 124 cases, including ordinary debounce and
  final controller projection.
- The desktop's packed consumer catches a missing checked-in public declaration:
  Svelte check fails once on `flushLayout`. A new dist-facing contract reproduces
  it with `pnpm --filter @lapis-notes/api check:pack-types` (one TS2339 error).
  Update the API-owned declaration, then build and type-check that public output.
  No consumer shim, source alias or dependency patch is introduced.
- Initial `pnpm spec:first` fails its three required Architecture, Packages and
  Plugin Model mappings. The owning chapters now describe the layout/editing
  teardown boundary and retain existing plugin contracts.

A supplemental whole-file Prettier check of the checked-in compiler-style
`workspace.svelte.d.ts` reports the same failure on the parent and current file
(one before, one after). The two added lines retain that file's established
format instead of reformatting the legacy declaration snapshot. All changed
authored sources and Markdown pass Prettier. No repository check or formatter
configuration is changed; all required check/type/package lanes pass.

## Qualification

Node 26.9.0 / pnpm 10.34.5; macOS ARM64.

- `pnpm test`: 1,563 passed with one existing skip, including 986 API cases.
- `pnpm build`: all 10 tasks pass. `pnpm check`: all 18 tasks pass, with zero
  Svelte diagnostics. The API build includes publint and the dist-facing type
  contracts.
- `pnpm test:storybook --force`: all 249 interactions pass in four cold shards
  (90 + 65 + 40 + 54). Expected failed-plugin fixture logging is not a failure.
- `pnpm packages:check`: package boundaries, local archive-consumer, release
  configuration and all 101 release-tool cases pass.
- `LAPIS_SERVER_E2E_IMAGE=lapis-server-desktop-migration:runtime pnpm test:web:e2e --force`:
  all 12 browser cases pass, including OPFS reload, database owner takeover,
  server editing, sharing and restart. The current Linux Deno dependency stage
  and runtime image were rebuilt. Current host-built server frontend files were
  individually hashed before copying into the runtime image. Docker settings
  and its 3 GiB build limit remain unchanged.
- Rebuild the existing ARM64 legacy desktop with `pnpm --filter @lapis-notes/desktop-deno package:app`.
  Both `pnpm test:desktop:packaged --force --core` and
  `pnpm test:desktop:packaged --force` pass. Its established local packaging
  factory uses an ad-hoc launch signature; Developer ID and notarization remain
  unconfigured and no release is published.
- The unchanged sibling plugin workspace consumes nine verified core/Mira
  archives through an ignored overlay, preserving tracked registry manifests
  and lockfiles. `pnpm audit` retains only its existing two ignored advisories.
  `pnpm test:storybook` passes all 235 interactions (61 + 69 + 45 + 60) against
  the new API archive. Its tracked working copy stays clean.
- The Tauri desktop consumes the complete ten-archive cohort. Its Svelte check
  passes with zero errors and warnings. `pnpm test:desktop` passes 24 actual
  WebView checks and eight cold lifecycle cases. These cover pending-save
  Close/Quit/Back, saved vault/layout restoration, failed-save retention/retry,
  failed reload/recovery, missing physical roots, broken layouts and five edited
  vault switches with native database release. Test processes have neither Node
  nor Deno on PATH. Desktop E-LIFE-001 records archive identity separately.

M4 external-edit conflict protection remains a separate desktop requirement.
The original combined everyday-use gate is unchanged. The API method and its
public declaration are qualified; they do not complete that aggregate gate.
`pnpm spec:check` passes all six configured lanes and 38 validator regression
tests. No visual baselines were created or updated. Package publication remains
deferred to migration completion.
