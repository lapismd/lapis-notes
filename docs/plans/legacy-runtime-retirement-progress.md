# Legacy runtime retirement progress

Coordination owner: Notes. Implementation authorized 2026-11-17. Follow the
[agreed plan](legacy-runtime-retirement.md). Work one removal at a time; do not
start host/API cleanup while shared AI removal remains in progress. Defer the
terminal ownership migration and Deno terminal-host retirement until every other
removal and its required consumer changes have landed.
Source commits, consumer qualification and release/deployment are separate gates.

## Preparation completed

Bootstrap quarantined 45 integrated workspaces, preserving directories and JJ
registrations. Batches: `20261117T151845Z-92402` (41) and
`20261117T152216Z-9206` (4). From `workspace-bootstrap`, restore with
`./cleanup-workspaces.sh --restore <batch> --apply`. Blocked workspaces remain
untouched; no ancestry, dirty-worktree or inventory safeguards were bypassed.
Bootstrap's normal all profile cloned the missing `relay-forge-sandbox`.

All 48 previously present independent local repositories were considered for
refresh: 33 advanced, 2 current, 6 fetched with dirty worktrees preserved,
6 have no remote, and retired `lapis-plugin-cv-roles` could not fetch its deleted
remote. The newly cloned sandbox is current. Clean unmerged parents have
`local/pre-legacy-retirement-20261117-*` recovery bookmarks where needed.
See the [exact update receipt](../../spec/records/2026-11-17-legacy-runtime-preparation/repository-updates.json)
and cleanup logs beside it. Canonical dirty checkouts: `jj-acp`,
`lapis-community`, `lapis-desktop`, `lapis-plugin-terminal`, `lapis-server`,
`nostr-plugin-registry`; their changes are excluded from these fresh workspaces.

## Fresh workspaces and bases

Paths below are direct siblings under `/Users/stevejuma/code/lapismd/`.
Every workspace is registered as `retire-shared-ai` in its owning JJ repository.

| Workspace                          | Fetched main base                          | Purpose                                                           |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| `lapis-notes-retire-shared-ai`     | `29011545d526b9543551bf19e25cbaf3d94c4f64` | Coordination; later remove duplicate catalogs/probes/dependencies |
| `lapis-plugins-retire-shared-ai`   | `313b4a41b8910e2f1db2cf07a64e73ca13f26fe3` | Release safeguards, then package/catalog removal                  |
| `plugin-registry-retire-shared-ai` | `0503bac93a3a3b6c1c64f5ec0d49cecf55ba5d6e` | Disable shared package distribution; preserve history             |
| `lapis-website-retire-shared-ai`   | `7ab1f931feeee25fe99c60bf1e9b6611b84928c2` | Pending bundled/native AI guidance                                |
| `lapis-github-retire-shared-ai`    | `a324a98fedbe389acc8bee86ef3aa0b03d8ed161` | Pending organization package listings                             |
| `lapis-desktop-retire-shared-ai`   | `9805eff8882eead854c3df2c46a29d724077c137` | Preserve current AI; provenance/data/native acceptance            |

Notes includes a duplicate of original plan change `qnluussr` (`09fdf93b`). Its
backlog conflict was resolved by retaining both current installation metadata
readiness and the retirement entry; the original plan workspace is unchanged.

## Removal 1: shared AI plugin — in progress

| Substep                                                       | Status                     | Evidence / remaining boundary                                                                                 |
| ------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Refresh current registration and release entrypoints          | Verified source            | Desktop selects owned AI or App Profile native chat; neither imports the shared plugin/controller             |
| Reject retired publication and metadata selectors             | Merged                     | Plugins #154/#155; main `e8f8eb1b`; exact-main CI `44149978818` passed                                        |
| Disable mutable registry source and block reactivation        | Source committed/pushed    | Registry #181 / `37ee5060`; 146 tests, 26 cold browser cases; approved signing workflow `44159554590` running |
| Remove shared implementation, package and media catalogs      | Merged                     | Plugins #155; 410 interactions, 1,022 package tests, 243 release-tooling tests and 16 artifacts               |
| Remove Notes duplicate stories/controller probes/dependencies | Partially source-qualified | Launcher #157 merged at `14d3138c`; catalog candidate `zuwpuyzx` in final qualification                       |
| Preserve installed-data/native lifecycle                      | Pending                    | External versus bundled provenance; settings/chat/memory; Safe Mode; cold close/reopen                        |
| Update Website and organization metadata                      | Merged                     | Website #1 / `9cbdc233`, exact-main CI `44157445481` passed; .github #15 / `5f81879f`                         |
| Complete source/public-package/consumer gates                 | Partially qualified        | Plugins source/artifact/catalog gates pass; Notes consumer and actual native/data gates remain pending        |
| npm deprecation, signed registry publication and deployment   | Pending release gates      | No unpublish or installed-app replacement                                                                     |

## Later removals — pending

1. Remove frozen Deno desktop/services and obsolete runtime/tooling paths,
   preserving tooling still needed by the deferred terminal work.
2. Migrate deprecated interfaces and registry compatibility consumers in owner order.
3. Qualify and land all non-terminal removals and their required consumer changes.
4. As the final removal, consolidate the Rust PTY service into `lapis-terminal`,
   update and qualify Server consumers, then retire the Deno terminal host.
5. Complete whole-plan Deno-absent package/host qualification and final
   dependency/inventory cleanup.

This order follows the user's revised sequencing request. Until step 4, retain the
current Rust PTY crate location, Server pin and required terminal-host tooling.
Track these as deferred edges; they do not block independently qualified earlier
slices or establish that the overall Deno retirement is complete.

Preserve standalone `ai-controller` for excluded `nostr-agent-controller`,
`community-local`, `nostr-auth`; preserve API file-tools, active native AI and
planned Sync. Never delete data or uninstall solely by plugin ID `ai`.

## Resume

Start with `jj --no-pager st` in each workspace. Read tracked owner guidance,
refresh remote refs without overwriting concurrent work, inspect source commits
and the latest evidence below, and continue the first pending shared-AI substep.
The ignored validation configs use the existing `omarchy` Docker context and
registry-only installs; no dirty sibling sources are transferred.
Spec-validator latest npm version was checked as `0.2.1`; Notes and Plugins
already declare `^0.2.1`. Host QMD doctor reports native Node ABI 147 mismatch;
semantic search degrades to its documented text fallback. Do not report that as
successful semantic retrieval. Product validation still uses Docker by default.

## Implementation receipts

Preparation documentation: Prettier passes. Notes `pnpm spec:check` passes in
Docker on the registry graph (6 configured lanes plus 69 spec-validation tests,
App-ownership and metadata-query audits). Initial host validation could not load
TypeScript from the fresh workspace; a Docker archive-backed attempt failed
installing an already-patched Bits UI archive. The retry uses registry-only
installation and introduces no dependency or patch change. These checks qualify
the coordination documents, not product removal.

Release safeguard baseline: 237 existing tests pass and four new retirement
regressions fail before implementation. Registry baseline: 11 GitHub sync tests
pass; three new retirement behaviors fail before implementation, and the
third-party-provenance control passes. Guard implementation is source-qualified and committed as recorded below;
At that checkpoint, source/package deletion and consumer/release gates remained
pending. The completed Plugins removal below closes its owning source/catalog
step; Notes, native/data and publication gates remain pending.

### Committed source checkpoint

| Owner    | JJ change / commit                                                              | Qualification                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugins  | `ukmnqynpumqtrptvsylsnkqvqlqtmxzq` / `8fd0840380182956fb6e3b9e920bdf5d7d33a215` | 241 release tests; 28 focused tests; registry-only `ci:release`: 51 package tasks, 1,398 tests, type/Svelte/build/publint, npm-pack, deterministic archives/signatures and static Storybook; final Docker spec checks pass |
| Registry | `qvlolmskkyltknvtuyyutlmwkmopoqxr` / `e0136ede50deaa9f1cd1f4f53dea2a0e9f940fb4` | 146 tests, 26 cold browser cases, 19 source entries, 21 unchanged metadata signatures, Astro checks/build and formatting pass                                                                                              |

Both owners have `retirement/shared-ai-distribution` bookmarks, pushed to GitHub
at the user's request. The Notes `retirement/shared-ai-progress` branch is also
pushed. No merge, npm publication/deprecation, signed registry publication,
deployment or installed-app replacement occurred.
Plugins' pre-existing conflicted local `main` remains untouched.

Owner evidence: Plugins
`spec/records/2026-11-17-shared-ai-publication-safeguards.md` plus its exact Docker
JSON receipt; registry `docs/shared-ai-retirement.md`. Full artifact qualification
ran at the source snapshot recorded in that JSON; the final narrow tooling and
spec reruns cover the subsequent selector preflight and documentation. These
are source/artifact checks, not actual native/product acceptance.

The first archive-backed Plugins audit failed on an old API 0.1.4 candidate's
moderate Minimatch advisory. The successful qualification uses registry-only
installation: zero moderate/high/critical advisories, with the unchanged existing
low-severity audit policy. No dependency/advisory exception was added. The
registry browser footer uses its existing `LAPIS_REGISTRY_UPDATED_AT` option with
the exact JJ source timestamp because this workspace has no colocated Git HEAD.
Generic pending/published-version acceptance now uses Graph, alongside explicit
AI install rejection. Failed attempts and corrections remain in owner evidence.

### Refreshed usage evidence

At the recorded bases, Desktop `notes-bundled-plugins.ts` imports its own
`AiPlugin` or `createNativeChatPlugin` and rejects selecting both. `Shell.svelte`
selects native adapters; `src/lib/native/ai/services.ts` uses public
`@lapismd/ai` and `@lapismd/ai/tauri`. No production source or manifest imports
`@lapis-notes/ai` or `@lapismd/ai-controller`; provenance comments are retained.
Desktop's existing native AI qualification backlog remains open at its original
acceptance boundaries; this inspection does not close it.

Notes' native-chat registration has moved since the old audit: it now lives in
`packages/app-profile/src/workspace-session/native-chat-registration.ts`, called
by the shared workspace session. Its default profile still has four core
plugins, with no shared AI. API `file-tools/app-tools.ts` and
`vault-operations.ts` still use `@lapismd/ai-host/file-tools`. Preserve those
imports. The pre-removal refresh found shared AI in Plugins source/catalog/build/packing
and Notes dev dependencies/catalog/controller probes. The Plugins edge is now
removed; the Notes edge remains the next substep.
Current registry source and live npm latest were rechecked at AI `0.1.16`;
registry source was active before this disablement. Published generated metadata
is intentionally unchanged until reviewed signing/publication.

### Next exact substep: Notes consumer cleanup

1. In `lapis-notes-retire-shared-ai`, remove duplicate shared-AI stories,
   controller bridges/probes, local archive requirements, optimizer entries and
   root dependencies. Trace shared panel/workspace shell fixtures too. Keep the
   published package/probe cleanup distinct from frozen Deno-host retirement.
   Preserve App Profile native chat and API file-tools; retain the standalone
   controller for the explicitly excluded consumers.
2. Reconcile Desktop's current coverage and qualify external-versus-bundled `ai`
   provenance/data, disablement, Safe Mode and cold lifecycle. Do not infer native
   acceptance from source boundaries or the Plugins catalog.
3. Update Website/organization guidance, then complete signed-registry
   publication and deployed/direct-API/stale-cache acceptance and npm deprecation
   at their existing release gates. Do not start terminal/other removals yet.

Before each source edit, discover the owning specification and record the
narrowest target's before count. Use the latest Deno-free validator and Docker
lanes. Plugins' `pnpm spec:check` is a host script; from a dependency-free fresh
workspace use `node scripts/validation.mjs run spec:check`. Registry tests can
regenerate `generated/download-targets.mjs` as a side effect: inspect it and
restore only that uncommitted generated diff after testing; never commit
hand-edited signed/generated publication state.

## GitHub checkpoints and current slice

The user authorized pushing the checkpoint branches, then the next slice.
All three checkpoint pushes succeeded. JJ re-signed commits during push;
content is unchanged and stable change IDs remain the coordination anchors.

| Repository / branch                                                                                        | GitHub checkpoint           |
| ---------------------------------------------------------------------------------------------------------- | --------------------------- |
| [Notes progress](https://github.com/lapismd/lapis-notes/tree/retirement/shared-ai-progress)                | `mlwxwtol` / `12117309a03f` |
| [Plugins distribution](https://github.com/lapismd/lapis-plugins/tree/retirement/shared-ai-distribution)    | `ukmnqynp` / `c9da95f4781d` |
| [Registry distribution](https://github.com/lapismd/plugin-registry/tree/retirement/shared-ai-distribution) | `qvlolmsk` / `37ee50609d5f` |

The earlier unsigned hashes above remain exact source-qualification provenance.
No main bookmark was moved. Notes fetched a newer remote main; this source slice
continues from its recorded base and preserves the concurrent release work.

The completed next slice is Plugins package/catalog removal (JJ change `yttxpspt`), stacked
on its pushed distribution safeguard. Source, the controller attach bridge,
AI-only stories/media/seeds and active package/build/pack/catalog entries are
removed. The publication tombstone remains. Historical requirements are moved
outside current authority to `spec/archive/2026-11-17-shared-ai-before-removal.md`.
Current LP-SPEC-061 governs the fail-closed source audit in normal and canonical
spec checks. Scope remains one removal; Notes' duplicate consumer/probe cleanup
and native/data acceptance remain the next boundaries.

Qualification complete for this source slice: original History baseline 6/6;
source absence regression failed before removal, then passed; 19 focused
source/CI-helper checks pass; History plus Search result target passes 8/8.
The full `ci:release` lane passes 48 tasks, 1,022 retained package tests, 241 initial
release-tooling cases, all 16 package/runtime artifacts and static Storybook.
The final release-tooling rerun adds two deferred head-renewal guards (243/243).
All 410 complete cold interaction/accessibility cases pass across eight shards;
final Docker spec/ownership and unchanged Desktop source-boundary checks
(12 tests plus audit) pass. No visual baselines changed.

The new Search story uses production SearchToolResult with a real owned App and
WorkspaceShell instead of importing the removed AI demo. It preserves accessible
file naming, actual leaf opening, retained result visibility and the empty state.
Native chat/transcript retention remains host integration acceptance. The 376
removed package tests were owned by the deleted AI implementation; all remaining
package suites run in full. A deferred renewal path also rejects stale AI heads
before OIDC/signing and template construction, without restoring or enabling the
Community/relay path.

The regenerated lock removes only the `packages/ai` importer, adds no npm package
versions and drops 43 unreachable versions. Peer closures are resolved normally;
no dependency overrides, advisory exceptions or package versions were added.
The CI context helper now inventories actual package manifests instead of
mistaking retired coordinates in the catalog source for live package paths.

### Pushed removal checkpoint

Plugins `yttxpsptztrmplnymowutpzmrztnnvrm` /
`035d65c82ab6daa31e83404f08c0083d1d8ae31e` is committed and pushed unsigned on
[retirement/remove-shared-ai](https://github.com/lapismd/lapis-plugins/tree/retirement/remove-shared-ai).
Its parent is the pushed publication safeguard. Source, artifact and complete
catalog qualification are recorded in
`spec/records/2026-11-17-shared-ai-source-removal.md` with exact CI, interaction
and packed-package JSON receipts. The source working copy is clean. No merge,
npm deprecation/publication, signed-registry update, deployment or installed-app
replacement occurred. Notes duplicate code/probes, native/data acceptance and
Website/organization guidance remain pending as listed above.

## Launcher removal and hosted landing checkpoint

Notes removes its retired shared-AI controller/probe commands, workspace seeder
and owning fixtures. LN-CAT-122 enforces their absence in normal/spec checks and
the replacement CI lane. Exact regression: 1 initial failure becomes 2 passes;
with routing, 3 pass. Registry-only Docker spec checks pass with 69 tests; all
77 validation-tooling and 199 release-tooling cases pass. See
[the source record](../../spec/records/2026-11-17-retired-ai-tooling.md).
Duplicate AI catalogs, preview bridge and package/archive dependencies remain
the next source boundary; this does not close native/data or release gates.

Prepared PRs: [Plugins safeguard #154](https://github.com/lapismd/lapis-plugins/pull/154),
[Plugins removal #155](https://github.com/lapismd/lapis-plugins/pull/155),
[Notes coordination #156](https://github.com/lapismd/lapis-notes/pull/156),
and [registry draft #181](https://github.com/lapismd/plugin-registry/pull/181).
Merges are authorized; required hosted checks still govern each landing.

Both Plugins PRs initially fail only the root audit after the Picomatch advisory
GHSA-fc5q-39xc-vjpf expanded to all published versions. Unchanged main reproduces
it and npm has no patched release. The user explicitly approved a documented
temporary exception for this advisory. Plugins records CVE-2026-112366 in root
and independent Sync tooling, preserving audit execution and all other findings.
Both audits and 19 audit/workflow regressions pass; Docker spec checks pass.
The safeguard head is now `d84dc813`; removal rebases without conflicts to
`886de049`. Its only tree difference from the previously qualified removal is
the five exception/configuration/record files. Full hosted checks are rerunning.

Registry CI regenerates mutable metadata and correctly fails its existing
signature checks until the protected signing refresh. No generated metadata or
signature has been hand-edited, and no signing/deployment approval is inferred.
Organization active listings are being updated separately; Website remains
pending. Terminal migration remains the final removal after other changes land.

### Landed coordination and organization metadata

[Notes coordination #156](https://github.com/lapismd/lapis-notes/pull/156) merged
as `31b13657817d1dc49b25d4b7ae12303a28025637` after all enabled required checks
passed. Its existing Storybook browser quarantine remains explicitly skipped.
[Organization profile #15](https://github.com/lapismd/.github/pull/15) merged as
`5f81879fc49091c17b16a1f7bb7be3d1dc7dca0b`; both PR and exact-main updater CI
pass. The generated package list excludes shared AI and preserves standalone
controller listings. Concurrent profile version updates were preserved when
resolving its rebase conflict.

[Notes launcher removal #157](https://github.com/lapismd/lapis-notes/pull/157) is
committed and pushed (`c771f8a5`, receipt formatting `7787a642`), now targeting
main. The first hosted event captured the old stacked base, which GitHub deleted
after #156 merged. Its specification-first job correctly rejects that missing
ref. This checkpoint triggers a fresh event against main; no gate or baseline
is changed, and the failed event remains evidence. Final receipt JSON required
one whitespace-only formatting commit; checks pass afterward.

Desktop source refresh confirms `notes-bundled-plugins.ts` chooses one owned AI
implementation and rejects simultaneous renderer/native owners. The API rejects
loading an installed copy of an already static identity before evaluation.
Desktop `aiEnabledByDefault` reads saved app-shell/installed disablement without
writing those files. Its LD-PLUG-001 verification is still **Planned** and its
AI-qualification backlog retains the actual product gate: these inspections do
not prove old-external/native coexistence, saved-data or cold native acceptance.
No Desktop code or existing qualification status changed.

The next Notes source boundary includes shared panel fixture registrations,
WorkspaceShellDemo, catalog/parity mappings, the manual preview bridge and its
URL/token optimizer/cache inputs, local archive requirements and root package
dependencies. Preserve the PWA security tests and API file-tools. The old direct
controller dependency-security test must be assessed with its removed caller;
it must not retain that root dependency merely to test an unused import.
Website snapshots/media and the AI help route still promote the retired package
and need a provenance-aware refresh. Terminal work remains last.

### Plugins source landed; next-source checkpoint

[Plugins removal #155](https://github.com/lapismd/lapis-plugins/pull/155) now
includes the safeguards and approved audit exception and merged directly to
main as `e8f8eb1b73ffe4bc2b96974c7388e2efbe4b911f`. GitHub also marks ancestor
[PR #154](https://github.com/lapismd/lapis-plugins/pull/154) merged. Exact head
`886de04910571fa5349d9e6ba51af1031c462306` passes the complete hosted workflow
[44148140915](https://github.com/lapismd/lapis-plugins/actions/runs/44148140915),
including audit, quality, unit, static Storybook, all four interaction shards,
artifacts and aggregate validation. A superseded same-head event was cancelled;
the completed latest event succeeds. The Plugins task workspace now rests on
landed main; its retired-source audit passes and neither retired directory exists.
The pre-existing conflicted local main bookmark remains untouched.

Fresh exact-main Plugins CI is queued as
[44149978818](https://github.com/lapismd/lapis-plugins/actions/runs/44149978818).
Publication and signed-registry deployment remain separate. Notes launcher PR
#157's fresh main-targeted event at `3c1182ceed98dc5f2019893f4c2b7424cf57e463`
is [44149841579](https://github.com/lapismd/lapis-notes/actions/runs/44149841579),
currently pending, not failed or qualified. Observe these existing handles before
any deliberate restart. Do not merge a stale-event failure or waive a gate.

Next: complete Notes catalog/bridge/dependency retirement and full affected
consumer checks, while landing #157 when its current required checks pass.
Website, installed-data/native product acceptance and protected registry signing
remain open. Then proceed through non-terminal hosts and deprecated interfaces;
terminal ownership/host retirement remains the final removal.

### Notes catalog removal candidate — qualification running

The source candidate removes the 14 shared-AI story/fixture files, hidden panel
and WorkspaceShell registrations, manual controller bridge/URL/token inputs,
root package dependencies and local AI archive requirement. The root-only
controller Git-security fixture is removed with its caller; PWA security and
API file-tools remain. Frozen desktop controller declarations and its Deno lock
are unchanged until host retirement. The new LN-CAT-123 catalog audit runs with
the existing launcher audit in normal/spec checks and CI regressions.

The exact new source regression initially has 1 failure and 1 pass, then both
pass. Source/tooling/structure/routing targets pass 25 cases; the retired AI-only
state-matrix case is removed, while shell/inventory regression coverage uses
retained Bases/Graph fixtures. The first cold History/Workspace run passes 12
and fails 1 solely on the now-removed Open Chat action. Its assertion now proves
absence; the exact 13-case cold rerun passes. Full checks, packing/static and
complete cold interactions are still required before committing this slice.

Nineteen catalog-specific requirements and their verification rows are archived;
common panel/shell/geometry contracts retain their surviving subjects. The
independent file-conflict context is preserved. Legacy provider/presentation
requirements still need a caller-aware ownership audit; their historic evidence
does not qualify current native AI. No native/data gate is marked complete.

Lock regeneration initially hits stale offline Core metadata; online refresh
resolves the already-declared published Core 0.13.5. The final pnpm-native lock
diff is 459 deleted lines, only the root importer changes, 40 package versions
are unreachable and no versions are added. No override or advisory exception
changes. A formatting attempt lacked a Svelte parser; the changed Svelte source
contains deletions only and its cold compilation/interactions pass. Generated
lock formatting is restored through pnpm to avoid unrelated YAML churn.

The first full Notes candidate run passes 27 package check/test/build tasks with
2,194 unique package tests (the existing 90-case Deno-service suite also runs in
its check/build lanes), 196 release-tooling tests, 68 spec regressions and all
canonical/ownership gates. It stops at archive preparation because the release
tool requires committed source plus an empty JJ working-copy commit. A local
candidate checkpoint supplies that precondition; packing, static/dev Docs and
complete cold interactions still must pass before this branch is pushed/landed.
No release precondition or functional assertion is bypassed.

## Shared-AI consumer continuation

Notes launcher #157 merged at `14d3138cb0f3c1d10996be650530376e4fbb877a`.
Required PR CI `44149841579` passed. Main Pages, PWA, Release and dependency-image
workflows all succeeded. These workflow outcomes do not by themselves qualify
new npm publication or native AI/data behavior.

Website #1 merged at `9cbdc233a7bec69d50d92e5da813edc3586a25fd` after both
hosted push/PR checks passed, including pinned Node 24.15.0. Exact-main workflow
`44157445481` also passed. It retains 26 guides and all historical source/media
provenance, removes shared AI from the 18-entry active table and rejects new
shared-package media imports before writes. Qualification: 13 unit tests,
25 cold browser cases, 234-page build, route crawl, ordinary and spec checks;
exact mobile/desktop inventory target 2/2. Its owner receipt is
`spec/records/2026-11-17-retired-shared-ai.md`. The website remains behind its
manual deployment gate; this merge did not deploy it.

Notes catalog removal is JJ change `zuwpuyzx`, with all current main package
versions and generated host schema preserved. Its first complete committed-source
release run passed before main-version intake; all 239 interactions/axe cases
passed across four cold shards. Rebased package checks/tests/builds also pass,
but packaging exposed a stale root Deno lock. The generated lock removes 60
unreachable versions and adds none, normalizes four now-unambiguous references
and brings root importer metadata in line with the manifests. Frozen desktop
controller declarations remain unchanged. The committed-lock release and normal checks now pass, including three public
package tarballs; all 239 current-main cold interactions pass. Exact receipts and
counts are in `spec/records/2026-11-17-retired-ai-catalog.md` and its JSON receipt.
The existing Specification Docs history quarantine remains skipped; the enabled
static/development cases pass 5/7 respectively. Final hosted PR landing remains
pending; this source qualification does not complete native/data acceptance.

Registry #181 remains draft at `37ee50609d5fbb89ce4bc3bb81b1d3ec5d091df1`.
The user explicitly approved protected metadata signing for that exact source.
Workflow `44159554590` is running against `retirement/shared-ai-distribution`
using the existing main-owned protected workflow. Review its generated-only PR
and all checks before source landing. Deployment and npm
package deprecation remain separate release gates. Native installed-data,
disablement/Safe Mode/cold acceptance and caller-aware contract ownership audit
remain the next shared-AI boundaries. Do not start host/API removal until those
are resolved; terminal remains the final removal.
