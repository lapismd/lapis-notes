# Publication readiness: registry blockers and local-archive map

Recorded 2026-10-27 20:45:00 UTC. Supporting evidence for the declared next
step after Phase 2 (publication of the LapisMD package line). This record maps
every currently known registry/publication blocker to its checksummed
local-archive equivalent, proposes a publication order for user approval, and
records the cross-repo History contract follow-up. Nothing here was published;
no lockfile was regenerated. Registry facts were re-verified from npm on the
record date. The historical foundation-refresh context is
[npm-registry-dependencies](npm-registry-dependencies.md).

Same-slice integration context: the frozen shared Workspace file-conflict
review candidate landed on Notes main (integrated lineage `zymuvnlk`/`qtpwpkxx`
over `44f3b41f`; full cold catalog 267/267), so the next `@lapis-notes/workspace`
release must carry it; the retained hosted-Properties browser e2e was NOT
landed because it reproduces a pre-existing clean native-shutdown defect on the
bare main baseline (details in `MIGRATION_HANDOFF.md`), leaving its journey
unclaimed.

## Blocker 1 — `@lapis-notes/api`: published 0.1.4 lacks landed contracts

- Registry state: versions `0.1.0/0.1.2/0.1.3/0.1.4`; dist-tags
  `latest 0.1.0`, `next 0.1.4`. The published 0.1.4 predates Notes main commits
  `fa73a08ea9d7` (`EmbedRegistry.renderMarkdownEmbed`, declinable Markdown
  embedders) and `56df650d7e0a` (`Plugin.disable` native drain /
  `MetadataCache.disableNativeContributions`). Both are ancestors of the
  integrated Notes main baseline `44f3b41f`.
- Local equivalent (verified 2026-10-27):
  `lapis-notes/.local/packages/lapis-notes-api-0.1.4.tgz`, sha256
  `daf6da88331c2a8686d4ddb1c9bb4f997f3d152d10f563d3ed6fad8837c931c1`, built
  from Notes main; the tarball `dist` contains `renderMarkdownEmbed`
  (`embed-registry.js`/`.d.ts`) and `disableNativeContributions`
  (`cache.svelte.js`, `plugin.js`). The prior archive is preserved beside it as
  `lapis-notes-api-0.1.4.tgz.bak-2eb47275-20261027`, sha256
  `2eb4727521e5684df37489ea35db3fa11887871c69e424fe709cf2e7797e2fbf`.
- Consumer: `lapis-plugins` resolves `@lapis-notes/api` to this tarball through
  its ignored `.pnpmfile.cjs` `localPackages` remap; committed
  manifests/lockfiles stay registry-semver.
- Publication note: the candidate tarball's manifest still says `0.1.4`, which
  is already taken on the registry with different content. Publication requires
  a version bump first (see order table); the tarball is content proof, not the
  publishable artifact. Plugins' blocked portable-lock draft (`467f2231`)
  unblocks only when the released API carries `renderMarkdownEmbed`.

## Blocker 2 — `@lapismd/agent-ui`: unpublished (registry 404)

- Registry state: `npm view @lapismd/agent-ui` → 404 (verified 2026-10-27).
  Notes `packages/app-profile/package.json` depends on `^0.1.0`; the committed
  Notes `pnpm-lock.yaml` contains no agent-ui entry at all, so a registry-only
  lockfile regen and every CI `pnpm install --frozen-lockfile` lane
  (`.github/workflows/lapis-ci.yml`) fail until it is published. Local
  validation bypasses this through the frozen archives cohort
  (`.local/validation/config.json` → `phase2-cohort.json`).
- Source repo (inspected READ-ONLY; nothing committed there — owner-review
  scope): committed main baseline is `onwxmlwp
0e549ebccbef4e91ff9157062b91ce6da5228a94` ("Default portable Agent UI checks
  to isolated Docker workers", 2026-10-25); the default workspace `@`
  (`ltttqqrw`) is empty over it. The `main` bookmark (`knvwkvzu 3e241da3`,
  2026-10-22) is older than the checkout baseline.
- Existing packed archives (none verifiably from the committed baseline):
  - Notes phase2 cohort `.local/validation/phase2-cohort/lapismd+agent-ui-0.1.0.tgz`,
    sha256 `58bd5870d6d67bd60a1d1c8724eb31d4359c3d923eb673474f6818b9e7f90b95`,
    built from **hidden** (rewritten, unlanded) revision
    `d2fd86fc24ec344a0817fcaf9eef59d02e456e29` — do not publish from this pack.
  - Notes `.local/validation/landing-20261025/prerequisites/lapismd-agent-ui-0.1.0.tgz`,
    sha256 `b6d8a4283d8007d83d7f786458a2712d2796df8e8031c1a48e9692ebe7135f3d`;
    its pack log records no source revision.
  - Desktop-receipt pack (`lapis-notes/.local/native-chat/agent-ui-receipt.json`)
    sha256 `e3fdc16237e62b8c651563739e019846dd8f06d5a1569c4475605d0249ba7114`
    from revision `5a88a3484786ce07af7d3cce4f8af8aa67035e04`.
- Fresh candidate packed 2026-10-27 from the committed baseline `0e549ebc` with
  agent-ui's own tooling (`pnpm build` → `scripts/build-agent-package.mjs`:
  svelte-package + publint "All good!", then `pnpm pack`):
  `lapis-notes/.local/publication-candidates/lapismd-agent-ui-0.1.0.tgz`,
  sha256 `a07c4890ca0706fcc81572f880de84806cdf05409112dfecc8d036a9cc7ccb67`;
  receipt `lapismd-agent-ui-0.1.0.receipt.json` beside it. The agent-ui
  working tree remains clean (dist/tgz are gitignored); publication itself
  remains agent-ui owner-review scope.

## Blocker 3 — `@lapismd/jj-history`: unpublished optional peer (registry 404)

- Registry state: `npm view @lapismd/jj-history` → 404 (verified 2026-10-27).
  jj-store `packages/jj-history/package.json` is at `0.1.0`.
- Local equivalents (verified 2026-10-27):
  - Canonical plugins-side prerequisite channel (mirrored by the ignored
    plugins `.pnpmfile.cjs` hook for the `@lapis-notes/history` optional peer):
    `lapis-plugins/.local/hosted-history/prerequisites/lapismd-jj-history-0.1.0.tgz`,
    sha256 `d4ee8ecbb4daee19427a0be0489925d3f013ee2e5a12e73f8016d25e76a115e5`.
  - Notes phase2 cohort pack
    `.local/validation/phase2-cohort/lapismd+jj-history-0.1.0.tgz`, sha256
    `94bae0ae3557262629e49455f80bb86ccd553232c4de23472415228b17f0d160`,
    built from jj-store revision
    `4e74e423966180576da89229e02da49dcd014dfd` — this predates the integrated
    jj-store history-read-admission slice `52b061c5`.
  - Notes `packages/web/package.json` currently carries the documented
    temporary sibling dependency
    `"@lapismd/jj-history": "link:../../../jj-store/packages/jj-history"`
    (also committed in `pnpm-lock.yaml`). This checkout-local specifier must be
    switched to a registry semver range as part of the publication repair; a
    registry-only frozen install cannot resolve it.
- Follow-up (not done here): repack from the integrated jj-store main **after**
  the active jj-store agent completes, then refresh the plugins prerequisite
  channel and the Notes cohort identity. No repack was attempted from jj-store
  during this record.

## Blocker 4 — Mira manifest ranges vs lockfile specifiers (no regen since bump)

- Notes commit `04ce1f886f7f` (2026-10-25 18:08, "Qualify Docker permission and
  lease handling with released Mira intake") bumped root `package.json` to
  `@lapismd/mira ~0.1.1`, `mira-editor/-plugin-ai/-plugin-mermaid ~0.0.3`
  without regenerating `pnpm-lock.yaml`. The lockfile importers still declare
  specifiers `~0.0.5`/`~0.0.2`/`~0.0.2`/`~0.0.2`, resolving to mira `0.0.5` and
  editor/ai/mermaid `0.0.2`; `packages/api` keeps the wider
  `~0.0.5 || ~0.1.0`. Any `--frozen-lockfile` install therefore fails on the
  specifier mismatch even before the 404 blockers.
- The registry already satisfies the bumped ranges: mira `0.1.1` and
  mira-editor/react/vanilla/plugin-ai/plugin-mermaid `0.0.3` are published
  (verified 2026-10-27), matching the mira-mde manifests (`workspace:~`
  internal links; main `a332ca3b`), so no Mira republish is required for this
  repair.
- Exact repair sequence (recorded, NOT executed):
  1. Publish the missing packages first: jj-history `0.1.0`, agent-ui `0.1.0`,
     and the bumped `@lapis-notes/api` (Blockers 1–3).
  2. Switch `packages/web` `@lapismd/jj-history` from the `link:` sibling
     dependency to the published registry range.
  3. Regenerate the Notes root lockfile registry-only (local hooks retired for
     the regen; committed lockfile resolves released packages only).
  4. CI `pnpm install --frozen-lockfile` lanes can then go green.

## Proposed publication order and versions (for user approval — not executed)

Versions are read from current manifests and pending changesets
(`lapis-notes/.changeset`: 31 pending — api 17 patch + 10 minor, file-explorer
8 patch + 1 minor, workspace 3 patch + 2 minor including the new
`shared-file-conflict-review` entry landed with this integration, ui 2 patch;
`lapis-plugins/.changeset`: 21 pending). `changeset version` makes the final
bumps; the table lists the resulting floor.

| #   | Package / action                 | Repo          | Proposed version           | Basis and preconditions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------- | ------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `@lapismd/jj-history`            | jj-store      | `0.1.0`                    | Manifest already 0.1.0; publish after the active jj-store Phase 2 lanes complete; then repack the prerequisite/cohort archives.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2   | `@lapismd/agent-ui`              | agent-ui      | `0.1.0`                    | Owner-review scope; candidate pack `a07c4890…` from committed main `0e549ebc` is staged; owner release lanes must pass before publish.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 3   | `@lapis-notes/api`               | lapis-notes   | `0.2.0` (floor `0.1.5`)    | Must ship `fa73a08e` + `56df650d`; pending changesets include 10 minors, so the changeset-driven bump is 0.2.0; repack after bump.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4   | `@lapis-notes/workspace`         | lapis-notes   | `0.3.0`                    | Published `next 0.2.1` provably lacks file-conflicts (0 entries in the registry tarball); landed candidate + pending minor changesets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5   | `@lapis-notes/file-explorer`     | lapis-notes   | `0.2.0`                    | Content changed (8 patch + 1 minor pending; registry 0.1.2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 6   | `@lapis-notes/ui`                | lapis-notes   | `0.1.4`                    | Content changed (2 patch pending; registry `next 0.1.3`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 7   | `@lapis-notes/language-service`  | lapis-notes   | republish only if changed  | Registry already has 0.1.1 (= manifest) on `next`; no pending changeset — verify content parity at release time and skip if equal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 8   | `@lapismd/mira*`                 | mira-mde      | only if required           | Registry (mira 0.1.1, others 0.0.3) already matches the manifests; no republish unless mira-mde content changed since wave 3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 9   | thirteen-plugin batch            | lapis-plugins | per plugins changeset flow | Prep exists only in preserved bookmark `preserved-npm-release-batch` (`67ce4ae5`, 2026-10-11; stale against current main). Registry today: 12 plugin packages published at their exact manifest versions (ai 0.1.5, bases 0.1.4, bookmarks 0.1.3, graph 0.1.3, history 0.1.4, markdown 0.1.6, markdown-lint 0.1.2, search 0.1.3, slides 0.1.0, source-editor 0.1.2, spellcheck 0.1.3, wordcount 0.1.2); canvas/csv/docx/pdf/transcripts are 404 at manifest 0.1.0; community and lapis-plugin-sync stay private. 21 pending changesets (incl. `native-backup-observation`, history patch) precede any batch; requires explicit release authorization. |
| 10  | Notes lockfile regen + CI verify | lapis-notes   | n/a                        | After 1–3 (and 9 if plugins ranges move): fix the web jj-history dependency, regenerate the root lockfile registry-only, verify frozen CI.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

Registry tag convention to confirm at release time: every Notes line publishes
to `next` while `latest` stays at `0.1.0`; decide whether publication promotes
`latest`.

## Cross-repo contract — History `BackupService.setEnabled`

Notes `web#check` requires `BackupService.setEnabled`, exposed by the plugins
History package; the owning commit is `92b4dea62f4d` ("Separate native
Repository backup selection from passive observation"), which the sibling
plugins integration agent is landing right now (at record time `92b4dea6` is
not yet an ancestor of the plugins active working line; its changeset
`native-backup-observation.md`, history patch, is already present). The Notes
phase2 cohort already consumes a history `0.1.4` archive built from
`92b4dea6` (cohort sha256 `e714935f9f0a…`), and `pnpm --filter @lapis-notes/web
check` passes on the host cohort (verified 2026-10-27). Follow-up AFTER the
plugins integration completes (not done in this slice): refresh the Notes-side
cohort — repack the History archive from the integrated plugins main, update
`phase2-cohort.json` identities — and rerun the affected Notes web checks.

## Anomalies noted during this record

- The frozen Phase 2 qualification cohort contains an agent-ui pack built from
  a hidden agent-ui revision (`d2fd86fc`); its identity stays valid as cohort
  evidence, but publication must use the committed-main pack (`a07c4890…`).
- The Notes committed lockfile carries one checkout-local `link:` specifier
  (`packages/web` → jj-store), which conflicts with the registry-only lockfile
  policy and must be repaired in the publication sequence (Blocker 3/4 steps).
