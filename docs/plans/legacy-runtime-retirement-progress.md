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

| Substep                                                       | Status                | Evidence / remaining boundary                                                          |
| ------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------- |
| Refresh current registration and release entrypoints          | In progress           | Native paths and excluded controller consumers must remain                             |
| Reject retired publication and metadata selectors             | In progress           | Add adversarial stale-plan and no-network dispatch coverage                            |
| Disable mutable registry source and block reactivation        | Pending               | Preserve all historical version/signature/archive bytes                                |
| Remove shared implementation, package and media catalogs      | Pending               | Plugins source, exports, locks, workflows, release/test fixtures                       |
| Remove Notes duplicate stories/controller probes/dependencies | Pending               | Keep API `ai-host/file-tools` and app-profile native chat                              |
| Preserve installed-data/native lifecycle                      | Pending               | External versus bundled provenance; settings/chat/memory; Safe Mode; cold close/reopen |
| Update Website and organization metadata                      | Pending               | Bundled/native AI guidance and source provenance                                       |
| Complete source/public-package/consumer gates                 | Pending               | Full required checks, archive/signature, cold interactions and native acceptance       |
| npm deprecation, signed registry publication and deployment   | Pending release gates | No unpublish or installed-app replacement                                              |

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
third-party-provenance control passes. Guard implementation is being validated;
source/package deletion and all consumer/release gates remain pending.
