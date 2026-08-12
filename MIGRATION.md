# Migration Status

Living checklist for the minimal Lapis Notes monorepo. Update this file when
intake or UI swap status changes.

## Bootstrap

| Area                                      | Status | Notes                                                                                                                                                                                                                                               |
| ----------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm + Turbo scaffold                     | Done   | No multi-script import-resolution gates                                                                                                                                                                                                             |
| Spec governance + validation              | Done   | 344 one-concern requirements; modular validation covers canonical Markdown, verification, mdBook output, and Storybook consumer source; local QMD discovery remains a disposable untracked cache                                               |
| Storybook host (port 7010)                | Done   | `API/` verification stories + catalog                                                                                                                                                                                                               |
| Storybook consumer Show Code              | In progress | Panels use layout-derived examples; API and workspace demos expose explicit implementation/consumer source instead of demo invocation; Date Setting still needs a public-boundary example                                                     |
| API Storybook verification + Visual Delta | Done   | Plays green; `visual-pending` PNG baselines generated (review → `visual-approved` later)                                                                                                                                                            |
| Sibling dependency normalization          | Done   | Five root `link:` dependencies + overrides; package exports are authoritative; CodeMirror/Lezer peers are host-owned; focused editor capture restored all links and removed `.deps/` (4 baseline matches, 3 current-sibling mismatches; no updates) |
| `@lapismd/design-core` sibling            | Done   | Root `link:../design-core` + pnpm override; its package-declared source exports remain live; package manifests use portable `*` contracts                                                                                                           |
| `@lapismd/mira` siblings                  | Done   | Root `link:../mira-mde/packages/*` deps + overrides; rebuild Mira to refresh its linked `dist` exports without reinstalling Lapis                                                                                                                   |
| Storybook a11y in Vitest                  | Done   | `vitest.setup.ts` + `a11y.test: "error"`; filled action tokens AA-tuned                                                                                                                                                                             |
| Storybook style authority                 | Done   | design-core styles + lapis theme; ui `theme.css` only (avoid dual Tailwind)                                                                                                                                                                         |
| Storybook Vite config layout              | Done   | `.storybook/vite-final.ts` holds aliases; slim `main.ts` avoids Storybook CJS-scan ReDoS hang on large configs                                                                                                                                      |

## Packages

| Package / area                              | Status         | Notes                                                                                                                                                                                                                                |
| ------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@lapis-notes/api`                          | Copied         | Kernel from full lapis-notes; scripts slimmed                                                                                                                                                                                        |
| `@lapis-notes/ui`                           | Pruned         | Kept compounds only: modal, confirm-dialog, search, sidebar-custom, table-dnd + helpers                                                                                                                                              |
| `@lapis-notes/workspace` shell integration  | Done           | Thin design-core host; api compatibility + persistence façade                                                                                                                                                                        |
| Web host                                    | Not started    | No runnable web product host in this slice                                                                                                                                                                                           |
| `@lapis-notes/desktop-electron`             | Done (partial host) | Source-first native-folder host from legacy commit `8ec68e18`; empty workspace shell, retained native services/sidecars, and local distribution only |
| `@lapis-notes/markdown`                     | Done (slice)   | Authorized plugin; Mira document render + public app-only panels and embed surfaces; File Properties keeps the Mira `FrontmatterEditor`; Outline and link panels match the observable full-repo behavior without the legacy renderer |
| Tags (workspace-origin)                     | Done (fixture) | Storybook-local `TagsDemoPlugin` with full sort/search/hierarchy/live-refresh behavior; explicitly not folded into a package                                                                                                         |
| `@lapis-notes/language-service`              | Done           | Provider-neutral Markdown client/worker supplies open-document diagnostics and cached actions                                                                                                                                         |
| `@lapis-notes/markdown-lint`                 | Done           | Enabled core plugin selects the probed native service or worker fallback and preserves configured rules, fixes, and ignores                                                                                                           |
| Notebook / other plugins                     | Not started    | Remain blocked by LN-PKG-004 until separately specified                                                                                                                                                                              |
| Storybook editor/Explorer intake plugins    | Done (fixtures) | Source-editor + Explorer remain Storybook-local fixtures; landing empty-state paint follows its body ViewHost and Explorer follows resolved view-surface tokens in every placement                                                   |
| design-core workspace engine                | Done           | Consumes public workspace APIs; shared stacked-pane width fixed at the design-core source                                                                                                                                            |

### Electron desktop host intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/desktop-electron` at
legacy commit `8ec68e18`.

- [x] Canonical desktop-host requirements, package authorization, verification mapping, and source provenance
- [x] Private `@lapis-notes/desktop-electron` package scaffold at version `2026.31.5`
- [x] Electron lifecycle, context-isolated preload, native menus, app URLs, window chrome, and bounded IPC
- [x] Native folder/profile bootstrap, filesystem/resource access, database/search, watches, notifications, and file actions
- [x] Markdown-only native language-service sidecar
- [x] Community-plugin sidecar, capability broker, and verified plugin asset protocol
- [x] Empty native-vault `WorkspaceShell` boot, persisted layout, reopen, fallback, switching, and teardown
- [x] macOS arm64/x64 local packaging, icons, entitlements, credential-safe signing/notarization hooks, and packaged smoke
- [x] Local-only macOS artifact manifest with sizes, SHA-256 checksums, and blockmap metadata
- [ ] Linux x64 AppImage/tar production and smoke on a Linux builder
- [x] Focused package, Electron, and macOS distribution validation
- [x] Root specification, check, test, and build validation
- [x] Focused `Workspace/Shell / PersistedDesktop` Storybook interaction and accessibility validation
- [x] Replace the temporary handwritten landing page with the branded `8ec68e18` native launcher while keeping demo seeding pruned
- [x] Load the production Design Core stylesheet pipeline and Lapis aliases in Electron
- [x] Match the `PersistedDesktop` captured empty-shell geometry: left open, right and bottom closed
- [x] Route native “Open Vault…” through the launcher after orderly session teardown
- [ ] Full Storybook suite: 74/78 pass; four existing `LapisEditorDemo` interaction failures remain outside the desktop intake
- [ ] `PersistedDesktop` Visual Delta comparison: blocked because Docker Desktop cannot start; no baseline was updated

Intentionally pruned: notebook/DuckDB, TypeScript-only language-service paths,
demo-vault seeding, bundled-plugin startup/build steps, the legacy full app
bootstrap, Windows targets, and remote release publication.

### Markdown plugin intake progress

Canonical Markdown requirements span `spec/src/markdown-plugin.md`, its nested
`spec/src/markdown-plugin/panels/` pages, and the shared movable-panel contract
in `spec/src/workspace-shell/panels.md` (LN-MD-001 through LN-MD-035). Parity
detail lives in `packages/plugins/plugin-markdown/PARITY.md`.

- [x] Package scaffold + workspace wiring (`@lapis-notes/markdown`)
- [x] Canonical panel documentation split into one page per panel beneath Markdown Plugin / Panels, with reusable surface and catalog guidance owned by Workspace Shell / Panels
- [x] Mira-owned markdown document modes (`source` / `live-preview` / `preview`)
- [x] Path A / Path B editor extension reload + host editor events preserved
- [x] Markdown settings section (Mira features, mermaid, AI stub)
- [x] Side panels: All Properties, File Properties, Outline, Backlinks, Outgoing Links, Media; Outline and link panels carry the full observable interaction/data slice
- [x] Shared `MarkdownSidebarPanel` recipe (LN-MD-018, LN-MD-032 through LN-MD-035) + Tags Storybook fixture; all movable panels are full-width/titleless with workspace-family 0.75rem list/result controls, and design-core `WorkspaceViewHost` resolves public view paint tokens with a white body/bottom/group default and sidebar paint only for ungrouped top-level side panels; Lapis contains no placement selectors
- [x] Metadata write contract + type widgets + `trackChanges` / `types.json` demo seeds
- [x] File Properties → Mira `FrontmatterEditor` + Lapis `MetadataTypeManager` adapter, no-overflow narrow single-column rows with label-aligned values, native focus geometry with view-token contrast fill, hash Tags icon, and surface-contrasting native pills (LN-MD-017/019)
- [x] Markdown frontmatter integration → public Mira source decorations, Source Code Pro YAML source, Mira-only inline fold controls, working rendered disclosure, and unpadded content-aligned embedded preview (LN-MD-025)
- [x] Complete Mira authoring composition → public base-free factory inside the API editor shell, selection tools, draggable block handles, slash commands, tables, images, completions, smart paste, extension lifecycles, truthful typed settings, optional edit-only top toolbar, and opt-in Doodle Dividers (LN-MD-071 through LN-MD-075)
- [x] Compact Mira feature settings → the 20 capability descriptors retain flat dotted keys/defaults/runtime gates while design-core renders their explicit labels and descriptions in a presentation-only Features toggle table (LN-MD-082/083, LN-ED-042)
- [x] Markdown mode chrome → API-to-design-core projection of compatibility view actions and pane menus; full-repo book-open/pencil mode actions, modifier split behavior, Reading/Source menu toggles, and registered Markdown provider items (LN-MD-076/077, LN-ED-038/039)
- [x] Markdown view-menu and Reading polish → borderless Mira Reading shell, View-first mode and toolbar controls, plus persisted toolbar indentation settings (LN-MD-078 through LN-MD-081, LN-ED-040/041)
- [x] Mira-backed embed framework → app-bound `MiraFileAdapter`, public `FileEmbed` / `MarkdownEmbed` / `NoteLink` plus `./embed`, shared document and Design Core Hover Card link-panel previews, vault-relative resolution, refresh/navigation, image and registered custom-embed lifecycle (LN-MD-026)
- [x] Ordinary Mira internal-link previews → linked source-owned Bits UI `LinkPreview`, owner-document portal, collision-aware viewport geometry, active appearance, and topmost cross-pane paint without a Lapis wrapper (LN-MD-027)
- [x] Editable note hover previews → Lapis vault-backed `writeMarkdown`, automatic ordinary-link editing, opted-in Backlinks/Outgoing `FileEmbed` editing, 500ms serialized autosave, dirty-error retention, and read-only direct embeds (LN-MD-028)
- [x] Minimal editable preview cards → no resolved filename/path chrome or panel embed guide, disclosure-safe all-round padding, sticky top-right open action, two-pixel editing border, CodeMirror-owned edit scrolling, hover/focus pinning, and persistence-safe outside-click dismissal (LN-MD-029)
- [x] Unified editable preview appearance → inherited Mira portal theme, explicit panel FileEmbed theme, Lapis-aligned Mira accent aliases, and preview padding isolated from live-edit frontmatter (LN-MD-030)
- [x] Focused `Workspace/Panels/Markdown/<Panel>/*` interaction stories: six movable surfaces for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Storybook-local Tags; file-scoped stories keep one minimal active note and vault-wide stories stay document-free
- [x] Real app-only component metadata with no kind/layout harness controls; real bottom/sidebar groups, stable ViewHost paint assertions, isolated 700px padding-free Docs previews, and explicit persisted-layout Show Code
- [x] Linked Mira package exports + CodeMirror/Lezer dedupe; ignored `.deps/*` staging remains Docker-only
- [ ] Markdown panel Visual Delta capture/review; all placement stories declare independent pending paths, but this slice intentionally generates or updates no PNGs
- [ ] Rich property-value suggestions / NoteLink behavior and full metadata worker

### Workspace shell integration progress

- [x] Generic Problems integration → design-core diagnostics façade, plugin-owned collections, open-document language-service bridge, diagnostics-only Markdown composition, Markdownlint provider, navigation/actions with open-editor/vault parity, aligned severity gutter glyphs, compact hover cards with stable origin handoff, styled inline problem expansion with clean hover recovery, transient tree/table presentation with shadcn two-axis scrolling, a live count in the owning leaf badge, an inline severity-filter menu, a leaf-owned title with right-aligned toolbar controls, and runnable editor acceptance (LN-WS-025 through LN-WS-048)
- [x] Editor-demo runtime teardown synchronously unloads and destroys retained editors before asynchronous plugin/controller disposal, preventing HMR from accumulating Mira portal hosts (LN-WS-019, LN-ED-009)
- [x] Full-shell `Workspace/Shell`, `Workspace/Lapis Editor Demo`, and panel Autodocs share an isolated 700px padding-free application viewport; authored shell pages render every canonical story description
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

| Family        | design-core target                   | api usage         | Status                        |
| ------------- | ------------------------------------ | ----------------- | ----------------------------- |
| button        | `@lapismd/design-core/shadcn/button` | direct            | Done (api imports)            |
| input         | `…/shadcn/input`                     | direct            | Done (api imports)            |
| textarea      | `…/shadcn/textarea`                  | direct            | Done (api imports)            |
| switch        | `…/shadcn/switch`                    | direct            | Done (api imports)            |
| table         | `…/shadcn/table`                     | direct            | Done (api imports)            |
| select        | `…/shadcn/select`                    | direct            | Done (api imports)            |
| command       | `…/shadcn/command`                   | direct            | Done (api imports)            |
| popover       | `…/shadcn/popover`                   | direct            | Done (api imports)            |
| hover-card    | `…/shadcn/hover-card`                | direct            | Done (Markdown link previews) |
| dropdown-menu | `…/shadcn/dropdown-menu`             | direct            | Done (api imports)            |
| tooltip       | `…/shadcn/tooltip`                   | direct            | Done (api imports)            |
| scroll-area   | `…/shadcn/scroll-area`               | direct            | Done (api imports)            |
| toggle-group  | `…/shadcn/toggle-group`              | direct            | Done (api imports)            |
| toggle        | `…/shadcn/toggle`                    | transitive        | Done (api imports)            |
| dialog        | `…/shadcn/dialog`                    | transitive        | Done (api imports)            |
| sheet         | `…/shadcn/sheet`                     | type + transitive | Done (api imports)            |
| separator     | `…/shadcn/separator`                 | transitive        | Done (api imports)            |
| skeleton      | `…/shadcn/skeleton`                  | transitive        | Done (api imports)            |
| progress      | `…/shadcn/progress`                  | direct            | Done (api imports)            |
| slider        | `…/shadcn/slider`                    | direct            | Done (api imports)            |
| context-menu  | `…/shadcn/context-menu`              | direct            | Done (api imports)            |
| drawer        | `…/shadcn/drawer`                    | direct            | Done (api imports)            |

### Keep in `@lapis-notes/ui` (not in shadcn-svelte registry)

Verified against `https://shadcn-svelte.com/registry/index.json` — these names
are **not** registry UI items. Maintain here (or compose from design-core
primitives) until a deliberate Lapis compound lands in design-core.

| Family         | Why keep                                      | Near-miss                               | Status                                               |
| -------------- | --------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| modal          | Imperative DocumentFragment / plugin host API | `shadcn/dialog`                         | Kept; colocated `modal.css` + `--ui-modal-*` (no TW) |
| confirm-dialog | `promptConfirm` → Promise\<boolean\>          | registry `alert-dialog` (different API) | Kept; colocated CSS + `--ui-confirm-dialog-*`        |
| search         | Input + icon + clear compound                 | `filter/SearchFilterBar`, `input-group` | Kept; colocated `search.css` + `--ui-search-*`       |
| sidebar-custom | NestedProvider, resize, `SidebarState`        | registry/design-core `sidebar` (stock)  | Kept; native CSS/tokens + portable wrapper props      |
| table-dnd      | dnd-kit grips/sensors for settings arrays     | forms `SortableArrayItem`               | Kept; grip chrome via `--ui-table-dnd-*`             |

Also keep local: root `cn` / fuzzy helpers. Trigger-overlay portal ownership is
now centralized in Design Core; the retired Lapis `overlay-portal-context`
export and API source alias MUST NOT be restored.

**Retired:** `date-time-picker-dialog` — removed from `@lapis-notes/ui`. Date/time
settings use api `date-setting` → `@lapismd/design-core/forms` `DatePicker` /
`TimePicker` (Storybook: `API/Date Setting`, catalog id `api-date-setting`).

### Add to design-core from shadcn-svelte registry (then swap)

These were on the keep list but **are** upstream registry UI items. Do **not**
maintain separate forks in `@lapis-notes/ui`. In design-core:
`pnpm ui:add <name>` → consume `@lapismd/design-core/shadcn/<name>`.

| Family       | Registry             | design-core today | Action                     |
| ------------ | -------------------- | ----------------- | -------------------------- |
| progress     | yes (`progress`)     | present           | Done — api imports swapped |
| slider       | yes (`slider`)       | present           | Done — api imports swapped |
| context-menu | yes (`context-menu`) | present           | Done — api imports swapped |
| drawer       | yes (`drawer`)       | present           | Done — api imports swapped |

### Prune from local ui

| Family                                                                                                                                                                                                                      | Note                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| All swap families (button, input, textarea, switch, table, select, command, popover, dropdown-menu, tooltip, scroll-area, toggle-group, toggle, dialog, sheet, separator, skeleton, progress, slider, context-menu, drawer) | Done — pruned from local ui; api + stories consume `@lapismd/design-core/shadcn/<family>` |
| date-time-picker-dialog                                                                                                                                                                                                     | Done — retired; date/time via `forms` DatePicker/TimePicker                               |
| label                                                                                                                                                                                                                       | Done — deleted (orphan)                                                                   |
| sidebar (stock)                                                                                                                                                                                                             | Done — deleted; `SIDEBAR_WIDTH_ICON` lives in sidebar-custom constants                    |

All api-consumed families also have `API/` plays and `visual-pending` baselines
(helpers are `skip-visual`). Promote tags to `visual-approved` after human review.

### Theme / CSS

| Item                            | Status          | Notes                                                          |
| ------------------------------- | --------------- | -------------------------------------------------------------- |
| Brand (`themes/lapis.css`)      | Source of truth | design-core Lapis semantic + `--ui-workspace-*`                |
| Local `theme.css`               | Alias-only      | Obsidian-era → design-core map (below); no palette / `@theme`  |
| Local `styles.css`              | Alias re-export | Imports `theme.css` only (no Tailwind)                         |
| design-core styles in Storybook | Done            | `.storybook/preview.ts`; production host cutover still pending |
| `pnpm check:no-tailwind`        | Done            | Scans ui + api components; stories excluded                    |

#### Obsidian / Lapis alias map (`ui/theme.css`)

| Lapis / Obsidian-era                  | design-core target                                               |
| ------------------------------------- | ---------------------------------------------------------------- |
| `--text-normal`                       | `--foreground`                                                   |
| `--text-muted` / `--text-faint`       | `--muted-foreground`                                             |
| `--text-accent`                       | `--ring` / `--primary`                                           |
| `--interactive-accent*`               | `--primary` / `--ring` / `--lapis-accent*`                       |
| `--background-primary` / `-secondary` | `--background` / `--muted`                                       |
| `--background-modifier-border*`       | `--border` / `--input` / `--ring`                                |
| `--input-height`                      | `--ui-control-height` → `--ui-workspace-settings-control-height` |
| `--color-base-*` ramp                 | Dropped from component paint                                     |

### Compound / api chrome conversion

| Surface                                                        | Status                                |
| -------------------------------------------------------------- | ------------------------------------- |
| ui: modal, confirm-dialog, search, table-dnd                   | Done — colocated CSS + tokens         |
| ui: sidebar-custom                                             | Done — native CSS family              |
| api: menu, configuration, editor layout, empty-view, icon-list | Done — colocated CSS; no TW utilities |

## Out of scope (do not copy yet)

- Full-app `scripts/check-first-party-*.mjs` matrix
- Docker / e2e vault / plugin-host generation
- Changesets / npm publication gates
