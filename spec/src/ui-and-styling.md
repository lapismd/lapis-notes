# UI and Styling

## Requirements

| ID | Requirement |
| --- | --- |
| LN-UI-001 | Overlapping shadcn primitives SHOULD migrate to `@lapismd/design-core/shadcn/*` over time; progress MUST be tracked in `MIGRATION.md`. |
| LN-UI-002 | UI families consumed by `@lapis-notes/api` (and Lapis-specific compounds retained in `@lapis-notes/ui`) MUST keep `API/` Storybook stories, plays, and docs (see `storybook-catalog.md`). |
| LN-UI-003 | New styling MUST prefer design-core philosophy: native CSS, public `--ui-*` tokens, `data-ui-*` hosts, and Lapis brand via `data-ui-theme="lapis"`. |
| LN-UI-004 | Exported package CSS MUST NOT require consumers to expand Tailwind utility surfaces; do not grow new Tailwind-in-export APIs. |
| LN-UI-005 | Theme migration to design-core `styles.css` + `themes/lapis.css` MUST be recorded in `MIGRATION.md` before hosts adopt it. |

## Swap map (normative intent)

Shared families such as button, input, dialog, select, tooltip, table, and
menus are swap candidates. Families without a design-core counterpart
(progress, slider, context-menu, drawer, and Lapis-custom compounds) stay in
`@lapis-notes/ui` until a replacement is specified.
