# Verification

Requirement traceability and implementation progress for the minimal repo.

| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-ARCH-001 | architecture | Implemented | `pnpm-workspace.yaml`, `turbo.json` |
| LN-ARCH-002 | architecture | Implemented | package scripts on api/ui |
| LN-ARCH-003 | architecture | Implemented | root `storybook` script port 7010 |
| LN-ARCH-004 | architecture | Implemented | no `check:source-resolution` scripts |
| LN-ARCH-005 | architecture | Implemented | root dep `file:../design-core` |
| LN-ARCH-006 | architecture | Implemented | root `check` runs `check:no-tailwind` |
| LN-ARCH-007 | architecture | In progress | `packages/workspace`; workspace-shell requirements |
| LN-PKG-001 | packages | Implemented | `packages/api` kernel copy |
| LN-PKG-002 | packages | Implemented | api peer on `@lapis-notes/ui` |
| LN-PKG-003 | packages | Implemented | pruned `packages/ui` |
| LN-PKG-004 | packages | Implemented | hosts/plugins absent; tracked in `MIGRATION.md` |
| LN-PKG-005 | packages | Implemented | package `exports` maps |
| LN-PKG-006 | packages | Implemented | `VaultStorageKind` in `vault-state.ts`; LightningFS / `tauri-folder` removed |
| LN-PKG-007 | packages | In progress | `packages/workspace` shell adapter |
| LN-UI-001 | ui-and-styling | Implemented | api + stories on `@lapismd/design-core/shadcn/*`; kept compounds only in ui |
| LN-UI-002 | ui-and-styling | Implemented | `API/` stories under `stories/api/` |
| LN-UI-003 | ui-and-styling | Implemented | colocated CSS + `--ui-*` on kept compounds + api chrome |
| LN-UI-004 | ui-and-styling | Implemented | policy in AGENTS + this chapter; no-TW gate |
| LN-UI-005 | ui-and-styling | In progress | Storybook loads design-core styles + lapis theme; production hosts still pending |
| LN-UI-006 | ui-and-styling | Implemented | AA-safe `--primary` / `--destructive` in design-core lapis theme |
| LN-UI-007 | ui-and-styling | Implemented | ui `theme.css` alias-only; brand in design-core `themes/lapis.css` |
| LN-UI-008 | ui-and-styling | Implemented | compounds + api chrome on native CSS; stories excluded |
| LN-UI-009 | ui-and-styling | Implemented | `pnpm check:no-tailwind` in root/package `check` |
| LN-CAT-001 | storybook-catalog | Implemented | Storybook host |
| LN-CAT-002 | storybook-catalog | Implemented | `stories/api/*` + plays; `pnpm test:storybook` |
| LN-CAT-003 | storybook-catalog | Implemented | `stories/catalog/catalog.mjs` + `ApiUi.mdx` |
| LN-CAT-004 | storybook-catalog | Implemented | docs link to spec chapters |
| LN-CAT-005 | storybook-catalog | Implemented | noted in `MIGRATION.md` |
| LN-CAT-006 | storybook-catalog | Implemented | Visual Delta baselines under `tests/visual/…`; tags `visual-pending` |
| LN-CAT-007 | storybook-catalog | Implemented | `api-ui-status` + portal body assertions in plays |
| LN-CAT-008 | storybook-catalog | Implemented | `.storybook/vitest.setup.ts` + `parameters.a11y.test: "error"` |
| LN-CAT-009 | storybook-catalog | Implemented | preview: design-core styles + lapis + ui alias theme |
| LN-CAT-010 | storybook-catalog | Implemented | stories excluded from no-tailwind scan |
| LN-CAT-011 | storybook-catalog | In progress | `stories/workspace/*` |
| LN-CAT-012 | storybook-catalog | In progress | workspace story plays + story adapter |
| LN-CAT-013 | storybook-catalog | In progress | empty contribution registries; no plugin boot |
| LN-GOV-001 | spec-governance | Implemented | `spec/` mdBook sources |
| LN-GOV-002 | spec-governance | Implemented | this matrix |
| LN-GOV-003 | spec-governance | Implemented | `scripts/check-spec-first.mjs` |
| LN-GOV-004 | spec-governance | Implemented | jj/git change detection |
| LN-GOV-005 | spec-governance | Implemented | ignored patterns in gate |
| LN-GOV-006 | spec-governance | Implemented | fail-closed on VCS errors |
| LN-GOV-007 | spec-governance | Implemented | `spec/book` gitignored |
| LN-WS-001 | workspace-shell | In progress | api-owned `AppShellController` |
| LN-WS-002 | workspace-shell | In progress | compatibility projection tests |
| LN-WS-003 | workspace-shell | In progress | `@lapis-notes/api/workspace-host` |
| LN-WS-004 | workspace-shell | In progress | api workspace load/save tests |
| LN-WS-005 | workspace-shell | In progress | bidirectional controller adapter |
| LN-WS-006 | workspace-shell | In progress | imperative view registration adapter |
| LN-WS-007 | workspace-shell | In progress | default design-core surface; no plugins |
| LN-WS-008 | workspace-shell | In progress | `WorkspaceShell.svelte` public props |
| LN-WS-009 | workspace-shell | In progress | persisted desktop/mobile stories |
| LN-WS-010 | workspace-shell | In progress | interaction/a11y/visual coverage |
