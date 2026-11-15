# Shared profile cohort for native repository hosts

The server's published App Profile 0.1.0 uses API 0.2.x, while the current native
History remotes UI requires API 0.6.x. Current Notes main contains a private
source-only profile and a native Repository binding stub that never registers
the plugin. The complete public shared-session implementation already exists in
committed Notes history at `1c790698abb1e5fb033534e1e5ae75ef71d951c4`.

This candidate integrates that source-owned session/export boundary into current
main, retaining later browser appearance persistence, PWA guarded disposal,
native Chat default/retry behavior and responsive shell selection. The default
four plugins stay optional and unchanged. Web injects browser-specific policy;
it does not retain a copied workspace session or native engine. Both host
adoptions and release qualification remain outstanding.

## Baselines

- `pnpm --filter @lapis-notes/app-profile exec vitest run
src/native-repository.test.ts`: one pass and one failure. Native Repository
  registration never calls `registerStaticPlugins`.
- `node --test scripts/check-package-boundaries.spec.mjs`: two passes and one
  failure. App Profile is absent from the governed public release graph.

After initial implementation, the exact targets pass two and three tests
respectively, with zero failures. These initial passes precede current cohort
installation and wider qualification. They are not a host, browser, archive or
publication gate.

## Initial qualification queue

Complete released dependency installation, App Profile and Web package checks,
tests/builds; root quality/unit/build; shared shell/session and full catalog
interaction/accessibility; browser journeys; public metadata/pack/clean-consumer
and release-tool gates. Retain every initial failure, explicit App ownership,
current lifecycle assertions and visual-pending tags without baseline updates.
The package is not published from this intermediate candidate.

## Additional boundary evidence

The packed-release regression initially fails module loading (one failure)
because its dependency-boundary checker was not exported. After exposing the
existing checker, all eight package-boundary/release-manifest tests pass,
including published plugin admission and private/local dependency rejection.
Shared-session composition initially reports six findings over three stories.
The exact composition suite moves from 30 pass/one fail to 31 pass/zero fail;
the 64-family inventory has zero findings. It follows the owned public export
and barrel to actual Svelte source rather than exempting a session import.

App Profile's check initially reports two errors in restored startup calls;
current API uses argument-free vault and sync readiness. The corrected source
passes with zero errors/warnings. All 99 App Profile tests across 19 files pass
against the previous installed cohort. The moved leave/lifecycle command now
selects its owning package. These results still precede released-cohort install.

Registry installation initially refuses unpublished Markdown 0.3.1. Exact npm
endpoints also confirm Search 0.1.12 and Source Editor 0.1.11 are unavailable.
Their already-versioned source admits API 0.6 (and Markdown admits UI 0.2), unlike
the older registry versions. GitHub release workflow 43724959367 selects only
those three prerequisites on qualified main 1e7cda3d; it remains in progress.

The first cold shared-session story run fails suite collection (one suite,
zero collected tests): root Storybook had no declared App Profile dependency.
The root now declares that owned workspace package; source aliases are not added.
Web's first complete check passes Svelte and node checks but fails e2e types
with two duplicate Vite/Rollup environment diagnostics. The restored public build
adapter exposes Vite types, so Web and App Profile now select the root's Node 26
type cohort. Frozen registry installation and exact reruns remain required.
Release-tool qualification initially reports 110 pass/one fail because its exact
package-order assertion omits App Profile. The assertion now includes the new
last package without weakening the graph-order check: all 111 release tests pass.

## Interim source archive qualification

While GitHub publication runs, the existing ignored pnpm hook installs three
already-qualified local pack outputs through an explicit temporary manifest.
Only the unpublished prerequisites are redirected; tracked manifests stay normal
semver. The original registry lockfile is restored immediately after installation.
The archive checksums are:

- Markdown 0.3.1: `ad9fc498b4430a5e727e4950e67aa094deb0aa066abae5203ee5d68a2f77eb30`.
- Search 0.1.12: `f3c64feb6a686af8c1f14d3fb466b14c080ee68ee82e1cff9150a3fe7ecdcb59`.
- Source Editor 0.1.11: `9da8566ed938f685342070f8ea4c763f2e53bbf94b8c34be9ec64921f98b5ab9`.

With that setup, App Profile check/build and all 99 units pass. Complete Web
check, including e2e types, passes; the Vite duplicate-environment errors are
resolved by the coherent Node type cohort. The first collected cold session run
has three failures after Vite discovers History and Agent UI and reloads axe.
The initial explicit includes cannot resolve nested Agent UI from root; all
three failures repeat. Using the actual nested dependency coordinates avoids
late optimization: the same three cold stories pass with axe enabled. No timeout,
assertion, accessibility rule or visual baseline is changed. Full root and clean
registry-only qualification remain required before commit/publication.

## Wider source results and retained consumer acceptance

Interim root check passes 16 tasks, root unit tests pass 2,168 cases across nine
packages, and the complete build passes nine tasks. The unchanged Deno helper's
check prunes root deno.lock; that incidental output is retained under ignored
validation storage and the tracked lockfile is restored rather than committed.
Package policy, boundary and all 111 release-tool tests pass.

The initial full catalog stops after 224 passes and one failure in Outgoing
Links/Middle Top Tabs. Its exact rerun reports one failure with six unselected
cases: an obsolete named-theme ancestor assertion. Qualified owning Markdown
source already repaired that contract in PR #111, documented in its immutable
2026-11-14 Canvas review-controls receipt. This intake adopts its actual inherited
foreground assertion, keeps exact focus-ring/geometry/scroll/persistence checks,
and uses the platform Select All modifier. The exact rerun passes one case with
six unselected cases. The obsolete canonical wording is reconciled in the owning
Plugins repository and here. Full family/catalog reruns remain required.

## Released cohort and final qualification

GitHub workflow 43724959367 passes on source 1e7cda3d and creates Markdown 0.3.1,
Search 0.1.12 and Source Editor 0.1.11 releases. Exact npm metadata/provenance
and downloaded tarball integrity verify all three. Markdown metadata and then its
canonical tarball initially return cached 404s; normal canonical GET later
succeeds. No version is republished or replaced. Their GitHub archive signatures,
file lists/hashes and source coordinates verify with the production release key.

Normal registry installation and a subsequent frozen install pass. Root and
App Profile resolve History 0.4.0 and the three published prerequisites. Web's
direct History range is also 0.4.0, eliminating its old nested 0.1.4 context.
The tracked lockfile has no private source archive, local path or temporary hook
reference. Interim archive results remain distinct from this registry cohort.

The interim complete catalog passes all 289 stories across 64 files with axe
unchanged, and its static build renders all 194 specification chapters. Final
registry check passes 16 tasks. Its first full unit run exhausts disk during
transformation: seven Workspace suites fail collection, not assertions. The
same package rerun passes all 44 tests. Serial root qualification is in progress;
no failure is hidden. Task-created source validation archives are reversibly
compressed with verified uncompressed SHA256 and retained source coordinates,
recovering 1,217 MiB without removing user files or recovery evidence.

The final registry-only run passes all 16 root unit tasks and nine build tasks.
The four exact cold source cases pass after the normal installation; the full
catalog then passes all 289 stories across 64 files, zero interaction/axe failures.
Six local consumer archives are packed from source snapshot bc005897 with verified
identities; App Profile's standalone publint passes. An isolated strict declaration
probe additionally exposes 820 existing csstype dependency errors, six inherited
library declaration errors, 11 missing native History SDK references and one
fixture using the old browser-opfs profile kind. The SDK is now declared by the
profile's public surface and the fixture selects the current opfs kind. Strict
third-party declaration diagnostics remain recorded separately from the canonical
release consumer's build/resolve gate; no diagnostic option is weakened.

## Populated public session and startup boundary

The first packed consumer build passed compilation but browser review found an
empty file view. That fixture mixed local API archives with transitive registry
copies. The final isolated profile consumer instead installs the profile archive
and its released dependency cohort with one API identity, without source aliases.
The earlier mixed-coordinate build is not accepted as browser qualification.

Strengthened Ready, Native Repository and Startup Retry stories require both the
seeded document heading and body, beyond Explorer and shell chrome. Their first
run reports three failures. Initial file navigation raced queued shell projection;
the shared session now starts its existing controller, mounts the shell, and
awaits the existing layout flush before delivering host readiness. The fixture
uses the public App foreground navigation action. The exact cold family passes
all three cases with axe enabled. No API contract or visual baseline is changed.

The final source check passes all 16 tasks. A repeated root unit run again hits
ENOSPC while collecting seven Workspace suites, with no assertion failures.
Two obsolete, task-created consumer dependency installations are removed while
retaining their source, manifests and logs. The exact Workspace rerun passes all
44 tests; the subsequent serial root graph passes all 16 tasks, covering 2,168
unit cases across nine packages, including 99 Profile and 39 Web cases. Existing
Deno-generated lock output is retained locally and restored from the source diff.
Specification check passes six lanes plus ownership/metadata audits and all 69
specification-tool regressions. Package boundaries and all 111 release-tool
regressions pass. The first complete cold Web lane passes all 13 journeys; final
built-consumer, catalog and Web artifact receipts follow below when complete.

The final populated catalog passes all 289 stories across 64 files (105, 72,
48 and 64 cases in four serial shards), zero interaction/axe failures. The final
root build passes all nine tasks and its rebuilt cold Web artifact passes all
13 journeys. Six public consumer archives are prepared from source snapshot
`eb19f843b7be400ec4244d18c577867a09e32c8b`; the Profile archive SHA256 is
`6fc7dea15b52ced9ee2911a3680b7d78888927487ca8291d4e7bc99f21059e79`.

A final main refresh discovers the independently merged Core-range update
`2645d4ba3689a6a153d8fe2face6773589ccb1c0` (PR #123). The candidate is rebased
onto it, preserving its dependency Changeset and all updated Core ranges. The
single overlapping Profile manifest is resolved with Core `^0.13.3` and the
qualified History/SDK dependencies. Normal lock regeneration and frozen install
pass. Comparing package and snapshot coordinate sets before/after reports zero
additions/removals: the tested graph already resolved Core 0.13.3 throughout.
Publication must retain the independent API/UI/Workspace patch intent already
on main, alongside this Profile minor intent.

## Final packed consumer and static acceptance

The rebased six-package pack comes from source snapshot
`cd305c1bc8c034abb2147de0cbe51017e84a52a1`. Profile SHA256 is
`9e5de3d7a8c72dec16ca29fbfc8da3c8a55fe76912b43bd39f678d602fd560b7`.
The isolated Vite 7.3.8 consumer builds that unique archive with normal registry
runtime dependencies and no aliases, overrides, patches or local hooks. Root
and Profile resolve the same registry API 0.6.3 module. Browser review confirms
an active Welcome.md tab, rendered heading and body, populated Explorer/Outline,
footer, and real Workspace Settings. This fixture is memory-only; it does not
qualify native transfers, encrypted custody or either production host.

The final static Storybook build renders all 194 specification chapters, and
all six applicable static navigation/accessibility journeys pass. Two authored
source-watch/dev-server cases are explicitly inapplicable in static mode and
remain skipped there. Specification and package/release-tool gates pass again
after the metadata-only rebase. All stories retain visual-pending; no PNG
baseline is changed. GitHub exact-head CI, versioning, registry publication and
Server/Desktop production adoption remain separate gates at this source commit.
