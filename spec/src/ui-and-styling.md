# UI and Styling

## Requirements

| ID | Requirement |
| --- | --- |
| LN-UI-001 | Overlapping shadcn primitives SHOULD migrate to `@lapismd/design-core/shadcn/*` over time; progress MUST be tracked in `MIGRATION.md`. |
| LN-UI-002 | UI families consumed by `@lapis-notes/api` (and Lapis-specific compounds retained in `@lapis-notes/ui`) MUST keep `API/` Storybook stories, plays, and docs (see `storybook-catalog.md`). |
| LN-UI-003 | New styling MUST prefer design-core philosophy: native CSS, public `--ui-*` tokens, `data-ui-*` hosts, and Lapis brand via `data-ui-theme="lapis"`. |
| LN-UI-004 | Exported package CSS MUST NOT require consumers to expand Tailwind utility surfaces; do not grow new Tailwind-in-export APIs. |
| LN-UI-005 | Theme migration to design-core `styles.css` + `themes/lapis.css` MUST be recorded in `MIGRATION.md` before hosts adopt it. |
| LN-UI-006 | Filled primary/destructive actions MUST meet WCAG AA contrast (≥ 4.5:1) with their foreground text; keep brighter accent tokens for rings/selection. |
| LN-UI-007 | Lapis brand tokens MUST live in design-core `themes/lapis.css`. `@lapis-notes/ui/theme.css` MUST be alias-only (Obsidian-era names → design-core semantics) and MUST NOT redefine `--primary` / `--destructive` or ship a parallel Tailwind `@theme` palette. |
| LN-UI-008 | Retained `@lapis-notes/ui` compounds and `@lapis-notes/api` component chrome MUST NOT contain Tailwind utility class strings in `.svelte` sources (`cn("flex …")`, layout/paint utilities, `tailwind-variants`). Allowed exception: `sr-only` / `not-sr-only`. Storybook story/demo Svelte MAY use host Tailwind for layout only. |
| LN-UI-009 | Root `pnpm check:no-tailwind` (and package `check` wiring) MUST fail when LN-UI-008 is violated under the component sources in `packages/ui`, `packages/api`, and `packages/workspace` (stories/examples excluded). |
| LN-UI-010 | The generic workspace startup surface and source editor demo integrations MUST compose design-core components and use native CSS/public tokens/data hosts; touched legacy editor utility strings MUST be replaced with semantic component classes. |
| LN-UI-011 | The source editor host MUST import `@lapismd/mira` Obsidian theme CSS, default to `data-mira-theme="obsidian"`, and paint syntax highlighting through Mira editor tokens on a `.markdown-editor-surface` (or equivalent Mira surface) without Tailwind utility strings. |

## Swap map (normative intent)

Shared shadcn families (button, input, dialog, select, tooltip, table, menus,
progress, slider, context-menu, drawer, …) MUST come from
`@lapismd/design-core/shadcn/*`. Lapis-custom compounds (`modal`,
`confirm-dialog`, `search`, `sidebar-custom`, `table-dnd`) stay in
`@lapis-notes/ui` and compose design-core primitives. Date/time settings use
`@lapismd/design-core/forms` (`DatePicker` / `TimePicker`).

The workspace shell uses native CSS scoped by `data-ui-component` and
`data-ui-part` attributes, with public `--ui-workspace-*` tokens supplied by
design-core. It does not add a Tailwind-based component styling surface.
