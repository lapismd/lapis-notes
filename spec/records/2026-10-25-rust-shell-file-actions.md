# Retained shell file actions — R1.3.11

Status: Hosted source qualified, 2026-10-25 06:05:58 UTC. R1.3.11 remains Working.
Notes parent `96b01a4b`; change `wwpxmlsu`.
LN-CORE-004/006/007 and the existing Web session lifecycle govern this slice.
Hosted source acceptance and Desktop native adoption remain separate gates.

## Exact reproduction

The new Rust browser Explorer family uses the real retained shell, native files
and authenticated service. No injected App, private mutation API or replacement
Explorer is used. The proper isolated command is run from `packages/web`:

`node node_modules/@playwright/test/cli.js test -c playwright.rust-server.config.ts -g 'retained Explorer'`

Before: one pass, one failure. Creation, Unicode rename and local trash preserve
bytes. The rename/move journey preserves collision destinations and saves the
initial draft, but the open editor retains `Note.md` after native rename/move.
A subsequent edit never reaches `Moved/Renamed.md`; the unchanged 30s assertion
fails. The proper serial reproduction repeats the same one-pass/one-fail result.

An initial invocation from the repository root resolves the wrong fixture root
and fails both setup attempts with ENOENT. It is an operator-command failure,
not product evidence. The corrected command is retained above.

After the lifecycle fix, the original moved-note write assertion passes. The
new cold-layout check initially reads before the normal debounced layout writer
creates its file. Wait for file availability inside the existing poll, retaining
the exact moved-path and cold-restored-content expectations and deadlines.

The PWA runner's listing also includes seven Rust cases (19 total) although its
build cannot run that host profile. Exclude both hosted fixture families from
the PWA config; retain the dedicated Node and complete seven-case Rust lanes.
This corrects profile selection without waiving either hosted suite.

## Owning fix and qualification

WebWorkspaceSession did not start its existing App-owned VaultChangeService.
Its internal rename observer therefore never rebounded open file views, even
though the native filesystem and Explorer tree were correct. Start the shared
service before publishing ready; stop/drain it before workspace teardown and
failed-startup retry. Use the same lifecycle for Rust, Node and local/PWA hosts.
No API fork, native-only view, alternate writer or new scheduler is introduced.

The original native file-operation contract and ordinary Explorer components
remain unchanged. Cold focused acceptance passes both cases in 11.2s after rebuilding the
renderer. All required hosted/source gates below now pass. Desktop's pre-existing Markdown image gate
still needs explicit disposition or qualified upstream repair before its
database/backup consumer commit. R2–R7 remain active work, not completed here.

## Validation checkpoint

- Exact Rust-hosted Explorer family: one pass/one failure before; two pass after
  (11.2s), including native disk assertions and actual service restart.
- `pnpm --filter @lapis-notes/web check:e2e`: pass.
- PWA `--list`: before 19 cases mixed PWA/Rust; after twelve intended PWA cases.
  The Rust configuration retains all seven cases in its independent lane.
- Complete source check/test/build, catalog and all three affected Web host
  profiles pass at the final checkpoint below.
- Root Prettier cannot infer Svelte because this repository has no Svelte
  Prettier plugin. The three inserted calls follow existing indentation; strict
  Svelte compilation and the owning source checks qualify that file. Supported
  TS/JSON/Markdown formatter checks remain required.

The first full specification check passes its other lanes but finds three
missing mapped chapter updates. Add the unchanged-contract lifecycle confirmation
to package, plugin-service and Node-host chapters; do not weaken the mapping.

Initial host-mode Node acceptance fails its runtime identity assertion because
the shell selects Node 26. Rerun with the available Node 24.10.0 executable,
preserving the production Node-24 assertion and the complete browser journey.

## Wider acceptance checkpoint

- Complete Rust browser lane: seven pass in 48.9s, using fresh renderer/service
  processes for the retained host and Explorer families.
- Node24.10.0 host-mode baseline: complete editing/sharing/restart journey
  passes in 20.2s. No Docker/Linux claim is made from host-mode acceptance.
- Full source check/test/build: twenty package check/test tasks, eleven builds,
  283 ordinary Rust cases/doctests and all 60 Web unit cases pass. Five existing
  optional model cases remain ignored; no model gate is claimed from them.
- Complete PWA lane: all twelve pass (1.5m), including installed plugins, WASM,
  OPFS restoration and owner/proxy takeover.
- Complete catalog lane: 261 pass across four shards (93 + 71 + 42 + 55).
- `pnpm spec:check` passes after the mapped-chapter correction; all supported
  changed-file Prettier checks pass. Strict Svelte checks/builds cover its file.

This commits the owning hosted lifecycle fix and source acceptance. It does not
complete the pending Desktop database/backup intake, native R1.3.11 acceptance,
R2–R7 or final Linux delivery. The existing external Markdown repair and its
unrelated lockfile are preserved; no Lapis AI source is changed.
