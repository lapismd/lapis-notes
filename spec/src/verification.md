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
| LN-ARCH-010 | architecture      | Implemented | Storybook-local editor and Explorer plugins; reusable API/design-core boundaries                                 |
| LN-ARCH-011 | architecture      | Implemented | root-only CodeMirror Markdown and JSON development dependencies                                                  |
| LN-ARCH-012 | architecture      | Implemented | Storybook aliases for design-core workspace source entry points                                                  |
| LN-ARCH-013 | architecture      | Implemented | Storybook API editor subpath source alias                                                                         |
| LN-ARCH-014 | architecture      | Implemented | root dep `file:../mira-mde/packages/mira` and pnpm override                                                       |
| LN-ARCH-015 | architecture      | Implemented | api `getChrome` breadcrumbs/history; inline title stays in api editor                                            |
| LN-PKG-001  | packages          | Implemented | `packages/api` kernel copy                                                                                       |
| LN-PKG-002  | packages          | Implemented | api peer on `@lapis-notes/ui`                                                                                    |
| LN-PKG-003  | packages          | Implemented | pruned `packages/ui`                                                                                             |
| LN-PKG-004  | packages          | Implemented | hosts/plugins absent; tracked in `MIGRATION.md`                                                                  |
| LN-PKG-005  | packages          | Implemented | package `exports` maps                                                                                           |
| LN-PKG-006  | packages          | Implemented | `VaultStorageKind` in `vault-state.ts`; LightningFS / `tauri-folder` removed                                     |
| LN-PKG-007  | packages          | Implemented | `packages/workspace` shell adapter                                                                               |
| LN-PKG-008  | packages          | Implemented | api-owned application metadata and notification presentation                                                     |
| LN-PKG-009  | packages          | Implemented | `WorkspaceBottomPanel` and Lapis-native bottom controls                                                          |
| LN-PKG-010  | packages          | Implemented | `MemoryVaultAdapter`; `SourceTextFileView`; focused API tests                                                    |
| LN-PKG-011  | packages          | Implemented | root package manifest and lockfile language dependencies                                                         |
| LN-PKG-012  | packages          | Implemented | api depends on sibling `@lapismd/mira` for source-editor shell                                                   |
| LN-PKG-013  | packages          | Implemented | api inline-title tokens and file-view `getChrome` breadcrumb/history projection                                  |
| LN-UI-001   | ui-and-styling    | Implemented | api + stories on `@lapismd/design-core/shadcn/*`; kept compounds only in ui                                      |
| LN-UI-002   | ui-and-styling    | Implemented | `API/` stories under `stories/api/`                                                                              |
| LN-UI-003   | ui-and-styling    | Implemented | colocated CSS + `--ui-*` on kept compounds + api chrome                                                          |
| LN-UI-004   | ui-and-styling    | Implemented | policy in AGENTS + this chapter; no-TW gate                                                                      |
| LN-UI-005   | ui-and-styling    | In progress | Storybook loads design-core styles + lapis theme; production hosts still pending                                 |
| LN-UI-006   | ui-and-styling    | Implemented | AA-safe `--primary` / `--destructive` in design-core lapis theme                                                 |
| LN-UI-007   | ui-and-styling    | Implemented | ui `theme.css` alias-only; brand in design-core `themes/lapis.css`                                               |
| LN-UI-008   | ui-and-styling    | Implemented | compounds + api chrome on native CSS; stories excluded                                                           |
| LN-UI-009   | ui-and-styling    | Implemented | `pnpm check:no-tailwind` in root/package `check`                                                                 |
| LN-UI-010   | ui-and-styling    | Implemented | design-core `WorkspaceStartup`; semantic source-editor classes and demo CSS                                      |
| LN-UI-011   | ui-and-styling    | Implemented | Mira Obsidian theme CSS and `data-mira-theme="obsidian"` on the source editor host                               |
| LN-UI-012   | ui-and-styling    | Implemented | editor inline-title tokens and h1-scale filename paint                                                           |
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
| LN-CAT-015  | storybook-catalog | Implemented | focused `Workspace/Shell/Bottom Panel Settings` play and pending baseline                                        |
| LN-CAT-016  | storybook-catalog | Implemented | seven `Workspace/Lapis Editor Demo` scenarios and canonical seed                                                 |
| LN-CAT-017  | storybook-catalog | Implemented | catalog metadata, `visual-pending` tags, and seven nested-import baselines                                       |
| LN-CAT-018  | storybook-catalog | Implemented | design-core workspace source aliases                                                                              |
| LN-CAT-019  | storybook-catalog | Implemented | API editor source alias                                                                                            |
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
| LN-WS-010   | workspace-shell   | Implemented | interaction/a11y plays, panel/floating action hover + `visual-pending` baselines                                 |
| LN-WS-011   | workspace-shell   | Implemented | api-owned Lapis application metadata, logo, and About surface                                                    |
| LN-WS-012   | workspace-shell   | Implemented | design-core stacked-pane preferred-width regression test                                                         |
| LN-WS-013   | workspace-shell   | Implemented | shared full-viewport Storybook layout and unconstrained mobile canvas                                            |
| LN-WS-014   | workspace-shell   | Implemented | top/stacked maximize plays, pressed state, reserved actions, and floating maximize/minimize icons                |
| LN-WS-015   | workspace-shell   | Implemented | stable bottom wrapper, controls, traversal, projection, and focused api tests                                    |
| LN-WS-016   | workspace-shell   | Implemented | api-owned debounce/alternate-file coverage plus ephemeral settings story                                         |
| LN-WS-017   | workspace-shell   | Implemented | API-registered story views consume the live inline-title shell setting                                           |
| LN-WS-018   | workspace-shell   | Implemented | exact API-to-design-core editor registry mirroring and disposal tests                                            |
| LN-WS-019   | workspace-shell   | Implemented | startup-gated shell mount plus deterministic retry and disposal acceptance                                       |
| LN-WS-020   | workspace-shell   | Implemented | API `getChrome` breadcrumbs and leaf history for file views                                                      |
| LN-ED-001   | editor-demo       | Implemented | public `MemoryVaultAdapter`; binary, metadata, filesystem, collision tests                                       |
| LN-ED-002   | editor-demo       | Implemented | public `SourceTextFileView`; lifecycle, data, extension, search, and Storybook axe coverage                      |
| LN-ED-003   | editor-demo       | Implemented | required Storybook-local Markdown, text, and JSON source editor plugin                                           |
| LN-ED-004   | editor-demo       | Implemented | source-only Markdown extension set and explicit exclusion boundary                                               |
| LN-ED-005   | editor-demo       | Implemented | atomic batch/preservation tests and loop-free controller persistence                                             |
| LN-ED-006   | editor-demo       | Implemented | live controller registry mirroring, pattern updates, and disposal                                                |
| LN-ED-007   | editor-demo       | Implemented | API-vault design-core Explorer adapter and mutation play                                                         |
| LN-ED-008   | editor-demo       | Implemented | Create note, Go to file, and design-core Close landing actions                                                   |
| LN-ED-009   | editor-demo       | Implemented | real startup tasks, required-plugin failure, teardown, and retry play                                            |
| LN-ED-010   | editor-demo       | Implemented | same-file transaction sync, single debounce write, and independent-file play                                    |
| LN-ED-011   | editor-demo       | Implemented | seven focused scenarios sourced from one deterministic seed                                                      |
| LN-ED-012   | editor-demo       | Implemented | native CSS and design-core composition; no-Tailwind gate                                                        |
| LN-ED-013   | editor-demo       | Implemented | Mira base CodeMirror shell + Obsidian theme; Markdown remains source-only language highlighting                 |
| LN-ED-014   | editor-demo       | Implemented | editable inline title CSS/tokens and rename through fileManager                                                  |
| LN-ED-015   | editor-demo       | Implemented | getChrome breadcrumbs/history plus Explorer reveal-path command                                                  |
| LN-ED-016   | editor-demo       | Implemented | demo seed enables showInlineTitle and showTabTitleBar                                                            |
