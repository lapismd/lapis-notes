# Runtime and package integration

## Installation metadata readiness

LN-PKG-195's original source-owned engine is deployed through PR144. LN-PKG-196
now consolidates its retry/process implementation onto the qualified shared
source while preserving Notes' policy and real Vite/import/CSS acceptance.
Owning-source checks and real retained consumer acceptance pass for the changed
adapter. Hosted current-head qualification and production verification remain
separate open gates. Tasks/Docs/Mira reuse retains each
publisher's existing identity, signing and provenance checks. Exhaustion stays
a failed gate and grants no blind rerun; frozen Deno packages remain excluded.

## Legacy runtime and package retirement

User scope correction 2026-11-18: retire only Desktop-related legacy code and
Deno runtime/tooling. Preserve core API services/functions, Language Service and
future-facing integration even without current callers. Generic API removals are
excluded. The Desktop Language Service dependency/projection experiment was
stopped and recoverably parked without commit/push; its existing wiring remains.

LN-WEB-093 removes Web's frozen-host raster input with seven exact output
hashes preserved. Full Web checks, 40 tests, build and integrated canonical
qualification pass in the [integration receipt](../../records/2026-11-17-web-icon-input-integration.md).
Notes #166 passed all 12 executed hosted jobs and 13 Web cases and merged at
`6787e824`; see the [hosted receipt](../../records/2026-11-18-web-icon-input-hosted.md).
The configured interaction quarantine remains a separate skip. The frozen host itself remains until its
separate owning removal.

Status: in progress. Plugins source/catalog and Notes launcher/catalog removals
are merged and source-qualified; Notes #158 passed required hosted CI after
2,194 package tests and 239 cold interactions. Approved registry signing and
production deployment are complete. Live signed metadata, saved links and UI
reject shared AI; registry #183's approved HTTP 410 behavior is deployed and
verified across all retained versions. A reproduced legacy cached-catalog path
without a download endpoint requires the approved LN-PLUG-137 provenance guard.
Its 36 installer cases, 2,202 package tests, full release, three inspected
tarballs and 239 cold interaction/axe cases pass. Notes #161 passed required
hosted workflow `44172806383` and merged at `d369ec9d`; API publication/adoption remains gated.
Sixteen obsolete package/controller/Fake/attach implementation requirements are
archived with their original evidence. Retained Desktop ownership and native/data
acceptance remain pending. All eleven npm versions are deprecated, and each
original tarball passes independent SHA-512 verification. Website source is merged;
its manual deployment is separate. Notes #164's peer cleanup is merged and
its exact six-package cohort is qualified in Desktop source checks; complete
catalog/hosted and actual native/data acceptance remain open. LN-CAT-124 removes
the CI registry fixture's pre-retirement Plugins source input. Its guarded
post-removal producer, 18 signed catalog documents, 16 signed bundles and all
13 cold Web cases pass. Notes #165 passed hosted workflow `44198935057` and
merged at `545284a0`; the source fixture edge is closed.
Desktop #48's older fixture pin/stale local-build guard repair passed complete
hosted qualification and merged into #47's feature branch at `45d61a6c`.
Combined #53 integrates the qualified private UI, historical-fixture preparation
and Deno-bootstrap slices; fresh combined hosted and actual updated #47
qualification remain pending. Native/data acceptance is not inferred.
The [host-boundary audit](../../records/2026-11-18-retirement-host-boundaries.md)
retains portable Sync/core functions in mixed `deno-host-services`, active
Agent Redaction/controller Deno support and the stable Homebrew cutover gate.
Do not delete whole service packages or core/public functions. Terminal remains
last; only obsolete host portions and unnecessary runtime tooling are targets.
Notes coordinates the
[consolidated retirement plan](../../../docs/plans/legacy-runtime-retirement.md)
for the frozen Deno desktop, shared AI plugin, obsolete host/tooling edges and
Deno-specific interface proposals. Core API cleanup is excluded. Sibling owners retain their contracts, implementation,
qualification and release authority. Preserve Tauri-owned AI, native chat,
the API file-tools kernel, required Rust services and planned Sync work.
`nostr-agent-controller`, `community-local` and `nostr-auth` are excluded;
standalone `ai-controller` is preserved for those consumers. The 2026-11-15
audit remains dated evidence. Current bases, preparation results, verified
substeps and pending acceptance are recorded in the
[progress and resume record](../../../docs/plans/legacy-runtime-retirement-progress.md).
Source preparation does not qualify product or release gates.

## Generated version PR authentication

Owner: Notes release automation. LN-GOV-054 prepares repository-scoped App
authentication without changing the version recipe or publication approval.
Local source qualification is recorded in the
[authentication receipt](../../records/2026-11-15-version-pr-authentication.md).
Hosted deployment and a real generated candidate's ordinary CI remain pending;
do not manufacture a package bump or treat source checks as npm publication.

These entries retain outstanding integration and qualification from the retired
migration plans. They do not reopen completed extraction or hosted cutover.
Current contracts are [Rust services](../architecture/rust-application-services.md),
[web](../web-host.md), [packages](../packages.md) and [styling](../ui-and-styling.md).

## Native Sync transport detachment

Owner: Notes API and App Profile. LN-PKG-189 transport detachment and
LN-PKG-193 recoverable leave-preparation source qualification pass, including
2,290 package cases and 288 cold interaction/axe cases. Verified public archive
intake and actual Desktop/native qualification remain outstanding. App teardown must await the host's presentation-resource release after
accepted calls settle, propagate cleanup failures and leave native durable work
owned by the host. Desktop owns Tauri/native consumer integration; source-only
API tests do not qualify that boundary.

## Standalone local and offline browser qualification

Owner: Notes web and API packages. Disposition: qualification pending where no
current receipt proves the complete supported browser profile. Retain the local
browser implementation independently of native-core selection.

Acceptance: a cold local/offline browser can open, edit, persist, reload and
reopen its supported vault, metadata, Search and Tasks features without requiring
the server, Tauri or a native engine. Preserve shared conformance fixtures,
conditional writes, dirty buffers, plugin disablement and teardown. Native or
hosted receipts cannot qualify this profile.

## Optional plugin service adoption

The approved optional editing-intent observation port (LN-CORE-054) replaces
idle recovery polling only for hosts that provide invalidations. Server owns
authenticated vault-scoped delivery, reconnect recovery and actual idle-browser
acceptance. API source and development archives are qualified in the
[owner record](../../records/2026-11-12-editing-intent-observation.md); new-version
publication and host registry intake remain outstanding. Plugin activation work
is independent.

Notebook demand activation is authorized in its owning standalone repository.
The generic discovery source slice (LN-PLUG-127/128) preserves ribbon and
Markdown pane actions without eager runtime loading. Its owner release and
Graph/Canvas/Slides/Transcripts manifest adoption remain required. Binary file
embeds likewise need demand dispatch before renderer lookup. Background service
activation must preserve configured indexing, capture and ingestion work.
The shared API's concurrent deferred-activation repair is qualified separately
from Notebook manifest adoption, Markdown directive/embed activation and the
portable renderer's asynchronous embed contract. Those owner releases and
normal-registry Server/Desktop cold-start acceptance remain required before
claiming the startup issue delivered.

Owner: Notes public service contracts; plugin algorithms remain in lapis-plugins
and native implementations in lapis-server. Optional Docs host/UI adoption and
legacy AppDatabase History capture ownership remain separately deferred.
Current application profiles do not bundle the optional legacy History plugin;
its installed behavior remains client-dependent. Do not activate it or introduce
a native scheduler as documentation cleanup.

Acceptance: define the optional capability first, then prove source/public-package
conformance and each explicitly selected host's admission, disable/re-enable,
passive lifecycle, recovery and cold reopen. Existing current-profile metadata,
Search, Tasks and native repository history qualification remains valid for its
recorded revisions.

## Package and UI integration

The shared App Profile candidate restores public session exports and native
Repository registration against API 0.6 and History 0.4. Its
[source qualification](../../records/2026-11-15-native-repository-profile-cohort.md)
does not qualify production host adoption. Publish App Profile 0.2 through the
GitHub release workflow and verify its minimal registry consumer. Server and
Desktop own subsequent normal-registry intake, remotes/credential adapters,
native automatic synchronization and cold application acceptance.

The revoked-vault Sync cleanup repair is released in API `0.2.3` on npm's
`next` channel. [Publication and signed provenance](../../records/2026-10-31-api-023-publication.md)
verify its exact bytes and source `0d9d4d92`; the released-source private App
Profile archive depends on API `0.2.3` rather than retaining an older exact copy.
Desktop owns intake of those released exports and the original cold native-close
acceptance in its [backlog](https://github.com/lapismd/lapis-desktop/blob/main/spec/src/backlog.md).
Preserve admission rejection and real cleanup failures; Notes publication does
not substitute for that consumer acceptance.

Owner: each published package's source repository. Keep remaining retained UI
families and public extension points documented in their owning feature chapters;
consolidate overlapping primitives upstream in Design Core. Package releases and
consumer adoption require separate evidence of public export bytes, portable
registry ranges and the affected hosts/stories. A source checkpoint alone cannot
qualify a consumer or authorize publication.

The historical release-wave register predates newer registry releases. Future
release preparation must inspect live package versions and required public
contracts rather than treating its old wave positions as pending work.

## Temporary Bits UI lifecycle patch removal

Owner: Bits UI for the fixes; Notes owns its explicitly approved pnpm intake.
The tracked 2.20.2 patch composes Link Preview timer cancellation, all six
Slider post-destroy pointer guards and the upstream FocusScope idempotent mount
(PR #2264, owner commit `692fbdf5095941464561189fd81ffc2cb4b81c6c`). Its
[receipt](../../records/2026-10-31-composed-bits-lifecycle-patch.md) separates
source provenance, exact installed bytes and current consumer qualification.

Acceptance: select a published upstream version containing every remaining
component fix, remove the patch through pnpm, and rerun exact lifecycle/preview
regressions, affected families, complete check/test/build and cold
Storybook interaction/accessibility, static and host/package acceptance. A
FocusScope-only release cannot close the other components' removal gates.
Published framework consumers do not inherit this root patch; preserve
LN-PKG-158's independent minimal registry consumer.

## Runtime dependency security

Owner: Mira's dependency chain. A fresh registry-only API `0.2.1` consumer
resolves `rehype-katex` `7.0.1` to vulnerable KaTeX `0.16.47`, despite Mira's
patched direct KaTeX dependency. Desktop's existing bounded `0.18.10` override
mitigates its current intake; the plain published API closure remains affected.

Acceptance: qualify and release the owner dependency repair, consume its normal
registry range, and verify a fresh published API production graph without that
consumer override. Preserve public Markdown math behavior and distinct source,
publication and consumer evidence. The separate API Minimatch owner fix and
patched fresh AI Host routes do not close this pre-existing finding.

## Development dependency maintenance

Owner: Notes development/build tooling. The October 31 configured root audit
retains separate Storybook, Vite, Vitest, QMD, Undici, web-build and unpatched
`deepmerge` findings in the [security receipt](../../records/2026-10-31-api-minimatch-security.md).
The tracked release workflow has no full-root vulnerability-audit gate; this
scope statement grants no new exception and does not claim a clean audit.

Acceptance: reproduce each current finding at its owning boundary, qualify
available fixes through the affected tool and consumer lanes, and report any
remaining unsupported or unpatched route explicitly. Keep this maintenance
separate from the focused API matcher compatibility change.

## Browser-runner disconnect investigation

**CI quarantine active, November 1:** the user authorized disabling flaky tests.
LN-CAT-121 disables automatic Vitest browser interactions/axe and local release
execution, with explicit fatal manual diagnostics retained. Notes validation
tooling owns this coverage gap and restoration; see the
[quarantine record](../../records/2026-11-01-storybook-browser-quarantine.md).
Static Storybook, development specification acceptance, package tests and Web
acceptance remain blocking. Disabled coverage is not a passing result.

Owner: Notes validation tooling. The initial cold composed-Bits run passes 88
cases before a browser disconnect while starting Chat; the unchanged exact Chat
family passes six cases and the unchanged complete retry passes all 269 cases.
The [source receipt](../../records/2026-10-31-composed-bits-lifecycle-patch.md)
retains the failed run and diagnostics. The source PR, API `0.2.3` version PR and
[actual publication workflow](../../records/2026-10-31-api-023-publication.md)
subsequently pass their required hosted gates. The disconnect's cause remains
unproven; this entry tracks diagnostic follow-up rather than an unpassed release
lane.

The November 1 dependency cohort adds PR #74's History-file disconnect and
PR #75's Link Preview disconnect to the retained observations. A distinct,
reproduced late Notes UI `tailwind-merge` optimization on Mira PR #72 is repaired
under LN-CAT-120, with 19 focused and 275 complete interaction/a11y passes. That
repair does not prove the cause of every historical transport disconnect; see
[the dependency CI investigation](../../records/2026-11-01-dependency-update-ci.md).

Acceptance: retain browser stderr, child exit and live cgroup memory/peak
observations to distinguish a browser crash, resource event and transport loss.
Keep unhandled errors fatal and require the complete current-source catalog and
required hosted checks to pass; a focused family pass cannot replace those
gates. Do not add an assertion, deadline, warning or resource-limit waiver.

## Source-test exceptions owned by siblings

The final migration handoff retained plugin portable-lock/Bits UI guards and
preview-lifecycle failures as source-owned findings. It also named jj-store's
integrated-slice validation and thread-files plan as owner work. These are
historical findings, not claims about today's sibling state. Before qualifying a
consumer that depends on them, reproduce the exact owner command, preserve
failures and consume the owner's verified fix; do not add consumer shims or
waive the acceptance boundary.

## Evidence

[Consolidation reconciliation](../../records/2026-10-30-spec-consolidation.md)
accounts for every former Rust tracking row and explains superseded cutover
claims. Existing receipts in spec/records retain their original revisions,
commands, failures and qualification limits.

## Cloudflare PWA publication

- Restore installed window chrome and persistence-safe updates and browser appearance (LN-WEB-085–087).
- Qualify the prepared static artifact, automatic main publication and app.lapis.md cutover (LN-WEB-083–084), static caching (LN-WEB-088) and revision-specific installation (LN-WEB-089).

## Mobile layout registry and host adoption

LN-WS-105/106 source and built-Web qualification pass through the explicit
prepared Core archive in [the mobile receipt](../../records/2026-11-12-mobile-layout.md).
Core 0.13.0 is published and registry/provenance verified; Notes now declares
that registry line. Complete released-graph integration and hosted checks before
merging the consumer. Production deployment and the frozen
Deno native gate remain separate. Desktop owns its pending compatible archive
intake and production-root responsiveness acceptance; preserve its concurrent
dependency work. Visual review remains pending without baseline changes.

## Queued pull request base references

Notes governance currently resolves the event base through a mutable remote
branch name. A queued stacked PR retargeted after its base is merged/deleted
can fail SPEC-FIRST-VCS despite unchanged base-tree bytes. Preserve the original
failed attempt and qualify a fresh synchronize event against current main.
A future source fix should resolve/fetch immutable event SHAs with regression
coverage; no required gate is waived. See the [retirement hosted receipt](../../records/2026-11-17-retired-ai-fixture-hosted.md).
