# Migration workspace register

Last updated **2026-10-27 14:08:02 UTC**.

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

**No temporary workspaces have been deleted as part of this handoff.** Snapshot
status uses read-only JJ metadata; another chat may have newer filesystem edits.
Secrets, vaults, profiles and ignored reports were not scanned. Design Core's
primary path was inferred from its store because JJ omits that root; verify its
workspace metadata before making changes. The Git worktree cross-check found
no additional independent checkout after that primary path was accounted for.

## Totals

38 owning repositories; 204 registered workspaces.

| Integration state           | Workspaces |
| --------------------------- | ---------: |
| Fork awaiting content audit |         50 |
| History integrated          |         92 |
| Main workspace              |         38 |
| Non-empty working copy      |         24 |

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
| [jj-store](#jj-store)                                             |          4 | `4e74e4239661`          | Owner review; preserve unrelated scope |
| [jujutsu-skills](#jujutsu-skills)                                 |          1 | `4089fe8edca1`          | Owner review; preserve unrelated scope |
| [lapis-ai](#lapis-ai)                                             |          1 | `b4a5f747c0dd`          | Owner review; preserve unrelated scope |
| [lapis-ci](#lapis-ci)                                             |          1 | `d0eea80ba0c7`          | Owner review; preserve unrelated scope |
| [lapis-community](#lapis-community)                               |          5 | `a5f64a4c7dea`          | Owner review; preserve unrelated scope |
| [lapis-desktop](#lapis-desktop)                                   |         30 | `85d9b5e10fcb`          | Paused migration intake; see handoff   |
| [lapis-notes](#lapis-notes)                                       |         65 | `68604b41f9ea`          | Paused migration intake; see handoff   |
| [lapis-notes-registry-final-ci](#lapis-notes-registry-final-ci)   |          1 | `3580e280a75e`          | Owner review; preserve unrelated scope |
| [lapis-plugin-cv-roles](#lapis-plugin-cv-roles)                   |          1 | `3e9a683fadbc`          | Owner review; preserve unrelated scope |
| [lapis-plugin-docs](#lapis-plugin-docs)                           |          2 | `f772f2bacc20`          | Owner review; preserve unrelated scope |
| [lapis-plugin-nostr-sync](#lapis-plugin-nostr-sync)               |          1 | `fe4754133736`          | Owner review; preserve unrelated scope |
| [lapis-plugin-notebook](#lapis-plugin-notebook)                   |          1 | `d307db8832e7`          | Owner review; preserve unrelated scope |
| [lapis-plugin-tasks](#lapis-plugin-tasks)                         |          9 | `52270c2aa783`          | Owner review; preserve unrelated scope |
| [lapis-plugin-terminal](#lapis-plugin-terminal)                   |          1 | `61f4ef24a6f2`          | Owner review; preserve unrelated scope |
| [lapis-plugins](#lapis-plugins)                                   |         27 | `773bed9e9945`          | Paused migration intake; see handoff   |
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

| Workspace / checkout                                                                                                  | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [default](/Users/stevejuma/code/lapismd/jj-store)                                                                     | `185acaf6e07c`    | Main workspace              | Repository-owner scope not audited by this cutover; integration classification is history only. See repository handoff; preserve current changes.                                                |
| [history-read-admission-20261026](/Users/stevejuma/code/lapismd/.workspaces/jj-store-history-read-admission-20261026) | `51b3e9ef8d37`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [linux-vault-sync](/Users/stevejuma/code/lapismd/.workspaces/jj-store-linux-vault-sync)                               | `34a966df92f9`    | History integrated          | Repository-owner scope not audited by this cutover; integration classification is history only. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [thread-files-plan](/Users/stevejuma/code/lapismd/jj-store-thread-files-plan)                                         | `0701b0e941b9`    | Fork awaiting content audit | Repository-owner scope not audited by this cutover; integration classification is history only. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |

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

| Workspace / checkout                                                                                                               | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-desktop)                                                                             | `6cf6ec5f86e2`    | Main workspace              | Provider85d9 ancestry integrated; refreshed31/117 cohort is uncommitted. Native qualification and two spec-first mappings remain. See repository handoff; preserve current changes. |
| [agent-catalog-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-agent-catalog-20261025)                           | `f6f1b0c604eb`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [bases-intake-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-bases-intake-20261025)                             | `ba4f089c21ae`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [catalog-validation-1](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-catalog-validation-1)                               | `feb1e8c3bfe4`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.        |
| [catalog-validation-2](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-catalog-validation-2)                               | `1b002dbf3c63`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.        |
| [catalog-validation-3](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-catalog-validation-3)                               | `b8610fd6533a`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [catalog-validation-4](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-catalog-validation-4)                               | `f05c16850778`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [desktop-native-queue-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-native-queue-20261027)                     | `c1948197587b`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [desktop-native-queue-provider-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-native-queue-provider-20261027)   | `61d7c18e4184`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [desktop-search-catalog-b-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-search-catalog-b-20261026)             | `3b6aafd6d220`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [e20-parent](/Users/stevejuma/code/lapismd/lapis-desktop-e20-parent)                                                               | `5da2db31e1f5`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [file-icons-main-shard-1-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-file-icons-main-shard-1)                | `061ddfef601a`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [file-icons-shard-2](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-file-icons-shard-2)                                   | `cee70bb9a9b6`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [file-icons-shard-3](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-file-icons-shard-3)                                   | `d14062f6fb0c`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [file-icons-shard-4](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-file-icons-shard-4)                                   | `823017285d8e`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [history-owner-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-history-owner-20261025)                           | `473dc068e3f3`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [hosted-history](/Users/stevejuma/code/lapismd/lapis-desktop-hosted-history)                                                       | `c2e211050435`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [metadata-catalog4-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-metadata-catalog4-20261026)                   | `9c6616ceb7fc`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [metadata-native-validation-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-metadata-native-validation-20261026) | `e44dc5b3f0f8`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [metadata-owner-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-metadata-owner-20261026)                         | `3dca580d7ceb`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [native-editor-claims-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-native-editor-claims-20261026)             | `798e6933e916`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [native-tasks-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-native-tasks-20261026)                             | `df9b9c3f0794`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [plugin-file-icons](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-file-icons)                                            | `c94b8c6d3275`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [provider-screen-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-provider-screen-20261025)                       | `60afe286d576`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [release-coordination](/Users/stevejuma/code/lapismd/lapis-desktop-release)                                                        | `14cb2b126169`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [search-owner-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-search-owner-20261026)                             | `95898140ffd3`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [shared-history-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-shared-history-20261026)                         | `ca91a0e88fb6`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [shared-original-reader-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-original-reader-20261026)                | `4b0c823d708a`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |
| [target-modes-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-desktop-target-modes-20261025)                             | `6e68aaefab34`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.            |
| [vault-backup](/Users/stevejuma/code/lapismd/vault-backup/lapis-desktop)                                                           | `a7bea279b82a`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.  |

## lapis-notes

Main checkout: /Users/stevejuma/code/lapismd/lapis-notes

| Workspace / checkout                                                                                                              | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-notes)                                                                              | `83dc5b6a6eaf`    | Main workspace              | Rust cutover cd997 committed; full 8404 qualification passed. Optional image-model tester draft is unverified; paused. See repository handoff; preserve current changes.           |
| [backup-problems-cohort-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-backup-problems-cohort-20261026)          | `e699e6c9ae45`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [consumer-pack-bits-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-consumer-pack-bits-20261025)                  | `395f53596b4a`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [desktop-migration](/Users/stevejuma/code/lapismd/lapis-notes-desktop-migration)                                                  | `9ee0fa3404ac`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [editor-problems-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-editor-problems-20261026)                        | `0cd9b61a2906`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [file-icons-main-intake-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-file-icons-main-intake)                   | `b12a0305f2d9`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [homebrew-distribution](/Users/stevejuma/code/lapismd/lapis-notes-homebrew)                                                       | `6094b172b448`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [hosted-final-cohort-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-hosted-final-cohort-20261026)                | `b03756f4ffb1`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [hosted-history-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-hosted-history-20261026)                          | `a32dab49ea15`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [hosted-history-adapter-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-hosted-history-adapter-20261026)          | `7dc750d49db0`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [hosted-native-metadata-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-hosted-native-metadata-20261026)          | `bf8e2ac67748`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [hosted-native-search-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-hosted-native-search-20261026)              | `34fc6b6e8906`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [hosted-properties-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-hosted-properties-20261027)                    | `82781d5204b1`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [hosted-services](/Users/stevejuma/code/lapismd/lapis-notes-hosted-services)                                                      | `f051481facab`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [hosted-task-reference-baseline-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-task-reference-baseline-20261026) | `d05686e7d060`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [hosted-tasks-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-hosted-tasks-20261026)                              | `e5a34c86860e`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [lapis-notes-daily-locale-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-daily-locale-20261026)                  | `7a599c8ac0d4`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [lapis-notes-r7-runtime-delivery-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r7-runtime-delivery-20261027)    | `e10dfe9acba2`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [linux-model-reference-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-linux-model-reference-20261027)            | `8c81f6b58217`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [native-background-port-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-background-port-20261025)          | `c96ffb33cad1`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-docs-index-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-docs-index-20261025)                    | `db861ad05c38`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-editor-claims-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-editor-claims-20261026)              | `10051ac051d4`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [native-editor-retirement-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-editor-retirement-20261026)      | `327241897ed1`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [native-handoff-recovery-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-handoff-recovery-20261027)        | `97840f0f3675`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [native-handoff-story-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-handoff-story-20261027)              | `009dff39c906`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-history-capture-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-history-capture-20261026)          | `c6d8788efce5`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [native-history-owner-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-history-owner-20261025)              | `a3276f39772d`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-intent-recovery-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-intent-recovery-20261026)          | `8d425bb17934`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-occurrences](/Users/stevejuma/code/lapismd/lapis-notes-native-occurrences)                                                | `17f97e62dbe8`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [native-search-observer-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-search-observer-20261026)          | `8195faa4467d`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-search-owner-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-search-owner-20261025)                | `b7ffc1e1d342`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-search-providers-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-search-providers-20261026)        | `cb79d009cae4`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-task-coordination-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-native-task-coordination-20261026)            | `9a5953e69ce2`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-task-port-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-task-port-20261026)                      | `234888316970`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-task-writes-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-native-task-writes-20261025)                        | `47828d893657`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [native-tasks-index-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-native-tasks-index-20261025)                  | `407410e4402c`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [plugin-file-icons](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-plugin-file-icons)                                      | `43b7ad937428`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [provider-modes-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-provider-modes-20261025)                          | `28067e5f37ae`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r3-acceptance-final-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r3-acceptance-final-20261027)                | `f8201e88c833`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r3-adapters-intake-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r3-adapters-intake-20261026)                  | `e082182b0427`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r3-editor-undo-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r3-editor-undo-20261027)                          | `9685d887bc55`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r3-final-main-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r3-final-main-20261027)                            | `acad9fc80224`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r3-hosted-semantic-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r3-hosted-semantic-20261027)                  | `44554fb7c161`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r3-kernel-final-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r3-kernel-final-20261027)                        | `70746789b40d`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [r3-shared-intake-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r3-shared-intake-20261026)                      | `5fbd3e0029f2`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r4-bootstrap-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-bootstrap-20261027)                              | `1eb6650f7f11`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r4-bootstrap-reader-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-bootstrap-reader-20261027)                | `81e88ef557b7`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r4-chat-queue-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-chat-queue-20261027)                            | `1426e3d6732c`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [r4-context-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-context-20261027)                                  | `625bffe301fa`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r4-indexing-race-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-indexing-race-20261027)                      | `89becfc77c9d`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [r4-native-skills-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-native-skills-20261027)                      | `f9541ec14eee`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r4-participant-host-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-participant-host-20261027)                | `a7d87ec6f740`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r4-participant-port-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-participant-port-20261027)                | `fbf18281639c`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [r4-participants-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-participants-20261027)                        | `5cc7a76640c1`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [r4-plan-review-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-plan-review-20261026)                          | `c52172083f88`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [r4-queue-port-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-queue-port-20261027)                            | `1030321fbbc0`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [r4-queue-provider-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r4-queue-provider-20261027)                    | `f4ae6c23cb5f`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |
| [r7-observation-streams-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r7-observation-streams-20261027)          | `c71f24e9d9ca`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [r7-static-delivery-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-r7-static-delivery-20261027)                  | `ab64796420df`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [reader-intake-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-reader-intake-20261026)                            | `bdffe84c0f0f`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [release-verification](/Users/stevejuma/code/lapismd/lapis-notes-release-verification)                                            | `40b6f26767bd`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.       |
| [restore-intake-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-restore-intake-20261026)                          | `82dc5e415554`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [reusable-history](/Users/stevejuma/code/lapismd/lapis-notes-history)                                                             | `8651daa2e670`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [server-node](/Users/stevejuma/code/lapismd/lapis-notes-server-node)                                                              | `613e6444ff0f`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope. |
| [shared-conflict-review-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-notes-shared-conflict-review-20261026)          | `23e0d2d6eb51`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.           |

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

| Workspace / checkout                                                                                                                 | Recorded revision | Integration                 | Progress / still pending                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [default](/Users/stevejuma/code/lapismd/lapis-plugins)                                                                               | `05d58fc615f3`    | Main workspace              | See integration state; a history result does not establish functional completion. See repository handoff; preserve current changes.                                                                               |
| [bases-parent-check-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-bases-parent-check-20261025)                   | `374a89adbb8e`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                |
| [bases-select-before-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-bases-select-before-20261025)                 | `5aed9d0208ef`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.                                      |
| [bases-select-names-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-bases-select-names-20261025)                   | `76f539167785`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [csv-metadata-order-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-csv-metadata-order-20261025)                   | `4f837e250cd4`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [desktop-migration](/Users/stevejuma/code/lapismd/lapis-plugins-desktop-migration)                                                   | `aced6eee2fc1`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [desktop-reading-fill](/Users/stevejuma/code/lapismd/lapis-plugins/.local/desktop-reading-fill)                                      | `8f2bd552c93b`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [file-icons-baseline](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-file-icons-baseline)                                   | `8b9ad8eb24c2`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                |
| [file-icons-main-intake-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-file-icons-main-intake)                    | `8a7265d82bda`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                |
| [lapis-plugins-cold-catalog-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-cold-catalog-20261026)                 | `bf0e659f3206`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [main-icons-regression-parent-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-main-icons-regression-parent)        | `101353f9615c`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.                                      |
| [markdown-yaml-20261025](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-markdown-yaml-20261025)                             | `27d46a1f62a1`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [native-backup-observer-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-native-backup-observer-20261026)           | `95e97a2ab053`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [native-editor-claims-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-native-editor-claims-20261026)               | `06091942679e`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [native-editor-claims-before-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-native-editor-claims-before-20261026) | `6432dc9a0fe3`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [native-history-observer-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-native-history-observer-20261026)         | `c19d8dee9fa2`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [native-search-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-native-search-20261026)                             | `572805cd35a3`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [native-search-adapter-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-native-search-adapter-20261026)             | `5d0397f4fc5a`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.                                      |
| [npm-release](/Users/stevejuma/code/lapismd/lapis-plugins-npm-release)                                                               | `67ce4ae55dec`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.                                      |
| [plugin-file-icons](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-file-icons)                                              | `92afc8743b4e`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                |
| [properties-before-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-properties-before-20261026)                     | `152e9f785a42`    | Non-empty working copy      | See integration state; a history result does not establish functional completion. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve.                                      |
| [properties-persistence-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-properties-persistence-20261026)           | `1246cc959b64`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [r7-release-tests-20261027](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-r7-release-tests-20261027)                       | `16409f80cff9`    | Non-empty working copy      | Qualified407ada test repair is not integrated. Portable-lock16409 draft and registry/API release-input blocker remain. Review unpublished changes and owner scope; qualify and integrate, or explicitly preserve. |
| [release-deferral](/Users/stevejuma/code/lapismd/lapis-plugins-release-deferral)                                                     | `9991bb8c50ae`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                |
| [search-recovery-20261026](/Users/stevejuma/code/lapismd/.workspaces/lapis-plugins-search-recovery-20261026)                         | `343f43f57a8f`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |
| [static-ci](/Users/stevejuma/code/lapismd/lapis-plugins-static-ci)                                                                   | `1d5ac7639338`    | History integrated          | See integration state; a history result does not establish functional completion. Preserve ignored artifacts/receipts, verify ownership, then forget/remove if in migration scope.                                |
| [sync-plan](/Users/stevejuma/code/lapismd/lapis-plugins-sync-plan)                                                                   | `f66991c145f8`    | Fork awaiting content audit | See integration state; a history result does not establish functional completion. Compare with main for moved/superseded/cherry-picked work; qualify any missing change.                                          |

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
