# Docker permission and lease qualification

Status: qualified. Final dependency-cohort tooling, real permission smoke, full
source check/test/build, guarded catalog, static and specification checks pass.

## Boundary

Desktop's new Linux lane exposed that Docker's default root capabilities bypass
Unix permission denials. The same owned runner in Notes reproduced that defect.
Workers already use an init reaper; they now also drop every Linux capability.
No product permission assertion or application runtime changes.

The runner also adopts the qualified Desktop lease/cleanup policy: created,
running, paused or unreachable workers retain the lease. Only completed owned
workers qualify for collection/removal, using immutable container IDs. Exact
source/archive input, bounded resources and separate native product gates remain.

## Before and after

- Exact `pnpm validation:smoke` before: one assertion failure. A mode-000 file
  remains readable under default root capabilities. Run
  `afe031b8-f7de-4b36-9237-966bcd14a1c8` retains the complete attempt.
- Exact rerun after `--cap-drop=ALL`: passes actual denied file reads, denied
  directory writes, zero effective capabilities, tool identity and both real
  headless Chromium/WebKit browsers. Run
  `0d6bf631-2dde-4a91-8262-ac56bae0f3de` retains the source and reports.
- New lease target `node --test scripts/validation-leases.test.mjs`: initial
  missing-boundary module-load failure; after implementation all 11 cases pass.
  Cases cover lost operation replies, failed SSH state queries, active/created/
  paused workers, changed ownership, completed failures, previews and resumed
  workers. They also verify exact ID deletion and result/error preservation.

The cold default Docker tooling run
`a55db4ef-6624-4896-aee1-cd146a3b3293` passes all 59 cases, including the 11
lease cases. Final corrected-cohort tooling run `e93d035e` also passes 59/59.
Final `pnpm validation:smoke` run `33dac726` passes real denied access and both
browser engines with zero effective capabilities.

The final `pnpm check:all` run `3841ad15` passes in 8m15.8s: 339 native Core
cases, five Rust-boundary cases, 2,209 unique package cases, all source checks
and builds. Six native/model/crash-helper ignores and one legacy package skip
retain their original scope. The source receipt explicitly qualifies Plugins
`6af2420ff720cf8ce04581306c9c7b8d12b126e4`, required by the already-selected
native Markdown services. No unrelated source pin is replaced.

Final guarded catalog `620deaac` passes all 261 cases in 59 files, with no
functional, accessibility or fatal runtime diagnostic failures. Static
`16e01dce` passes all five build/static tasks and 181 specification chapters;
final specification `45d413c2` passes all 78 regressions plus current mappings,
protocol, boundary, progress, App-ownership and mdBook gates. The corresponding
[dependency receipt](2026-10-25-released-mira-dependency-intake.md) retains full
run identities, source provenance and registry-lock limitations.

These final runs use Design Core source
`944cd448b40d53be79624c2a453248af78e513e8`, whose audited public archive has
SHA-256 `4f6b3f5c6c619e3154cb2860881b7d89b9c11062db4cfa1eb9ae0488150b7a97`.
The earlier `33b05d40` full run used a provisional cohort and remains supporting
evidence only. Source/private-archive dependencies remain explicit; portable
checks do not qualify an actual model or OS/WebView feature.
