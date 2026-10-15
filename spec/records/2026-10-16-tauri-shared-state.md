# Shared application state and Tauri runtime intake

Source qualification passed in the `desktop-migration` Jujutsu workspace.
The enclosing change owns the source; package publication is deferred until the
desktop migration's final release gate. Desktop consumes checksum-verified pnpm
archives, with registry ranges retained in tracked dependency files.

## Contract and scope

- LN-ARCH-140: `.lapis` is the shared vault-local state default across every
  host, including configuration, workspace, hotkeys and plugin persistence.
- LN-ARCH-141: `tauri-desktop` is a native desktop without implicit Deno services.
- LN-DB-055: Tauri needs an explicit database provider and the direct role;
  production cannot silently fall back to browser or memory storage.
- LN-PKG-165: public root/path exports own the state-directory constant and
  application-state path builder.
- LN-PKG-166: the public runtime export is independent of optional database and
  model implementations; existing exports remain compatible.

No `.obsidian` import, merge or rollback is required for unreleased state.
Normal note-save, dirty-buffer and transaction guarantees remain required.
Remaining `.obsidian` references in implementation are privacy exclusions or
Obsidian documentation/compatibility fixtures, rather than active state defaults.

The separate workspace preserved the original checkout's user edits. The
subsequently committed Bases 0.1.4 consumer repair (`bd3cd80c`) became this
change's parent before final qualification; this migration published nothing.

## Source regression evidence

Logs are retained locally under `.local/desktop-migration/`.

| Target                                                                                          | Observed result                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial shared-state/runtime target                                                             | 7 failures: 6 behavior failures and 1 harness failure.                                                                                                                    |
| Harness repair                                                                                  | Intermediate runs exposed missing `matchMedia`, an orphan `$effect`, and lifecycle outside a component. A mounted test-only Svelte component supplies the real lifecycle. |
| `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/tauri-state-defaults.test.ts` | 7 passed after the first repair, then 14 passed after runtime-classification coverage.                                                                                    |
| Initial complete API suite                                                                      | 971 passed in 106 files before the final classification cases.                                                                                                            |
| Runtime leaf target after public export separation                                              | 14 passed, with the real mounted lifecycle. API prepack, publint and packed type checks passed.                                                                           |
| API `tsc --noEmit -p tsconfig.types.json`                                                       | Passed.                                                                                                                                                                   |
| UI prepack and publint                                                                          | Passed.                                                                                                                                                                   |
| Initial `pnpm build`                                                                            | Failed at Deno host-services because the new public path entry lacked Deno import-map coverage.                                                                           |
| Exact host-services build after repair                                                          | Deno checks and 98 tests passed.                                                                                                                                          |
| Repaired `pnpm build`                                                                           | 10/10 tasks successful.                                                                                                                                                   |
| `pnpm check`                                                                                    | 18/18 tasks successful; Svelte reported no errors or warnings.                                                                                                            |
| Final `pnpm check --env-mode=loose`                                                             | 18/18 tasks passed after the runtime export and public declaration repairs, with 0 Svelte errors/warnings.                                                                |
| Initial `pnpm spec:first`                                                                       | 5 missing mapped chapters; updated the owning chapters and reran successfully.                                                                                            |
| `pnpm spec:check`                                                                               | Passed, including 38 specification-tooling tests, before the final runtime export/evidence updates.                                                                       |
| Cold Editor Settings Storybook target                                                           | 1 passed, 17 skipped, including `.lapis/app.json` persistence.                                                                                                            |

The new `runtime` entrypoint follows a real consumer failure: plain Node could
not load the database barrel's bundler-oriented imports, while the shell build
also emitted optional Turso/model WASM assets merely to classify the runtime.
The fix belongs to API's public export boundary. Desktop uses the independent
runtime entrypoint; no loader shim or copied classifier is added to production.

Built public type review then exposed a maintained declaration that still
required `configPath`. A new self-referencing public-export contract failed with
one TS2741 diagnostic under `pnpm --filter @lapis-notes/api check:pack-types`.
The owning `context.svelte.d.ts` now permits an omitted input and preserves a
resolved string in `AppPublicProperties`, matching the implementation. Final
source-owned prepack and the exact `check:pack-types` rerun now pass, including
construction without `configPath`, the resolved string, the literal `.lapis`
default, and the public Tauri runtime entrypoint.

## Wider qualification and failures

| Command/target                                                  | Observed result and resolution                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial root `pnpm test`                                        | Desktop had 295 passed, 1 failed, 1 skipped: the lost-read-response retry timed out at its unchanged 5s limit under concurrent load. Turbo then cancelled API/Web/Workspace workers.                                                                                                           |
| Exact unchanged desktop read-retry test                         | 1 passed, 19 skipped in about 1.5s. No timeout or assertion was weakened.                                                                                                                                                                                                                      |
| `TURBO_CONCURRENCY=2 pnpm test`                                 | API: 977 passed, 1 failed in 106 files. The unchanged TypeScript declaration-emission test exceeded 5s under competing transforms. Turbo cancelled dependent builds.                                                                                                                           |
| Exact unchanged `src/lib/build-tools/vite-declarations.test.ts` | 1 passed; declaration emission took 2.98s. No timeout or assertion changed.                                                                                                                                                                                                                    |
| First serial-package unit attempt                               | API: 978 passed in 106 files; UI: 15 passed. Interrupted before completing the remaining packages while consolidating competing build lanes.                                                                                                                                                   |
| Final serial build/unit verification                            | Build: 10/10 tasks passed. Unit lane: 18/18 tasks passed; 1,555 tests passed and 1 existing Desktop test skipped across all 10 packages. Use `--env-mode=loose` so Turbo forwards `VITEST_MAX_WORKERS`; its default strict environment filters that variable. Package concurrency remains one. |
| Initial full Storybook                                          | First shard: 90 passed. Second shard: 63 passed, 2 failed; subsequent shards did not run.                                                                                                                                                                                                      |
| Exact cold Bases/Backlinks reproduction                         | 2 failed, 8 skipped. Bases exposed stale 0.1.3 picker accessibility; Backlinks measured 399.7897px before a 400px assertion.                                                                                                                                                                   |
| Bases resolution                                                | Parent now consumes the existing published 0.1.4 source repair. No consumer accessibility override is introduced.                                                                                                                                                                              |
| Backlinks resolution                                            | Retain the 400px assertion and await the existing opening animation before final geometry; also assert the untransformed layout width is at least 400px.                                                                                                                                       |
| Exact repaired cold Bases/Backlinks target                      | 2 passed, 8 skipped, with axe enabled; affected-family and full-catalog runs follow.                                                                                                                                                                                                           |
| Complete affected Bases/Backlinks families                      | 10 passed in 2 files, with axe enabled.                                                                                                                                                                                                                                                        |
| First web persistence target                                    | Did not reach the browser: its prerequisite host-services build had 97 passed and 1 timed-out journal-receipt test.                                                                                                                                                                            |
| Repeated web wrapper                                            | Its redundant build repeated the same journal timeout during Docker I/O (97 passed, 1 failed). Full controlled build and unit lanes already pass; browser acceptance runs their built outputs directly.                                                                                        |
| Exact unchanged journal-receipt target                          | First rerun: 1 timed out, 41 skipped. After competing builds stopped: 1 passed, 41 skipped, in 1.93s of test execution. The 5s timeout, 24 mutations and receipt assertions remain unchanged.                                                                                                  |
| Initial server browser lane                                     | Docker's daemon disconnected during dependency installation (EOF), then its socket disappeared. No browser tests ran. Retry the normal daemon and isolated test image without resetting Docker data.                                                                                           |
| Cold PWA persistence target                                     | 1 passed in 18.3s against the full source build, with a fresh preview server (`CI=1`). The selected OPFS session/layout survives reload without flashing the chooser.                                                                                                                          |
| First frozen dependency refresh                                 | Rejected the ignored local pnpm hook's checksum mismatch. Registry refresh uses `--ignore-pnpmfile`, preserving the tracked registry lockfile.                                                                                                                                                 |

The formatter initially lacked a Svelte parser/plugin in this checkout. The
existing desktop-installed Prettier Svelte plugin formatted the nine changed
Svelte files without introducing a source alias or dependency patch.
Deno import-map validation regenerated its lockfile; the automatic root
`package.json` workspaces addition was removed as unrelated configuration.
Four competing build/verification attempts were intentionally stopped to avoid
rewriting shared public outputs concurrently. Their partial results are retained
in the logs and do not qualify the complete lanes.

## Additional host and catalog qualification

- The complete web browser lane passed 12/12, including installed-plugin state,
  `.lapis/workspace.json`, reload, module workers, owner takeover and the standard
  server case.
- Docker reports five CPUs and 3,052,138,496 bytes of memory while the frontend
  command permits an 8 GiB heap. The normal image retry was stopped after more
  than ten minutes in transformation; Docker settings/data were not reset.
- Host Node 26/pnpm 10.34.5 built `dist-server`. All 445 portable browser files
  have SHA256 records in `.local/desktop-migration/server-frontend-files.json`.
  Linux Deno dependencies built normally. Production runtime instructions were
  reused with the frontend COPY input. Image
  `d110e2bc790d42344454702cbb05ff7b158e60fafba659dfb18d412994fc0d0c`
  passed the complete server browser case (editing, sharing and restart), 1/1 in
  21.4s. This qualifies the runtime and application, not the memory-constrained
  all-in-container frontend build.
- The next full Storybook attempt passed 90 and 65 stories in shards 1/2. Shard
  3 had 38 passed and 2 failed; shard 4 did not run. Mobile used an obsolete tab
  label; Outgoing Links measured the same 399.7897px opening transform.
- The exact Mobile/Outgoing Links target had 1 failed, 1 passed and 11 skipped
  before repair, then 2 passed and 11 skipped. Both layout/transformed width
  minimums remain 400px. The owning selector repair from `f15b61b4` is reused on
  the existing Design Core 0.4.0 target; default-checkout refresh work is preserved.

- The other three mobile families reproduced the same obsolete label: 3 failed,
  10 skipped before repair; 3 passed, 10 skipped after the owning selector update.
  Complete Workspace, Outgoing Links, AI, Bases and History families then passed
  all 26 stories across five files, including keyboard and axe acceptance.
- The macOS ARM64 legacy application was rebuilt locally. Both the core and full
  packaged smoke commands passed with isolated vault/profile data. Developer ID
  signing/notarization were unconfigured; the existing factory's local ad-hoc
  signature satisfies its macOS launch check. No release was published.

- A complete catalog attempt then passed 90, 65 and 40 stories in shards 1-3.
  The final shard had 51 passed and 3 failed in Plugin Management. The exact
  three-story target reproduced 3 failed/22 skipped: media/uninstall visibility
  was asserted during entry, and the aborted media play left pointer locking for
  the next story. Waiting for both media openings and uninstall visibility keeps
  the original content, pointer and focus assertions. The target then passed
  3/3 (22 skipped), and the complete Plugin Management family passed 25/25.

## Consumer qualification

Desktop's `E-HOST-001` owns archive checksums, source snapshots, installer
recovery, actual WebView acceptance and ordinary application-bundle evidence.
Initial five-package pack/install passed after correcting an unsupported pnpm
pack flag and explicitly declaring the consumer's complete framework graph.
The final archive set is repacked from the verified source revision.

Source build, unit/static checks, public type contracts, web/server acceptance,
and both legacy packaged smoke modes passed. The final complete four-shard
catalog passed 249/249 across 54 files (90 + 65 + 40 + 54), with axe enabled.
All five source requirements are Implemented. Desktop owns the final archive
binding to this verified source commit and its native requalification.
