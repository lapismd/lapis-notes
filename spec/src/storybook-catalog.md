# Storybook Catalog

## Requirements

| ID | Requirement |
| --- | --- |
| LN-CAT-001 | Storybook MUST be the only browsable docs host for this repo and MUST run on port 7010. |
| LN-CAT-002 | Every `@lapis-notes/ui` family consumed by `@lapis-notes/api` (direct imports; excluding type-only surfaces such as sheet `Side`) MUST have an `API/<Name>` Storybook story under `stories/api/` with a play that exercises meaningful behavior. |
| LN-CAT-003 | Catalog metadata under `stories/catalog/` MUST list API UI verification ids, governing spec links, public surfaces, and story ids. |
| LN-CAT-004 | Story and MDX docs MUST link to canonical `spec/src` chapters instead of copying normative prose. |
| LN-CAT-005 | Shared shadcn families destined for design-core SHOULD NOT duplicate full design-core Storybook coverage; document status in `MIGRATION.md`. |
| LN-CAT-006 | Visual stories under `API/` MUST ship Visual Delta PNG baselines (`baselinePathMode: nested-import`) tagged `visual-pending` until human review promotes them to `visual-approved`. Stories tagged `skip-visual` are exempt. |
| LN-CAT-007 | Interactive plays MUST assert outcomes via a demo status surface (`data-testid="api-ui-status"`) and use `storybook/test` helpers; portaled overlays MUST assert against `canvasElement.ownerDocument.body`. |

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

- Interaction tests: `pnpm test:storybook`
- Visual baselines: `pnpm build-storybook` then `pnpm test:visual:update` (generates under `tests/visual/storybook.spec.ts-snapshots/stories/api/`)
- Visual regression: `pnpm test:visual`
