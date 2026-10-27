# Rust migration handoff

**Phase 1 consolidation completed 2026-10-27 15:46:14 UTC.** All changes are
committed in the four migration repositories' main workspaces, and all 121
migration-owned temporary workspaces were audited, preserved, forgotten and
deleted. Phase 2 (full verification and test repair on the integrated mains)
started 2026-10-27 16:45:00 UTC; the Notes gates 1-4 completed by 18:40 UTC
(CI repair, model-tester qualification, Mac provider gate 3/3 in one run, and
the full lane set on the restored qualified archive cohort); gate 5 (the two
pinned Notes lineages) awaits the user's decision. Do not restart the app or
Storybook except through a Phase 2 lane that requires it.

This handoff, [MIGRATION.md](MIGRATION.md), the saved
[Rust core plan](RUST_CORE_MIGRATION_PLAN.md), the
[cutover priority plan](RUST_HOSTED_CUTOVER_PLAN.md) and the
[workspace register](MIGRATION_WORKSPACES.md) are the starting points. The
machine inventory is [spec/migration-workspaces.json](spec/migration-workspaces.json).
Repository canonical specifications still govern behavior. Per-repo retirement
manifests live in each main's ignored `.local/workspace-retirement/`.

## Current merge state

| Repository / main checkout                    | Committed baseline                                                                                                                                                    | Working copy |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `/Users/stevejuma/code/lapismd/lapis-notes`   | `2c59351352c3`: Phase 2 gate-completion record on top of model-tester qualification `c6f7290e6081` and CI repair `7163519aaafe`, over the Phase 1 tracker `2b3975c3`. | Clean        |
| `/Users/stevejuma/code/lapismd/lapis-desktop` | `b009d1441727`: R7 intake (Notes native pin `cd997c2c`, 31-archive/117-route cohort, E-CORE-046 DRAFT) above spec-first repair `70730562`.                            | Clean        |
| `/Users/stevejuma/code/lapismd/lapis-plugins` | `a68b8880e67c`: merged native-search stack above portable-lock draft `467f2231` and test repair `338282bf`, on `773bed9e`.                                            | Clean        |
| `/Users/stevejuma/code/lapismd/jj-store`      | `52b061c52111`: integrated history-read-admission slice above pending-docs commit `26a72176`, on `4e74e423`.                                                          | Clean        |

All commits are unsigned (`jj --config signing.behavior=drop`). Nothing was
abandoned anywhere; every retired revision remains in its jj store.

## Phase 1 dispositions and pinned lineages

Unlanded unique work is bookmarked (GC-protected) and awaits Phase 2 decisions:

- **Notes** `preserved-hosted-properties-20261027` (`kpymntwz 845842b8`):
  never-executed hosted Properties e2e + LN-WEB-074 spec text; the hosted
  Properties recovery journey is still unclaimed in `MIGRATION.md`.
- **Notes** `preserved-shared-conflict-review-20261026` (`pslnvswp 36cc3c4e`
  chain): frozen Workspace 0.2.1 file-conflicts candidate `ea7a2d28` +
  qualification record `974328f6`; integration needs full Storybook/spec lanes.
- **Desktop** `preserved-e-qualification-003` (`3628db65`): E-QUALIFICATION-003
  (the approved immutable E-AI-109 formatting-exception record referenced by
  current evidence) is not in main; decide landing with the evidence lanes.
- **Desktop** `codex/release-coordination` (`a8572603`): E-RELEASE-017 +
  RELEASE.md not in main; main consumes `^0.6.0`.
- **Desktop** also pinned: `preserved-docker-catalog-candidate` (`2e810560`),
  `preserved-provider-chat-qualification` (`11e22c7f`, divergent),
  `preserved-bases-native-adoption` (`34909cff`),
  `preserved-catalog-validation-1/2` (`feb1e8c3`, `1b002dbf`).
- **Plugins** `preserved-npm-release-batch` (`67ce4ae5`): the thirteen-plugin
  release-batch preparation exists only here. Unauthorized; not merged, not
  published. Publication remains a separate gate.
- **Plugins** store-only R7 native-services lane (~22 substantive commits; IDs
  in the manifest `storeOnlyHistoryWarning`, e.g. `bd305e58`, `40f8febb`,
  `814f6d2d`, `ee3580d3`+`857444bc`): audit in Phase 2 whether the Rust
  cutover superseded it; do not assume it landed.
- **jj-store** `preserved-thread-files-plan` (`b43d5b89`): saved M35 plan,
  implementation never started; full export under
  `.local/workspace-retirement/thread-files-plan/`. The `main` bookmark
  (`07229718`) is stale behind the active trunk — re-point it.

Merged into mains during Phase 1: Plugins test repair `407ada2e`→`338282bf`
(exact targeted 2/2+2/2 after 0/2+0/2), portable-lock draft
`16409f80`→`467f2231` (marked UNVERIFIED, blocked on released API
`EmbedRegistry.renderMarkdownEmbed`), native-search stack
`797c14ef/5e0dffc3/5d0397f4`→`0de75f96/d38a1cdf/a68b8880` (union conflict
resolution; cargo +1.99 check, markdown_yaml 2/2, search_canvas 1/1 pass;
TS/spec lanes deferred); jj-store history-read-admission→`52b061c5` (docs
lanes pass; Rust tree identical to the Docker-qualified tree).

## Incident record: `.workspaces` destruction (unrecoverable)

During the retirement sweep a plugins-side cleanup ran a bare
`rm -rf .workspaces` while the shared directory still held other repositories'
checkouts. Tracked content was safe (snapshotted in jj stores; zero abandons),
but ignored evidence was destroyed before preservation:

- Desktop: E-CORE-045 native receipt payloads
  (`desktop-native-queue-provider-20261027/.local`, 17G) and the private
  `native-build.mjs`/`mac-rust.mjs`/`bootstrap-native.mjs` helpers — the
  E-CORE-045 command lineage is unreproducible; future provider/native proofs
  must generate fresh receipts. `E-CORE-045.md` committed evidence and main
  `.local/qualification/r7-cohort/` (4 receipts + 33 archives covering all
  E-CORE-046 identities) are intact.
- Notes: ~70GB of `.local` receipt bulk across the 57 `.workspaces`-hosted
  workspaces (sizes itemized in the manifest). Final worker receipts,
  `.local/server-container/`, `.local/r7-provider-final/macos-20261027/`,
  `.local/r7-cutover/` and `.local/search-models/` in main are intact.
- Plugins: native-search-adapter `.local` (~906MB). 6,808 files (~1.0GB) were
  preserved before deletion, incl. the desktop-migration `.release` payload
  tree and all 13 static-ci `.lapis-plugin` bundles.

Lesson (now register policy): retirement sweeps never delete a shared parent
directory while sibling agents run; preservation precedes every deletion.

## Verified Notes cutover (evidence retained from the landed qualification)

- Rust is the ordinary hosted renderer/build/start runtime; metadata, History
  and Tasks are selected together. `dev:server` uses the actual native image.
- All six original hosted regressions pass; corrected persistence/restart pair
  2/0; complete hosted family 11/0; focused Web 13/0.
- Native image `sha256:884c3028708c…` passes 16 actual runtime/browser/
  cold-storage checks. Five real-model source cases pass offline with exact
  ORT1.30/Linux CPU references (two process-helper ignores are intentional).
- Full landed-main lanes passed at frozen `8404bdd2` (identical product source
  to `cd997c2c`): check 18 tasks, package tests 2,426 (one retained
  frozen-Deno skip), build 10 tasks, 705 native (seven retained ignores),
  specification/governance 80, validation tooling 96, release tooling 101,
  cold catalog 265, static specification/Docs 6.
- Evidence: [focused cutover record](spec/records/2026-10-27-rust-hosted-default-cutover.md);
  worker dirs `.local/validation/runs/lapis-r7-runtime-final-main-0553241c-*`,
  `…final-catalog-d681e338-*`, `.local/server-container/lapis-rust-image-e897fb8a-*`,
  `…/controller-4f874027-*`. Earlier failed runs remain evidence; do not
  relabel their aggregates as passing.

## Phase 2 gates

**Notes**

1. DONE (2026-10-27 16:45 UTC): `.github/workflows/lapis-ci.yml` repaired — the
   global `LAPIS_NOTES_VALIDATION_RUNTIME=native` is now overridden to `docker`
   for the `pnpm test:server:container` step, with an exact workflow regression
   in `scripts/check-release-workflow.spec.mjs` (22/22 after 21/1). The
   Docker-only guard is unchanged and has no host fallback. Mapped chapters:
   spec-governance/validation-and-ci, architecture/build-and-validation,
   packages/releases-and-exports.
2. DONE (2026-10-27 18:05 UTC): model-tester draft `c64391fd` qualified.
   Fresh basic16 (16/16) and model (23/23) receipts against actual image
   `sha256:884c3028…` with tool image `9fa6f3fb…`; ONNX ran only via
   `LAPIS_SERVER_TEST_ONNX=1` + absolute runtime path (verified cached assets,
   no downloads). One draft defect repaired in
   `scripts/server-container/model-assets.mjs` (seed helper input transfer);
   the failed first attempt is retained as evidence. Record:
   `spec/records/2026-10-27-image-model-acceptance.md`; LN-CORE-070 is now
   Implemented. The qualified 16-archive cohort was restored byte-exact from
   the preserved final-main worker inputs to
   `.local/validation/phase2-cohort.json` (the local validation config now
   points at it; the stale main-icons cohort's history build lacked
   `BackupService.setEnabled` and broke web typecheck).
3. DONE (2026-10-27 18:22 UTC): Mac provider gate passed 3/3 in ONE run from
   the frozen source root (18:20:24→18:22:02 UTC, exit 0; queue/resume/
   provider specs; actual provider turns; no retry, no replay). Frozen
   identity: binary sha `b84097fd…`, renderer 456/456 verified against image
   `884c3028`, specs byte-identical to `8404bdd2`, Playwright 1.61.1 pinned
   wiring, qualified helper hash unchanged; the frozen project's dependencies
   were installed with the restored phase2 cohort (identities equal to
   `source.json`) and its tracked manifest/lock bytes were restored after
   install. Receipts: `provider-gate-phase2.json` +
   `phase2-provider-run-182024.log` + frozen-root `.local/rust-provider-*`;
   `provider-agents.json` stayed mode-0600 and was never printed.
4. DONE (2026-10-27 18:40 UTC): full main lanes on the integrated baseline
   (draft commit included) passed via the documented Docker runner on the
   restored qualified cohort: check 16/16, test 16/16 (Rust 705/0/7 retained
   ignores + 2,130 package/0 fail), build 9/9, spec:check (80),
   validation:check 96/96, release:test 101/101, cold catalog 265/265,
   static specification 192 chapters + Docs 6/6 — all with desktop-deno
   excluded-deprecated per the standing decision below. No worker reported
   source mutations; no deno.lock normalization was applied to main.
5. Decide the two pinned Notes lineages (hosted-properties e2e,
   shared-conflict-review chain) with their required lanes.

**Desktop**

1. Run the deferred native/provider/bundle gates for the committed intake
   `b009d144` (strict normal/e2e Rust checks, native tests, affected
   renderer/AI/catalog, complete ordinary/e2e bundles + asset equality,
   focused native admission/queue ownership, actual two-provider cases, full
   hidden API suite via `scripts/desktop-api-tests.mjs`). Generate FRESH
   receipts — the E-CORE-045 payload lineage is lost; do not reuse the old
   provider workspace's hard-coded build helper or verifier.
2. Finalize E-CORE-046 (currently DRAFT) once its provider proof exists;
   preserve the accepted immutable E-AI-109 formatting exception; decide
   landing of E-QUALIFICATION-003 (`3628db65`) and E-RELEASE-017 (`a8572603`).
3. Spec-first note: of the two Phase 1 commits, only `70730562` is
   independently spec-first-clean; the combined range passes. Keep chapter
   budgets in mind (desktop.md is at 32,758/32,768 bytes; governance.md at
   400/400 lines).

**Plugins**

1. Verify the merged native-search stack on main: TypeScript lanes
   (`native-search-manager.test.ts`, packages/search), spec lanes, full
   validation suite, release tooling.
2. Fix the two valid portable-lock/BitsUI guards in their owning upstream
   repos (no shims, aliases, private lock paths, or publication without
   release authorization); the `467f2231` draft stays blocked until the
   released API `EmbedRegistry.renderMarkdownEmbed` contract exists.
3. Repair the previously accepted 13 preview-lifecycle failures (user
   directive: previously noted failures are in scope).
4. Audit the store-only R7 native-services lane against the cutover
   architecture; integrate or record explicit supersession. Decide the
   release-batch (`67ce4ae5`) disposition with the user.

**jj-store**

1. Run the full lanes for the integrated slice `52b061c5`: `pnpm build`,
   `pnpm spec:check`, `pnpm check`, `pnpm test` (Docker runtime where the repo
   requires it), then validate any consumers per the workspace refresh map.
2. Decide the thread-files-plan (M35) landing; re-point the stale `main`
   bookmark; disposition `powynzov c976850d`.

## Standing decisions

- Notes `packages/desktop-deno` is DEPRECATED and marked for deletion (user
  decision 2026-10-27). It is excluded from Phase 2 verification lanes: do not
  run, repair, or count its checks/tests/builds (turbo lanes pass
  `--filter=!@lapis-notes/desktop-deno`); a root lane failing solely because of
  it is recorded as excluded-deprecated. The exclusion does NOT extend to
  `server-deno` or `deno-host-services`, which keep their documented retained
  lanes and skips.
- R7 cutover remains primary; R5 memory and R6 durable operations are Deferred
  after cutover. Remaining R4 participant/profile/group queues, rich
  context/commands/handoff, approvals/tools/Changes/undo are explicit backlog.
  Deno is frozen. App signing/M11 is deferred. Publication, deployment and
  installed-app replacement remain separate gates.
- Prefer parallel independent lanes; serialize heavy Mac builds behind the
  30GiB free-space guard and respect Docker resource/cache ownership. Never
  dump full process arguments/environment; no secret belongs in tracked files.
- Commit verified slices unsigned with `jj --config signing.behavior=drop
commit …`; refresh the trackers (this file, `MIGRATION.md`,
  `MIGRATION_WORKSPACES.md`, `spec/migration-workspaces.json`,
  `spec/migration-progress.json` + `pnpm progress:generate`) with UTC stamps.
- Visual review remains a separate non-blocking lane; keep changed stories
  `visual-pending` and do not update baselines without approval.
