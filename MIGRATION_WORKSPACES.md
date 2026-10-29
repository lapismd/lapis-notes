# Migration workspace register

Last updated **2026-10-27 15:46:14 UTC**.

This is the complete discovered Jujutsu workspace inventory for the local LapisMD
folder, including repositories outside this cutover. It is a handoff snapshot,
not permission to merge unrelated work or delete a checkout. The
[main migration tracker](MIGRATION.md) owns delivery status;
[resume handoff](MIGRATION_HANDOFF.md) owns the next steps.

## Read the status correctly

- **History integrated:** the target, or every parent of its empty working copy,
  is in the owning main committed ancestry. Ignored artifacts still require preservation.
- **Non-empty working copy:** there are recorded changes to review; this is not a verified slice.
- **Fork awaiting content audit:** ancestry differs; work may already be moved, cherry-picked or superseded.
- **Main workspace:** inspect its handoff before changing it. Other chats may own its changes.
- **Conflicted / checkout missing:** recover or resolve deliberately; do not blanket-remove.

**Phase 1 consolidation ran on 2026-10-27:** every temporary workspace of the
four migration repositories (lapis-notes 64, lapis-desktop 28, lapis-plugins 26,
jj-store 3 — 121 total) was content-audited, integrated where unique, preserved
to its owning main's `.local/workspace-retirement/` manifest, then forgotten and
deleted. `vault-backup` (lapis-desktop) is intentionally retained. Workspaces of
the other 34 repositories remain untouched owner-review scope.

**Incident (recorded, unrecoverable):** during that pass a sibling retirement
agent ran a bare `rm -rf .workspaces` that destroyed the shared directory while
it still held other repositories' workspace checkouts. All tracked content was
already snapshotted in the jj stores and nothing was abandoned, but ignored
`.local` evidence was lost before preservation: ~70GB of Notes receipt bulk
(sizes itemized in its manifest), the Desktop E-CORE-045 native receipt payloads
and private native-build helpers (~70GB across 25 dirs), and ~906MB of Plugins
native-search-adapter run receipts. Committed evidence, the Desktop
`.local/qualification/r7-cohort/` retention set and the Notes Phase-2 input
directories are verified intact. Retirement sweeps must never delete a shared
parent directory while sibling agents are running.

## Totals

38 owning repositories; 83 registered workspaces after the 2026-10-27 Phase 1
retirement of all 121 migration-repository temporary workspaces.

| Integration state           | Workspaces |
| --------------------------- | ---------: |
| Fork awaiting content audit |         13 |
| History integrated          |         26 |
| Main workspace              |         38 |
| Non-empty working copy      |          6 |

The remaining non-main entries all belong to repositories outside the migration
scope (owner review), plus the intentionally retained `vault-backup`.

## Repository index

| Repository                                                        | Registered | Main committed baseline | Pending disposition                    |
| ----------------------------------------------------------------- | ---------: | ----------------------- | -------------------------------------- |
| [agent-redaction](#agent-redaction)                               |          2 | `3c3dc0d768af`          | Owner review; preserve unrelated scope |
| [agent-ui](#agent-ui)                                             |          5 | `0e549ebccbef`          | Owner review; preserve unrelated scope |
| [ai-controller](#ai-controller)                                   |          5 | `89b5c6f1792a`          | Owner review; preserve unrelated scope |
| [ai-host](#ai-host)                                               |          2 | `58d0ffc5ca50`          | Owner review; preserve unrelated scope |
| [community-local](#community-local)                               |          1 | `2cb26ab5310c`          | Owner review; preserve unrelated scope |
| [design-core](#design-core)                                       |         10 | `99fa0952d1c4`          | Owner review; preserve unrelated scope |
| [github-profile](#github-profile)                                 |          1 | `2bfda37bb479`          | Owner review; preserve unrelated scope |
| [homebrew-tap](#homebrew-tap)                                     |          1 | `b5bcf0293b72`          | Owner review; preserve unrelated scope |
| [jj-acp](#jj-acp)                                                 |          1 | `47946b870b18`          | Owner review; preserve unrelated scope |
| [jj-checkpoint](#jj-checkpoint)                                   |          1 | `626aeb5ad261`          | Owner review; preserve unrelated scope |
| [jj-desktop](#jj-desktop)                                         |          1 | `37e8487a67e0`          | Owner review; preserve unrelated scope |
| [jj-nostr](#jj-nostr)                                             |          1 | `ab864f64dddc`          | Owner review; preserve unrelated scope |
| [jj-sample-repo](#jj-sample-repo)                                 |          1 | `1b5f0cb83a81`          | Owner review; preserve unrelated scope |
| [jj-store](#jj-store)                                             |          1 | `52b061c52111`          | Retired 2026-10-27; see section        |
| [jujutsu-skills](#jujutsu-skills)                                 |          1 | `4089fe8edca1`          | Owner review; preserve unrelated scope |
| [lapis-ai](#lapis-ai)                                             |          1 | `b4a5f747c0dd`          | Owner review; preserve unrelated scope |
| [lapis-ci](#lapis-ci)                                             |          1 | `d0eea80ba0c7`          | Owner review; preserve unrelated scope |
| [lapis-community](#lapis-community)                               |          5 | `a5f64a4c7dea`          | Owner review; preserve unrelated scope |
| [lapis-desktop](#lapis-desktop)                                   |          2 | `b009d1441727`          | Retired 2026-10-27; vault-backup kept  |
| [lapis-notes](#lapis-notes)                                       |          1 | `c64391fdd6d0`          | Retired 2026-10-27; see section        |
| [lapis-notes-registry-final-ci](#lapis-notes-registry-final-ci)   |          1 | `3580e280a75e`          | Owner review; preserve unrelated scope |
| [lapis-plugin-cv-roles](#lapis-plugin-cv-roles)                   |          1 | `3e9a683fadbc`          | Owner review; preserve unrelated scope |
| [lapis-plugin-docs](#lapis-plugin-docs)                           |          2 | `f772f2bacc20`          | Owner review; preserve unrelated scope |
| [lapis-plugin-nostr-sync](#lapis-plugin-nostr-sync)               |          1 | `fe4754133736`          | Owner review; preserve unrelated scope |
| [lapis-plugin-notebook](#lapis-plugin-notebook)                   |          1 | `d307db8832e7`          | Owner review; preserve unrelated scope |
| [lapis-plugin-tasks](#lapis-plugin-tasks)                         |          9 | `52270c2aa783`          | Owner review; preserve unrelated scope |
| [lapis-plugin-terminal](#lapis-plugin-terminal)                   |          1 | `61f4ef24a6f2`          | Owner review; preserve unrelated scope |
| [lapis-plugins](#lapis-plugins)                                   |          1 | `a68b8880e67c`          | Retired 2026-10-27; see section        |
| [lapis-plugins-registry-version](#lapis-plugins-registry-version) |          1 | `defa3d061ae7`          | Owner review; preserve unrelated scope |
| [lapis-terminal](#lapis-terminal)                                 |          1 | `aa8fc3a866b0`          | Owner review; preserve unrelated scope |
| [mira-mde](#mira-mde)                                             |         11 | `c5d1e4b68ed6`          | Owner review; preserve unrelated scope |
| [nostr-agent-controller](#nostr-agent-controller)                 |          2 | `704f92fb64ba`          | Owner review; preserve unrelated scope |
| [nostr-auth](#nostr-auth)                                         |          1 | `c67da83185d0`          | Owner review; preserve unrelated scope |
| [nostr-plugin-registry](#nostr-plugin-registry)                   |          1 | `593e0988b43a`          | Owner review; preserve unrelated scope |
| [nostr-relay](#nostr-relay)                                       |          2 | `841c64001e28`          | Owner review; preserve unrelated scope |
| [spec-validator](#spec-validator)                                 |          1 | `ab8cd63debcd`          | Owner review; preserve unrelated scope |
| [storybook-addon-visual-delta](#storybook-addon-visual-delta)     |          1 | `67ebc69dc233`          | Owner review; preserve unrelated scope |
| [terminal-host](#terminal-host)                                   |          1 | `7d2b2849ebe4`          | Owner review; preserve unrelated scope |

## agent-redaction

Main checkout: /Users/stevejuma/code/lapismd/agent-redaction

| Workspace / checkout                                                     | Recorded revision | Integration        | Progress / still pending                                                                                                                                                                         |
| ------------------------------------------------------------------------ | ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [default](/Users/stevejuma/code/lapismd/agent-redaction)                 | `3083e1821a2c`    | Main workspace     | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                                |
| [npm-release](/Users/stevejuma/code/lapismd/agent-redaction-npm-release) | `35b9a55a0e5d`    | History integrated | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |

## agent-ui

Main checkout: /Users/stevejuma/code/lapismd/agent-ui

| Workspace / checkout                                                                                        | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [default](/Users/stevejuma/code/lapismd/agent-ui)                                                           | `c59d77756b3c`    | Main workspace              | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                                |
| [branches-fit-20261025](/Users/stevejuma/code/lapismd/.workspaces/agent-ui-branches-fit-20261025)           | `b521a89b91e6`    | Non-empty working copy      | Repository-owner scope not audited by this cutover; integration classification is history only. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [catalog-retention-20261025](/Users/stevejuma/code/lapismd/.workspaces/agent-ui-catalog-retention-20261025) | `5f903a98d4ff`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [docker-validation-20261025](/Users/stevejuma/code/lapismd/.workspaces/agent-ui-docker-20261025)            | `d08aa543c312`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [send-capability-20261027](/Users/stevejuma/code/lapismd/.workspaces/agent-ui-send-capability-20261027)     | `f243d7d37cb2`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |

## ai-controller

Main checkout: /Users/stevejuma/code/lapismd/ai-controller

| Workspace / checkout                                                             | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ----------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/ai-controller)                           | `a54693bd7299`    | Main workspace              | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                      |
| [homebrew-runtime](/Users/stevejuma/code/lapismd/ai-controller-homebrew-runtime) | `3fbeb60f347b`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change. |
| [npm-release](/Users/stevejuma/code/lapismd/ai-controller-npm-release)           | `62d941b43e15`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change. |
| [release-docs](/Users/stevejuma/code/lapismd/ai-controller-docs)                 | `dab6c370803a`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change. |
| [static-ci](/Users/stevejuma/code/lapismd/ai-controller-static-ci)               | `808972c407e2`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change. |

## ai-host

Main checkout: /Users/stevejuma/code/lapismd/ai-host

| Workspace / checkout                                             | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                               |
| ---------------------------------------------------------------- | ----------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/ai-host)                 | `028523850492`    | Main workspace              | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                      |
| [npm-release](/Users/stevejuma/code/lapismd/ai-host-npm-release) | `e3cc73b2b5b7`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change. |

## community-local

Main checkout: /Users/stevejuma/code/lapismd/community-local

| Workspace / checkout                                     | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| -------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/community-local) | `87e9e7edeb1f`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## design-core

Main checkout: /Users/stevejuma/code/lapismd/design-core

| Workspace / checkout                                                                                               | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------ | ----------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/design-core)                                                               | `f00b4625072f`    | Main workspace              | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. JJ did not expose this root; verify the inferred primary checkout before changes. |
| [catalog-package](/Users/stevejuma/code/lapismd/.workspaces/design-core-catalog-package)                           | `7b90b0445bb4`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                    |
| [column-fit-contents-20261025](/Users/stevejuma/code/lapismd/.workspaces/design-core-column-fit-contents-20261025) | `8943f1e3c285`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                    |
| [composer-lifetime](/Users/stevejuma/code/lapismd/.workspaces/design-core-composer-lifetime)                       | `73f6ce620093`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                    |
| [composer-package-20261025](/Users/stevejuma/code/lapismd/.workspaces/design-core-composer-package-20261025)       | `c032a7cda146`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                              |
| [docker-validation](/Users/stevejuma/code/lapismd/.workspaces/design-core-docker-validation)                       | `dd0470ee517c`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                    |
| [picker-contrast-20261026](/Users/stevejuma/code/lapismd/.workspaces/design-core-picker-contrast-20261026)         | `36ae3e01290e`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                    |
| [plugin-file-icons](/Users/stevejuma/code/lapismd/.workspaces/design-core-plugin-file-icons)                       | `c6c3772006a7`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                    |
| [swipe-lifetime-20261025](/Users/stevejuma/code/lapismd/.workspaces/design-core-swipe-lifetime-20261025)           | `f692cce4d942`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                    |
| [swipe-package-20261025](/Users/stevejuma/code/lapismd/.workspaces/design-core-swipe-package-20261025)             | `f2971304d7e8`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                              |

## github-profile

Main checkout: /Users/stevejuma/code/lapismd/github-profile

| Workspace / checkout                                    | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/github-profile) | `352cc91ba029`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## homebrew-tap

Main checkout: /Users/stevejuma/code/lapismd/homebrew-tap

| Workspace / checkout                                  | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ----------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/homebrew-tap) | `769d2b30f496`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## jj-acp

Main checkout: /Users/stevejuma/code/lapismd/jj-acp

| Workspace / checkout                            | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ----------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/jj-acp) | `5d758d196ac9`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## jj-checkpoint

Main checkout: /Users/stevejuma/code/lapismd/jj-checkpoint

| Workspace / checkout                                   | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------------ | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/jj-checkpoint) | `017be26180a5`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## jj-desktop

Main checkout: /Users/stevejuma/code/lapismd/jj-desktop

| Workspace / checkout                                | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| --------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/jj-desktop) | `3d530ce9a600`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## jj-nostr

Main checkout: /Users/stevejuma/code/lapismd/jj-nostr

| Workspace / checkout                              | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/jj-nostr) | `7eaa320792ac`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## jj-sample-repo

Main checkout: /Users/stevejuma/code/lapismd/jj-sample-repo

| Workspace / checkout                                    | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/jj-sample-repo) | `621b9df5adde`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## jj-store

Main checkout: /Users/stevejuma/code/lapismd/jj-store

**Phase 1 consolidation complete 2026-10-27.** All 3 temporary workspaces were
audited and retired; only `default` remains. Dispositions, fork-audit findings
and preserved artifacts: `.local/workspace-retirement/manifest-jj-store.json`.

| Workspace / checkout                              | Recorded revision                          | Integration    | Progress / still pending                                                                                                                                                                                                                  |
| ------------------------------------------------- | ------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/jj-store) | `afa38bc217aa` wc, baseline `52b061c52111` | Main workspace | Clean. Commit `26a72176` records the pending default-workspace docs (E-REUSABLE-PROGRESS-050, M33 rows, contract confirmations; docs lanes pass). Commit `52b061c5` integrates the history-read-admission fork, which was NOT superseded. |

Retirement record:

- `linux-vault-sync`: integrated; 51 receipt files preserved.
- `history-read-admission-20261026`: unique verified slice (bounded indexed read
  admission, 4 tests, E-VAULT-BACKUP-022 pass record) duplicated cleanly onto
  trunk as `52b061c5`; original `qtsxlskq 5f4bf729` remains in the store.
- `thread-files-plan`: **not merged** — saved-for-later M35 plan, implementation
  never started; pinned by bookmark `preserved-thread-files-plan` (`b43d5b89`);
  full 32-file plan + patch preserved under
  `.local/workspace-retirement/thread-files-plan/`; landing decision deferred.
- The `main` bookmark (`07229718`, 2026-10-16) is stale behind the active trunk;
  re-pointing is deferred. `powynzov c976850d` is a pre-existing sibling fork,
  untouched.

## jujutsu-skills

Main checkout: /Users/stevejuma/code/lapismd/jujutsu-skills

| Workspace / checkout                                    | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/jujutsu-skills) | `7b0d61a4d390`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## lapis-ai

Main checkout: /Users/stevejuma/code/lapismd/lapis-ai

| Workspace / checkout                              | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-ai) | `78840fa53a9b`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## lapis-ci

Main checkout: /Users/stevejuma/code/lapismd/lapis-ci

| Workspace / checkout                              | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-ci) | `5f93d8488668`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## lapis-community

Main checkout: /Users/stevejuma/code/lapismd/lapis-community

| Workspace / checkout                                                                         | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------- | ----------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [default](/Users/stevejuma/code/lapismd/lapis-community)                                     | `51c847763d5f`    | Main workspace              | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                          |
| [npm-release](/Users/stevejuma/code/lapismd/lapis-community-npm-release)                     | `94210c8558e6`    | Non-empty working copy      | Repository-owner scope not audited by this cutover; integration classification is history only. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve. |
| [release-docs](/Users/stevejuma/code/lapismd/lapis-community-docs)                           | `8c93f9c9b0f6`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.     |
| [static-schema-release](/Users/stevejuma/code/lapismd/lapis-community-static-schema-release) | `430f59616804`    | Non-empty working copy      | Repository-owner scope not audited by this cutover; integration classification is history only. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve. |
| [static-v2](/Users/stevejuma/code/lapismd/lapis-community-static-v2)                         | `68bbd478224d`    | Non-empty working copy      | Repository-owner scope not audited by this cutover; integration classification is history only. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve. |

## lapis-desktop

Main checkout: /Users/stevejuma/code/lapismd/lapis-desktop

**Phase 1 consolidation complete 2026-10-27.** 28 of 29 temporary workspaces
were retired; `vault-backup` is intentionally retained. Manifest:
`.local/workspace-retirement/manifest-lapis-desktop.json` (includes `hiddenChainRecoveryIds`).

| Workspace / checkout                                                     | Recorded revision                          | Integration        | Progress / still pending                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [default](/Users/stevejuma/code/lapismd/lapis-desktop)                   | `2f97b7fc5e8a` wc, baseline `b009d1441727` | Main workspace     | Clean. `70730562` repairs the two spec-first mappings (desktop.md/governance.md; gate passes). `b009d144` records the R7 intake: Notes native pin cd997c2c, 31-archive/117-route cohort, E-CORE-046 DRAFT; native/provider/bundle gates deferred to Phase 2. |
| [vault-backup](/Users/stevejuma/code/lapismd/vault-backup/lapis-desktop) | `a7bea279b82a`                             | History integrated | Intentionally retained backup workspace; not part of the retirement sweep.                                                                                                                                                                                   |

Retirement record:

- `catalog-validation-1/2` (non-empty): content already in main; patch exports
  preserved; pinned `preserved-catalog-validation-1` (`feb1e8c3`),
  `preserved-catalog-validation-2` (`1b002dbf`).
- Unlanded recoverable chains are bookmarked: `preserved-e-qualification-003`
  (`3628db65`, E-QUALIFICATION-003 not in main — landing decision deferred to
  Phase 2), `preserved-docker-catalog-candidate` (`2e810560`),
  `preserved-provider-chat-qualification` (`11e22c7f`, divergent),
  `preserved-bases-native-adoption` (`34909cff`); `codex/release-coordination`
  (`a8572603`) holds unlanded E-RELEASE-017 + RELEASE.md.
- Incident loss: the external `.workspaces` deletion destroyed 25 workspace
  dirs (~70GB) before preservation, including the E-CORE-045 native receipt
  payloads and the private native-build/mac-rust/bootstrap helpers —
  permanently lost; E-CORE-045.md committed evidence and main
  `.local/qualification/r7-cohort/` (4 receipts + 33 archives covering all
  E-CORE-046 identities) are verified intact.
- Surviving siblings preserved then retired: `e20-parent` (36 files incl.
  headless probe receipts), `hosted-history` (E-QUALIFICATION-003 doc+patch),
  `release-coordination` (E-RELEASE-017 + RELEASE.md exports).

## lapis-notes

Main checkout: /Users/stevejuma/code/lapismd/lapis-notes

**Phase 1 consolidation complete 2026-10-27.** All 64 temporary workspaces were
retired; only `default` remains. Manifest:
`.local/workspace-retirement/manifest-lapis-notes.json`.

| Workspace / checkout                                 | Recorded revision                          | Integration    | Progress / still pending                                                                                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-notes) | `66cb6e4c41e7` wc, baseline `c64391fdd6d0` | Main workspace | Clean. `c64391fd` commits the unverified optional actual-image model-tester draft; basic16 + model phases must rerun in Phase 2 before qualification. Phase-2 input dirs under `.local/` verified intact. |

Retirement record:

- All 10 non-empty and 11 fork revisions were individually content-audited:
  superseded (byte-identical to landed commits such as `865f0988`, `fe1d2dcd`,
  `c4bbc6cc`, `d2346704`), reproduction-only (task-reference baseline), or
  snapshot-committed (hosted-services `f91a7e8b`, release-verification
  `4de6c136`). Zero `jj abandon` operations.
- Two unique unlanded lineages were **not merged** (they require validation
  lanes forbidden in Phase 1) and are pinned: bookmark
  `preserved-hosted-properties-20261027` (`kpymntwz 845842b8`: never-executed
  hosted Properties e2e + LN-WEB-074 spec text) and bookmark
  `preserved-shared-conflict-review-20261026` (`pslnvswp 36cc3c4e` chain:
  frozen Workspace 0.2.1 file-conflicts candidate `ea7a2d28` + record
  `974328f6`). Phase 2 decides their integration.
- Sibling `../lapis-notes-*` artifacts (3,250 files / ~472MB, incl.
  native-occurrences' 469 files) were preserved before retirement.
  `lapis-notes-registry-final-ci` is an independent repository and was left in
  place.
- Incident loss: the external `.workspaces` deletion destroyed the ignored
  `.local` evidence (~70GB bulk; per-workspace sizes recorded in the manifest)
  of the 57 `.workspaces`-hosted workspaces before preservation; all tracked
  content was safe in the jj store.
- Phase-2 inputs verified intact: `.local/validation/runs/lapis-r7-runtime-final-*`,
  `.local/server-container/*`, `.local/r7-provider-final/macos-20261027/`,
  `.local/r7-cutover/`, `.local/search-models/`.

## lapis-notes-registry-final-ci

Main checkout: /Users/stevejuma/code/lapismd/lapis-notes-registry-final-ci

| Workspace / checkout                                                   | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ---------------------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-notes-registry-final-ci) | `9dde15e8ecfe`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## lapis-plugin-cv-roles

Main checkout: /Users/stevejuma/code/lapismd/lapis-plugin-cv-roles

| Workspace / checkout                                           | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| -------------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-plugin-cv-roles) | `03efacd6f921`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## lapis-plugin-docs

Main checkout: /Users/stevejuma/code/lapismd/lapis-plugin-docs

| Workspace / checkout                                                                                                      | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-plugin-docs)                                                                | `b1389446aa67`    | Main workspace              | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                      |
| [docs-native-projection-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugin-docs-native-projection-20261025) | `0da56831475d`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change. |

## lapis-plugin-nostr-sync

Main checkout: /Users/stevejuma/code/lapismd/lapis-plugin-nostr-sync

| Workspace / checkout                                             | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ---------------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-plugin-nostr-sync) | `1a867efa17c6`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## lapis-plugin-notebook

Main checkout: /Users/stevejuma/code/lapismd/lapis-plugin-notebook

| Workspace / checkout                                           | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| -------------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-plugin-notebook) | `ce48b5d62f0d`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## lapis-plugin-tasks

Main checkout: /Users/stevejuma/code/lapismd/lapis-plugin-tasks

| Workspace / checkout                                                                                                                | Recorded revision | Integration            | Progress / still pending                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [default](/Users/stevejuma/code/lapismd/lapis-plugin-tasks)                                                                         | `ecc45c3f9c9b`    | Main workspace         | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                                |
| [hosted-outcomes-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-task-hosted-outcomes-20261026)                           | `0971fce12280`    | History integrated     | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [lapis-task-daily-locale-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-task-daily-locale-20261026)                      | `1ea6211dadcc`    | History integrated     | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-host-adapter-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-task-native-host-adapter-20261026)                   | `7c0661ac0670`    | History integrated     | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-mutation-parity-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-task-mutation-parity-20261025)                    | `ad400a0e8e99`    | History integrated     | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-recurrence-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-task-recurrence-intake-20261025)                       | `14aa6cabd0c5`    | History integrated     | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-task-coordination-reference-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-task-coordination-reference-20261026) | `01b0e13f52cb`    | History integrated     | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-task-documents](/Users/stevejuma/code/lapismd/lapis-task-documents)                                                         | `be7c7e6b89cd`    | Non-empty working copy | Repository-owner scope not audited by this cutover; integration classification is history only. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [native-yaml-parser-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-task-yaml-parser-20261025)                            | `abae243ba3ed`    | History integrated     | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |

## lapis-plugin-terminal

Main checkout: /Users/stevejuma/code/lapismd/lapis-plugin-terminal

| Workspace / checkout                                           | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| -------------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-plugin-terminal) | `9c609eea5884`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## lapis-plugins

Main checkout: /Users/stevejuma/code/lapismd/lapis-plugins

**Phase 1 consolidation complete 2026-10-27.** All 26 temporary workspaces were
retired; only `default` remains. Manifest:
`.local/workspace-retirement/manifest-lapis-plugins.json` (incl. `storeOnlyHistoryWarning`).

| Workspace / checkout                                   | Recorded revision                          | Integration    | Progress / still pending                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-plugins) | `f7fd92ed969c` wc, baseline `a68b8880e67c` | Main workspace | Clean. Lineage above `773bed9e`: `338282bf` qualified test repair (exact targeted 2/2+2/2 pass after 0/2+0/2 before) → `467f2231` portable-lock draft (UNVERIFIED, blocked on released API EmbedRegistry.renderMarkdownEmbed; do not publish) → `0de75f96`/`d38a1cdf`/`a68b8880` unique native-search stack (cargo +1.99 check, markdown_yaml 2/2, search_canvas 1/1 pass; TS/spec/full lanes are Phase 2). |

Retirement record:

- The unauthorized thirteen-plugin release-batch preparation was **not merged
  and not published**; it exists only as store commit `67ce4ae5`, bookmark
  `preserved-npm-release-batch`. Release authorization remains a separate gate.
- The unmerged R7 native-services lane (~22 substantive commits, e.g.
  `bd305e58`, `40f8febb`, `814f6d2d`, `ee3580d3`+`857444bc` frozen Deno sync
  plan) remains store-only; IDs are recorded in the manifest. Do not assume it
  landed; Phase 2 decides integration or explicit supersession.
- 6,808 evidence files (~1.0GB) preserved, incl. the desktop-migration
  `.release` payload tree and the static-ci registry-acceptance fixture with
  all 13 `.lapis-plugin` bundles; 9 oversized files sha256-recorded.
- Incident loss: native-search-adapter `.local` run receipts (~906MB) were
  destroyed by the external `.workspaces` deletion.

## lapis-plugins-registry-version

Main checkout: /Users/stevejuma/code/lapismd/lapis-plugins-registry-version

| Workspace / checkout                                                    | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ----------------------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-plugins-registry-version) | `95942d31680e`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## lapis-terminal

Main checkout: /Users/stevejuma/code/lapismd/lapis-terminal

| Workspace / checkout                                    | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-terminal) | `5963fe019c0b`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## mira-mde

Main checkout: /Users/stevejuma/code/lapismd/mira-mde

| Workspace / checkout                                                                                                        | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [default](/Users/stevejuma/code/lapismd/mira-mde)                                                                           | `d0d7a46d17b5`    | Main workspace              | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                                |
| [bits-intake-20261025](/Users/stevejuma/code/lapismd/.workspaces/mira-bits-intake-20261025)                                 | `2fdf143308e7`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [bits-intake-pack-validation-20261025](/Users/stevejuma/code/lapismd/.workspaces/mira-bits-pack-validation-20261025)        | `d85f8b5f7cad`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [desktop-migration](/Users/stevejuma/code/lapismd/mira-mde-desktop-migration)                                               | `36d3800dfefd`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [inline-links](/Users/stevejuma/code/lapismd/mira-mde-inline-links)                                                         | `3060b281a41f`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [input-lease-20261026](/Users/stevejuma/code/lapismd/.workspaces/mira-input-lease-20261026)                                 | `f69d79ea8c35`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [npm-release](/Users/stevejuma/code/lapismd/mira-mde-npm-release)                                                           | `b64ba1e69138`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [preview-attachment-tracking-20261026](/Users/stevejuma/code/lapismd/.workspaces/mira-preview-attachment-tracking-20261026) | `1c592d4ea5e8`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [properties-edit-boundary-20261026](/Users/stevejuma/code/lapismd/.workspaces/mira-properties-edit-boundary-20261026)       | `a8aac2e2c87d`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [static-registry-ci](/Users/stevejuma/code/lapismd/mira-mde-static-registry-ci)                                             | `9cd59bf1fee7`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [wave3-release](/Users/stevejuma/code/lapismd/mira-mde-wave3-release)                                                       | `6ba4ea4a8bc1`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |

## nostr-agent-controller

Main checkout: /Users/stevejuma/code/lapismd/nostr-agent-controller

| Workspace / checkout                                                                                         | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------ | ----------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/nostr-agent-controller)                                              | `04bdd6eea733`    | Main workspace              | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                      |
| [nostr-agent-controller-context-budget](/Users/stevejuma/code/lapismd/nostr-agent-controller-context-budget) | `4504a8ccd76e`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change. |

## nostr-auth

Main checkout: /Users/stevejuma/code/lapismd/nostr-auth

| Workspace / checkout                                | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| --------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/nostr-auth) | `988ac8271a2b`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## nostr-plugin-registry

Main checkout: /Users/stevejuma/code/lapismd/nostr-plugin-registry

| Workspace / checkout                                           | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| -------------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/nostr-plugin-registry) | `f5a3e42cfb5b`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## nostr-relay

Main checkout: /Users/stevejuma/code/lapismd/nostr-relay

| Workspace / checkout                                               | Recorded revision | Integration            | Progress / still pending                                                                                                                                                                   |
| ------------------------------------------------------------------ | ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [default](/Users/stevejuma/code/lapismd/nostr-relay)               | `0b5d0c81c7ad`    | Main workspace         | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                          |
| [nostr-gateway](/Users/stevejuma/code/lapismd/nostr-relay-gateway) | `36c7722c5a22`    | Non-empty working copy | Repository-owner scope not audited by this cutover; integration classification is history only. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve. |

## spec-validator

Main checkout: /Users/stevejuma/code/lapismd/spec-validator

| Workspace / checkout                                    | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/spec-validator) | `8e7258378dc2`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## storybook-addon-visual-delta

Main checkout: /Users/stevejuma/code/lapismd/storybook-addon-visual-delta

| Workspace / checkout                                                  | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| --------------------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/storybook-addon-visual-delta) | `35318cce6d19`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## terminal-host

Main checkout: /Users/stevejuma/code/lapismd/terminal-host

| Workspace / checkout                                   | Recorded revision | Integration    | Progress / still pending                                                                                                                          |
| ------------------------------------------------------ | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/terminal-host) | `6c85f228fba7`    | Main workspace | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes. |

## Refresh and cleanup rules

The machine-readable snapshot is [spec/migration-workspaces.json](spec/migration-workspaces.json).
Refresh it and this register after integration commits or workspace retirement.
Recheck the exact working tree and owner before resuming a fork; do not equate
an empty workspace with completed acceptance. Before removing any integrated
migration checkout, retain needed ignored source archives, build/provider
receipts and private configuration in its owning default workspace. Never copy
credentials into this register or a tracked evidence file.
