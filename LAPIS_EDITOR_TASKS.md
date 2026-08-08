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
| LE-04 | lapis-notes | Story-local required Markdown/Text/JSON source editor plugin and settings | LE-01, LE-03 | Not started | Pending | Pending |
| LE-05 | lapis-notes | Vault-backed Explorer, landing actions, startup runner, and deterministic teardown | LE-01, LE-03 | Not started | Pending | Pending |
| LE-06 | lapis-notes | Runnable and focused Storybook scenarios with shared seed data | LE-04, LE-05 | Not started | Pending | Pending |
| LE-07 | both | Full checks, interaction/a11y acceptance, pending visual baselines, and final review | LE-01..LE-06 | Not started | Pending | Pending |
