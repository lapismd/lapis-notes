# Rust migration handoff

**Execution is paused at the user's request.** Resume only when the user directs
the next agent to continue. No migration-owned build, provider turn or acceptance
window remains running. Do not restart the app or Storybook during this pause.

This handoff, [MIGRATION.md](MIGRATION.md), the saved
[Rust core plan](RUST_CORE_MIGRATION_PLAN.md), the
[cutover priority plan](RUST_HOSTED_CUTOVER_PLAN.md) and the complete
[workspace register](MIGRATION_WORKSPACES.md) are the starting points. The
machine inventory is [spec/migration-workspaces.json](spec/migration-workspaces.json).
Repository canonical specifications still govern behavior.

## Current merge state

| Repository / main checkout                    | Landed                                                                                                                                                                          | Uncommitted / still pending                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/Users/stevejuma/code/lapismd/lapis-notes`   | `cd997c2cf92ecfa1ce16de1f49ec085d58d026d5`: Rust defaults, Node/Unix-companion retirement, Linux image/CI source and operator guidance. `68604b41` records subsequent activity. | Optional actual-image model tester draft, described below. This handoff/status commit contains documentation only.                         |
| `/Users/stevejuma/code/lapismd/lapis-desktop` | Provider source `85d9b5e10fcb1b70acfc1ad16f99259db6a20a5a` is now in default ancestry, above `40b50d3e`.                                                                        | Refreshed Notes native pin/public cohort and E-CORE-046 are uncommitted; native/spec-first gates remain.                                   |
| `/Users/stevejuma/code/lapismd/lapis-plugins` | Main remains `773bed9e`; no cutover test-repair intake has landed.                                                                                                              | Qualified test repair `407ada2e51ec4fa255e14f8057888671b16a4a81` and portable-lock draft `16409f80` remain in `r7-release-tests-20261027`. |

Notes test/runtime product source is identical between committed `cd997c2c` and
its tested empty child `8404bdd25c7182c728339b164866dcde481f1e55`. Subsequent
Notes changes are status/docs and the unverified tester draft, not a new server
implementation. Keep qualification identities separate from the latest metadata
commit. Use `jj --no-pager st` before touching any repository.

## Verified Notes cutover

- Rust is the ordinary hosted renderer/build/start runtime; metadata, History
  and Tasks are selected together. `dev:server` uses the actual native image.
- The Node application server, private Unix companion, obsolete adapter and old
  Node-only fixtures are removed. Frozen Deno, generic host services, public
  compatibility labels and JJ Store's unrelated `companion` feature remain.
- All six original hosted regressions pass. Corrected preceding persistence/
  restart pair passes **2/0**, complete hosted family **11/0**, focused Web **13/0**.
- Native image `sha256:884c3028708c3e005430d667953abefbe1196170bf65ed2a35bb4a344acbdfbd`
  passes **16 actual runtime/browser/cold-storage checks**: UID/GID1993, absent
  Node/Deno, read-only application, native origin/isolation, real editing, exact
  persisted bytes, guarded sign-out and clean process restart/reopen.
- All five real-model source cases pass with exact ORT1.30/Linux CPU references,
  without downloads. Do not double-count their child-process summaries; two
  process-helper ignores remain intentional and their parent tests exercise them.
- Full landed-main lanes pass: check **18 tasks**, package tests **2,426 cases**
  (**one retained frozen-Deno skip**), build **10 tasks**, **705 native cases** (seven retained ignores),
  specification/governance **80**, validation tooling **96**, release tooling
  **101**, cold catalog **265**, static specification/Docs **6**.
- The two final worker receipts are `passed`; catalogue has zero tracked
  mutations. Native tests temporarily normalized `deno.lock`: **202 old npm
  entries removed, zero added identities or changed integrity values**. This
  diagnostic is retained; the normalization was not applied to main.

Evidence: [focused cutover record](spec/records/2026-10-27-rust-hosted-default-cutover.md).
Final worker directories, all default-owned:

- `.local/validation/runs/lapis-r7-runtime-final-main-0553241c-c29d-4269-817f-3da74f772ac8`
- `.local/validation/runs/lapis-r7-runtime-final-catalog-d681e338-0730-4d14-88a5-24704d9f1643`
- `.local/server-container/lapis-rust-image-e897fb8a-7a7b-4339-9cf1-a46c41a835ae`
- `.local/server-container/controller-4f874027-04af-418a-970e-4c439d5619d8`

Retain each `result.json`, `source.json`, request/input identities, command log,
source-mutation/lock audit, image receipt and browser results. Earlier failed
runs remain evidence; do not relabel their aggregates as passing.

## Notes draft: optional actual-image model test

These paths are intentionally **uncommitted and not runtime-qualified**:

- `scripts/server-container/browser.mjs`
- `scripts/server-container/test.mjs`
- `scripts/server-container/model.mjs`
- `scripts/server-container/model-assets.mjs`
- `scripts/server-container/seed-model.mjs`
- `spec/src/architecture/rust-hosted-delivery.md`

The draft enables ONNX only with `LAPIS_SERVER_TEST_ONNX=1` and an absolute
`LAPIS_SERVER_TEST_ONNX_RUNTIME`. It validates the five cached model assets and
Linux ORT digest, seeds the owned `/data/models` volume as UID1993, creates a
separate model vault, and checks vectors/rankings/revisions plus warm/cold offline
recovery. No actual image-model run has happened. The committed basic16 proof
precedes this shared-harness edit, so rerun basic16 and model phases before
committing the draft. Formatting/syntax alone is not acceptance.

Known CI issue to repair on resume: `.github/workflows/lapis-ci.yml` globally
sets `LAPIS_NOTES_VALIDATION_RUNTIME=native`, but the image acceptance supervisor
correctly requires `docker`. The `pnpm test:server:container` step needs an
explicit Docker environment override and an exact workflow regression. Do not
weaken its Docker-only guard or use a host-product fallback.

Existing model inputs, no download needed:

- `.local/search-models/Xenova/all-MiniLM-L6-v2` — five qualified files.
- `node_modules/.pnpm/onnxruntime-node@1.30.0/node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime.so.1`
- Linux runtime SHA256 `ffb75a925ba05e47b235bb66e3e3911714a80b328a9c9425539feb204aa32a23`.
- Oracle JSONs: `packages/api/src/lib/__tests__/fixtures/search-semantic-model.json`
  and `crates/lapis-app-core/tests/fixtures/search-model/linux-x64-ort-1.30.0-amd-7800x3d.json.txt`.

The private `.local/r7-cutover/image-acceptance.py` controller predates this
optional draft: extend its transferred file/input set before reuse. Never claim
its older basic run as a model proof.

## Mac provider gate: prepared, never executed

Default-owned setup:

`/Users/stevejuma/code/lapismd/lapis-notes/.local/r7-provider-final/macos-20261027/`

Read `pause-handoff.json`, `source.json`, `native-build.json`, `native-build.log`
and `renderer.json`. Frozen Notes source is `8404` plus six pinned native sources
and sixteen verified public inputs. A fresh Mac server build passed in **45.86s**
with Rust/Cargo1.99 and two jobs. Binary:

`source/lapis-notes/.local/rust-core-target/debug/lapis-server`

SHA256 `b84097fd7e58e0b5dd24495dea0b7724b11295e00cb018e505f9d7be7d1e352c`
(212,908,080 bytes). The 456-file retained static renderer was extracted from the
qualified image above. It is not an older provider-host product build.

**All three final-cohort provider cases are still pending.** The compile session
89249 is finished; no owned Cargo/rustc process or provider turn remains.
On resume, verify pinned Playwright1.61.1 tool wiring in the frozen project, then
run once from its Web package context:

```sh
LAPIS_SERVER_PROVIDER_SCREEN_TEST=1 \
LAPIS_SERVER_TEST_AGENTS_CONFIG=/Users/stevejuma/code/lapismd/lapis-notes/.local/r7-provider-final/macos-20261027/provider-agents.json \
LAPIS_TEST_RUST_STATIC_ROOT=/Users/stevejuma/code/lapismd/lapis-notes/.local/r7-provider-final/macos-20261027/source/lapis-notes/packages/web/dist-rust-server \
pnpm --filter @lapis-notes/web exec playwright test \
  -c playwright.rust-provider.config.ts
```

Run from the frozen source root shown above, with a verified pinned test tool
available to its Web package. The selected files are `rust-server-provider.spec.ts`,
`rust-server-provider-queue.spec.ts`, `rust-server-provider-resume.spec.ts`.
They cover retained R2, Stop-Unknown/no replay, and explicitly seeded cold Resume.
A failed actual provider attempt must be recorded before any deliberate retry;
never replay an uncertain accepted turn automatically.

The private mode0600 `provider-agents.json` operator-config copy is outside the
source export. It selects the existing Mac helper (`9181b386…`) and
Codex ACP1.13.1/Codex0.156.1 with declared read-only mode. Existing authentication
stays private. Do not print config/environment/credential contents or copy the
whole user Codex configuration. Linux provider qualification would additionally
need a pinned Linux helper/adapter and isolated credential provisioning; no such
run or transfer has happened.

## Desktop: exact paused intake

Read `/Users/stevejuma/code/lapismd/lapis-desktop/AGENTS.md`,
`spec/src/current/index.md`, current AI queue contract and milestones first.
Default change is `snqzxwuy`; its last reported snapshot is `6cf6ec5f`, parent
`85d9b5e1`. The source commit is now an ancestor, not merely copied files.
Rebasing only the intake working copy preserved the exact candidate tree.

Current candidate:

- Notes native pin `cd997c2cf92ecfa1ce16de1f49ec085d58d026d5`.
- Fresh API0.1.4 SHA256 `f368081f2451057a56fc7e9ff163c31a1979b76dedf258c93c933179e958255a`.
- Fresh AppProfile0.0.0 SHA256 `bf1324f71af2cb146ae9be0ac047dd69187c46d047f510ad5ad8cb45d9ad161f`.
- Private **31-archive /117-route** overlay installed and verified; tracked
  package manifest and npm lock are unchanged.
- Cargo lock adds only Core's dependency on already-pinned `serde_yaml`.

Default-owned receipts and retained payloads are in
`.local/qualification/r7-cohort/`: `candidate-archives.json`, `retention.json`,
`public-inputs-receipt.json`, `retained-archives.json` and prerequisite records.
The Notes producer pair/provenance also exists at
`.local/qualification/r7-desktop-pair/` in Notes.

Completed: exact quiet consumer **16/0 before and after**, TypeScript **0 errors /
0 warnings**, source audit, progress **58 tasks/323 records**, canonical validation
**368 chapters/116 requirements**. Storybook7480 was stopped before installation
and remains stopped. No installed app or user profile was replaced.

**Do not commit this input/native slice yet.** Latest `spec:first` reports two
mapped chapter omissions relative to newly integrated85d9:
`spec/src/current/desktop.md` and `spec/src/current/governance.md`. Repair those
mappings, then run the coherent frozen eight-source/public/native acceptance.
`spec/src/history/E-CORE-046.md` remains a draft; E-CORE-045 is immutable source
proof and is not the final tuple's provider proof.

Remaining gates include strict normal/e2e Rust checks, native tests, affected
renderer/AI/catalog, complete ordinary/e2e bundles and asset equality; focused
native admission/queue ownership; actual two-provider cases; full hidden API
suite. Use `scripts/desktop-api-tests.mjs` and E-CORE-046 for exact targets.
Do not reuse the old provider workspace's hard-coded build helper or verifier.
Preserve the previously accepted immutable E-AI-109 formatting exception.

## Plugins and workspace retirement

Plugins default is clean at `773bed9e`. Source workspace:

`/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-r7-release-tests-20261027`

`407ada2e` qualifies the private test repair; `16409f80` is the uncommitted
portable-lock/BitsUI prerequisite. Prior repair passes exact/affected tooling;
the normal registry matrix still lacks the released API `EmbedRegistry.renderMarkdownEmbed`
contract. Do not add a shim, source alias, private path in a publishable lock or
publish a package without release authorization. Audit against newer owning main
before merging; do not overwrite subsequent canvas/release work.

No temporary checkout has been forgotten or deleted. The complete register
covers every discovered JJ workspace, including unrelated repositories. Its
history classifications are not functional-completion claims. In particular,
empty forks can contain moved/superseded history and nonempty old workspaces can
hold unrelated edits. Never blanket-merge them.

Preserve required ignored archives and native/provider receipts before cleanup.
Desktop's former31 public payloads (including16 temporary-workspace paths) were
copied to default-owned content storage. Historical E-CORE-045 native receipts
still require preservation before removing its source workspace. Notes/Plugins
and other forks need their own ignored-artifact audit.

Mac free space was restored to about40GiB by checksum-identical inactive cache
clones; after the build the last check was about39.47GiB. Standing approval covers
audited inactive caches only. Recheck free space and compiler/open-file activity
before builds; retain the30GiB guard and preserve binaries/profiles/evidence.
Never dump full process arguments/environment: an earlier unrelated credential
exposure was reported to the user; no secret belongs in tracked handoff files.

## Delivery order and standing decisions

1. Inspect all three main statuses and this register; preserve uncommitted drafts.
2. Repair the two Desktop spec-first omissions and image-CI environment issue.
3. Complete exact optional-image tests and current-cohort native/provider gates;
   record failures without automatic provider/write replay.
4. Run only still-required final host/local-offline/package acceptance. Notes
   full source/catalog lanes already passed on8404; avoid repeating unchanged
   broad suites without a new impact/failure reason.
5. Commit verified slices unsigned, update both trackers/UTC stamps, integrate
   migration-owned forks and preserve ignored evidence, then retire safe checkouts.
6. Mark only qualified gates complete; publication/deployment/installed replacement
   remain separate. Do not restart services as part of this paused handoff.

R7 cutover remains primary. R5 memory and R6 durable operations are Deferred after
cutover. Remaining R4 participant/profile/group queues, rich context/commands/
handoff, approvals/tools/Changes/undo are explicit backlog, not completed by the
runtime switch. Deno is frozen. App signing/M11 is deferred. Prefer parallel
independent implementation lanes; serialize heavy Mac builds and respect Docker
resource/cache ownership. Use `jj --config signing.behavior=drop commit ...`.
