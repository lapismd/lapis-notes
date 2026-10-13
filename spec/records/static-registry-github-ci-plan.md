# Static registry integration and GitHub CI plan

The user resumed this plan on 2026-10-13 after the Lapis Notes framework release.
This continuation prepares source-review PRs and blocking GitHub CI qualification.
Production registry metadata signing was separately approved and completed.
The user also approved publishing the signed registry once CI prerequisites pass.
Plugin publication and registry release dispatch remain separate release gates.

## Resumed qualification — 2026-10-13

- Design Core 0.3.2 is published. Source PR 17 and version PR 18 are merged;
  [CI run 38317471796](https://github.com/lapismd/design-core/actions/runs/38317471796)
  executed all 11 jobs successfully, including cold catalog and browser lanes.
- Notes source PR 4 and the framework version PR are merged. npm exposes API,
  UI and File Explorer 0.1.2 and Workspace 0.2.0 under `next`; `latest` still
  names the older releases. Explicit portable ranges resolve the new versions.
- Plugins now qualifies API/UI/File Explorer 0.1.2, Workspace 0.2.0,
  Language Service 0.1.1 and AI Controller 0.1.0. CI no longer looks up the
  nonexistent API 0.1.1 or grants success when functional jobs are skipped.
  The isolated `lapis-plugins-static-ci` workspace excludes the newer Sync
  implementation from this source candidate. Notes pins the pushed candidate
  `61bf175f21d91f17e06a071bdaadbaf5d87645a1` for validation-only artifact builds.
  [Plugins PR 6](https://github.com/lapismd/lapis-plugins/pull/6) is merged; its
  source-bound 12-plugin archives and signed acceptance fixture verify locally.
- Notes has validation-only complete Web and native macOS/Linux packaged jobs.
  Its Web lane consumes a retained, test-signed fixture built from an exact
  frozen Plugins source candidate. Fixture keys are ephemeral and production
  builds ignore fixture trust. Desktop packaging uses Terminal Host's public
  npm Deno and native-artifact exports instead of a sibling source checkout.
- [Registry PR 12](https://github.com/lapismd/plugin-registry/pull/12)
  contains the V2 source and a portable API 0.1.2 lock. Strict remote validation
  verifies all 11 existing published entries. Approved signing verifies 13 V2
  metadata signatures. Generated-only PR 13 and the source PR are merged after
  complete signature, site, script and browser qualification.

Initial local evidence: Notes root check 18/18 tasks, root tests 18/18 tasks,
root build 10/10 tasks, desktop tests 218 passes plus one existing skip, and a
fresh ad-hoc-signed macOS packaged smoke pass. Complete Web acceptance changes
from four registry failures and six passes against the uncut production endpoint
to 10/10 passing against the verified 12-plugin fixture rebuilt from the pushed
Plugins commit. Notes release-tool tests pass 67/67 under the CI candidate-pin
environment. Its fixture transport regression changed from one failure to one
pass under that environment and verifies rejection of mismatched source metadata.
Initial registry evidence records
8/8 focused schema/source tests, 77/77 script tests, 17/17 browser cases,
Astro check, statistics validation and formatting. Approved metadata signing
subsequently unblocks V2 signature verification and site packaging.

The complete Plugins lane exposed a story setup that toggled an already-open
preference menu closed. Its corrected setup observes the public expanded state,
retains hover and catalog assertions, and passes the exact 62-story shard and
all 177 interaction/accessibility scenarios. Source also records 36 package
tasks, 105 release-tool tests and the static catalog build. Linux native
qualification must execute on GitHub; local macOS evidence is not Linux evidence.

### GitHub execution and repaired boundaries

- [Plugins CI 38454548155](https://github.com/lapismd/lapis-plugins/actions/runs/38454548155)
  executed all nine jobs successfully, including 177 interaction/accessibility
  scenarios, 105 release-tool tests and retained test-signed candidate artifacts.
- [Notes PR 13](https://github.com/lapismd/lapis-notes/pull/13) adds the complete
  acceptance graph. Its first run passed governance, quality, units, static
  catalog, all 243 interaction/accessibility scenarios, fixture generation and
  artifact planning. Web rejected incorrectly
  labelled provenance: GitHub retained Notes' workflow SHA despite a step-level
  environment override. The fixture build now verifies its Plugins checkout
  and exports provenance inside the executing shell. Its exact regression
  changes from one failure to one pass and rejects a mismatched checkout.
- The first macOS job exposed Deno 2.9.7 appending `.app` to an output name that
  already ended in `.app`. Packaging now supplies an extension-free name and
  selects `DENO_BIN` or `PATH`. Earlier local packaging had selected the separate
  Deno 2.9.5 user installation and did not establish 2.9.7 qualification.
  The corrected fresh Deno 2.9.7 package passes local cold smoke, including
  first launch, URL handoff, controller/tool/service readiness and clean close.
- The first Linux package built but startup failed. WebKit's location-only
  stack concealed the actual message. Desktop diagnostics now retain both;
  packaged smoke reports include the failed phase, and failed native jobs retain
  their archives. The message-preservation regression changes from one failure
  to one pass. Linux startup qualification remains required.
- The second Notes run verifies the correct Plugins source provenance and the
  macOS bundle name. Both native runners then report the missing separately
  installed controller executable. The npm package supplies the SDK, not that
  CLI. CI now provisions the CLI from public release source
  `0082a1151ad2da20d0288384636b25bec0778482` using the owning build and verified
  installer, passes its isolated path explicitly, and retains its manifest.
  That source passes 194 Node tests, seven runtime-install tests, specification,
  architecture, types and boundaries; Notes' local cold smoke passes with this
  exact released CLI instead of the developer's installed service snapshot.
- Complete Web execution on the second run records nine passes and one failure:
  the server-host test requires Docker, absent from the job container. The Web
  job now uses native Ubuntu with Docker and Chromium, builds the server image
  from the candidate, and preserves all ten tests. Candidate areas are excluded
  from the server Docker context. Its prerequisite regression changes from one
  failure to one pass; the controller prerequisite regression does the same.
  A fresh local server image passes the exact server-host test (1/1), followed
  by the complete signed-fixture Web suite (10/10). The prerequisite slice also
  passes 70 release-tool tests, 23 workflow/transport tests, specification gates
  and actionlint; clean GitHub execution remains required.
- The repaired Notes candidate passes root check 18/18 tasks, root unit 18/18
  tasks, build 10/10 tasks, desktop 219 tests plus one existing skip, 68 release
  tests, specification/App-ownership/metadata gates, actionlint and formatting.
- Registry Astro generation previously modified a tracked cache file outside
  `generated/`, which would reject a signing candidate. Generated Astro files
  are now untracked and ignored; cold type generation and all 77 script tests
  pass, and repeated source checking leaves the committed tree clean.
- [Notes CI 38460618229](https://github.com/lapismd/lapis-notes/actions/runs/38460618229)
  executed all required jobs. macOS packaged smoke, governance, quality, units,
  static catalog, all 243 interaction/accessibility scenarios, fixture generation
  and artifact planning passed. Linux controller provisioning failed on GNU tar
  extraction of pnpm dependency hard links; complete Web execution recorded nine
  passes and one server startup failure. The aggregate correctly failed.
- [Controller PR 1](https://github.com/lapismd/ai-controller/pull/1) repairs
  dependency staging in its owning package. It materializes the npm dry-run file
  inventory as independent files, preserving bytes and executable flags within
  the verified package root. The exact hard-link regression changes from one
  failure to one pass. Its 195 Node tests, seven runtime-install tests, spec,
  architecture, type, boundary, CLI build and publint checks pass; a fresh Linux
  Docker environment also builds and verifies the installed CLI. Source CI
  [38463053946](https://github.com/lapismd/ai-controller/actions/runs/38463053946)
  and the specification workflow pass at
  `11c70f4390190b8f9e1bc0d06ed349df5c142754`. Notes pins that exact validation
  candidate; the default Controller workspace's newer unpublished work remains
  separate and npm SDK ranges stay portable.
- The Web server failure came from a mode-0600 bootstrap file owned by the host
  runner rather than the container's `deno` user. The fixture now seeds the
  credential through stdin into a private service-user-owned Docker volume,
  mounts it read-only and removes it after acceptance. Assertions and deadlines
  are unchanged. The exact server-host test passes 1/1, followed by complete Web
  acceptance 10/10. Fresh macOS packaged smoke passes with the committed repaired
  Controller candidate. The final repair also passes 70 release-tool tests, Web
  package check, specification/App-ownership/metadata gates and actionlint;
  fresh complete GitHub execution remains the source qualification gate.

### Completed source qualification and authorized merges

[Notes CI 38465829736](https://github.com/lapismd/lapis-notes/actions/runs/38465829736)
passes at `96fdc2a78700b802616a90ed6b348c5609844438`. All 12 jobs execute
successfully: build cache, governance, quality, units, static catalog, all 243
interaction/accessibility scenarios, exact-source signed fixture, complete Web
acceptance 10/10, both native macOS/Linux packages and cold smoke, artifact
planning and the blocking aggregate. Neither platform nor the server scenario
is deferred. Native package candidates and controller manifests are retained.
LN-PKG-161, LN-PKG-162 and LN-PKG-163 are now Implemented.

The user explicitly authorized merging green, ready source PRs on 2026-10-13.
Controller PR 1 merged as `b2d26dd37c169803dac783930b3982aad9f5bc34`; its
post-merge CI and specification workflow pass. Plugins PR 6 merged as
`801016d5f92b9fcbc9ce34b974ee149bbff761f7`; its dependency image build and
post-merge source CI 38466424509 pass. Their original
source commits remain pinned by Notes, preserving qualified provenance. The
newer local Sync and Controller changes remain separate. Notes PR 13 merged as
`82dc778f7a7af259b91f02f618d23ed4124286ae` after its complete source CI passed.
This documentation follow-up records the completed qualification on that merged
source.

### Approved metadata signing and remaining release gates

The user explicitly approved production registry metadata signing on 2026-10-13.
The review branch's signing workflow ran with
`source_ref=review/static-registry-v2` and `approval=REGISTRY_SIGN_APPROVED`.
[Signing run 38468415141](https://github.com/lapismd/plugin-registry/actions/runs/38468415141)
passes; [generated-only PR 13](https://github.com/lapismd/plugin-registry/pull/13)
adds 13 verified Ed25519 metadata signatures without changing artifact payloads,
URLs or trust keys. Its
[CI 38468536572](https://github.com/lapismd/plugin-registry/actions/runs/38468536572)
passes strict remote validation, committed generation, statistics, Astro/site
build, 77 script tests, 17 browser cases and formatting. It merged into the
review branch as `7f9123c32a2de604c64fadca9eece161644e031f`. The original
`pnpm registry:verify-signatures` reproduction now verifies all 13 signatures
locally instead of failing on the absent index signature.

At this checkpoint, `registry-production` has no GitHub required-reviewer rule;
approval came from the user and the workflow's explicit approval input.
[Final source CI 38468859557](https://github.com/lapismd/plugin-registry/actions/runs/38468859557)
passes the same complete qualification on the integrated signatures. Registry
PR 12 merged as `deda38b110809e42e5afd0ca6ed46c63edbda5ef`. Its main-triggered
Publish registry workflow initially skipped under the disabled deployment gate.

Notes' documentation follow-up CI 38468104497 passes both native packages but
records Web acceptance 9/10: its trace shows `ERR_NETWORK_CHANGED` aborting
Chromium's initial server module downloads before the sign-in UI can mount.
Server readiness succeeded; runtime code, assertions and deadlines are unchanged.
The final documentation candidate passes fresh complete
[CI 38470239737](https://github.com/lapismd/lapis-notes/actions/runs/38470239737):
all 12 jobs execute successfully, including 243 interaction/accessibility cases,
Web acceptance 10/10 and both cold native packages. Notes PR 14 merged as
`eedb9e3d700ad3a7428905e9fd5aa2910b7a105f`.
Notes' post-merge Release workflow 38467732222 also passes its full validation
graph on the merged source, including native and browser acceptance.

npm plugin publication and registry release dispatch remain separate approval
gates. Neither operation has been performed during this continuation.

### Approved production cutover and media correction

The user explicitly authorized registry deployment after the remaining CI
prerequisites passed. `STATIC_REGISTRY_V2_DEPLOY_APPROVED=true` and the explicit
`REGISTRY_DEPLOY_APPROVED` input enabled
[deployment 38471947611](https://github.com/lapismd/plugin-registry/actions/runs/38471947611)
from `deda38b110809e42e5afd0ca6ed46c63edbda5ef`. The public catalog verified
13 metadata signatures against the existing pinned keys, matched the merged
source, retained the V1 archive and served the correct Word Count archive digest.
Optional download statistics remain unavailable; the site renders that state.

The user then identified the missing generated screenshots. Comparison with
the local source preview at `http://127.0.0.1:4323/` confirms shared templates
and different data: production lacked all 11 banners and galleries, so its
conditional split hero and carousel did not render. The local preview also
includes unpublished Slides as coming soon; the released catalog has 11 entries.

The existing metadata-only refresh imports presentation data from qualified
Plugins source `61bf175f21d91f17e06a071bdaadbaf5d87645a1`, without npm
publication or plugin-release dispatch. All 11 entries now carry their banners,
22 gallery cards and 160 hashed image references. Existing release versions,
archive URLs, digests, sizes and archive licenses are preserved. Missing-media
verification changes from 11 failures to 11 passes. All image bytes, hashes and
dimensions verify; 17 focused tests, 77 full scripts, 17 cold browser cases,
strict remote validation, Astro check, formatting and a test-signed artifact
containing every referenced image pass.

[Protected signing 38473387204](https://github.com/lapismd/plugin-registry/actions/runs/38473387204)
refreshes all 13 production metadata signatures. Generated-only Registry PR 15
passes [CI 38473508851](https://github.com/lapismd/plugin-registry/actions/runs/38473508851)
and merges into the media source branch. Registry PR 14 merges as
`6c3ee00191f704998ca960cd9724c16098e63628`; its integrated source
[CI 38473792520](https://github.com/lapismd/plugin-registry/actions/runs/38473792520)
passes. GitHub main has no required-check protection, so `gh pr merge --auto`
merged immediately rather than waiting. The automatic deployment
38473856963 was cancelled, and the deployment variable was temporarily disabled
to retain the prerequisite gate while main CI completed.

[Main CI 38473856962](https://github.com/lapismd/plugin-registry/actions/runs/38473856962)
passed, then authorized [deployment 38474113988](https://github.com/lapismd/plugin-registry/actions/runs/38474113988)
published the corrected media catalog from `6c3ee00191f704998ca960cd9724c16098e63628`.
Live verification matches all 13 signatures and all 160 image hashes and sizes,
retains the signed V1 archive and verifies the Word Count archive digest.
The production detail page visibly renders the generated banner and gallery.

Live production Web install acceptance records one failure: Chromium rejects
the GitHub release archive request because the origin response lacks CORS
headers. Metadata and direct server-side archive integrity checks pass. The
remaining browser archive-delivery boundary belongs to Registry artifact
hosting and the Notes verified download transport; fixture acceptance does not
establish production browser delivery.

The new Plugins dependency-image PR 7 remains unmerged.
[CI 38471857848](https://github.com/lapismd/lapis-plugins/actions/runs/38471857848)
passes prerequisites, image resolution, builds, quality, units, static catalog
and artifact verification, but records two AI model-refresh story failures.
No assertions, deadlines or test requirements were weakened.

### Published changelogs and retained version pages

Source manifests have advanced beyond published versions. The metadata importer
previously extracted only the current manifest's Changesets section, leaving
all 11 published releases without notes. The exact-version regression changes
from one failure to one pass. Release, metadata and local-preview syncs now
request every retained version independently, preserve missing historical notes,
and never assign unpublished notes to an older release. The curated entry
schema now validates the strict structured note contract; its regression also
changes from one failure to one pass. Only notes change in the 11 source entries.

All 13 retained versions match the signed V1 archive, including the calendar
releases of Graph and Markdown Lint. Every immutable archive retains its signed
manifest, hash and size. All published first-party versions have exact source
notes; the two calendar releases have no matching source notes and retain the
unavailable state. No unverified Nostr projection was imported.

Lapis's `PluginBrowserDetail.svelte` supplies the version-selection reference.
The site now has a Details dropdown, shared version-specific static pages,
selected compatibility/date/size/notes and immutable download targets. Install
opens the existing verified file-installer instructions and identifies historical
versions; pending, inactive and revoked download targets remain unavailable.
Presentation data remains shared across releases, as in Lapis's registry view.
The two version/browser regressions change from two failures to two passes.
Final local qualification passes 81 script tests, 19 cold browser cases, strict
remote verification of all 13 archives, Astro check/build and formatting using
isolated test metadata keys; production keys remain in protected CI.

[Source PR 16](https://github.com/lapismd/plugin-registry/pull/16) contains the
verified fix. [Protected signing 38475946908](https://github.com/lapismd/plugin-registry/actions/runs/38475946908)
and [signed CI 38476084133](https://github.com/lapismd/plugin-registry/actions/runs/38476084133)
pass; generated-only PR 17 changes only 11 detail payloads and signature
sidecars. It merges as `e0924a6aacf7390ace37120899e18a43a537b50e` after all
81 script tests and 19 cold browser cases pass. Local verification confirms
13 production signatures and unchanged retained archive contracts.

[Integrated CI 38476370006](https://github.com/lapismd/plugin-registry/actions/runs/38476370006)
passes the complete source qualification. PR 16 merges as
`36d5fda8759ba23022001089832f692ef380e3d3`; its tree is identical to the
qualified signed candidate. Merging used explicit completed-check inspection
and exact-head guards, with no reliance on GitHub auto-merge.

[Main CI 38476734910](https://github.com/lapismd/plugin-registry/actions/runs/38476734910)
and approved [deployment 38476735175](https://github.com/lapismd/plugin-registry/actions/runs/38476735175)
pass on the merged source. Live verification matches all 13 signatures,
160 media hashes/sizes, 13 retained version pages and immutable archive redirects.
All 11 published changelogs match signed source. Production browser acceptance
passes older Graph selection, persistence and the selected archive installation
dialog; the local-only pending-source case is intentionally skipped remotely.
Native browser review confirms Source Editor's notes and the older Graph selector,
compatibility and archive. Local comparison remains running on port 4323.

## Historical integration handoff

The 2026-10-12 handoff paused final local verification after integrating the
following changes. Its local evidence is retained below for chronology.

## Integrated repositories

| Repository      | Default workspace          | Integrated change                                                                                                                             |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Lapis Notes     | `lapis-notes`              | `txxznsov`: Plugins view, API-owned schema, registry details, host readiness and macOS bootstrap repair; preserves the existing main lint fix |
| Design Core     | `design-core`              | `kpkvkppn`: safe areas, settings typography, line-tab indicator, teleport teardown and cold catalog preparation                               |
| Lapis Plugins   | `lapis-plugins`            | `sqmkvprm`: static release qualification, parked Community exclusions, AI readiness/model refresh and History chrome; preserves Sync planning |
| Static registry | `../lapis-plugin-registry` | `nymuyrwy`: revived Astro registry, shared API schema, media, filters and download statistics                                                 |

Each local `main` bookmark points at its integration. Archive bookmarks preserve
both the review tips and previous default states. Community runtime and
Nostr/relay discovery remain deferred; Community presentation references do not
reactivate its runtime. Older unrelated release, Sync and Community workspaces
are preserved.

## Source-review sequence

1. Fetch the GitHub remote through Jujutsu and inspect new upstream commits,
   branch protection, package availability and the CI prerequisites. Reconcile
   upstream changes without dropping the locally integrated commits.
2. Create a `review/static-registry-v2` bookmark from local `main` in each of the
   four repositories. Push that bookmark and open a PR to GitHub `main`, using
   `origin` for Notes, Design Core and Plugins, and `github` for the static
   registry. The registry's `origin` is the older Forgejo remote.
3. Let PR CI verify the candidates. Do not push directly to remote `main` for
   the first verification: Notes and Design Core also have main-triggered
   release and Storybook Pages workflows; the registry has a gated
   main-triggered Cloudflare deployment.
4. Resolve each CI failure in its owning repository. Require actual execution
   of all required jobs; a green aggregate with deferred/skipped jobs is not
   final verification. Keep per-repository counts and retain candidate artifacts.
5. Merge PRs only after required CI passes and any remaining review gates are
   accepted. Package publication and deployment require a separate release
   approval, dependency order, and production credentials.

## Current CI coverage and remaining gates

| Repository  | Existing PR checks                                                                                                                                                                                                    | Remaining coverage or prerequisite                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Design Core | `ci.yml`: governance, quality, units, static catalog, Storybook interactions, Workspace/Shell/Shadcn/AI browser suites, full/production audits and aggregate validation                                               | Completed: all 11 jobs executed successfully on the released source.                                                                          |
| Notes       | `lapis-ci.yml`: governance/release intent, quality/ownership, units, static catalog, full interactions, complete Web, signed fixture, native macOS/Linux packages, package/artifact planning and aggregate validation | Completed: all 12 jobs pass in CI 38465829736, including native Linux cold smoke; PR 13 is merged.                                            |
| Plugins     | `ci.yml`: published-framework prerequisite, build cache, audit/package/spec checks, units/release tests, static catalog, full interactions, pack/archive verification and test-signed artifact planning               | Completed: all nine source jobs pass and PR 6 is merged. Production publication and signing remain separate gates.                            |
| Registry    | `checks.yml`: frozen install, strict remote artifact validation, generation/signatures, statistics, Astro check/build, unit/browser tests, formatting and generated-tree consistency                                  | Completed: approved signing, full CI, media/changelog publication and version pages pass. Production browser archive CORS remains unresolved. |

Clean CI cannot consume ignored checkout-specific hooks or local tarballs.
The framework prerequisites are now published. Notes' documented validation-only
fixture lane builds exact Plugins candidates while retaining registry semver
manifests and lockfiles. Its ephemeral keys establish acceptance evidence only.
Do not disable audits, ownership, signature, strict remote, or prerequisite checks
to obtain a green run.

## Local evidence and review status

Before integration, Notes recorded 18/18 root check tasks, 18/18 test tasks,
1,246 tests, 10/10 build tasks, 54/54 affected stories, 243/243 full stories and
10/10 web tests. The subsequent desktop regression changed from one failure
and four passes to 5/5 passing focused tests; desktop tests recorded 218 passes
with one existing skip. A fresh macOS arm64 ad-hoc package passed its first cold
smoke without refresh. Those results precede this merge and do not establish
final verification of the integrated tree, Linux acceptance, production signing
or notarization.

Design Core's latest focused catalog source tests passed 5/5 and serial cold
pointer reproduction passed 2/2. Full checks stopped on missing mapped spec
updates, now included. The final helper-import adjustment still needs a cold CI
run. UI stories remain visual-pending and no baseline update is included.

The four task review workspaces are retired after owned servers stop. Their
complete directories, including ignored evidence, fixtures, dev data and local
hooks, are preserved in macOS Trash under timestamped names. Existing local
installs may reference the retired paths: refresh them through released npm
packages or a documented validation setup before restarting review services.
