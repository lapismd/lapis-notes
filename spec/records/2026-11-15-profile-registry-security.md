# Shared profile registry and dependency security

## Published packages

Release workflow 43735009696 passes on plugin source
`1f7c091ad243670cfbe425763f36da2f5367d530` and publishes all thirteen selected
packages. All thirteen production Ed25519 signatures, complete signed payloads,
checksums and source tags verify through the owning published-coordinate helper.
Bases 0.4.0, Canvas 0.4.0 and Markdown 0.3.1 expose identical skill files through
npm skills.json, their actual npm tarballs and their signed archives (two files
each). The initial Canvas parity request used an incorrect hard-coded runtime
ID and failed at download; deriving the asset name from its public manifest
repairs the harness. No product assertion or file comparison is removed.

Initial cached registry 404s are retained. Canonical npm lookups then succeed;
normal registry lock generation and frozen installation pass without archives,
source hooks or an alternate registry. A dependency-manifest conflict on rebase
retains both main's Design Core 0.13.3 and the profile's History 0.3.1 floor.

## Patched findings

The first fresh registry audit reports four low, 21 moderate and two high
instances, with zero critical. Bounded patched resolutions address Vitest,
Zod, body-parser, fast-uri, qs and Hono. Workbox's glob dependency advances to
14.0.2 or later. Its actual getManifest API retains matching paths and content
revisions. A new actual-caller cancellation regression fails before (seven
reads versus four at rejection) and passes after the fix. All five PWA/native
Git dependency regressions pass. The post-fix audit retains only deepmerge.
Full package, browser, PWA and release acceptance remain required.

## Approved temporary exception

Advisory: [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4),
CVE-2026-93753, low severity, affects deepmerge 4.2.0 through 4.3.1.
Upstream lists no patched version. Installed and current Svelte Vite plugin
releases require deepmerge 4.3.1. The same finding and dependency path reproduce
on the unchanged Notes audit baseline.

Owner: third-party @sveltejs/vite-plugin-svelte, build configuration merging.
Its src/utils/options.js merges defaults, repository Svelte config, inline
plugin options and extra compiler options. These are executable developer-owned
build inputs. This dependency does not process runtime vault note/property data
and is not included by the public profile's type-only Vite import.

Approved scope: ignore this exact advisory only in the repository development
build audit; retain all other audit findings and normal tests. Review by
2026-12-15, removing the exception as soon as a patched supported upstream chain
is available. The user explicitly approved this exact exception on 2026-11-15.
Only GHSA-gcqx-w48m-w2h4 is added to the development audit ignore list; no
severity threshold is lowered. `pnpm audit --json` exits zero after applying
the approved exception. Its raw metadata still counts the ignored low finding;
there are no unexcepted moderate, high or critical findings.

## Registry submissions

All thirteen one-file submissions (plugin-registry PRs 145 through 157)
reference the exact verified source and published package/version assets. Their
checks pass and no review objection or unresolved thread is present. All
thirteen merge after exact-head checks. They queue the combined publication;
this is not yet a claim that the production catalog has deployed those entries.
Registry preparation workflow 43741029285 owns the combined candidate.

## Registry-based interaction failure

All 27 registry-based package check/test/build lanes pass. The first complete
browser aggregate passes 287 stories but loses its browser connection before
the two LinkPreviewAcceptance cases execute. Vitest reports one unhandled
browser-connection-closed error, with no assertion failure. This is not a
passing full lane and no retry is presented as a repair. Receipt:
`.local/validation/runs/lapis-notes-validation-95346554-68b2-4193-9ae8-c0b5c22d0aeb`.
The exact LinkPreviewAcceptance family is the next diagnostic boundary.

Registry publication PR 158 targets c85b14c5. All thirteen prior-version maps
remain equal, adding exactly one approved version each; each new catalog hash
matches its published GitHub checksum. Its checks remain a separate merge gate.

The exact LinkPreviewAcceptance family passes both cases unchanged on a cold
run. This is a non-reproduction, not a claimed fix for the full-run disconnect.
Receipt: `.local/validation/runs/lapis-notes-validation-6cbe0b9d-f550-450b-bbbf-190fe3340083`.
The original fourth shard is rerun unchanged as the next diagnostic scope.

Registry PR 158 passes on c85b14c5 and merges after exact-head verification.
Production deployment and live endpoint verification follow that merge.

The original fourth shard also passes unchanged: 64 cases, zero failures.
Receipt: `.local/validation/runs/lapis-notes-validation-b16d59ff-5def-4b8b-b14e-6e4dc81f1a1b`.
This remains diagnostic non-reproduction; a fresh complete four-shard run
is required before source qualification. No timeout, assertion, browser
configuration or test selection is changed to obtain either diagnostic pass.

Registry production workflow 43742393802 succeeds on the PR 158 merge
`7c92fa36b1522e245d18a37418b45ab6f58e42ab`. Live catalog and production
download checks are recorded separately from workflow success.

Live `https://registry.lapis.md/v2/index.json` and all thirteen changed detail
documents verify with the application's pinned production registry key. Each
latest version is correct; all thirteen production `/download/` archives match
the approved SHA-256 and byte size. The merge preserves all 69 prior version
records. Log: `.local/registry158-live-verification-after-20261115.log`.
The initial Python request received HTTP 403; curl receives HTTP 200. The
first local verifier read hash fields from the version instead of its public
`bundle` object and fails before downloading. Correcting that harness path
retains every hash, size and signature assertion; the corrected run passes all
thirteen. Neither failure changed production metadata or application code.

The complete fresh registry-only browser aggregate passes 289 cases across all
four shards (105 + 72 + 48 + 64), zero assertion failures or unhandled errors.
Receipt: `.local/validation/runs/lapis-notes-validation-1b583d72-4b40-4fbd-88ec-4466dabd2834`.
The previous disconnect remains an unexplained failed attempt; both the exact
family and original shard passed unchanged before this fresh aggregate.

The profile-only release-intent regression fails before (one failure among four
cases) and all four pass after adding App Profile to the existing guard. The
complete release-tool suite subsequently passes 113 cases. Root check passes
all sixteen tasks. Spec-validator 0.2.0 remains the latest Deno-free release;
doctor and QMD search succeed with only the existing script-alias warning.

## Storybook security-upgrade navigation regression

The current built catalog succeeds, but static documentation acceptance reports
one failure, five passes and two existing watcher-only skips. The unchanged
`requirement links, outline, and history survive reload` case fails at its final
Forward assertion. The development docs suite likewise reports one failure and
seven passes. Both retain their assertions and default timeouts.

The exact case passes on a separate clean JJ baseline workspace at Notes
`2645d4ba3689a6a153d8fe2face6773589ccb1c0`, with its unchanged frozen lock and
Storybook 10.5.7. This is a regression introduced by the secure Storybook intake,
not an accepted pre-existing test failure. The baseline workspace is
`../lapis-notes-spec-history-baseline`; its normal frozen install passes and its
exact browser log is `.local/history-baseline-exact.log` (one pass).

Temporary instrumentation of the isolated browser shows the manager handling
GLOBALS_UPDATED after returning to an anchored chapter. The same-route hash
branch emits NAVIGATE_URL without forwarding `{ replace: true }`, converting
the intended replacement into a push and discarding the Forward destination.
CDP history confirms that the previous forward entry is removed. The diagnostics
are removed from the tracked test; no production wrapper or dependency patch
is applied. Logs: `.local/profile-spec-history-before-20261115.log`,
`.local/profile-spec-history-emitter-20261115.log`, and
`.local/profile-spec-history-entries-20261115.log`.

Published Storybook 10.6.2, 10.6.3, 10.6.4, 10.6.5 and installed 10.6.7 all
contain the same router branch. Latest npm is 10.6.7. Storybook 10.5.10 lacks
that branch but remains below the patched boundary for
[GHSA-f2ph-cmg5-wxc8](https://github.com/advisories/GHSA-f2ph-cmg5-wxc8) and
[GHSA-px85-f4q5-jh77](https://github.com/advisories/GHSA-px85-f4q5-jh77).
The old version is not restored. The approved deepmerge exception covers none
of this behavior. No navigation test is skipped, weakened or marked passing.

The user explicitly accepted this catalog-only Forward-navigation limitation
on 2026-11-15 and authorized continuing Lapis releases with the secure Storybook
version. This acceptance covers only the documented history regression. The
unchanged test remains failing and visible; no skip, timeout or assertion
change is authorized. Product package gates and the 289-case application
interaction/accessibility aggregate remain passing. Recheck the exact case
when adopting an upstream Storybook fix.

Direct App Profile packing passes its build, check and publint prepack gates.
All five public export maps resolve files in the actual tarball; no test or
fixture files are included. The artifact is retained at
`.local/profile-public-direct-pack/lapis-notes-app-profile-0.1.0.tgz`, with the
original pack log at `.local/profile-public-direct-pack-20261115.log`. This is
a local source artifact, not a publication or a replacement for the required
clean-revision release aggregate. Final specification checking also passes
its configured gates and 67 governance cases after recording the exception.

## Combined-main reconciliation after acceptance

Main advances to `ccca08e9` with the separately merged public profile, portable
session/native Repository intake and startup-readiness fence (PRs 127/128),
then versions App Profile 0.2.0, API 0.6.4 and Workspace 0.4.6 (PR 125). The
reconciliation preserves those newer implementations and their History 0.4
contract, removing duplicate restored sources. This slice now requests a Profile
patch alongside the byte/retry API patch. The final versioned Profile API floor
must identify the actual API release carrying these guards.

Initial clean packaging before reconciliation rejects an external Markdown
dependency under the old tarball validator. Main already contains the source
validator correction; it is adopted rather than duplicated. Initial spec
reconciliation puts two verification rows outside their table (two unmapped
findings); moving them into the existing table restores the specification gate.
All 62 exact storage/retry cases pass after main integration. Complete combined
package, catalog and clean-revision packaging qualification is repeated.

Main's release workflow 43745647019 reaches publication but fails npm
authentication for App Profile 0.2.0. The package remains absent from npm at the
check. This is a publisher configuration gate, not a reason to bypass signing
or substitute a local package in consumer manifests.

The combined-main root check, all 27 package lanes (2,177 unique cases), 62 exact
storage/retry cases and 112 release-tool cases pass. Package receipt:
`.local/validation/runs/lapis-notes-validation-e1d210f7-a1a7-48e6-862a-cc3d2af0ac7f`.
Clean-revision tarball preparation and its isolated consumer build pass after
using disk-backed TMPDIR. The failed disposable consumer initially exhausts
/tmp inodes and prevents Docker startup and publint; only that exact task-owned
consumer is removed. The failed attempts and successful retry remain in
`.local/profile-main-clean-pack-final-20261115.log` and
`.local/profile-main-clean-pack-retry-20261115.log`. Public API build and real
browser storage/cold restart pass after the same temporary-storage correction.

Fresh static Docs has five passes, the one accepted history failure and two
existing watcher-only skips. Fresh development Docs has seven passes and the
same accepted failure. No other Docs failure is waived. The repeated final
LinkPreviewAcceptance transport failure is now covered only by the user's
explicit [two-case quarantine](2026-11-15-link-preview-browser-quarantine.md);
omitted cases are not passing coverage.

The user reports App Profile 0.2.0 published. The first exact npm lookup is
still cached 404; a later normal lookup confirms the expected API 0.6.4 /
Workspace 0.4.6 / History 0.4 dependency graph. The actual npm tarball verifies
SHA-512 integrity, all five public export maps and absent test/fixture assets.
Npm supplies no gitHead for this version, so no source-provenance claim is made.
The live trusted publisher now matches lapismd/lapis-notes, release.yml and
npm-production, with publish/stage-publish permissions. No publisher write is
performed by this slice. The prior authentication failure is historical.

## PR 130 governance follow-up

The exact committed base/head spec-first gate reproduces CI job 132933294478:
one SPEC-FIRST-MISSING finding for the Hosted Server chapter after main
reconciliation. Source documentation is corrected with the shared API retry/byte
guards, published dependency boundary and separate native Server acceptance;
no protected mapping or implementation is weakened. The before log is retained
at `.local/pr130-governance-before-20261115.log`. Latest spec-validator remains
Deno-free 0.2.0; doctor and QMD search run before this correction.

After the chapter correction, the same base-to-updated-head gate passes with
29 protected files and 26 canonical chapters (one finding before, zero after).
The full specification aggregate, 67 governance cases, documentation type/mirror
check and affected Markdown formatting pass. This is a documentation-only
correction; the already qualified product and catalog code is unchanged.

## Accepted failures are quarantined, not red-merge exceptions

The user clarifies that accepting the Docs history failure requires documenting
and quarantining its test, with green required checks before merge. This
supersedes the earlier interpretation of acceptance as permission to merge the
red Docs jobs. The [single-case Docs quarantine](2026-11-15-docs-history-quarantine.md)
retains all assertions and timeouts, keeps both Docs jobs and their other cases
enabled, and supplies an explicit diagnostic opt-in. The exact default target
reports one omitted case; opt-in reproduces the original failure. No red
required check will be bypassed for this release.
