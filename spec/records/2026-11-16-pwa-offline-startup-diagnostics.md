# PWA offline startup diagnostics and failed-artifact retention

## Scope and observed failure

Main PWA run `43781514577` at `66a05073805d8fd7b45bc555afbd9f8b2903f747`
and dependency-pilot CI `43787069704` at PR #126 head
`49531dc1ecbbf1764fd7c27025a3c61c507e8ac2` each reported one failed
required offline-reopen acceptance. The latter built the merge revision
`1b3413122080327e6a197819becaaa2072aaae8b`. Its diagnostic showed the
shared Profile's first task, “Open the vault”, active, no recorded console,
page or network failures, a controlling service worker and 610 precache entries.

That task previously covered three awaited operations without identifying the
pending one: vault discovery, Sync readiness and state-directory creation.
Browser AppDatabase/session acquisition precedes that shared Profile task, so
the task label alone does not establish database acquisition as the cause.
Neither failed run retained the prepared PWA: its upload followed the failing
acceptance step. Their exact failed artifacts cannot be replayed.

The newer main reusable validation in run `43783704790` passed, including
Cloudflare and aggregate validation, on docs-only main
`6dd8d473335523be7e9351abe9ba6e62ec8d9615`. Its verified cache receipt was
`hit`, producer `66a05073805d8fd7b45bc555afbd9f8b2903f747`, identity
`sha256:b5d06ecd5afd83d6a6a85de8137cc8b90d521f285306d029c9af7528d0f915bf`
and image
`ghcr.io/lapismd/lapis-notes-ci@sha256:489324dd0c029e2e6287789ac66f3969e4782e3e52eebf8f8f433b73fc118e85`.
The dependency-cache path is not established as the cause of the intermittent
startup failure.

## Changes and exact regressions

LN-WEB-092 uploads the unchanged prepared source-labelled artifact before
Wrangler qualification and always retains the acceptance log. Shell pipefail
preserves a failing acceptance status. Deployment still depends on successful
complete validation and its existing exact-source identity check. The workflow
regression `node --test --test-name-pattern='PWA artifact is retained'
scripts/cloudflare-web.test.mjs` changed from 1 failed/0 passed to 0 failed/1 passed.

LN-PKG-194 records a bounded operation enum on the existing Profile session.
The extracted private helper preserves the original three operations, order,
arguments and rejection. It adds no filesystem workaround, retry, timeout,
readiness relaxation, global App access or public package entrypoint. Deferred
controls hold each actual await independently and retain the original failure.
The focused command `pnpm --filter @lapis-notes/app-profile exec vitest run
src/workspace-session/vault-startup.test.ts` initially failed collection because
the diagnostic helper was absent; all four cases now pass. Cold artifact
acceptance also requires the built session marker to reach `complete`.

## Separate cold controls

All browser runs used fresh contexts/processes and existing unchanged timeouts
in the pinned CI image
`ghcr.io/lapismd/lapis-ci@sha256:91341a81cc9306eed818c4c433cd29ed11d2ea64c703f32685391befe0eca503`
(Node 24.15.0, Playwright 1.61.1). No credentials were retrieved, copied or
exported.

- The retained successful main artifact `14189513324` passed 1 cold unmodified
  replay. A separate diagnostic-only wrapper replay passed 1 case.
- A local frozen-registry build from unchanged candidate 49531dc1/Core 0.13.4
  passed 4 independent cold instrumented controls. A fifth cold control used the
  exact original candidate smoke script with no wrappers and 2 CPUs; it passed.
  That candidate was built with the host Node 26.8.2 toolchain. These controls
  are not the unavailable failed CI bytes and do not replace the hosted gate.
- The diagnostic source snapshot `37ad5c60c8d6881dd02d6092f164b7856e7c060d`
  built its public packages and production PWA in the pinned Node 24 image.
  Its cold prepared-artifact acceptance passed 1/1, including the marker,
  offline reopen, verified Word Count cache, Search, appearance, oversized WASM
  and persistence-safe prompt update. No diagnostic wrappers were installed.

## Wider qualification

- Complete Docker root check/test/build passed: 2,194 package cases, including
  106 Profile, 1,832 API and 39 Web cases; all required builds passed.
- Complete cold Storybook interaction/accessibility: 288 passed, 0 failed across
  four existing governed shards (105/73/48/62).
- Release/workflow tooling: 120 passed; Cloudflare packaging/HTTP/workflow: 5 passed.
- Full specification: 6 configured lanes and 69 governance regressions passed;
  exact-base spec-first passed. Latest Deno-free validator 0.2.0, QMD search and
  doctor were checked. Formatter and actionlint passed; audit reported no
  moderate-or-higher findings and 1 existing LOW finding (1 ignored).
- Complete built-Web registry browser qualification: 13 passed, 0 failed,
  including cold browser vault reload, installed plugins and cross-tab database
  writer takeover. The signed fixture is pinned to Plugins
  `da7d8bb73541eb3421ca8fdfaf1eaaf2baecc850`.

Initial local orchestration failures were environmental and corrected:
concurrent canonical invocations collided on the existing workspace lease;
spec-first required an explicit base and all mandated chapter mappings. No
functional assertion or gate was weakened. Minimal frozen-host documentation
cross-references satisfy mapping; no Deno runtime, package or tooling changed.

## Remaining acceptance

The intermittent stall's cause remains unresolved. The dependency pilot stays
blocked until its original failed required job passes under the owning hosted
acceptance decision; local passes alone do not waive it. Root requested one
unchanged-head failed-job retry, separately from this diagnostic slice. Do not
interpret that retry or this instrumentation as a proven race/filesystem fix.
If it recurs, preserve the new exact PWA and log artifacts and use the bounded
operation marker to reproduce the actual failing await before changing runtime
behavior. Hosted validation of this source PR and any later package publication
or consumer/deployment intake remain separate gates.
