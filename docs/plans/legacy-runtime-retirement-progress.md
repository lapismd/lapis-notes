# Legacy runtime retirement progress

Current scope (user correction, 2026-11-18): **Desktop-related legacy code and
Deno removal only**. Leave core API services/functions and future-facing service
wiring intact. Generic API cleanup is excluded. Language Service is intentionally
retained, including its Desktop dependency/projection; no current caller is not
removal authority. E-RETIRE-007 is stopped, uncommitted and unpublished.

Coordination owner: Notes. Implementation authorized 2026-11-17. Follow the
[agreed plan](legacy-runtime-retirement.md). Work one removal at a time; do not
start host/API cleanup while shared AI removal remains in progress. Defer the
terminal ownership migration and Deno terminal-host retirement until every other
removal and its required consumer changes have landed.
Independent prerequisites may run in parallel under the user's explicit
authorization; retain one reviewable slice per removal and integrate in dependency
order. Source commits, consumer qualification and release/deployment are separate gates.

Current resume: the approved installer guard is merged in Notes #161; registry
HTTP 410 is deployed and all eleven npm versions are deprecated with original
tarballs independently verified. Plugins #156 carries its committed receipt.
Still pending: caller-aware AI feature contracts, actual old-external/bundled
native data/startup acceptance, API package publication/adoption and website
cutover. Continue shared-AI acceptance before host/API removal. Terminal is last.
Notes #164 merged the approved App Profile peer cleanup at `5ffb33c1` after
required hosted qualification; the initial offline PWA failure, exact artifact
replay and unchanged-head retry remain in the
[hosted receipt](../../spec/records/2026-11-17-profile-vite-peer-hosted.md).
All six exact-main archive hashes match the source-qualified cohort. Desktop's
794 governance/renderer, 748 AI and 290 Rust cases pass (two existing Rust ignores),
as do types, strict Clippy, renderer and static catalog builds. Its actual
installed production graph is clean; the approved exact development-only
Picomatch exception expires 2026-11-30. Complete local catalog passes 2168 cases across all 16 viewport/theme variants,
and final public admission/canonical checks pass (E-RETIRE-002). Fresh hosted
consumer/artifact intake remains in progress, without package publication or
native/data acceptance being inferred.

A deeper pipeline audit found Notes' signed registry fixture still building the
old pre-retirement Plugins checkout. The current slice moves it to verified
post-removal `96935625` and runs the source retirement guard before installation,
retaining upstream audit/artifact checks. Its new regression changes one failure
to 197 passing release-tool cases. Real fixture qualification passes 18 catalog
signatures, 16 signed bundles and all 13 cold Web cases after replacing an
obsolete AI test expectation. The [fixture receipt](../../spec/records/2026-11-17-retired-ai-registry-fixture.md)
preserves the initial 12-pass/1-failure run and environmental failures. Notes #165 passed required hosted workflow `44198935057` and merged at
`545284a05f418b8d8b882c797b48878cf820bab1`; the [hosted receipt](../../spec/records/2026-11-17-retired-ai-fixture-hosted.md)
retains the successful producer and 13 Web cases. Next also address Desktop's older Plugins fixture input and guard
its on-demand local plugin build against stale source; those are distinct from
the preserved Rust-owned `@lapismd/ai` package.
The parallel checkpoints are now reviewable: Notes fixture [#165](https://github.com/lapismd/lapis-notes/pull/165),
Web icon prerequisite [#166](https://github.com/lapismd/lapis-notes/pull/166),
Desktop consumer [#47](https://github.com/lapismd/lapis-desktop/pull/47),
fixture admission [#48](https://github.com/lapismd/lapis-desktop/pull/48) and
prepared native preservation [#49](https://github.com/lapismd/lapis-desktop/pull/49).
Notes #165 is merged. #166's first queued event retained a deleted base name
after retarget and failed spec-first VCS discovery; a fresh synchronized candidate
retains all required checks. Desktop PRs remain drafts. #49 prepares four new cases but executes zero native
cases; original signed-artifact and App Profile native-chat preservation remain
separate. #48's fresh artifact audit found Language Service packing before its
compiled output was built. Fix the Desktop producer and regenerate/verify the
artifact before treating either Desktop intake as ready; E-RETIRE-005 records
that follow-up. Existing local source qualification used independently verified
complete archives and does not excuse the hosted producer defect.

A separate `retirement-qualification` Desktop workspace from `351811a9` runs
final consumer/canonical checks while the original catalog worker completes.
A separate session-UI audit has proven seven private files unreachable and is
qualifying their removal without deleting active stores, cards or saved-session
types. Its later E-RETIRE-006 receipt must retain the before/after caller audit
and directly affected checks. This is still within shared-AI cleanup; it does
not authorize broad native AI deletion or advance terminal retirement.

The tables below describe current status; older receipts are dated checkpoints.

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
The original workspaces are registered as `retire-shared-ai` in their owning JJ
repositories; the additional parallel workspaces are recorded below.

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

## Parallel work and resume boundaries

The user authorized parallel implementation to reduce elapsed time. Root owns the
Notes signed-fixture/Web slice and Desktop's current consumer checkpoint;
independent workers own the following isolated prerequisites. None authorizes
package publication, website deployment or native macOS execution.

| Workstream                   | Workspace / JJ workspace name                                       | Status and integration boundary                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop fixture admission    | `lapis-desktop-retirement-fixtures` / `retirement-fixtures`         | Guard install/build against retired source and advance only hosted Plugins input; retain Rust/native pins. E-RETIRE-003.                                                                                                                |
| Native preservation coverage | `lapis-desktop-retirement-preservation` / `retirement-preservation` | Prepare production-boundary legacy-copy, disablement, Safe Mode and cold-reopen cases. Actual native execution remains unrun/pending. E-RETIRE-004.                                                                                     |
| Web icon input               | `lapis-notes-retirement-web-icons` / `retirement-web-icons`         | Remove frozen-host asset input with exact seven-output byte equivalence. Retain frozen host until owning removal; seven identical outputs, full Web checks/40 tests/build and integrated spec pass; hosted landing pending. LN-WEB-093. |

Desktop checkpoint `351811a99485cf30c946641c8737200d903657ef` is pushed as
[draft #47](https://github.com/lapismd/lapis-desktop/pull/47); required hosted
workflow `44197829697` is running. Source qualification is recorded in immutable
E-RETIRE-001. Its final qualification will append E-RETIRE-002, without rewriting
the earlier pending receipt. Notes fixture source is pushed as [PR #165](https://github.com/lapismd/lapis-notes/pull/165).
Desktop fixture admission is pushed as stacked [draft #48](https://github.com/lapismd/lapis-desktop/pull/48);
29 directly affected Docker governance cases pass and its repaired producer now builds/verifies all seven plugin payloads and signed
archives; fresh updated-head artifact/fanout qualification remains pending. Do not reuse older full CI artifacts after fixture
source identity changes. Coordinate Docker browser/build lanes; a second runner
in the same workspace correctly fails its exclusive lease instead of overlapping.

## Removal 1: shared AI plugin — in progress

| Substep                                                       | Status                               | Evidence / remaining boundary                                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refresh current registration and release entrypoints          | Verified source                      | Desktop selects owned AI or App Profile native chat; neither imports the shared plugin/controller                                                     |
| Reject retired publication and metadata selectors             | Merged                               | Plugins #154/#155; main `e8f8eb1b`; exact-main CI `44149978818` passed                                                                                |
| Disable mutable registry source and block reactivation        | Deployed                             | Registry #181/#183; signed disabled metadata and 18 live GET/HEAD responses verified; HTTP 410 stops fallback                                         |
| Remove shared implementation, package and media catalogs      | Merged                               | Plugins #155; 410 interactions, 1,022 package tests, 243 release-tooling tests and 16 artifacts                                                       |
| Remove Notes duplicate stories/controller probes/dependencies | Merged                               | #157 and #158 / `52cffda1`; 2,194 package tests, 239 cold interactions, 3 inspected tarballs and required hosted CI pass                              |
| Remove retired AI from pinned fixture build inputs            | Notes merged; Desktop pending        | Notes #165 / `545284a0` closes its signed fixture edge; Desktop #48 guard and actual producer pass, fresh hosted artifact/fanout remain pending.      |
| Preserve installed-data/native lifecycle                      | Pending                              | External versus bundled provenance; settings/chat/memory; Safe Mode; cold close/reopen                                                                |
| Update Website and organization metadata                      | Merged                               | Website #1 / `9cbdc233`, exact-main CI `44157445481` passed; .github #15 / `5f81879f`                                                                 |
| Complete source/public-package/consumer gates                 | Source qualified; acceptance pending | Catalog removals pass; approved legacy-cache provenance guard source-qualified; API release and native/data gates remain open                         |
| npm deprecation, signed registry publication and deployment   | Registry and npm complete            | Approved signed candidate is live; All 11 npm versions deprecated; every original tarball SHA-512 verified; no unpublish or installed-app replacement |

## Later removals — pending

1. Remove frozen Deno desktop/services and obsolete runtime/tooling paths,
   preserving tooling still needed by the deferred terminal work.
2. Preserve core API services/functions, generic interfaces and registry compatibility; generic API cleanup is excluded.
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

Registry #181 was prepared at `37ee50609d5fbb89ce4bc3bb81b1d3ec5d091df1`.
The user explicitly approved protected metadata signing for that exact source.
Workflow `44159554590` is running against `retirement/shared-ai-distribution`
using the existing main-owned protected workflow. Review its generated-only PR
and all checks before source landing. Deployment and npm
package deprecation remain separate release gates. Native installed-data,
disablement/Safe Mode/cold acceptance and caller-aware contract ownership audit
remain the next shared-AI boundaries. Do not start host/API removal until those
are resolved; terminal remains the final removal.

## Approved signing and final consumer PRs

Notes catalog/source/lock removal is pushed in
[PR #158](https://github.com/lapismd/lapis-notes/pull/158), exact head
`cfaf4c53bfe070398e6e24da7bce8f46d332a933`. All local required lanes pass;
required hosted workflow `44160243971` is running. Observe that existing run
before deciding its landing; do not infer CI success or publication from a push.

The user explicitly approved registry signing for `37ee5060` only. Protected
workflow `44159554590` passed and opened generated-only #182. Its head
`356412082836bb7629a3a6169412c5ab082e8eeb` passed complete hosted Checks
`44159923356` and merged into the feature branch at
`812e4a44d3843e83cad15c1f34086843511703d3`. The five generated files change
only shared-AI disablement and corresponding mutable metadata signatures.
Independent structural comparison retains every historical version, origin,
hash and artifact; all 21 metadata signatures verify locally. The owner signing
receipt is committed in Registry `36bd61e3`; parent #181 is ready for review
and needs final-head checks.

Deployment needs a separate decision: Registry `publish.yml` runs on a main
push and its existing `STATIC_REGISTRY_V2_DEPLOY_APPROVED` variable is `true`.
Merging #181 therefore deploys the candidate; signing approval does not authorize
that main merge/deployment. Do not change the repository variable to bypass the
gate. Website merge remains independent and its deployment is manual.

The npm retirement payload is prepared, not applied: the public registry has
11 versions of `@lapis-notes/ai` (0.1.0, 0.1.1, 0.1.2, 0.1.5, 0.1.6, 0.1.7,
0.1.8, 0.1.12, 0.1.13, 0.1.15 and 0.1.16). Proposed deprecation message:
"Retired shared AI plugin. Use the AI bundled with Lapis Desktop; keep existing
settings, conversations and memory. See https://github.com/lapismd/lapis-desktop."
No npm deprecation or unpublish has occurred.

Resume shared AI with: observe/land Notes #158 after all required checks; observe
Registry #181's exact final checks, obtain deployment approval before its main
merge and prove live disabled metadata/direct/saved-link/stale-cache behavior;
complete native installed-data/disablement/Safe Mode/cold acceptance and the
remaining caller-aware contract ownership audit; obtain npm deprecation approval
before applying the prepared message. Host/API retirement follows this removal;
terminal ownership migration/retirement remains last.

## Registry production landing and stale-consumer finding

The user separately approved merge and production deployment of Registry #181
at `36bd61e3488b4282d903a2004062ef36817f42c9`. It merged at
`42903595b7ea78194d47635319dfa0f5046ab5bb`. Exact-main Checks `44161464343`,
Publish registry `44161464626`, publication preparation `44161464641` and its
qualified-candidate workflow `44161584703` all passed. This approval does not
publish npm packages or deploy the separate website.

Live index and AI detail metadata both verify against the pinned registry trust
root and report disabled. All nine indexed AI versions reject saved GET and HEAD
links with HTTP 404 and no redirect. The production Playwright target
`tests/registry-versions.spec.ts` / `retired shared AI keeps history but cannot
install any retained version` passes (1/1). Historical versions/artifacts remain.

Actual Notes installer inspection found an additional stale-consumer path:
`VerifiedPluginInstaller.install()` falls back to the preserved signed artifact
origin after any download-endpoint failure except cancellation or HTTP 410.
The manager blocks a fresh disabled index, but a stale active index can bypass
an endpoint's 404 through that fallback. Do not count saved-link rejection alone
as complete stale-cache/direct-API acceptance.

Proposed registry-owned fix: respond HTTP 410 Gone for intentionally disabled
releases before origin fetch or analytics writes. Existing Notes handling already
stops fallback on 410, so this needs no new consumer package release. Active,
pending, unknown and revoked endpoint behavior stays as before; user data and
historical artifacts stay intact. The exact registry target starts 15/15 green;
the new 410 regression reproduces 1 failure with 14 existing cases passing.
Source implementation awaits the user's explicit public API confirmation under
their saved standing rule; that question is pending. Registry task workspace
contains only the deliberately failing regression at this checkpoint.

Notes #158 still awaits its last hosted web-acceptance job; all other enabled
jobs pass and inherited interaction CI remains explicitly skipped. Its local
complete 239-case interaction/axe receipt remains separate evidence. Resume by
observing that run and the pending public API decision, then finish shared-AI
consumer/native/contracts/npm gates before host/API retirement. Terminal is last.

## Notes consumer landing

Notes #158 merged at `52cffda160e68f3b70f481bd82df8dbbf69062b9` after exact
head `cfaf4c53bfe070398e6e24da7bce8f46d332a933` passed complete required
workflow `44160243971`, including web acceptance and aggregate validation.
The inherited browser interaction CI job remains skipped; the independently
completed 239 cold interaction/axe cases are recorded separately. No native/data
qualification, new npm publication or website deployment is inferred.

[Live registry receipt](../../spec/records/2026-11-17-retired-ai-registry-live-before-gone.json)
records the disabled signed documents, 18 saved-link GET/HEAD checks, production
browser case and still-open stale-client limitation. That receipt predates the approved HTTP 410 follow-up below. Preserve the
remaining native/data/contracts/npm gates and the final-terminal sequence.

## HTTP 410 deployment and cached-provenance guard

Registry #183 merged at `e99f5fd40c92a779b26fcab4a5efa84372d6f4a3` and deployed
from verified head `ca8421f515e54aa0da32ea65018ca662039829fb`. PR checks
`44165451713`, main checks `44166043673`, publish `44166044133` and qualified
workflow `44166153748` pass. The approved HTTP 410 behavior stops Notes origin
fallback before registry archive fetch or analytics writes. Source qualification
includes 16 focused cases, 147 unit tests, 26 browsers, 21 signatures and all
28 then-existing Notes installer cases.

The [live receipt](../../spec/records/2026-11-17-retired-ai-registry-live-gone.json)
verifies signed disabled index/detail metadata, unchanged historical metadata,
all 18 GET/HEAD checks across nine AI versions returning 410 without redirects,
active Bases returning 200 and unknown IDs returning 404. The production
retired-AI browser case also passes. Earlier 404 receipts are historical
checkpoints, not the current endpoint contract.

Notes #160 merged at `7b9b1c2bf16130bb64025eb49ca2c77c3e601e81` after required
CI `44167542884` passed. Sixteen obsolete implementation requirements and their
evidence are archived verbatim. Generic feature and native/data ownership
remains open. Desktop was refreshed to main `18aac280`; no Desktop runtime
change or native qualification is claimed.

A further legacy cached-catalog gap was reproduced: no `downloadUrl` means the
installer can fetch the preserved artifact directly. The user approved the
LN-PLUG-137 provenance exception. The guard rejects original artifact URLs and
verified retired source before installation writes, preserving other AI and
saved data. All 36 installer cases, 2,202 package tests, normal checks, spec checks,
full release and 239 cold interaction/axe cases pass;
[the owning receipt](../../spec/records/2026-11-17-retired-ai-provenance.md)
records the reproduced failure and source evidence. The API patch is not yet
published or adopted by native consumers.

Resume with retained AI contract ownership and actual native/data acceptance.
Website deployment remains a separate approval gate; approved npm deprecation
is complete as recorded below. Host/API removal follows shared-AI acceptance;
terminal migration and retirement remain last.

### Historical npm authentication checkpoint

The user approved the exact 11-version npm metadata retirement candidate on
2026-11-17. The [approved candidate](../../spec/records/2026-11-17-retired-ai-npm-deprecation-candidate.json)
preserves the 0.1.0 packaging-defect warning. Execution is not complete:
`npm whoami` returns E401 and npm web login awaits the user's authentication.
No token is recorded here, no tarball is removed and no metadata change is
claimed. After authentication, recheck candidate version/integrity identities,
apply only the approved messages and verify every tarball URL/hash is unchanged.

### Completed npm metadata retirement

The approved messages are now live for all eleven published `@lapis-notes/ai`
versions. Version 0.1.0 retains its packaging-defect warning. Fresh public metadata
verifies all messages, the unchanged version inventory and unchanged `latest`
tag. All eleven original tarballs were downloaded and independently SHA-512
verified against the pre-change integrity values. No unpublish, new publication
or installed-data removal occurred.

The owner [Plugins #156](https://github.com/lapismd/lapis-plugins/pull/156) records
the exact candidate, successful operation, downloaded bytes/hashes, initial E401,
browser authentication and stale verification read. The 0.1.0 mutation was not
replayed after acceptance. Evidence commit: `f93b30a42bc5d7b0848249af52474e7f878c7d7e`;
required hosted CI `44174284319` passed and Plugins #156 merged at
`969356250f26c5561fac22cf00d8da8f395dbdae`. The preceding authentication-pending
checkpoint is historical. Notes API publication/adoption,
actual native/data acceptance and website deployment remain separate gates.

### Approved installer guard landed

Notes #161 merged at `d369ec9d4c8024565ba1a066bd4eabbc1cd8a6fe` after complete
required hosted workflow `44172806383` passed at exact head
`23a9d509ddb360e4b0e3f0db121a1d0ba3139210`. All enabled checks, including
web acceptance, release artifacts and aggregate validation, pass. The inherited
hosted interaction skip is unchanged; the independent 239-case cold Docker
interaction/axe run remains its source receipt.

LN-PLUG-137 is source-qualified and merged. New API package publication and
consumer adoption are not inferred. The next shared-AI work is the remaining
caller-aware feature ownership audit and actual old-external/bundled native
startup/data/disablement/Safe Mode/cold-reopen acceptance. These retirement
preservation checks do not require closing every unrelated native-AI backlog
item. Website production still requires its separate reviewed cutover and
legacy-publisher prerequisite. Terminal remains the final removal.

## Scope correction and parked Language Service experiment

On 2026-11-18 the user explicitly limited work to Desktop-related legacy code and
Deno removal and protected future-facing core services/functions. The Language
Service dependency-removal experiment is superseded, not an implementation todo.
No E-RETIRE-007 change was committed, pushed or merged.

Recovery bookmark `recovery/out-of-scope-desktop-language-edge-20261118` retains
working change `vovunqoq` / `287f096b616389dc862cd2ba98301036a58a1800`. The
`lapis-desktop-retirement-language-edge` workspace is clean at a child of
`5006a7cf`, with the service declaration/projection/source job/local inventories
retained. Its owned worker is stopped and ignored receipts plus
`SCOPE-SUPERSEDED.md` preserve the experiment. Do not resume or publish it.

Desktop #48's admitted-archive completeness and retired-source guard repairs
remain in scope; they build/verify existing services without deleting their API.
The verified E-RETIRE-006 deletion concerns only superseded private Desktop
presentation, with 432 reachable runtime modules unchanged. Further helper or
stylesheet removals are not started; planned services/functions remain protected.
