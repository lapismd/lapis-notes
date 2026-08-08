# Verification

Requirement traceability and implementation progress for the minimal repo.

| ID          | Chapter           | Status      | Evidence                                                                                                         |
| ----------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| LN-ARCH-001 | architecture      | Implemented | `pnpm-workspace.yaml`, `turbo.json`                                                                              |
| LN-ARCH-002 | architecture      | Implemented | package scripts on api/ui/workspace                                                                              |
| LN-ARCH-003 | architecture      | Implemented | root `storybook` / `storybook:stop` / `storybook:restart` supervisor lane on port 7010                           |
| LN-ARCH-004 | architecture      | Implemented | no `check:source-resolution` scripts                                                                             |
| LN-ARCH-005 | architecture      | Implemented | root dep `file:../design-core`                                                                                   |
| LN-ARCH-006 | architecture      | Implemented | root `check` runs `check:no-tailwind`                                                                            |
| LN-ARCH-007 | architecture      | Implemented | `packages/workspace`; workspace-shell requirements                                                               |
| LN-ARCH-008 | architecture      | Implemented | design-core Storybook stylesheet and catalog-layout synchronizer                                                 |
| LN-ARCH-009 | architecture      | Implemented | api V3 bottom-panel projection, alternate filenames, and single layout writer                                    |
| LN-ARCH-010 | architecture      | Planned | `LAPIS_EDITOR_PLAN.md`; Storybook-local plugin boundary                                                          |
| LN-PKG-001  | packages          | Implemented | `packages/api` kernel copy                                                                                       |
| LN-PKG-002  | packages          | Implemented | api peer on `@lapis-notes/ui`                                                                                    |
| LN-PKG-003  | packages          | Implemented | pruned `packages/ui`                                                                                             |
| LN-PKG-004  | packages          | Implemented | hosts/plugins absent; tracked in `MIGRATION.md`                                                                  |
| LN-PKG-005  | packages          | Implemented | package `exports` maps                                                                                           |
| LN-PKG-006  | packages          | Implemented | `VaultStorageKind` in `vault-state.ts`; LightningFS / `tauri-folder` removed                                     |
| LN-PKG-007  | packages          | Implemented | `packages/workspace` shell adapter                                                                               |
| LN-PKG-008  | packages          | Implemented | api-owned application metadata and notification presentation                                                     |
| LN-PKG-009  | packages          | Implemented | `WorkspaceBottomPanel` and Lapis-native bottom controls                                                           |
| LN-PKG-010  | packages          | Implemented | `MemoryVaultAdapter`; `SourceTextFileView`; focused API tests                                                     |
| LN-UI-001   | ui-and-styling    | Implemented | api + stories on `@lapismd/design-core/shadcn/*`; kept compounds only in ui                                      |
| LN-UI-002   | ui-and-styling    | Implemented | `API/` stories under `stories/api/`                                                                              |
| LN-UI-003   | ui-and-styling    | Implemented | colocated CSS + `--ui-*` on kept compounds + api chrome                                                          |
| LN-UI-004   | ui-and-styling    | Implemented | policy in AGENTS + this chapter; no-TW gate                                                                      |
| LN-UI-005   | ui-and-styling    | In progress | Storybook loads design-core styles + lapis theme; production hosts still pending                                 |
| LN-UI-006   | ui-and-styling    | Implemented | AA-safe `--primary` / `--destructive` in design-core lapis theme                                                 |
| LN-UI-007   | ui-and-styling    | Implemented | ui `theme.css` alias-only; brand in design-core `themes/lapis.css`                                               |
| LN-UI-008   | ui-and-styling    | Implemented | compounds + api chrome on native CSS; stories excluded                                                           |
| LN-UI-009   | ui-and-styling    | Implemented | `pnpm check:no-tailwind` in root/package `check`                                                                 |
| LN-UI-010   | ui-and-styling    | In progress | design-core startup surface; semantic source-editor classes                                                       |
| LN-CAT-001  | storybook-catalog | Implemented | Storybook host                                                                                                   |
| LN-CAT-002  | storybook-catalog | Implemented | `stories/api/*` + plays; `pnpm test:storybook`                                                                   |
| LN-CAT-003  | storybook-catalog | Implemented | `stories/catalog/catalog.mjs` + `ApiUi.mdx`                                                                      |
| LN-CAT-004  | storybook-catalog | Implemented | docs link to spec chapters                                                                                       |
| LN-CAT-005  | storybook-catalog | Implemented | noted in `MIGRATION.md`                                                                                          |
| LN-CAT-006  | storybook-catalog | Implemented | Visual Delta baselines under `tests/visual/…`; tags `visual-pending`                                             |
| LN-CAT-007  | storybook-catalog | Implemented | `api-ui-status` + portal body assertions in plays                                                                |
| LN-CAT-008  | storybook-catalog | Implemented | `.storybook/vitest.setup.ts` + `parameters.a11y.test: "error"`                                                   |
| LN-CAT-009  | storybook-catalog | Implemented | preview/manager: Obsidian-default brand selector, light/dark toggle, design-core styles + lapis + ui alias theme |
| LN-CAT-010  | storybook-catalog | Implemented | stories excluded from no-tailwind scan                                                                           |
| LN-CAT-011  | storybook-catalog | Implemented | `stories/workspace/*` + nested-import PNG baselines                                                              |
| LN-CAT-012  | storybook-catalog | Implemented | workspace story plays + story-only memory adapter                                                                |
| LN-CAT-013  | storybook-catalog | Implemented | no Lapis/community plugin boot; minimal static notifications chrome                                              |
| LN-CAT-014  | storybook-catalog | Implemented | full-viewport shell, mobile, notification, About, and stacked-tab stories                                        |
| LN-CAT-015  | storybook-catalog | Implemented | focused `Workspace/Shell/Bottom Panel Settings` play and pending baseline                                         |
| LN-CAT-016  | storybook-catalog | Planned | `Workspace/Lapis Editor Demo` scenarios                                                                           |
| LN-GOV-001  | spec-governance   | Implemented | `spec/` mdBook sources                                                                                           |
| LN-GOV-002  | spec-governance   | Implemented | this matrix                                                                                                      |
| LN-GOV-003  | spec-governance   | Implemented | `scripts/check-spec-first.mjs`                                                                                   |
| LN-GOV-004  | spec-governance   | Implemented | jj/git change detection                                                                                          |
| LN-GOV-005  | spec-governance   | Implemented | ignored patterns in gate                                                                                         |
| LN-GOV-006  | spec-governance   | Implemented | fail-closed on VCS errors                                                                                        |
| LN-GOV-007  | spec-governance   | Implemented | `spec/book` gitignored                                                                                           |
| LN-WS-001   | workspace-shell   | Implemented | api-owned `AppShellController`                                                                                   |
| LN-WS-002   | workspace-shell   | Implemented | id-reusing projection + focused tests                                                                            |
| LN-WS-003   | workspace-shell   | Implemented | `@lapis-notes/api/workspace-host`                                                                                |
| LN-WS-004   | workspace-shell   | Implemented | instance-owned api load/save writer + alternate filename and final-projection tests                              |
| LN-WS-005   | workspace-shell   | Implemented | guarded bidirectional adapter + snapshot-based child reconciliation                                              |
| LN-WS-006   | workspace-shell   | Implemented | imperative view registration adapter                                                                             |
| LN-WS-007   | workspace-shell   | Implemented | default design-core surface; no plugins                                                                          |
| LN-WS-008   | workspace-shell   | Implemented | `WorkspaceShell.svelte` public props + real-App mount test                                                       |
| LN-WS-009   | workspace-shell   | Implemented | persisted desktop/mobile stories                                                                                 |
| LN-WS-010   | workspace-shell   | Implemented | interaction/a11y plays, panel/floating action hover + `visual-pending` baselines                                      |
| LN-WS-011   | workspace-shell   | Implemented | api-owned Lapis application metadata, logo, and About surface                                                    |
| LN-WS-012   | workspace-shell   | Implemented | design-core stacked-pane preferred-width regression test                                                         |
| LN-WS-013   | workspace-shell   | Implemented | shared full-viewport Storybook layout and unconstrained mobile canvas                                            |
| LN-WS-014   | workspace-shell   | Implemented | top/stacked maximize plays, pressed state, reserved actions, and floating maximize/minimize icons                |
| LN-WS-015   | workspace-shell   | Implemented | stable bottom wrapper, controls, traversal, projection, and focused api tests                                     |
| LN-WS-016   | workspace-shell   | Implemented | api-owned debounce/alternate-file coverage plus ephemeral settings story                                          |
| LN-WS-017   | workspace-shell   | Implemented | API-registered story views consume the live inline-title shell setting                                            |
| LN-WS-018   | workspace-shell   | Implemented | exact API-to-design-core editor registry mirroring and disposal tests                                             |
| LN-ED-001   | editor-demo       | Implemented | public `MemoryVaultAdapter`; binary, metadata, filesystem, collision tests                                        |
| LN-ED-002   | editor-demo       | Implemented | public `SourceTextFileView`; lifecycle, data, extension, and search tests                                         |
| LN-ED-003   | editor-demo       | Planned | Storybook-local source editor core plugin                                                                         |
| LN-ED-004   | editor-demo       | Planned | source-only Markdown extension set                                                                                |
| LN-ED-005   | editor-demo       | Implemented | atomic batch/preservation tests and loop-free controller persistence                                             |
| LN-ED-006   | editor-demo       | Implemented | live controller registry mirroring, pattern updates, and disposal                                                |
| LN-ED-007   | editor-demo       | Planned | API-vault Explorer adapter                                                                                        |
| LN-ED-008   | editor-demo       | Planned | functional empty-view actions                                                                                     |
| LN-ED-009   | editor-demo       | Planned | real startup tasks and failure/retry                                                                              |
| LN-ED-010   | editor-demo       | Planned | same-file CodeMirror synchronization acceptance                                                                  |
| LN-ED-011   | editor-demo       | Planned | shared-seed Storybook scenarios                                                                                   |
| LN-ED-012   | editor-demo       | Planned | native CSS/design-core styling                                                                                    |
