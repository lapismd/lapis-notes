# Markdown plugin parity

Living checklist vs full-repo
`~/code/lapis-notes/packages/plugins/plugin-markdown` and workspace Tags.

## Current slice status (2026-08-09)

`@lapis-notes/markdown` is the sole authorized plugin package in this monorepo
slice (LN-MD-001). Document render is Mira-owned; Lapis keeps Plugin/Editor/
metadata write authority. Spec: `spec/src/markdown-plugin.md` (LN-MD-001–019).

| Layer | Status | Notes |
| --- | --- | --- |
| Package + registration | Landed | Workspace package; `Plugin` APIs only (no loader fork) |
| Mira document modes | Landed | `source` / `live-preview` / `preview` + View menu + leaf state |
| Mira local package resolve | Landed | Sibling `link:` packages resolve built public exports; rebuild Mira to refresh `dist`. Docker visual capture still uses ignored staged `.deps/*` |
| File Properties (LN-MD-017/019) | Landed | Mira `FrontmatterEditor` + Lapis `FrontmatterController` / `FrontmatterPropertyManager` adapter over `MetadataTypeManager`; writes via `processFrontMatter` / `updateFrontmatterProperty` |
| Side panels + Tags fixture | Landed | Shared `MarkdownSidebarPanel` (LN-MD-018); Tags remains Storybook-local |
| Spec / Storybook verification | Landed | `pnpm spec:first`; panel CSF plays green; markdown package `check` + unit tests green |
| Visual Delta for panels | Partial | All Properties six-surface spike is `visual-pending`; remaining panel stories stay `skip-visual` until Visual Delta resumes |

## In scope / landing this slice

| Area | Status | Notes |
| --- | --- | --- |
| Plugin registration via existing `Plugin` APIs | Done | No framework fork |
| MarkdownView modes source / live-preview / preview | Done | Leaf state + View menu |
| Mira document render swap | Done | Rich CM via Mira; reading via MiraEditor preview |
| Path A / Path B extension reload + editor events | Done | NoteEditor + registerEditorExtension + updateOptions |
| Markdown settings (Mira features + mermaid/AI) | Done | schema + Markdown settings section |
| All Properties | Done | `MarkdownSidebarPanel` shell + `sidebar-custom` NestedProvider/Menu rows; type icons align to search-icon offset |
| File Properties | Done | Mira `FrontmatterEditor` + Lapis controller/manager adapter (LN-MD-017/019); local `FrontMatter` component is not panel authority; PillListEditor deferred |
| Outline | Done (simplified UI) | Heading list + jump via shell `__list` / `__row` |
| Backlinks / Outgoing Links | Done (simplified UI) | Metadata links; FileEmbed hover deferred |
| Media view | Done (minimal) | Image file view registration |
| Tags sidebar | Done | Storybook-local `TagsDemoPlugin` on `MarkdownSidebarPanel` |
| Focused `Workspace/Panels/Markdown/*` stories | Done | Seeded CSF under `stories/workspace/panels`; a dedicated All Properties group covers all six movable surfaces in a minimal shell, including grouped chrome in the bottom panel, while remaining panels stay `skip-visual` |
| Sidebar panel recipe (LN-MD-018) | Done | Sticky chrome + ui Search + panel-action hover + CSS ancestry over stable design-core surface hosts |
| Editor demo last-wins override | Done | source → markdown → tags; optionalCorePlugins configured |
| MetadataProcessor write contract | Done | `write` serializes the frontmatter object (not `cache.frontmatter`) |
| Type widget registration | Done | Lapis types registered in `onload` with icons + simple native editors |
| Frontmatter mutate helper | Done | `updateFrontmatterProperty` / `applyFrontmatterMutation` |
| Lapis ↔ Mira frontmatter adapter | Done | `createLapisFrontmatterController` / `createLapisFrontmatterPropertyManager` / `syncLapisFrontmatterController` |
| Host `trackChanges` wiring | Done | Storybook panel + editor-demo boots call `watchMetadata` and dispose |
| Demo `types.json` seed | Done | Panel + editor vault seeds include `.obsidian/types.json` |
| Linked Mira exports + CM/Lezer dedupe | Done | Storybook and markdown Vitest use package exports; no sibling Mira source aliases |
| Storybook `main.ts` ReDoS workaround | Done | Heavy Vite config lives in `vite-final.ts` so Storybook’s CJS-scan regex does not hang startup |

## Sidebar panel recipe

Use this for every new workspace leaf panel (markdown + Tags). Authority: All
Properties polish folded into `MarkdownSidebarPanel` (LN-MD-018).

### Surface placement

Panels can move between every desktop surface. Design-core owns stable surface
identity on the destination host, and the shell matches it through CSS ancestry:

| `data-workspace-surface` | Paint |
| --- | --- |
| Ungrouped top-level `left-sidebar` / `right-sidebar` panel | `--ui-workspace-panel` |
| `body` / `bottom-panel` / `workspace-sidebar-group` / no surface ancestor | `--ui-workspace-background` |

- Do not inspect or cache `view.leaf.parent`, or pass placement props into
  `MarkdownSidebarPanel`; a dragged leaf must adopt its destination CSS without
  a component remount.
- Keep view host CSS (`surfaces.css`) **transparent** so the shell owns paint.
- Sticky chrome uses the same `--markdown-sidebar-surface` token as the root.
- Do not hard-code sidebar grey on panels that may open in the main split.

### View icons

`WorkspaceIcon` resolves Lucide **short names** against `@iconify-json/lucide`
(e.g. `archive`, `info`, `list`). Prefer those from `View.getIcon()`.

| View | Icon |
| --- | --- |
| All Properties | `archive` (Obsidian “file box” / drawer) |
| File Properties | `info` |
| Outline | `list` |
| Backlinks | `link-2` |
| Outgoing Links | `links` |
| Tags | `tags` |

`lucide-foo` / `lucide:foo` are normalized by design-core, but short names are
the contract for new panels.

### Do

- One `ScrollArea`; sticky toolbar + optional search **inside** the viewport.
- Search via `@lapis-notes/ui/search` with white fill on the control only.
- Toolbar icons: `--ui-workspace-panel-action-hover-*` (ghost `--muted` matches Lapis sidebar and is invisible).
- Layout tokens on the shell: `--markdown-sidebar-chrome-pad-x`, `--markdown-sidebar-search-row-pad-x`, `--markdown-sidebar-search-icon-inset`, `--markdown-sidebar-end-pad`, `--markdown-sidebar-count-end-pad`, `--header-height`.
- Simple lists: `markdown-sidebar-panel__list` / `__row` / `__row-meta`.
- Menu lists: `Sidebar.NestedProvider` (context only) + Content/Menu/MenuButton/MenuBadge inside shell children.
- Set `getIcon()` to the Lucide short name for the view (see table above).

### Don't

- Remount `Sidebar.Root` / `Sidebar.Provider` inside a leaf.
- Put chrome outside the ScrollArea or re-tune per-panel sticky/search padding.
- Rely on design-core ghost Button hover (`--muted`) on sidebar surfaces.
- Force `--ui-workspace-panel` / `--sidebar` when the leaf is in the main body.
- Treat the bottom panel or sidebar group as a sidebar paint override; both keep
  the white default.
- Return unknown Lucide ids from `getIcon()` (WorkspaceIcon falls back to `file`).

## Deferred

| Area | Notes |
| --- | --- |
| List-callouts catalog + settings tab | Full-repo hybrid settings |
| Metadata worker / heavy type widgets | Lightweight `extract-metadata` intaken; full remark/worker deferred; PillListEditor / suggestValues / NoteLink later |
| Language-service hooks | Package not authorized yet |
| Host wikilink/embed/file autocomplete parity | Needs host resolvers |
| Full FileEmbed hover via retired local preview | Stub or Mira preview |
| Mode-switch scroll/selection restore edge cases | Keep if cheap with intake |
| Notebook frontmatter layout | Notebook package out of scope |
| Reading-speed / readable-line-length host policy | May stay on editor schema |
| Mira `split` mode | Not in Lapis MarkdownViewModeType |
| Production AI `run` provider | Demo stub only |
| Full-repo remark metadata worker UI depth | Lightweight extract remains |
| Nest full `Sidebar.Root` inside workspace leaves | Prefer Lapis Explorer pattern: shell/panel NestedProvider + Content/Menu primitives (All Properties uses this); avoid remounting Root |
| PillListEditor / property-name suggestions / NoteLink in File Properties | Keep Mira editor + simple Lapis type widgets until dedicated widget pass |
| Panel Visual Delta baselines | All Properties six-surface spike is `visual-pending`; remaining panel stories stay `skip-visual` until capture lane resumes |

Update this file when intake or Mira coverage changes.
