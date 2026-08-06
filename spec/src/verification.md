# Verification

Requirement traceability and implementation progress for the minimal repo.

| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-ARCH-001 | architecture | Implemented | `pnpm-workspace.yaml`, `turbo.json` |
| LN-ARCH-002 | architecture | Implemented | package scripts on api/ui |
| LN-ARCH-003 | architecture | Implemented | root `storybook` script port 7010 |
| LN-ARCH-004 | architecture | Implemented | no `check:source-resolution` scripts |
| LN-ARCH-005 | architecture | Implemented | root dep `link:../design-core` |
| LN-PKG-001 | packages | Implemented | `packages/api` kernel copy |
| LN-PKG-002 | packages | Implemented | api peer on `@lapis-notes/ui` |
| LN-PKG-003 | packages | Implemented | pruned `packages/ui` |
| LN-PKG-004 | packages | Implemented | hosts/plugins absent; tracked in `MIGRATION.md` |
| LN-PKG-005 | packages | Implemented | package `exports` maps |
| LN-PKG-006 | packages | Implemented | `VaultStorageKind` in `vault-state.ts`; LightningFS / `tauri-folder` removed |
| LN-UI-001 | ui-and-styling | In progress | swap map in `MIGRATION.md` |
| LN-UI-002 | ui-and-styling | Implemented | `API/` stories under `stories/api/` |
| LN-UI-003 | ui-and-styling | In progress | philosophy documented; theme swap pending |
| LN-UI-004 | ui-and-styling | Implemented | policy in AGENTS + this chapter |
| LN-UI-005 | ui-and-styling | Pending | theme row in `MIGRATION.md` |
| LN-CAT-001 | storybook-catalog | Implemented | Storybook host |
| LN-CAT-002 | storybook-catalog | Implemented | `stories/api/*` + plays; `pnpm test:storybook` |
| LN-CAT-003 | storybook-catalog | Implemented | `stories/catalog/catalog.mjs` + `ApiUi.mdx` |
| LN-CAT-004 | storybook-catalog | Implemented | docs link to spec chapters |
| LN-CAT-005 | storybook-catalog | Implemented | noted in `MIGRATION.md` |
| LN-CAT-006 | storybook-catalog | Implemented | Visual Delta baselines under `tests/visual/…`; tags `visual-pending` |
| LN-CAT-007 | storybook-catalog | Implemented | `api-ui-status` + portal body assertions in plays |
| LN-GOV-001 | spec-governance | Implemented | `spec/` mdBook sources |
| LN-GOV-002 | spec-governance | Implemented | this matrix |
| LN-GOV-003 | spec-governance | Implemented | `scripts/check-spec-first.mjs` |
| LN-GOV-004 | spec-governance | Implemented | jj/git change detection |
| LN-GOV-005 | spec-governance | Implemented | ignored patterns in gate |
| LN-GOV-006 | spec-governance | Implemented | fail-closed on VCS errors |
| LN-GOV-007 | spec-governance | Implemented | `spec/book` gitignored |
