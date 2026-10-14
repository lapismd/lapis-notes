# Registry release continuation — 2026-10-14

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
