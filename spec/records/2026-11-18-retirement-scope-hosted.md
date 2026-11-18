# Desktop and Deno retirement scope: hosted qualification

[Notes PR #168](https://github.com/lapismd/lapis-notes/pull/168) merged checked
head `75d5b3b2ad42d0e1134668065901da556b3d2ff3` into main as
`dee1067190baebe5344ea216eac3218c5f69da01` after
[Lapis CI 44213407128](https://github.com/lapismd/lapis-notes/actions/runs/44213407128)
passed on its second attempt. This receipt preserves the first failure and
qualification without changing the retirement plan or executable behavior.
The [compact machine receipt](2026-11-18-retirement-scope-hosted.json) records
exact identities; detailed raw receipts remain in the existing retirement
workspace's ignored `.local/validation/pr168-pwa-replay/` directory.

## Source and scope

Compared with green main `6787e8248146edcd75e78228a28738840be8fce4`, the checked
head changes exactly five Markdown files: the two retirement plans, the
[Web icon hosted receipt](2026-11-18-web-icon-input-hosted.md), runtime-integration
backlog and Web verification. No implementation, configuration, manifest,
lockfile or asset changed.

The merged scope is Desktop-related legacy code and Deno removal. Core API
services/functions, Language Service and its Desktop wiring remain protected;
the broader API-removal proposal is superseded. This historical receipt adds no
new removal authority or plan-status transition.

## Initial hosted failure

Attempt 1 failed PWA job `134498831551`; aggregate `134508420954` correctly
failed. Every other substantive job passed, including all 13 hosted Web cases.
The configured Storybook interaction skip remains omitted coverage, not a pass.

The original `pnpm web:cloudflare:acceptance` timed out after 90 seconds during
offline reload. Diagnostics report a controlled service worker, no console,
page or network errors, and `vaultOperation=sync-readiness` with the shell still
unready. This matches the earlier
[PR #164 incident](2026-11-17-profile-vite-peer-hosted.md); it does not establish
a repaired runtime defect.

The failed artifact identifies build
`d5f78d4f6589407a014ada4f21e6bdf8c34e881b`. Before any retry, its exact ZIP and
diagnostic ZIP were downloaded and independently verified against GitHub's
SHA-256 digests. Artifact `14387966343` hashes to
`c2a56cf5d110cf6fa0ca1c8678c768bb49acb500c292aa0cb0c0dc9ea27e1e12`;
diagnostic `14388290913` hashes to
`e78caa566dae78bd172a627d1c6816b093e59add8f9d1fa68095c51ff8cd9ac7`.
The retained local ZIPs preserve the original failed bytes independently of
subsequent same-name artifact uploads and hosted retention limits.

## Exact-artifact cold replay

One cold omarchy Docker replay passed the original failing acceptance command
unchanged. The worker used exact checked source, its frozen registry lock and
the exact downloaded artifact; it did not rebuild the application. The four
acceptance/helper scripts were independently byte-identical to green main.

The worker had two CPUs, 4 GiB memory, 2 GiB shared memory, no shared mounts or
cache volumes, a fresh Wrangler temporary copy and a fresh Playwright context.
Node 24.15.0, pnpm 10.34.5, Wrangler 4.156.0 and Playwright 1.61.1 remained pinned.
Frozen installation and `pnpm web:cloudflare:acceptance` both exited zero.
The original 620 artifact files remained SHA-256-identical before and after.
Acceptance confirmed offline reopen, Search, verified offline plugin caching,
appearance, isolation and persistence-safe prompt updates.

No assertion, timeout, test infrastructure, runtime, application or core API
source changed. Local replay supported diagnosis; it did not replace the hosted
blocking gate or qualify native acceptance.

## One accepted retry and final gate

The first targeted retry request was rejected with HTTP 403 while the original
workflow still ran; it accepted no retry. After attempt 1 became terminal and
the head was reverified unchanged, exactly one targeted PWA rerun was accepted.

Attempt 2 passed PWA job `134509729677` and aggregate `134512355867`. The current
required checks had no pending or failed gate; final workflow status was 12
successful jobs and one configured interaction skip. PR metadata was clean and
mergeable at the exact checked head before the verified merge above.
The initial failure, exact replay and single accepted retry remain distinct.

The intermittent offline startup stall under
[LN-WEB-092](../src/web-host/application-presentation.md#ln-web-092) remains
unfixed and belongs to its existing backlog investigation. No quarantine,
assertion weakening or gate exception was added. Package publication,
production deployment, installed-app replacement and native macOS acceptance
are not qualified by this documentation-only scope landing.
