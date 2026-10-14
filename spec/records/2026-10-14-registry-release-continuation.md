# Registry release continuation — 2026-10-14

## Final plugin publication and catalog deployment

The user approved the exact twelve-plugin production batch, protected signing,
npm publication, Slides bootstrap and trusted-publisher setup, GitHub release
assets, registry dispatch, and deployment. No new release approval is pending.

[Production run 38570118242](https://github.com/lapismd/lapis-plugins/actions/runs/38570118242)
published the batch from `48141a6e4571338c137ac8d44095704199a59083`:

| Package (`@lapis-notes/`) | Version |
| ------------------------- | ------- |
| ai                        | 0.1.5   |
| bases                     | 0.1.3   |
| bookmarks                 | 0.1.3   |
| graph                     | 0.1.3   |
| history                   | 0.1.4   |
| markdown                  | 0.1.6   |
| markdown-lint             | 0.1.2   |
| search                    | 0.1.3   |
| slides                    | 0.1.0   |
| source-editor             | 0.1.2   |
| spellcheck                | 0.1.3   |
| wordcount                 | 0.1.2   |

All twelve public npm tarballs match the reviewed bytes. All twelve public
plugin archives match the reviewed runtime files and verify with the existing
app-pinned `lapis-plugin-release-2026-06` key. Eleven npm provenance records
bind this source and production run. Slides' approved initial publication used
the authenticated local session and browser MFA; that bootstrap has no npm
provenance. Its GitHub trusted publisher is configured for subsequent releases.

The production artifact uploader skipped the hidden `.release` directory, so
the verification plan was reconstructed from public production assets and
labelled with its verification origin. Plugins PR 15 fixes retention, explicitly
enumerates all 50 required public files, and fails if no files match. Its actual
upload-action glob replay changes from zero to 50 retained files; 108 release
tests and all nine CI jobs pass. The fix merged as
`defa3d061ae7b985c8d19b8de794540b4e146842`.

Registry dispatch generated ten overlapping import PRs. AI and Slides imports
exposed a site test tied to the old AI version and absent Slides entry. The
consolidated [Registry PR 31](https://github.com/lapismd/plugin-registry/pull/31)
imports all twelve verified releases and derives expected pages from curated
inputs while preserving parked-plugin exclusions and immutable historical
install coordinates. The individual PRs 21–30 are closed as superseded.

[Protected signing 38583067310](https://github.com/lapismd/plugin-registry/actions/runs/38583067310)
created generated-only PR 32. Its full checks pass and it merges into the source
branch. Integrated [CI 38583648010](https://github.com/lapismd/plugin-registry/actions/runs/38583648010)
passes before PR 31 merges as `08ef1947473539bc9f08aacf9523ec9b5209786c`.
[Main CI 38584064216](https://github.com/lapismd/plugin-registry/actions/runs/38584064216)
and [deployment 38584064382](https://github.com/lapismd/plugin-registry/actions/runs/38584064382)
pass at that merged source.

The deployed site includes the UTC snapshot timestamp below the copyright,
full-page highlighted manifest with raw JSON access, styled native version
selector, and optional compact author download count. Missing, malformed or
stale statistics hide both the count and detail section. The timestamp comes
from the published source commit independently of reproducible metadata dates.
The existing local preview remains running on port 4323 with the same UI.

Final qualification passes 88 scripts, 25 cold local browser cases, strict
remote validation of twelve entries, Astro check, and formatting. Production
verification passes fourteen metadata signatures, 25 version pages and archive
endpoints, all 168 media hashes/sizes, thirteen retained release contracts and
all 49 unchanged V1 files. Streamed Word Count 0.1.2, Graph 2026.6.6 and Slides
0.1.0 archives match their signed sizes and hashes. Nine applicable production
browser cases pass. Two extra live probes expected synthetic local fixture
media; their exact local cases pass, and the real production screenshot viewer
and version picker were verified directly without weakening assertions.

## CI and consumer refresh

All eleven active repositories covered by the protection update require strict
passing checks and enforce them for administrators. Notes requires all twelve
jobs, Plugins all nine, and Registry its complete checks job. Merges use
completed-check inspection and matching-head guards.

The approved shared CI image `2026.10.14.1` includes checksum-pinned GitHub CLI
2.102.0 and has digest
`sha256:91341a81cc9306eed818c4c433cd29ed11d2ea64c703f32685391befe0eca503`.
Plugins PR 14 and Notes PR 22 refresh their consumer images after complete CI.
Mira 0.0.4 is published under `latest`; API 0.1.3 and Workspace 0.2.1 are
published under `next`, with verified integrity and release records.

Notes PR 23 refreshes eleven root plugin ranges and three private profile
ranges through public npm, plus portable pnpm/Deno locks and the rebuilt
dependency image. Slides remains an installed plugin. Fresh root build passes
10/10 tasks, profile check has zero diagnostics, profile tests pass 14/14 and
38 specification regressions pass. The initial profile check ran before internal
dist builds and reported 79 missing-module diagnostics and one failed suite;
the same targets pass after the required build order.

The exact PR governance gate initially reports three missing host/profile
chapters. Its mapped canonical documentation repair changes that count to zero;
specification checks and mirrors pass. Incidental API version-inventory output
is excluded from the overall PR: this private dependency refresh does not add
a public API release. The complete final CI and merge evidence follows below.

The next CI head reports one Markdown Problems failure from a detached gutter
child lookup and one server-host restart failure from Chromium
`ERR_NETWORK_CHANGED` during Docker bridge recreation. Both exact local targets
pass before and after the repairs. The gutter play now resolves connected
markers and their existing style assertions in one retry; server acceptance
retains a test-owned network namespace while still requiring clean serving
container shutdown, recreation and data persistence. Root check passes 18/18,
the editor-demo family 14/14, the cold full Storybook lane 245/245, and the
complete signed-fixture Web lane 12/12 against a freshly rebuilt server image.
Specification checks, 38 regressions and formatting pass. The final candidate
`75d046319469b323202dbf762c4e9a3134416d68` was checked on
[CI 38588198443](https://github.com/lapismd/lapis-notes/actions/runs/38588198443).

That run passes both native packages and gets past the original gutter lookup,
but the story's fixed two-problem badge expectation fails later. The fixture
enables Harper alongside Markdownlint, whereas LN-WS-046 requires the complete
diagnostic total. The corrected oracle retains exact MD018/MD025 checks, rejects
workspace-wide provider failures, and compares the painted badge with the full
App snapshot. Its exact local target and all fourteen editor-demo cases pass.
The Web trace also records `ERR_NETWORK_CHANGED` on initial navigation, so the
server case now launches a dedicated browser worker after Docker setup. Its
exact local target passes, root check passes 18/18 and specification regressions
38/38. The complete repeated interaction/Web/native lanes run in CI as the user
requested; no assertions, timeouts or publication protections are relaxed.
Candidate `ab90e52a0c31c132082b3eca3bc29cd941faa324` passes all twelve jobs on
[CI 38592528412](https://github.com/lapismd/lapis-notes/actions/runs/38592528412).
The complete interaction lane passes 245/245 stories plus 8/8 Specification
browser cases; Web passes 12/12, and native macOS/Linux packaged acceptance
both pass. Strict required checks and the matching-head merge guard are verified
before PR 23 merges as `e1d7de1f8e6a39c16d6906c04e302cd89899c2ac`.
The approved plugin/catalog release and consumer refresh are complete; no
publication, signing, dispatch or deployment gate remains in this plan.

Private packaged-app publication, notarization, Community and private Sync are
outside this plugin/catalog release. Existing clients need the updated app build
to receive the new app-link and verified browser delivery behavior.

## Earlier qualification history

## Archive delivery

The registry's signed `bundle.downloadUrl` redirected browsers to GitHub, whose
release-origin response lacks CORS headers. The API installer also ignored that
signed endpoint and fetched `bundle.url` directly.

The registry now streams only generated active release targets with public CORS,
keeps browser credentials and caller URLs out of upstream requests, and returns
readable gateway errors. Pending, unknown and revoked targets remain unavailable.
The updated installer prefers the selected release's signed endpoint and retries
the same signed origin for transport failure. Cancellation, revocation responses
and failed archive verification stop fallback. Hashes, sizes, embedded signatures,
runtime checks, selected versions and installation policy remain enforced.

[Registry PR 20](https://github.com/lapismd/plugin-registry/pull/20) passed source
CI and merged as `703f7d7f3ae287d4633343ece4993e1b15bee8f1`. Main CI
[38532157684](https://github.com/lapismd/plugin-registry/actions/runs/38532157684)
and authorized deployment
[38532157765](https://github.com/lapismd/plugin-registry/actions/runs/38532157765)
pass. Generated signed metadata and immutable archive contracts are unchanged.

Local evidence: two endpoint failures become two passes, all ten Function cases
pass, and complete checks pass 88 script tests and 22 browser cases. A cold Pages
runtime and production delivery both verify the original Word Count 0.1.1 and
Graph 2026.6.6 sizes and hashes without a browser redirect. Wrangler state is
ignored and excluded from source commits.

API evidence: seven installer failures become seven passes; all 172 distribution
tests, root check/test/build (18/18, 18/18, 10/10), 56 affected stories and 245 full
interaction/accessibility stories pass. Rebuilt server-host and full signed-fixture
Web acceptance pass 12/12. The exact production Plugins/Word Count installation
case changes from one failed Fetch install to one pass after registry deployment.
Specification and ownership checks pass. The API patch Changeset records the fix;
[PR 17](https://github.com/lapismd/lapis-notes/pull/17) passes all 12 jobs on
[38535445346](https://github.com/lapismd/lapis-notes/actions/runs/38535445346)
and merges as `57106f40e2696164c9d7503e601ffd22983d3036`.

## Plugin CI

[Plugins PR 7](https://github.com/lapismd/lapis-plugins/pull/7) passed all nine jobs
on CI attempt 3 and merged as `4589f345aa879ccbb27a454f2272878bc602ee7d`.
Its main run reproduced the two original AI model-refresh failures. Runner labels
are valid and jobs execute; this is an interaction-readiness failure.

The source follow-up waits for the selected harness and completed catalog loading,
fully dismisses the focused menu and parent, and observes restored pointer ownership.
The first explicit readiness repair reproduced two local failures; complete
dismissal passes both exact cases, 23 Chat stories and all 177 catalog stories.
The earlier isolated File Properties `derived_inert` warning does not recur in
this repaired local full lane. Its fatal guard remains enabled. PR 8 run 38538436172 still reports two failures: a closed model submenu and
next-story pointer lock. It merged prematurely as `14c4cf39`; that merge is not
release qualification. A source follow-up and complete green CI remain required.

## Publication state

Workspace version PR 16 merged as `879a68a80e0bde639f28099ab763bb044bc5951c`
after complete 12-job CI. The main Release run is green but its npm publication,
verification and GitHub-release jobs are skipped. npm still exposes Workspace
0.2.0 and API 0.1.2 under `next`; Workspace 0.2.1 and the API patch are pending.

The active plugin batch remains the twelve public packages, including Slides.
Community and private Sync are excluded. New npm packages, protected production
plugin signing/publication and registry release dispatch have not run in this
continuation. `STATIC_RELEASE_ENABLED` is unset; existing framework/first-release
variables do not replace explicit approval for this release batch.

After source CI and version preparation, publish approved framework packages,
then the exact qualified plugin source through its protected static workflow.
Review generated registry release PRs, retain older versions and archive hashes,
and deploy after checks. Existing installed clients need the updated app build
to use the new app-link and browser delivery behavior.

## Version-note preparation repair

Generated API 0.1.3 PR 18 omitted its notes. Release run 38537431130 logs a
missing `prettier-plugin-jsdoc` while Changesets still succeeds. The API config
now gives Markdown its built-in formatter independently of optional code tools.
A Prettier 3 regression changes from one failure to a pass; all four focused
cases and 74 complete release-tool tests pass. Root check passes 18/18, and
specification, ownership, 38 spec regressions and release intent pass. Release checks require non-empty
notes for each current public package version before and after versioning.
The original API 0.1.2 Changesets consumed in `e2a0b8e6` restore its omitted
source entry. An isolated exact `pnpm release:version` produces API 0.1.3 and
its signed-delivery notes, preserves older notes, and passes both gates. No
published package is modified. PR 18 must be regenerated after the source repair
and qualify at its resulting exact head before merge or publication.

## Workspace navigation acceptance

PR 19 run 38540407674 passes eleven jobs but fails one Persisted Desktop
assertion: Manage Vaults has not run immediately after the menu click. GitHub
protection leaves the PR blocked. Design Core correctly defers that host action
to `onOpenChangeComplete`; the play now waits for the selected-action status,
closed trigger, removed portal and restored pointer ownership. The original
cold local target passes 1/1 before the change despite the CI failure; the
repaired target passes 1/1, all six Shell stories and the affected 40-story
shard pass. Root checks pass 18/18; specification, ownership and 38 specification
regressions pass. Runtime source, package versions and visual baselines are
unchanged. Complete GitHub CI at the updated head remains required.
