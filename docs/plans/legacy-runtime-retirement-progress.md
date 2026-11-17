# Legacy runtime retirement progress

Coordination owner: Notes. Implementation authorized 2026-11-17. Follow the
[agreed plan](legacy-runtime-retirement.md). Work one removal at a time; do not
start terminal/host/API cleanup while shared AI removal remains in progress.
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

| Substep                                                       | Status                | Evidence / remaining boundary                                                                     |
| ------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| Refresh current registration and release entrypoints          | Verified source       | Desktop selects owned AI or App Profile native chat; neither imports the shared plugin/controller |
| Reject retired publication and metadata selectors             | Source committed      | Plugins `ukmnqynp` / `8fd08403`; 241 release tests and full artifact qualification                |
| Disable mutable registry source and block reactivation        | Source committed      | Registry `qvlolmsk` / `e0136ede`; 146 tests, 26 cold browser cases; signing/publication pending   |
| Remove shared implementation, package and media catalogs      | Pending               | Plugins source, exports, locks, workflows, release/test fixtures                                  |
| Remove Notes duplicate stories/controller probes/dependencies | Pending               | Keep API `ai-host/file-tools` and app-profile native chat                                         |
| Preserve installed-data/native lifecycle                      | Pending               | External versus bundled provenance; settings/chat/memory; Safe Mode; cold close/reopen            |
| Update Website and organization metadata                      | Pending               | Bundled/native AI guidance and source provenance                                                  |
| Complete source/public-package/consumer gates                 | Pending               | Full required checks, archive/signature, cold interactions and native acceptance                  |
| npm deprecation, signed registry publication and deployment   | Pending release gates | No unpublish or installed-app replacement                                                         |

## Later removals — pending

1. Consolidate Rust PTY service into `lapis-terminal`, then retire Deno terminal host.
2. Remove frozen Deno desktop/services and obsolete runtime/tooling paths.
3. Migrate deprecated interfaces and registry compatibility consumers in owner order.
4. Final Deno-absent package/host qualification and dependency/inventory cleanup.

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
source/package deletion and consumer/release gates remain pending.

### Committed source checkpoint

| Owner    | JJ change / commit                                                              | Qualification                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugins  | `ukmnqynpumqtrptvsylsnkqvqlqtmxzq` / `8fd0840380182956fb6e3b9e920bdf5d7d33a215` | 241 release tests; 28 focused tests; registry-only `ci:release`: 51 package tasks, 1,398 tests, type/Svelte/build/publint, npm-pack, deterministic archives/signatures and static Storybook; final Docker spec checks pass |
| Registry | `qvlolmskkyltknvtuyyutlmwkmopoqxr` / `e0136ede50deaa9f1cd1f4f53dea2a0e9f940fb4` | 146 tests, 26 cold browser cases, 19 source entries, 21 unchanged metadata signatures, Astro checks/build and formatting pass                                                                                              |

Both owners have local `retirement/shared-ai-distribution` bookmarks. Workspaces
are clean after commits. No remote push, merge, npm publication/deprecation,
signed registry publication, deployment or installed-app replacement occurred.
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
imports. Shared AI still exists in Plugins source/catalog/build/packing and
Notes dev dependencies/catalog/controller probes, pending the next substep.
Current registry source and live npm latest were rechecked at AI `0.1.16`;
registry source was active before this disablement. Published generated metadata
is intentionally unchanged until reviewed signing/publication.

### Next exact substep

1. In `lapis-plugins-retire-shared-ai`, audit remaining imports of
   `@lapis-notes/ai`, `packages/ai`, `AiPlugin` and controller fixtures across
   tracked source, shared panel helpers, Storybook coverage/parity manifests,
   release/build/pack/media selectors and tests. Remove the obsolete package and
   its catalog wiring together; retain the new retired-coordinate tombstone.
2. In `lapis-notes-retire-shared-ai`, remove the duplicate shared-AI stories,
   controller bridges/probes, local archive requirements and root dependencies.
   Preserve native chat and API file-tools. Do not start terminal/other removals.
3. Reconcile Desktop's coverage ledger and qualify external-versus-bundled `ai`
   provenance/data and cold lifecycle. Complete Website/organization guidance,
   source/consumer qualification and the separate signed-registry/npm gates.

Before each source edit, discover the owning specification and record the
narrowest target's before count. Use the latest Deno-free validator and Docker
lanes. Plugins' `pnpm spec:check` is a host script; from a dependency-free fresh
workspace use `node scripts/validation.mjs run spec:check`. Registry tests can
regenerate `generated/download-targets.mjs` as a side effect: inspect it and
restore only that uncommitted generated diff after testing; never commit
hand-edited signed/generated publication state.
