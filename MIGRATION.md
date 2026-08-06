# Migration Status

Living checklist for the minimal Lapis Notes monorepo. Update this file when
intake or UI swap status changes.

## Bootstrap

| Area | Status | Notes |
| --- | --- | --- |
| pnpm + Turbo scaffold | Done | No multi-script import-resolution gates |
| Spec + AGENTS + `spec:first` | Done | mira-mde-inspired, slimmed |
| Storybook host (port 7010) | Done | `API/` verification stories + catalog |
| API Storybook verification + Visual Delta | Done | Plays green; `visual-pending` PNG baselines generated (review → `visual-approved` later) |
| `@lapismd/design-core` sibling | Done | Root `file:../design-core`; api/ui `file:../../../design-core` |

## Packages

| Package / area | Status | Notes |
| --- | --- | --- |
| `@lapis-notes/api` | Copied | Kernel from full lapis-notes; scripts slimmed |
| `@lapis-notes/ui` | Pruned | Kept compounds only: modal, confirm-dialog, search, sidebar-custom, table-dnd + helpers |
| Workspace / web / desktop hosts | Not started | Intake later; Vitest stubs workspace-generated CJS provider values |
| Plugins / notebook / language-service | Not started | Api plugin tests use synthetic manifests only (no plugin package deps) |
| `app-shell` / design-core workspace | Not started | Prefer `@lapismd/design-core/workspace` |

## UI → design-core

Styling target: native CSS, `--ui-*` tokens, `data-ui-theme="lapis"`.

**Policy:** any shadcn family that exists in `@lapismd/design-core` MUST come
from design-core. Keep only Lapis-unique compounds and primitives design-core
does not ship yet; prefer upstreaming missing shadcn primitives over long-term
forks.

### From design-core (swap — clear shadcn overlap)

| Family | design-core target | api usage | Status |
| --- | --- | --- | --- |
| button | `@lapismd/design-core/shadcn/button` | direct | Done (api imports) |
| input | `…/shadcn/input` | direct | Done (api imports) |
| textarea | `…/shadcn/textarea` | direct | Done (api imports) |
| switch | `…/shadcn/switch` | direct | Done (api imports) |
| table | `…/shadcn/table` | direct | Done (api imports) |
| select | `…/shadcn/select` | direct | Done (api imports) |
| command | `…/shadcn/command` | direct | Done (api imports) |
| popover | `…/shadcn/popover` | direct | Done (api imports) |
| dropdown-menu | `…/shadcn/dropdown-menu` | direct | Done (api imports) |
| tooltip | `…/shadcn/tooltip` | direct | Done (api imports) |
| scroll-area | `…/shadcn/scroll-area` | direct | Done (api imports) |
| toggle-group | `…/shadcn/toggle-group` | direct | Done (api imports) |
| toggle | `…/shadcn/toggle` | transitive | Done (api imports) |
| dialog | `…/shadcn/dialog` | transitive | Done (api imports) |
| sheet | `…/shadcn/sheet` | type + transitive | Done (api imports) |
| separator | `…/shadcn/separator` | transitive | Done (api imports) |
| skeleton | `…/shadcn/skeleton` | transitive | Done (api imports) |
| progress | `…/shadcn/progress` | direct | Done (api imports) |
| slider | `…/shadcn/slider` | direct | Done (api imports) |
| context-menu | `…/shadcn/context-menu` | direct | Done (api imports) |
| drawer | `…/shadcn/drawer` | direct | Done (api imports) |

### Keep in `@lapis-notes/ui` (not in shadcn-svelte registry)

Verified against `https://shadcn-svelte.com/registry/index.json` — these names
are **not** registry UI items. Maintain here (or compose from design-core
primitives) until a deliberate Lapis compound lands in design-core.

| Family | Why keep | Near-miss | Status |
| --- | --- | --- | --- |
| modal | Imperative DocumentFragment / plugin host API | `shadcn/dialog` | Kept; rewritten onto design-core dialog/sheet primitives |
| confirm-dialog | `promptConfirm` → Promise\<boolean\> | registry `alert-dialog` (different API) | Kept; rewritten onto design-core |
| search | Input + icon + clear compound | `filter/SearchFilterBar`, `input-group` | Kept; rewritten onto design-core input |
| sidebar-custom | NestedProvider, resize, `SidebarState` | registry/design-core `sidebar` (stock) | Kept; rewritten onto design-core |
| table-dnd | dnd-kit grips/sensors for settings arrays | forms `SortableArrayItem` | Kept; rewritten onto design-core |

Also keep local: root `cn` / fuzzy helpers, `overlay-portal-context`.

**Retired:** `date-time-picker-dialog` — removed from `@lapis-notes/ui`. Date/time
settings use api `date-setting` → `@lapismd/design-core/forms` `DatePicker` /
`TimePicker` (Storybook: `API/Date Setting`, catalog id `api-date-setting`).

### Add to design-core from shadcn-svelte registry (then swap)

These were on the keep list but **are** upstream registry UI items. Do **not**
maintain separate forks in `@lapis-notes/ui`. In design-core:
`pnpm ui:add <name>` → consume `@lapismd/design-core/shadcn/<name>`.

| Family | Registry | design-core today | Action |
| --- | --- | --- | --- |
| progress | yes (`progress`) | present | Done — api imports swapped |
| slider | yes (`slider`) | present | Done — api imports swapped |
| context-menu | yes (`context-menu`) | present | Done — api imports swapped |
| drawer | yes (`drawer`) | present | Done — api imports swapped |

### Prune from local ui

| Family | Note |
| --- | --- |
| All swap families (button, input, textarea, switch, table, select, command, popover, dropdown-menu, tooltip, scroll-area, toggle-group, toggle, dialog, sheet, separator, skeleton, progress, slider, context-menu, drawer) | Done — pruned from local ui; api + stories consume `@lapismd/design-core/shadcn/<family>` |
| date-time-picker-dialog | Done — retired; date/time via `forms` DatePicker/TimePicker |
| label | Done — deleted (orphan) |
| sidebar (stock) | Done — deleted; `SIDEBAR_WIDTH_ICON` lives in sidebar-custom constants |

All api-consumed families also have `API/` plays and `visual-pending` baselines
(helpers are `skip-visual`). Promote tags to `visual-approved` after human review.

### Theme / CSS

| Item | Status | Notes |
| --- | --- | --- |
| Local `theme.css` / `styles.css` | Current | Still used by kept compounds / api hosts |
| design-core `styles.css` + `themes/lapis.css` | Storybook host | Loaded in `.storybook/preview.ts` with `data-ui-theme="lapis"`; full production host cutover still pending |

## Out of scope (do not copy yet)

- Full-app `scripts/check-first-party-*.mjs` matrix
- Docker / e2e vault / plugin-host generation
- Changesets / npm publication gates
