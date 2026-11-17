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

| Substep                                                       | Status                  | Evidence / remaining boundary                                                                          |
| ------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Refresh current registration and release entrypoints          | Verified source         | Desktop selects owned AI or App Profile native chat; neither imports the shared plugin/controller      |
| Reject retired publication and metadata selectors             | Source committed        | Plugins `ukmnqynp` / `8fd08403`; 241 release tests and full artifact qualification                     |
| Disable mutable registry source and block reactivation        | Source committed        | Registry `qvlolmsk` / `e0136ede`; 146 tests, 26 cold browser cases; signing/publication pending        |
| Remove shared implementation, package and media catalogs      | Source committed/pushed | Plugins `yttxpspt` / `035d65c8`; 410 interactions, 1,022 package tests; source and artifacts qualified |
| Remove Notes duplicate stories/controller probes/dependencies | Pending                 | Keep API `ai-host/file-tools` and app-profile native chat                                              |
| Preserve installed-data/native lifecycle                      | Pending                 | External versus bundled provenance; settings/chat/memory; Safe Mode; cold close/reopen                 |
| Update Website and organization metadata                      | Pending                 | Bundled/native AI guidance and source provenance                                                       |
| Complete source/public-package/consumer gates                 | Partially qualified     | Plugins source/artifact/catalog gates pass; Notes consumer and actual native/data gates remain pending |
| npm deprecation, signed registry publication and deployment   | Pending release gates   | No unpublish or installed-app replacement                                                              |

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
