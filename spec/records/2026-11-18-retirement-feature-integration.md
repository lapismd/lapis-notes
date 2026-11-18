# Desktop feature integration and remaining runtime audit

This is a supporting checkpoint for the Desktop/Deno-only retirement. It adds
no core API/service/function removal authority and qualifies no native app,
package publication, installed-app replacement or production deployment.
Current work remains in the [runtime backlog](../src/backlog/runtime-integration.md#legacy-runtime-and-package-retirement)
and [progress record](../../docs/plans/legacy-runtime-retirement-progress.md).

## Qualified Desktop feature integration

[Desktop #53](https://github.com/lapismd/lapis-desktop/pull/53) passed complete
hosted [run 44226223633](https://github.com/lapismd/lapis-desktop/actions/runs/44226223633),
attempt 1, exact `9685e1e39cde23e96f6867f7ce00a4923fcd166e`.
All 20 jobs finished: 18 successful and the two configured skips `Native bundle`
and `Full source qualification`. Validate job `134559499591` confirms all eight
selected gates: governance, prerequisites, quality, unit, static catalog,
interaction/axe, Linux and audit. Both Linux release binaries and all four
cold catalog shards pass. This replaces no native acceptance.

Its actual feature merge is `2b553332dd97f8ad86106060b7b5c8648cafab5f`, targeting
`retirement/shared-ai-public-consumer`, not main. An independent JJ comparison
finds no tree difference from checked `9685e1e3`. The original #49 `5321742d`,
#51 `c4c4509e` and #52 `bbbf12f2` heads remain ancestors; GitHub marks all three
merged. The ten earlier Desktop evidence files remain unchanged.

Actual updated [#47](https://github.com/lapismd/lapis-desktop/pull/47) has fresh
[run 44232361289](https://github.com/lapismd/lapis-desktop/actions/runs/44232361289)
in progress. Earlier #47 base `45d61a6c` also passed run `44216859965`, but
neither that nor #53's success qualifies this actual updated head. Main landing
is pending. No macOS native case has run; the on-demand diagnostic decision,
startup/data acceptance and App Profile lifecycle/storage remain separate.
Core API/services, Language Service and Rust pins are retained; E-RETIRE-007
remains parked and uncommitted.

Notes [#169](https://github.com/lapismd/lapis-notes/pull/169) passed complete
hosted run `44228577845`: 12 successful jobs and the existing interaction skip,
including PWA and all Web acceptance. It merged checked `4bd43c2e` as
`538bb4697839a788f041e1830465907e10f50bba`; JJ confirms identical trees.
Its scope and host-boundary clarification changed no core implementation.

## Remaining owner boundaries

Plugins main `8a90c1063dab11af5e5c211bc00a3ebbce79c0cd` has unnecessary Deno
installation and version probing in its private portable Docker mechanism.
The isolated candidate preserves package, Storybook, native, Sync, manifest,
lock and CI trees. Baseline registered smoke `70f7addb` fails before invocation
on missing `deno`; corrected smoke `726ed165` passes in the same image
`sha256:3078eab0ae796a0fbcabd8af91461d78ee3e1d50e46449a0332259a8ef6b42e7`,
including actual Chromium/WebKit and finished-image Deno absence. Sixty-four
validation controls, ordinary checks and complete release/pack/static gates
pass. Complete cold interactions pass 410 cases across eight invocations.
Preserved Sync passes its check, 326 tests, build and unchanged audit policy.
Final specification, evidence and formatting checks pass. Source
`54552e6353f05d66556180799992569a417d8735` is committed and pushed as
[Plugins #158](https://github.com/lapismd/lapis-plugins/pull/158), with actual
hosted run `44234359523` active; main landing is pending. Its
[owner receipt](https://github.com/lapismd/lapis-plugins/blob/54552e6353f05d66556180799992569a417d8735/spec/records/2026-11-18-deno-free-docker-validation.md)
retains the initial/intermediate smoke, transport and metadata-alias failures.
Existing audit policy is unchanged; no new exception is authorized here.

Community main `4670760cc04fa2940bc68b029c29fe9b71bb8685` has no direct Deno
runtime/launcher match across 1,531 tracked source/configuration text files. Its sole match is
upstream engine metadata in the lock. The integrity-verified validator 0.1.0
archive has a Node CLI (`#!/usr/bin/env node`); its optional compiled Deno
backend is not selected by Community manifests or source. This static audit
is not runtime qualification or a reason to remove services, APIs, fixtures or
future functions. No Community source changes or tests were performed; its
unrelated dirty canonical checkout is preserved. Apply the parent latest
Deno-free validator rule when this owner next changes.

## Concrete Website gate

Website source `9cbdc233a7bec69d50d92e5da813edc3586a25fd` has successful exact-main
CI and a fresh bounded Docker frozen install/build/crawl. Its sealed 546-file
artifact passes all 25 cold browser cases, zero failures. Archive SHA-256:
`f7ece0cb7169a216b908ec6359180f246ca9a54ef4bb63d7d0d7e2e093c9ec38`;
per-file manifest SHA-256:
`f3dd6b9a8de36f8226ef925ba5f94b86a20df2b86479345dfcd75a0dc7371bf6`.

The actual owner runbook requires disabling the legacy publishing workflow and
confirming no queued/running writer. Workflow `301133254` is disabled manually
with zero active jobs, satisfying that prerequisite; source deletion is not
required. Read-only raw Pages metadata confirms project `lapis-md`, production
branch `main`, and current production `5a90e983-c503-4dd6-bd50-8ab9aa3bc788`.
The explicit proposed `website-preview` branch differs. No upload, dispatch,
project setting, DNS or secret change occurred. Preview authorization, hosted
acceptance and separate production authorization remain pending. Existing
production still serves the old shared-AI guidance.

All these outcomes preserve the protected core/future-service boundary.
Frozen Desktop removal still waits on its preservation prerequisites; terminal
ownership and Deno terminal-host retirement remain last.

## Coordination document qualification

The four changed paths are documentation only; no source, configuration,
manifest or lockfile changes. Omarchy Docker `pnpm spec:check` run
`c21bb595-cc5d-4d2b-8c82-4c706699b410` passes at snapshot
`c3ba64022917c889d2ebd750fda7f34626688fe9`: seven validation lanes, 68 spec
regression cases, retired-source/App ownership/metadata-query audits, zero
failures. Node 24.15.0, pnpm 10.34.5 and Spec Validator 0.2.1 remain pinned;
two CPUs, 4 GiB memory and workspace-isolated caches are used. Subsequent edits
only record completed Sync checks, the source commit and this receipt; final
formatting and local links are checked separately. Hosted qualification for the
coordination update remains pending.
