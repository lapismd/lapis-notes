# Deferred imperative workspace attachment

Scope: LN-WS-006/064 and their existing API, architecture and plugin-lifecycle
owners. Notes repository history exposed a shared mount/projection ordering bug.
Source work is isolated from the active desktop migration's file-persistence
changes in the `reusable-history` JJ workspace, based on `d8946b94`.

That is the initial qualification base. The current source slice is rebased onto
`8a27bc36`, preserving its existing public `FileTextConflict.resolveMerged`
contract for the current desktop consumer. The refreshed results below retain
the earlier attempts and identify current artifact provenance separately.

A controller-opened tab can render before the queued API compatibility wrapper
exists. The imperative mount previously returned without attaching, leaving a
loaded view and its correct DOM detached. The adapter now attaches immediately
when possible, then checks again after its existing projection completes. It
reattaches that same retained container and fences deferred work on cleanup.
No additional view, App, plugin activation, service authority or public API is
introduced. Layout, persistence, native permission and execution contracts are
unchanged. The canceled-host case waits through `flushLayout` before asserting
that no attachment occurs.

## Source validation

| Command                                                                                                                                         | Result                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm exec vitest run src/lib/__tests__/workspace.test.ts -t 'attaches a controller-opened view'` before                                        | 1 failed, 1 passed, 129 skipped; the live mount stayed empty after projection |
| Same exact command after the source fix                                                                                                         | 2 passed, 129 skipped                                                         |
| `pnpm exec vitest run src/lib/__tests__/workspace.test.ts`                                                                                      | 131 passed; includes the strengthened projection barrier and canceled mount   |
| `pnpm --filter @lapis-notes/api test`                                                                                                           | 127 files, 1,160 passed                                                       |
| `pnpm --filter @lapis-notes/ui build`                                                                                                           | Public prerequisite build and publint pass                                    |
| `pnpm --filter @lapis-notes/api build`                                                                                                          | Public build, publint and packaged declaration contracts pass                 |
| `pnpm --filter @lapis-notes/api check`                                                                                                          | Svelte 0 errors/0 warnings and TypeScript pass                                |
| `pnpm pack --config.ignore-scripts=true --pack-destination /Users/stevejuma/code/lapismd/lapis-desktop-history/.local/archives/packed` from API | Built public archive prepared for downstream acceptance                       |

Versions: pnpm10.34.5, Node26.9.0, Vitest4.1.11, API0.1.4, macOS ARM64.
Source and downstream raw logs are retained under jj-store's ignored
`.local/reusable-conversations/history-*`. These are focused source results;
wider source and cold downstream acceptance remain pending below.

## Wider qualification attempts

`pnpm check` passed all 18 tasks with no cache hits. The first `pnpm test`
attempt stopped at two 5-second `desktop-deno/src-deno/sync-local-bridge.test.ts`
timeouts: 294 passed, two failed, one skipped. Its subsequent chained root
build did not run. Running those exact two cases at rest passed both with 18
others skipped. The next aggregate unit attempt passed that host, then stopped
at `api/src/lib/build-tools/vite-declarations.test.ts`: 1,159 API tests passed,
one timed out, and 16 of 18 Turbo tasks succeeded. The exact declaration test
then passed at rest in 2.44 seconds. These timeout causes remain unproven; no
timeout or assertion has changed. The quiet standard `pnpm test` retry passed
all 18 tasks (16 cached), including all 1,160 API cases in 127 files and 32
workspace-package cases in seven files. This is the ordinary command with
unchanged concurrency and timeouts; the earlier failed attempts remain recorded.

`pnpm build` then passed all ten tasks (eight cached), including the Web and
frozen Deno production bundles. This is source build evidence, not native Tauri
runtime acceptance.

The first `pnpm test:storybook` attempt stopped in shard 1/4: 75 passed and 18
failed; the remaining three shards did not run. Vite discovered the static
`rotate-ccw` recovery icon during interaction and reloaded the frame. Sixteen
failures reported an inaccessible dynamically imported accessibility runtime;
the two other failures concerned the Markdown lint marker mask and Harper
diagnostics. The shared optimizer now pre-bundles that recovery icon under
LN-CAT-099. Exact cold editor-family acceptance must distinguish the reload
failure from any remaining dependency or diagnostic failures. Assertions and
accessibility remain enabled.

The exact cold `LapisEditorDemo.stories.ts` rerun passed all 18 cases, including
Markdown Problems and Markdown Spellcheck. `pnpm test:storybook` then passed all
four shards: 93, 71, 42 and 55 cases, respectively, across 59 files (261 total).
Turbo reported five successful tasks with four cached prerequisite builds; the
browser task executed. No dependency archive, assertion, timeout or axe rule was
changed to get this result.

This is an interaction/accessibility pass, not an empty-console claim. Apart
from expected failure-fixture logs, shard two emitted two ResizeObserver loop
diagnostics and three CodeMirror invalid-line RangeErrors in AI panel stories.
Those non-failing runtime diagnostics remain visible in
`history-api-root-stories-optimizer.log`; their cause is not established by this
mount regression or by the passing story counts. Native and broader editor
diagnostic qualification remain distinct from the API attachment proof.

## Dependency preparation and failed attempts

The isolated source workspace preserves tracked manifests and lockfiles.
Initial borrowed dependency links failed before tests because the UI source's
`clsx` was unresolved; both temporary links were removed. A fresh offline frozen
install required the original ignored pnpm hook to match its recorded checksum.
`pnpm install --frozen-lockfile --offline` then succeeded. The normal registry
Design Core0.4.0 lacks this migration's already-required `setCloseGuard`, so that
run failed both cases during harness construction and proved no mount behavior.

Source qualification uses the migration's existing verified public
`lapismd-design-core-0.4.0-m72-menu.tgz`, SHA256
`0d31cc17e3be99bff4eea941de0ab828aabc5f94a12dddcf5a24ec6d3629a4fd`,
source `9c51152ac5e4a256b3d9c45921e90dceaaa19b5b`. Its owning record is
Design Core's `spec/records/2026-10-16-session-popups.md`. A generic archive
installer first refused an unrelated dependency's `^0.3.2` range. The isolated
validation hook redirects only semver-compatible ranges; incompatible legacy
dependencies retain their normal versions. Root, API, UI and workspace resolve
the same verified0.4.0 artifact. No dependency source or exports are patched.
The ignored scoped installer restores tracked dependency files after install.

The first meaningful mount run additionally found the new test's cleanup mock
lacked the existing `languageServices.unbindDiagnostics` service. The test now
supplies that service locally; the final before run isolates the actual missing
attachment failure. No assertion or production cleanup contract was weakened.

## Public consumer and remaining gates

The built API archive has SHA256
`7f4b61849cb59e31f166144ce2bd59ae5150513803ac9f3cd62e8f18dd5cbd92`,
source snapshot `bf9ac7ea2c06d8b981e4e4ab9c926d062dfa2448`. Notes consumes it
through its ignored archive overlay with normal public imports. That consumer
uses its separately verified Design Core0.5.1 `fa174d7e` preview. Source0.4
compatibility evidence is not substituted for downstream0.5 behavior.

Before the API fix, Notes' real production-plugin Storybook family had eight
failures and one Safe Mode pass. A single-story diagnostic confirmed the correct
view DOM was detached, with the expected tab active in the shell layout. Both
legacy leaf creation and the public host `openLeaf` reproduced it. Consumer
implementation retains the public host navigation path; it adds no attachment
workaround.

- Cold Notes history/diff public-package retry: the original nine scenarios
  passed desktop-light and narrow-light. Desktop-dark retained one unified
  syntax-token contrast failure; a dedicated tenth unified-diff story reproduces
  it independently. A separate consumer operation-reset bug was repaired and
  its strengthened exact regression passes. Final both-theme and native UI
  acceptance remain pending; source lifecycle tests cannot replace them.
- Required source check, ordinary aggregate unit, full build and complete
  Storybook interaction/accessibility lanes pass. Final source specification,
  formatting and public consumer/artifact qualification remain pending.
- Pending: final specification/format validation and source commit.
- Native Notes visible-history and durable-conversation gates remain separate;
  these source/API results cannot complete Desktop M13 or jj-store M33.
- Package publication, installed-app replacement and visual approval remain
  outside this slice. Existing user work and development data are preserved.

## Current producer qualification

The current exact attachment regressions pass again (two passed, 129 skipped).
The complete API passes 1,160 cases in 127 files; public build, publint and
packaged declarations pass. The sequential ordinary pipeline
`pnpm check && pnpm test && pnpm build && pnpm test:storybook && pnpm spec:check`
then exits zero: check 18/18 tasks, tests 18/18, build 10/10 and all 261 browser
interaction/accessibility cases across 59 files. Specification validation,
spec-first, App ownership and metadata-query audits pass. These are fresh
current-base results; cache counts and earlier failures remain visible in the
raw `history-api-current-root-{check,test,build,stories,spec}.log` files.

The refreshed API archive is packed from snapshot
`17e72beba7a4647586f6d59cb16ee8ca6fcf7284`, SHA256
`e8072f731ca2d3db7dfb140a85cfc9fd9c8fef63c1b151d079de89bdc77f0887`.
The isolated desktop `447f8244` consumer installs it through public exports
alongside Design Core 0.5.1. All 17 history cases pass four theme/viewport
configurations (68 checks), including the consumer's restored historical-pin
regression. The final complete current-app catalog now passes all 173 cases in
every desktop/narrow and light/dark configuration: 692 passes across 44 files per
configuration. Consumer types have zero errors/warnings, all 191
renderer/governance cases pass, and renderer/static catalog builds pass.

This closes the source and public-package consumer gates for the attachment
slice. The enclosing Jujutsu change retains the exact regression, ordinary
aggregate source results and earlier failures. Actual visible native history,
durable conversation/restart, registry publication and baseline approval keep
their separate gates; these results do not complete Desktop M13 or jj-store M33.
