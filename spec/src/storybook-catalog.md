# Storybook Catalog

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-CAT-001 | Storybook MUST be the only browsable docs host for this repo and MUST run on port 7010.                                                                                                                                                                                                                                                                                                   |
| LN-CAT-002 | Every `@lapis-notes/ui` family consumed by `@lapis-notes/api` (direct imports; excluding type-only surfaces such as sheet `Side`) MUST have an `API/<Name>` Storybook story under `stories/api/` with a play that exercises meaningful behavior.                                                                                                                                          |
| LN-CAT-003 | Catalog metadata under `stories/catalog/` MUST list API UI verification ids, governing spec links, public surfaces, and story ids.                                                                                                                                                                                                                                                        |
| LN-CAT-004 | Story and MDX docs MUST link to canonical `spec/src` chapters instead of copying normative prose.                                                                                                                                                                                                                                                                                         |
| LN-CAT-005 | Shared shadcn families destined for design-core SHOULD NOT duplicate full design-core Storybook coverage; document status in `MIGRATION.md`.                                                                                                                                                                                                                                              |
| LN-CAT-006 | Visual stories under `API/` MUST ship Visual Delta PNG baselines (`baselinePathMode: nested-import`) tagged `visual-pending` until human review promotes them to `visual-approved`. Stories tagged `skip-visual` are exempt.                                                                                                                                                              |
| LN-CAT-007 | Interactive plays MUST assert outcomes via a demo status surface (`data-testid="api-ui-status"`) and use `storybook/test` helpers; portaled overlays MUST assert against `canvasElement.ownerDocument.body`.                                                                                                                                                                              |
| LN-CAT-008 | Storybook accessibility checks MUST fail `pnpm test:storybook` on axe violations: `.storybook/vitest.setup.ts` registers `@storybook/addon-a11y/preview`, and preview sets `parameters.a11y.test: "error"`.                                                                                                                                                                               |
| LN-CAT-009 | Storybook MUST load design-core `styles.css` + Lapis theme as style authority, import `@lapis-notes/ui/theme.css` (Obsidian alias tokens only), expose an Obsidian/Default brand selector with Obsidian initially selected, and expose design-core's independent light/dark colour-mode toggle. Host `@tailwindcss/vite` MAY remain for story/demo layout only — not for component paint. |
| LN-CAT-010 | Story / demo Svelte under `stories/` MAY use host Tailwind for layout; that usage MUST remain excluded from `pnpm check:no-tailwind`.                                                                                                                                                                                                                                                     |
| LN-CAT-011 | `Workspace/Shell` MUST document the `@lapis-notes/workspace` integration with persisted desktop and mobile stories linked to `workspace-shell.md`.                                                                                                                                                                                                                                        |
| LN-CAT-012 | Workspace shell plays MUST boot a real api `App`, exercise meaningful controller-backed shell behavior, and verify the story adapter receives the expected workspace persistence update.                                                                                                                                                                                                  |
| LN-CAT-013 | Workspace shell stories MUST use design-core's shared full-viewport catalog layout, including an unconstrained mobile canvas, and MUST NOT load Lapis/community plugins. They MUST include the minimal design-core notifications chrome plus Lapis version/About metadata.                                                                                                                |
| LN-CAT-014 | Workspace shell stories MUST cover the persisted desktop and mobile shells, the populated notification center, the Lapis About dialog, and stacked empty tabs whose scroll width and selected-tab movement match design-core.                                                                                                                                                             |
| LN-CAT-015 | `Workspace/Shell` MUST include a focused bottom-panel/settings story that boots a real api `App`, persists panel geometry through the api writer, and proves design-core's built-in settings update shell alignment and ribbon presentation without loading plugins or adding settings persistence.                                                                                       |
| LN-CAT-016 | `Workspace/Lapis Editor Demo` MUST boot a real api `App` and required Storybook-local core plugins over the public memory vault, use one canonical seed, and cover runnable, same-file sync, Explorer mutation, editor settings, startup, failure, and opening-vault states.                                                                                                              |
| LN-CAT-017 | Workspace catalog metadata MUST enumerate each editor-demo scenario, map it to this specification, and retain nested-import `visual-pending` coverage until human approval.                                                                                                                                                                                                               |
| LN-CAT-018 | Storybook MUST resolve every design-core workspace entry point through the installed sibling link and the package's public exports. Docker visual capture MUST exercise the same exports from its ignored staged package, avoiding a mixed installed/source runtime without consumer-owned design-core source aliases. |
| LN-CAT-019 | Storybook's Vite aliases MUST resolve `@lapis-notes/api/editor` with the root API source so editor interactions and accessibility checks exercise the protected implementation under test.                                                                                                                                                                                                |
| LN-CAT-020 | Storybook MUST resolve `@lapis-notes/markdown` from Lapis workspace source and resolve sibling Mira editor/plugin packages through installed links and built public exports, with no Mira source aliases. It MUST provide focused `Workspace/Panels/Markdown/*` stories for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags. |
| LN-CAT-021 | Storybook MUST expose each non-summary chapter indexed by `spec/src/SUMMARY.md` as a first-positioned `Specification/*` documentation page in summary order. Each page MUST render its canonical `spec/src` Markdown through a metadata-only MDX adapter using a raw import and Storybook's `Markdown` block; normative prose MUST NOT be copied into Storybook-owned files. |
| LN-CAT-022 | `Workspace/Panels/Markdown/All Properties` MUST group the movable-surface spike as six focused child stories rather than adding them to the flat Markdown panel list: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel (using grouped-panel chrome), and Sidebar As A Group. The stories MUST use the real minimal Lapis shell, keep the panel as the visual and interaction focus, carry literal `visual-pending` tags, and ship independent nested-import baselines. Each app-backed Autodocs canvas MUST render in an isolated iframe at a compact 22rem story height so simultaneous examples retain their own app and placement instead of inheriting the standalone canvas's 36rem capture minimum. |

## API verification families

Direct api imports (one story family each):

- `button`, `input`, `textarea`, `switch`, `slider`, `progress`
- `select`, `search`, `tooltip`, `popover`, `command`
- `dropdown-menu`, `context-menu`, `drawer`
- `modal`, `confirm-dialog`, `date-setting` (`@lapismd/design-core/forms` DatePicker/TimePicker)
- `scroll-area`, `table`, `toggle-group`
- `sidebar-custom`, `table-dnd`
- `helpers` (`cn` / `fuzzySearch`) — interaction-only, `skip-visual`

## Tooling

- Interaction + a11y tests: `pnpm test:storybook` (axe via addon-a11y; `a11y.test: "error"`)
- No-Tailwind sources: `pnpm check:no-tailwind` (component trees; stories excluded)
- Visual baselines: `pnpm build-storybook` then `pnpm test:visual:update` (generates nested-import baselines under `tests/visual/storybook.spec.ts-snapshots/stories/`)
- Visual regression: `pnpm test:visual`
- Workspace shell stories use the same interaction, a11y, and nested-import
  Visual Delta workflow as API stories and remain `visual-pending` until review.
- Editor-demo catalog entries identify the Ready, SameFileSplitSync,
  ExplorerMutations, EditorSettings, LoadingPlugins, StartupFailure, and
  ExplorerOpeningVault stories individually so focused visual updates do not
  rewrite existing shell baselines.
- The bottom-panel/settings story keeps the Workspace settings page open in its
  final state so panel alignment and controller-backed settings are visible.
- Shell story views remain API-registered imperative Lapis views; their
  story-only body title responds to the live inline-title appearance setting so
  settings are demonstrated through the same view-host bridge as consumers.
- The visual helpers stage the sibling design-core checkout inside the Docker
  context for both compare and update runs. They exclude documented nonvisual
  stories, and the update helper accepts repeatable story-prefix filters; its
  defaults select API and workspace stories without rewriting unrelated
  baselines.
