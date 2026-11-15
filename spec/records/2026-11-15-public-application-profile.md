# Public application profile qualification

## Scope and source

LN-PKG-132 makes App Profile a published package with built public exports.
LN-PKG-191 adds explicit failed-startup retry required by its portable session.
Hosts retain vault admission, storage, native services and distribution policy.
This source starts from Notes `285eac57`. The committed session, build exports
and Repository adapter are integrated from Notes `1c790698`; current native-chat
source is retained. Publication and actual host acceptance remain separate gates.

Server's existing registry profile `0.1.0` depends on API `^0.2.4`. Its frozen
consumer has five missing-skill API diagnostics. A temporary API `^0.6.2` /
Workspace `^0.4.4` intake leaves four incompatible-App diagnostics because the
profile still loads API `0.2.8`. Those probe manifests and logs remain ignored
in Server `.local/skills-registry-intake-20261115`; tracked probe changes were
restored. The initial check overlapped installation and produced 93 transient
diagnostics; it is discarded as qualification and the stable check was rerun.

## Focused results

- `node --test scripts/check-package-boundaries.spec.mjs`: the public profile
  regression failed once before release-graph integration and then passed.
- `node --test scripts/check-package-boundaries.spec.mjs
scripts/release-plan.spec.mjs scripts/release-manifest.spec.mjs`: initially
  13 passed / one failed because the expected release order omitted App Profile;
  the explicit expected order now includes it. The rerun passed 14/14.
- Profile `check`: initially six diagnostics (four missing built dependency
  exports and two missing startup-retry signatures); after dependency builds
  and the source fix, zero errors and warnings. Profile build passed.
- Profile `test`: 17 files / 96 tests passed before coherent-cohort revalidation.
- Exact Vault/SyncHost retry tests failed 2/2 before the implementation and
  passed 2/2 after. Added active-load joining and disposed-host cases pass too:
  the exact two-file target passes 4/4.
- The API suite passed 182 files / 1,806 tests before the two added boundary
  cases; its full rerun remains required. API build, publint and packed type
  contracts passed. The API `check` attempt reached the Docker runner but
  refused its stale frozen lock; this is not a passing check.

## Retained aggregate attempts

The first local specification validation found three authoring failures:
missing acceptance-list introduction, a 406-line storage chapter, and a detached
verification row. The requirement now lives in App/services, the list has its
introduction and the row belongs to the existing table. The exact validator
rerun passed 11 validators, 194 chapters and 1,592 requirements.

The first Docker `ci:release` archive run passed package/release policy and all
110 release tests, then stopped on that earlier specification snapshot. Receipt:
`.local/validation/runs/lapis-notes-validation-66855fe5-b889-4965-9897-55290dbb2521`.
The later native spec aggregate passed validation/mdBook before identifying
missing cross-cutting canonical confirmations. Those confirmations are being
updated without changing the protected-path rules.

## Temporary plugin acceptance inputs

The plugin publication workflow was dispatched separately for the 16 unpublished
versions from `2dd74261017bb9b4eaf00f63cbd5384772aec343`, after authenticated
trusted-publisher inspection passed all 17 packages. History `0.3.1` was already
published. While GitHub execution is queued, the owning source built and packed
these explicit temporary acceptance inputs:

| Package       | Version | SHA-256                                                            |
| ------------- | ------- | ------------------------------------------------------------------ |
| Markdown      | 0.3.0   | `12a357772a4dbab1f1da0965f58592c2c3093e9a904f3c3b1484498bdd422148` |
| Search        | 0.1.12  | `65318227e515707f9b66f13673488fa1a5079fe63871eaab1bd7cb157d84fea6` |
| Source Editor | 0.1.11  | `60fd66258bffc191e099407d6a57292b9cc7cf6b0a9cddcf9420bfc2855c906f` |

Archive manifests, provenance and payloads live in ignored
`.local/profile-plugin-archives`. They qualify local source consumption only.
Tracked final manifests and locks must resolve released registry packages.

## Remaining gates

Complete coherent package check/test/build, specification/mirror/release checks,
audit, cold interaction/accessibility and packed consumer acceptance. Then
commit and submit the verified source, qualify its version PR and publish API
and App Profile through the existing protected workflow. Registry verification,
Server/CLI and Desktop intake and their cold host checks are still pending.
Visual baselines remain unchanged and review remains pending.

## Follow-up qualification

The coherent plugin-cohort package aggregate passes all 27 check/test/build
lanes. After byte-preservation coverage, it passes 2,175 unique package tests,
including 1,813 API and 96 App Profile cases. Receipt:
`.local/validation/runs/lapis-notes-validation-04c8a1cd-a07c-4f1d-acd0-67cf304c00df`.
The intermediate byte implementation had one ArrayBufferLike type diagnostic;
copying encoder output into an owned ArrayBuffer repairs it without a cast.

The lossy-decoding skill regression fails before the fix: invalid UTF-8 can
hash as replacement-character text and permit an earlier file update before
conflict. Raw-byte snapshots and the optional public conditional-byte port now
skip the entire skill. All 58 focused installer/browser/memory cases pass.
API public build, publint and packed type contracts pass. The real filesystem
browser acceptance passes for both adapter modes and a cold browser process,
including preserved invalid UTF-8 reference bytes before and after restart.

The first coherent catalog intake exposed two obsolete consumer assertions:
Bases now reports Unsupported view and preserves the configured timeline;
Mira 0.2 removed data-mira-theme. The exact Bases case passes with the owner's
current contract. The preview case passes with the actual CodeMirror foreground
compared to the supported Mira token and the focus color compared to the Lapis
workspace token. Equating editor foreground to preview container chrome was an
incorrect extra assumption: the two palettes are distinct. Persistence, dirty
buffer, scroll and dismissal assertions remain intact. Exact preview receipt:
`.local/validation/runs/lapis-notes-validation-8cc5605e-575e-4485-9e30-aa591674b212`.

The original plugin release run 43692854488 was cancelled before signed
candidate preparation or publication. AI, CSV and Markdown excluded UI 0.2
while admitting API 0.6, which requires it. Their owning repository is correcting
and qualifying the public peer ranges; Notes' final registry lock must use that
replacement release. No public asset was replaced.

The old registry lock audit reproduces the same advisory set and counts on
unchanged main: nine low, 36 moderate, nine high and two critical instances.
The source raises Storybook and Vite minimums to patched releases; the fresh
registry-lock audit remains a release gate. No audit waiver is added.

The complete cold Notes interaction/axe lane now passes all four shards:
102 + 72 + 48 + 63 = 285 stories, zero failures. Receipt:
`.local/validation/runs/lapis-notes-validation-5aaf3c00-3df6-41e9-873e-5e2e5f322736`.
The current specification aggregate passes six lanes plus all 67 governance
regressions; all 15 release graph/boundary/manifest regressions pass. These
archive-based source results do not replace final registry-lock/audit, packed
cohort qualification or the actual Server/Desktop consumers.

The corrected plugin peer cohort is submitted as
[Plugins PR 128](https://github.com/lapismd/lapis-plugins/pull/128), head
`79d05911d1e93a9fda09f566877278e218dedb02`. Its owning-source aggregate
passes 1,478 package, 231 release and 449 cold browser cases.
Before App Profile publication, its versioned API dependency MUST be raised
to the release carrying this slice (now expected `^0.6.4`): the portable session requires the new explicit retry
behavior. The source baseline remains API 0.6.2 plus its pending patch Changeset;
verify the actual version PR's minimum rather than assuming a compatible old
range proves that behavior.

## Updated main intake

The profile source is rebased onto Notes main `e0f13024`, which includes the
committed native Sync App contracts and bulk plugin management. Upstream owns
LN-PKG-188 through LN-PKG-190; the staged startup retry and conditional-byte
requirements are now LN-PKG-191 and LN-PKG-192. Both contracts and verification
rows are retained. Main versions API 0.6.3 and Workspace 0.4.5; this slice now
requires the subsequent API patch (expected 0.6.4) for retry and byte guards.
The versioned App Profile minimum must identify that actual release. Earlier
package and interaction receipts remain historical qualification, and combined
main intake must run the affected full lanes again.

The combined main intake passes all 27 package check/test/build lanes and
2,184 unique package tests, including 1,822 API and 96 Profile cases. Receipt:
`.local/validation/runs/lapis-notes-validation-30df115c-b0a4-40d4-a048-6687bd055ca6`.
The complete cold interaction/accessibility lane passes 289 stories across
four batches (105 + 72 + 48 + 64), zero failures. Receipt:
`.local/validation/runs/lapis-notes-validation-59b3ca4b-89bb-4e6d-851b-373200715535`.
All 70 focused byte/retry/native-Sync cases pass, and the rebased specification
aggregate passes six lanes plus 67 governance cases. The existing old-registry
lock and public publication gates remain pending the corrected plugin release.

The rebased API public build, publint and packed type contracts pass. The
standalone real-browser skill-storage test also passes again (one case, zero
failures) using this newly built API, including byte preservation in both
adapter modes across a cold browser restart. Logs are retained in ignored
`.local/profile-rebase-public-api-build-20261115.log` and
`.local/profile-rebase-public-browser-20261115.log`.

## Plugin publication and final registry qualification

Plugins PRs 128 and 129 are merged. Markdown 0.3.1, Search 0.1.12 and
Source Editor 0.1.11 are published from their independently verified source;
their owner retains provenance and signed-registry evidence. The other thirteen
current plugin versions remain absent from npm, including Bases 0.4.0 and
Canvas 0.4.0. Approved release workflow 43735009696 now targets source
`1f7c091ad243670cfbe425763f36da2f5367d530` for those thirteen packages only.
History, Markdown, Search and Source Editor are unselected; replacement of
existing assets is false. Final Notes registry-lock/audit acceptance follows
actual publication, rather than replacing the tracked lock with local archives.

Notes main has meanwhile merged Design Core dependency intake and has an
independent version PR 125. Reconcile its actual released API version before
final versioning; App Profile's dependency floor must identify the release that
contains this slice's retry and byte guards, not an earlier API-only patch.

The first monitor of workflow 43735009696 exits on a GitHub API HTTP 502.
A direct run/job check confirms the workflow remains in progress: initial CI
validation passed and the static job is validating shared release gates before
signing or publication. This is a monitor transport failure, not a source or
publication failure. Monitoring resumes against the same run; no duplicate
workflow is dispatched. The original monitor log remains unchanged.

Release workflow 43735009696 subsequently succeeds. All thirteen remaining
packages publish, production signatures and checksums verify, and the normal
registry-only frozen installation passes. Their submissions merge through
registry PRs 145–157; publication PR 158 merges and production deployment
43742393802 succeeds. The current registry-based package aggregate passes
all 27 lanes and 2,184 unique cases (receipt
`lapis-notes-validation-61052158-18be-4a6a-9d4e-7cb04b0bf046`).

The [registry security record](2026-11-15-profile-registry-security.md) retains
patched advisory regressions, the user-approved exact deepmerge exception
(review by 2026-12-15), the initial full-browser transport failure and its
unchanged diagnostic passes. Normal audit exits zero. Final full browser,
source packaging, Notes publication and consumer adoption remain separate gates.
