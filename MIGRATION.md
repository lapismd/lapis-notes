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
| Sibling dependency normalization | Done | Five root `link:` dependencies + overrides; package exports are authoritative; CodeMirror/Lezer peers are host-owned; focused editor capture restored all links and removed `.deps/` (4 baseline matches, 3 current-sibling mismatches; no updates) |
| `@lapismd/design-core` sibling | Done | Root `link:../design-core` + pnpm override; its package-declared source exports remain live; package manifests use portable `*` contracts |
| `@lapismd/mira` siblings | Done | Root `link:../mira-mde/packages/*` deps + overrides; rebuild Mira to refresh its linked `dist` exports without reinstalling Lapis |
| Storybook a11y in Vitest | Done | `vitest.setup.ts` + `a11y.test: "error"`; filled action tokens AA-tuned |
| Storybook style authority | Done | design-core styles + lapis theme; ui `theme.css` only (avoid dual Tailwind) |
| Storybook Vite config layout | Done | `.storybook/vite-final.ts` holds aliases; slim `main.ts` avoids Storybook CJS-scan ReDoS hang on large configs |

## Packages

| Package / area | Status | Notes |
| --- | --- | --- |
| `@lapis-notes/api` | Copied | Kernel from full lapis-notes; scripts slimmed |
| `@lapis-notes/ui` | Pruned | Kept compounds only: modal, confirm-dialog, search, sidebar-custom, table-dnd + helpers |
| `@lapis-notes/workspace` shell integration | Done | Thin design-core host; api compatibility + persistence façade |
| Web / desktop hosts | Not started | No runnable product host in this slice |
| `@lapis-notes/markdown` | Done (slice) | Authorized plugin; Mira document render + File Properties via Mira `FrontmatterEditor` / Lapis adapter (LN-MD-017/019); simplified side panels; living checklist in `packages/plugins/plugin-markdown/PARITY.md` |
| Tags (workspace-origin) | Done (fixture) | Storybook-local `TagsDemoPlugin`; not folded into `@lapis-notes/markdown` |
| Notebook / language-service / other plugins | Not started | Remain blocked by LN-PKG-004 except markdown carve-out |
| Storybook editor/Explorer intake plugins | Planned | Source-editor + Explorer remain Storybook-local fixtures |
| design-core workspace engine | Done | Consumes public workspace APIs; shared stacked-pane width fixed at the design-core source |

### Markdown plugin intake progress

Canonical requirements: `spec/src/markdown-plugin.md` (LN-MD-001–019).
Parity detail: `packages/plugins/plugin-markdown/PARITY.md`.

- [x] Package scaffold + workspace wiring (`@lapis-notes/markdown`)
- [x] Mira-owned markdown document modes (`source` / `live-preview` / `preview`)
- [x] Path A / Path B editor extension reload + host editor events preserved
- [x] Markdown settings section (Mira features, mermaid, AI stub)
- [x] Side panels: All Properties, File Properties, Outline, Backlinks, Outgoing Links, Media
- [x] Shared `MarkdownSidebarPanel` recipe (LN-MD-018) + Tags Storybook fixture; movable paint follows stable design-core CSS hosts, with a white body/bottom/group default and sidebar paint only for ungrouped top-level side panels
- [x] Metadata write contract + type widgets + `trackChanges` / `types.json` demo seeds
- [x] File Properties → Mira `FrontmatterEditor` + Lapis `MetadataTypeManager` adapter (LN-MD-017/019)
- [x] Focused `Workspace/Panels/Markdown/*` interaction stories (plays green; Visual Delta deferred)
- [x] Grouped All Properties movable-surface spike: real app-only component metadata with no kind/layout harness controls; middle/top tabs, stacked tabs, left/right sidebars, grouped bottom panel, and sidebar group each use one real panel in the minimal shell with focused interaction coverage and an isolated 700px padding-free Docs preview
- [x] Linked Mira package exports + CodeMirror/Lezer dedupe; ignored `.deps/*` staging remains Docker-only
- [ ] Remaining panel Visual Delta baselines (`skip-visual` until capture lane resumes); the All Properties six-surface spike is `visual-pending`
- [ ] Heavy type widgets (PillListEditor / NoteLink / suggestValues) and full metadata worker

### Workspace shell integration progress

- [x] Canonical requirements and governance mapping
- [x] Api-owned design-core controller and compatibility projection
- [x] Host-only `@lapis-notes/api/workspace-host` export
- [x] `@lapis-notes/workspace` package
- [x] Persisted desktop and mobile Storybook stories
- [x] Interaction, accessibility, build, and visual verification
- [x] Full-viewport desktop/mobile parity, Lapis About/version chrome, and notifications presentation
- [x] Empty-view stacked-tab overflow parity with design-core
- [x] Floating-window controls use design-core panel-action hover tokens and consumer Storybook verification
- [x] Top/stacked pane maximize toggles, compact reserved top-tab actions, and conforming floating-window maximize/minimize icons from design-core
- [x] Design-core V3 bottom panel preserved through the api compatibility façade and workspace writer
- [x] Focused bottom-panel/settings Storybook scenario with live shell-setting verification
- [x] API-registered story views visibly consume the live inline-title appearance setting

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
| modal | Imperative DocumentFragment / plugin host API | `shadcn/dialog` | Kept; colocated `modal.css` + `--ui-modal-*` (no TW) |
| confirm-dialog | `promptConfirm` → Promise\<boolean\> | registry `alert-dialog` (different API) | Kept; colocated CSS + `--ui-confirm-dialog-*` |
| search | Input + icon + clear compound | `filter/SearchFilterBar`, `input-group` | Kept; colocated `search.css` + `--ui-search-*` |
| sidebar-custom | NestedProvider, resize, `SidebarState` | registry/design-core `sidebar` (stock) | Kept; `sidebar-custom.css` + `--ui-sidebar-custom-*` |
| table-dnd | dnd-kit grips/sensors for settings arrays | forms `SortableArrayItem` | Kept; grip chrome via `--ui-table-dnd-*` |

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
| Brand (`themes/lapis.css`) | Source of truth | design-core Lapis semantic + `--ui-workspace-*` |
| Local `theme.css` | Alias-only | Obsidian-era → design-core map (below); no palette / `@theme` |
| Local `styles.css` | Alias re-export | Imports `theme.css` only (no Tailwind) |
| design-core styles in Storybook | Done | `.storybook/preview.ts`; production host cutover still pending |
| `pnpm check:no-tailwind` | Done | Scans ui + api components; stories excluded |

#### Obsidian / Lapis alias map (`ui/theme.css`)

| Lapis / Obsidian-era | design-core target |
| --- | --- |
| `--text-normal` | `--foreground` |
| `--text-muted` / `--text-faint` | `--muted-foreground` |
| `--text-accent` | `--ring` / `--primary` |
| `--interactive-accent*` | `--primary` / `--ring` / `--lapis-accent*` |
| `--background-primary` / `-secondary` | `--background` / `--muted` |
| `--background-modifier-border*` | `--border` / `--input` / `--ring` |
| `--input-height` | `--ui-control-height` → `--ui-workspace-settings-control-height` |
| `--color-base-*` ramp | Dropped from component paint |

### Compound / api chrome conversion

| Surface | Status |
| --- | --- |
| ui: modal, confirm-dialog, search, table-dnd | Done — colocated CSS + tokens |
| ui: sidebar-custom | Done — native CSS family |
| api: menu, configuration, editor layout, empty-view, icon-list | Done — colocated CSS; no TW utilities |

## Out of scope (do not copy yet)

- Full-app `scripts/check-first-party-*.mjs` matrix
- Docker / e2e vault / plugin-host generation
- Changesets / npm publication gates
