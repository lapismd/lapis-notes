# UI and Styling / Retained UI contracts

Active API, retained UI, Workspace, Explorer and Web consumers require published
Design Core `^0.6.0`, including prepared
browser CSS and bundled font assets, through the existing public style exports.
The minimum includes the close guard, asynchronous plugin flush and centered
bottom-panel contracts already used by current source. Earlier supported ranges
cannot advertise those required capabilities. The frozen Deno host is unchanged.

UI 0.1.3 is the prepared packaging patch for the retained runtime dependency
declarations. Its CSS, tokens, component markup and public exports are unchanged.
The release follow-up retains ordinary source and release validation.

Retained UI keeps its existing behavior. Its class helper, dialogs, sidebar and
Search imports are published runtime dependencies (`clsx`, `tailwind-merge`,
`bits-ui` and `@lucide/svelte`). The source-import regression covers that
package boundary without adding utility classes to component markup.

## LN-UI-001 — Shared primitive migration tracking

<a id="ln-ui-001"></a>

**Requirement.** Overlapping shadcn primitives SHOULD migrate to `@lapismd/design-core/shadcn/*` over time; progress MUST be tracked in `MIGRATION.md`.

The retained Select story follows the public primitive's native `combobox`
semantics, locates the labelled Workspace control by that role, selects Daily,
and verifies the selected value with axe enabled. Application-owned Select
controls provide their purpose through labels; visible option text does not
replace the control's accessible name. The
[runtime intake receipt](../../records/2026-10-25-bits-runtime-intake.md) separates
this Notes story update from the source-owned Bases naming repair.

## LN-UI-002 — UI families consumed by @lapis-notes/api (and Lapis-specific: keep API/ Storybook stories, plays, and docs

<a id="ln-ui-002"></a>

**Requirement.** UI families consumed by `@lapis-notes/api` (and Lapis-specific compounds retained in `@lapis-notes/ui`) MUST keep `API/` Storybook stories, plays, and docs (see `storybook-catalog.md`).

## LN-UI-003 — New styling: prefer design-core philosophy: native CSS, public --ui-\*

<a id="ln-ui-003"></a>

**Requirement.** New styling MUST prefer design-core philosophy: native CSS, public `--ui-*` tokens, `data-ui-*` hosts, and Lapis brand via `data-ui-theme="lapis"`.

## LN-UI-004 — Portable exported CSS

<a id="ln-ui-004"></a>

**Requirement.** Exported package CSS MUST NOT require consumers to expand Tailwind utility surfaces; do not grow new Tailwind-in-export APIs.

## LN-UI-005 — Theme migration to design-core styles.css + themes/lapis.css: recorded in MIGRATION.md before hosts adopt it

<a id="ln-ui-005"></a>

**Requirement.** Theme migration to design-core `styles.css` + `themes/lapis.css` MUST be recorded in `MIGRATION.md` before hosts adopt it.

## LN-UI-006 — Filled primary/destructive actions: meet WCAG AA contrast (≥ 4.5:1)

<a id="ln-ui-006"></a>

**Requirement.** Filled primary/destructive actions MUST meet WCAG AA contrast (≥ 4.5:1) with their foreground text; keep brighter accent tokens for rings/selection.

## LN-UI-007 — Design Core brand-token ownership

<a id="ln-ui-007"></a>

**Requirement.** Lapis brand tokens MUST live in design-core `themes/lapis.css`. `@lapis-notes/ui/theme.css` MUST be alias-only (Obsidian-era names → design-core semantics) and MUST NOT redefine `--primary` / `--destructive` or ship a parallel Tailwind `@theme` palette.

## LN-UI-008 — Native CSS in retained components

<a id="ln-ui-008"></a>

**Requirement.** Retained `@lapis-notes/ui` compounds and `@lapis-notes/api` component chrome MUST NOT contain Tailwind utility class strings in `.svelte` sources (`cn("flex …")`, layout/paint utilities, `tailwind-variants`). Allowed exception: `sr-only` / `not-sr-only`. Storybook story/demo Svelte MAY use host Tailwind for layout only.

## LN-UI-009 — Root pnpm check:no-tailwind (and package check wiring): fail when LN-UI-008 is violated under

<a id="ln-ui-009"></a>

**Requirement.** Root `pnpm check:no-tailwind` (and package `check` wiring) MUST fail when LN-UI-008 is violated under the component sources in `packages/ui`, `packages/api`, and `packages/workspace` (stories/examples excluded).

## LN-UI-010 — Generic workspace startup surface and source editor: compose design-core components and use native CSS/public

<a id="ln-ui-010"></a>

**Requirement.** The generic workspace startup surface and source editor demo integrations MUST compose design-core components and use native CSS/public tokens/data hosts; touched legacy editor utility strings MUST be replaced with semantic component classes.

## LN-UI-011 — Source editor host: import @lapismd/mira Obsidian theme CSS, default

<a id="ln-ui-011"></a>

**Requirement.** The source editor host MUST import `@lapismd/mira` Obsidian theme CSS, default to `data-mira-theme="obsidian"`, and paint syntax highlighting through Mira editor tokens on a `.markdown-editor-surface` (or equivalent Mira surface) without Tailwind utility strings.

## LN-UI-012 — Source editor inline title: use native CSS with public --ui-editor-inline-title-\* tokens

<a id="ln-ui-012"></a>

**Requirement.** The source editor inline title MUST use native CSS with public `--ui-editor-inline-title-*` tokens (and Obsidian-compatible `--inline-title-*` aliases) so the editable filename reads as an h1-scale title without Tailwind utility strings.

## LN-UI-013 — Source editor face paint: default to Mira monospace via public editor

<a id="ln-ui-013"></a>

**Requirement.** Source editor face paint MUST default to Mira monospace via public editor tokens, with a sans override selectable by CodeMirror host `data-language` for Markdown and plain text only. Native CSS MUST keep configured fold-gutter markers visible for non-Markdown languages while hiding the duplicate generic gutter for Markdown, whose fold controls are owned by Mira. Editor-shell note-column spacing MUST target only the outer editor sizer and MUST NOT pad Mira's nested embedded previews.

## LN-UI-014 — Design Core overlay portal ownership

<a id="ln-ui-014"></a>

**Requirement.** Trigger-based overlay portal ownership MUST remain in Design Core. Lapis MUST consume the shared Popover, Hover Card, Tooltip, Dropdown Menu, Context Menu, and Select owner-document behavior rather than exporting a local portal context, adding consumer source aliases, or passing cross-realm targets to Bits UI. Markdown link previews MUST use Design Core Hover Card and its public z-index token so they stay topmost across workspace panes and inside their originating popout document.

## LN-UI-015 — Alias-only @lapis-notes/ui/theme.css layer: align Mira's Obsidian accent, accent-foreground, soft-accent, focus-ring

<a id="ln-ui-015"></a>

**Requirement.** The alias-only `@lapis-notes/ui/theme.css` layer MUST align Mira's Obsidian accent, accent-foreground, soft-accent, focus-ring, and selection variables with design-core's public Lapis workspace semantics under `data-ui-theme="lapis"`. It MUST NOT duplicate the Lapis palette, redefine design-core primitives, or change standalone Mira's portable fallback theme.

## LN-UI-016 — Retained sidebar-custom Input and Separator wrappers: type their unchanged bindings and forwarded props

<a id="ln-ui-016"></a>

**Requirement.** Retained `sidebar-custom` Input and Separator wrappers MUST type their unchanged bindings and forwarded props through the corresponding public design-core prop contracts. They MUST NOT infer an exported declaration from linked sibling implementation files.

## LN-UI-017 — @lapis-notes/ui: remain a versioned, pack-tested public artifact

<a id="ln-ui-017"></a>

**Requirement.** `@lapis-notes/ui` MUST remain a versioned, pack-tested public artifact for API and external-plugin consumers. Its published manifest MUST use portable semver ranges for shared host dependencies while colocated development MAY link matching sibling versions.

## LN-UI-018 — Public CodeMirror autocomplete stylesheet: use native CSS and shared Design Core

<a id="ln-ui-018"></a>

**Requirement.** The public CodeMirror autocomplete stylesheet MUST use native CSS and shared Design Core Popover and Command tokens for opaque surface paint, radius, boundary, shadow, typography, selected options, and completion details. It MUST compile without a host Tailwind theme.

## LN-UI-019 — @lapis-notes/ui public 0.1.0 package: document its root helpers, CSS entrypoints, retained

<a id="ln-ui-019"></a>

**Requirement.** The `@lapis-notes/ui` public `0.1.0` package MUST document its root helpers, CSS entrypoints, retained component subpaths, and Design Core/Svelte peer boundary. Its release tarball MUST include README, changelog, license, and built CSS/component declarations without adding domain state or host policy.

## LN-UI-020 — Alias-only Lapis theme: define public --ui-search-highlight-background and --ui-search-highlight-foreground defaults

<a id="ln-ui-020"></a>

**Requirement.** The alias-only Lapis theme MUST define public `--ui-search-highlight-background` and `--ui-search-highlight-foreground` defaults with WCAG AA text contrast so Search and other plugin-owned highlighted matches share accessible application paint.

- Light and dark matches retain at least 4.5:1 text contrast on workspace and sidebar surfaces, including hover and active rows.
- Dark yellow highlights preserve readable text without changing light-mode defaults or requiring consumer color overrides.
