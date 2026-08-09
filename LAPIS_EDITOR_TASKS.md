# Lapis Editor Tasks

Status values: `Not started`, `In progress`, `Blocked`, `Done`.

Update a row only after recording its validation evidence. Each completed
implementation slice must have a PR-quality Jujutsu change in the owning
repository.

| ID | Repository | Deliverable | Depends on | Status | Validation evidence | Jujutsu change |
| --- | --- | --- | --- | --- | --- | --- |
| LE-00 | lapis-notes | Plan, tracker, canonical specification, and migration boundary | - | Done | `pnpm spec:check` | `yposrwqs` |
| LE-01 | design-core | Generic `WorkspaceStartup` component, docs, stories, and pending visual contract | LE-00 | Done | `pnpm check:no-tailwind`; `pnpm check`; 474 unit and 519 Storybook tests; catalog build; visual audit; two inspected `visual-pending` candidates | `tvnvlmpp` |
| LE-02 | lapis-notes | Public `MemoryVaultAdapter` and `SourceTextFileView` | LE-00 | Done | API build/publint; binary/filesystem/source-view tests; root `pnpm check`; full 581-test suite | `zuzkromq` |
| LE-03 | lapis-notes | Atomic configuration persistence and editor-registry controller bridges | LE-02 | Done | Atomicity/preservation/failure tests; loop-free controller sync; exact registry update/disposal tests; `pnpm spec:check` | `zuzkromq` |
| LE-04 | lapis-notes | Story-local required Markdown/Text/JSON source editor plugin and settings | LE-01, LE-03 | Done | All 37 Storybook interaction/a11y tests; Markdown/text/JSON view and language assertions; settings persistence and live Editor Associations play | `qomnmspr`, `zytsxwyx` |
| LE-05 | lapis-notes | Vault-backed Explorer, landing actions, startup runner, and deterministic teardown | LE-01, LE-03 | Done | Explorer create/rename/move/delete play; landing palette/create/close plays; failure/retry play; 8 focused design-core Explorer tests | `qomnmspr`, `yptuzttv`, `mvpxqnuk` |
| LE-06 | lapis-notes | Runnable and focused Storybook scenarios with shared seed data | LE-04, LE-05 | Done | Seven focused demo plays; `pnpm build-storybook`; seven inspected `visual-pending` baselines; canonical comparison 7/7 passed at 0% diff | `qomnmspr` |
| LE-07 | both | Full checks, interaction/a11y acceptance, pending visual baselines, and final review | LE-01..LE-06 | Blocked | Lapis: spec/check/581 package tests/37 Storybook tests/build/focused visual all pass; full visual audit is red on 24 mismatches + 5 missing older API/workspace baselines. Design-core: owned checks pass; full `pnpm checks` stops on 6 unrelated existing Prettier findings. | `qomnmspr`, `tvnvlmpp`, `yptuzttv`, `zytsxwyx`, `mvpxqnuk` |
| LE-08 | lapis-notes | Mira base CodeMirror shell (originally landed via `file:`, now superseded by the sibling `link:`/package-export policy), Obsidian theme default, source-only language packs | LE-04 | Done | `pnpm spec:check`; `pnpm check`; api 567 tests; Storybook editor demo plays; focused visual update/compare 7/7 for `workspace-lapis-editor-demo-` | `qpqzrvzk` |
| LE-09 | both | Inline filename title paint + tab title bar breadcrumbs/history via getChrome; Explorer reveal-path | LE-06, LE-08 | Done | `pnpm spec:check`; `pnpm check`; api 567 tests; 37 Storybook tests; focused visual update/compare 7/7 for `workspace-lapis-editor-demo-`. design-core: `pnpm check`; view-header Storybook test. | lapis `nqrxzkts`; design-core `kxkvzyzk` |
