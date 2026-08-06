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
| `@lapismd/design-core` sibling link | Done | `link:../design-core` |

## Packages

| Package / area | Status | Notes |
| --- | --- | --- |
| `@lapis-notes/api` | Copied | Kernel from full lapis-notes; scripts slimmed |
| `@lapis-notes/ui` | Pruned | Api-needed families + transitive deps only |
| Workspace / web / desktop hosts | Not started | Intake later |
| Plugins / notebook / language-service | Not started | Intake later |
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
| button | `@lapismd/design-core/shadcn/button` | direct | Pending |
| input | `…/shadcn/input` | direct | Pending |
| textarea | `…/shadcn/textarea` | direct | Pending |
| switch | `…/shadcn/switch` | direct | Pending |
| table | `…/shadcn/table` | direct | Pending |
| select | `…/shadcn/select` | direct | Pending |
| command | `…/shadcn/command` | direct | Pending |
| popover | `…/shadcn/popover` | direct | Pending |
| dropdown-menu | `…/shadcn/dropdown-menu` | direct | Pending |
| tooltip | `…/shadcn/tooltip` | direct | Pending |
| scroll-area | `…/shadcn/scroll-area` | direct | Pending |
| toggle-group | `…/shadcn/toggle-group` | direct | Pending |
| toggle | `…/shadcn/toggle` | transitive | Pending |
| dialog | `…/shadcn/dialog` | transitive | Pending |
| sheet | `…/shadcn/sheet` | type + transitive | Pending |
| separator | `…/shadcn/separator` | transitive | Pending |
| skeleton | `…/shadcn/skeleton` | transitive | Pending |

### Keep in `@lapis-notes/ui` (not in shadcn-svelte registry)

Verified against `https://shadcn-svelte.com/registry/index.json` — these names
are **not** registry UI items. Maintain here (or compose from design-core
primitives) until a deliberate Lapis compound lands in design-core.

| Family | Why keep | Near-miss |
| --- | --- | --- |
| modal | Imperative DocumentFragment / plugin host API | `shadcn/dialog` |
| confirm-dialog | `promptConfirm` → Promise\<boolean\> | registry `alert-dialog` (different API) |
| search | Input + icon + clear compound | `filter/SearchFilterBar`, `input-group` |
| date-time-picker-dialog | datetime-local settings dialog | docs Date Picker / `calendar` (not same) |
| sidebar-custom | NestedProvider, resize, `SidebarState` | registry/design-core `sidebar` (stock) |
| table-dnd | dnd-kit grips/sensors for settings arrays | forms `SortableArrayItem` |

Also keep local: root `cn` / fuzzy helpers, `overlay-portal-context`.

### Add to design-core from shadcn-svelte registry (then swap)

These were on the keep list but **are** upstream registry UI items. Do **not**
maintain separate forks in `@lapis-notes/ui`. In design-core:
`pnpm ui:add <name>` → consume `@lapismd/design-core/shadcn/<name>`.

| Family | Registry | design-core today | Action |
| --- | --- | --- | --- |
| progress | yes (`progress`) | missing | `pnpm ui:add progress` then swap |
| slider | yes (`slider`) | missing | `pnpm ui:add slider` then swap |
| context-menu | yes (`context-menu`) | missing | `pnpm ui:add context-menu` then swap |
| drawer | yes (`drawer`) | missing | `pnpm ui:add drawer` then swap |

### Prune from local ui

| Family | Note |
| --- | --- |
| label | Orphan — zero consumers in pruned repo |
| sidebar (stock) | Only feeds `SIDEBAR_WIDTH_ICON` into sidebar-custom; fold constant, drop folder |

All api-consumed families also have `API/` plays and `visual-pending` baselines
(helpers are `skip-visual`). Promote tags to `visual-approved` after human review.

### Theme / CSS

| Item | Status | Notes |
| --- | --- | --- |
| Local `theme.css` / `styles.css` | Current | Still used by api |
| design-core `styles.css` + `themes/lapis.css` | Pending | Swap when hosts land |

## Out of scope (do not copy yet)

- Full-app `scripts/check-first-party-*.mjs` matrix
- Docker / e2e vault / plugin-host generation
- Changesets / npm publication gates
