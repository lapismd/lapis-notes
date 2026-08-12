# AGENTS.md

Guidance for agents working in this repository. This file applies to the whole
repo unless a more specific `AGENTS.md` is added deeper in the tree.

## Project Shape

- This is a pnpm + Turbo monorepo for a **minimal** Lapis Notes slice.
- Current packages: `@lapis-notes/api` (runtime kernel) and `@lapis-notes/ui`
  (pruned design-system surface consumed by api).
- Host apps, plugins, workspace shell, and notebook packages are **not** in this
  repo yet. Track intake in `MIGRATION.md` — do not invent them ahead of the
  spec.

## Spec First

- Canonical requirements live under `spec/src/`. Implementation must not run
  ahead of the spec.
- Update the mapped chapter(s) and `spec/src/verification.md` **before or with**
  protected implementation changes.
- Run `pnpm spec:first` after changing protected paths. The gate fails closed on
  unmapped `packages/*/src` changes.
- Keep specification scripts and their tests together under
  `scripts/spec-validation/`; add new validation lanes to its explicit
  orchestrator instead of creating root-level spec scripts.
- Prefer `pnpm spec:search -- "<topic or LN-ID>"` before broad manual scans of
  the specification. Open and verify the returned `spec/src` files because the
  QMD index is only a discovery cache. Use `--semantic` for conceptual queries;
  fall back to `rg` when QMD or its embedding model is unavailable.
- Authority order: `spec/src` → package interfaces / implementation → Storybook
  catalog → READMEs / this file (workflow only).

### Requirement authoring

- Give each requirement ID one independently verifiable concern. Split clauses
  into separate IDs when they can fail independently, need different evidence,
  or are likely to evolve separately.
- Keep requirement table cells concise and normative. Use `MUST` / `MUST NOT`
  for required behavior and `MAY` for an intentional option or exception.
- Keep each requirement statement and ID-scoped acceptance bullet within 80
  prose words and four sentences. `pnpm spec:validate` enforces those objective
  limits after removing Markdown syntax.
- If one atomic concern still has three or more unordered acceptance details,
  add a unique `### <ID> acceptance details` subsection in the defining chapter,
  introduce its unordered list, and include at least three bullets. Do not use
  bullets to hide concerns that need separate IDs.
- When splitting a requirement, retain the original ID for its primary concern
  and allocate the next unused IDs for the extracted concerns. Preserve every
  constraint, exception, and normative keyword; never reassign an existing ID
  to unrelated behavior.
- In the same change, add one `spec/src/verification.md` row per new ID and
  update cross-references, `MIGRATION.md`, and mapped guidance. Run
  `pnpm spec:check` and verify that requirement and verification IDs remain
  one-to-one.
- Treat validator diagnostics as repository contracts: every finding includes
  an error code, governing specification rule, path and line, affected ID when
  applicable, and an actionable message. Fix the source instead of suppressing
  or grandfathering an oversized requirement.

## UI And Styling

- Prefer `@lapismd/design-core` for overlapping shadcn primitives over time
  (sibling package via `link:../design-core` and its public exports).
- Keep Lapis-specific compounds in `@lapis-notes/ui` until migrated; each
  retained custom family needs Storybook stories and docs.
- Every UI family consumed by `@lapis-notes/api` has an `API/<Name>` verification
  story under `stories/api/` (catalog: `stories/catalog/`). When changing
  api-used UI or migrating a family to design-core, update the matching `API/`
  story play and re-run `pnpm test:storybook` plus visual checks
  (`pnpm build-storybook` / `pnpm test:visual` or `pnpm test:visual:update`).
- New or changed visual stories ship with tag `visual-pending` and nested-import
  PNG baselines under `tests/visual/storybook.spec.ts-snapshots/`. Do not flip
  tags to `visual-approved` without human review.
- **Brand / theme source of truth** is design-core
  `themes/lapis.css` (`data-ui-theme="lapis"`). Local
  `@lapis-notes/ui/theme.css` is **alias-only** (Obsidian-era names → design-core
  semantics). Do not redefine `--primary` / `--destructive` / Tailwind `@theme`
  in ui.
- **Component paint** MUST be native CSS + public `--ui-<family>-*` tokens +
  `data-ui-component` / `data-ui-part` hosts. **No Tailwind utility strings** in
  retained `.svelte` sources under `packages/ui/src/lib/components` or
  `packages/api/src/lib/components` (`cn("flex …")`, `class="gap-2"`,
  `tailwind-variants`). `sr-only` is the only allowed utility class name.
  Enforce with `pnpm check:no-tailwind` (wired into root `pnpm check`).
- Storybook style authority is design-core (`styles.css` + Lapis theme) plus
  thin `ui/theme.css`. Storybook may keep `@tailwindcss/vite` **only** for
  story/demo layout — not as a component styling path.
- Storybook **Show Code** MUST be copy-pasteable consumer usage through public
  package imports, not auto-extracted story harnesses, fixtures, or args-only
  wrappers. Colocate `*.example-sources.ts` when a story needs an explicit
  snippet and set `parameters.docs.source` (`code`, `language`, and
  `type: "code"`) on the meta or individual story. Verify the rendered Show Code
  panel whenever adding or changing Docs stories.
  `pnpm spec:validate` enforces this configuration for Autodocs stories that
  use local demo, harness, or fixture boundaries; `!autodocs` acceptance stories
  are intentionally exempt.
- Multi-scenario Storybook families with an authored MDX Docs page MUST give
  every scenario a non-empty `parameters.docs.description.story`. Give each
  scenario its own heading and render `<Description of={Stories.<Story>} />`
  immediately before its Canvas, so the Docs page binds the canonical story
  metadata instead of copying prose that can drift.
- Track swap progress in root `MIGRATION.md`.

## Workspace Shell Stories

- Full-shell Autodocs for `Workspace/Shell`, `Workspace/Lapis Editor Demo`, and
  movable panel shells use the shared `WORKSPACE_SHELL_DOCS_STORY` dimensions:
  an isolated iframe (`inline: false`) at `700px` high. Prefer this contract for
  any new story whose subject is the complete workspace shell unless a mapped
  requirement explicitly needs a different viewport.
- Give shell Docs canvases a scoped class and remove `.docs-story .sb-story`
  padding so the application shell owns the complete documented viewport.
  Keep standalone story canvases full-screen; the 700px rule applies to their
  Autodocs embed rather than constraining the component or story root.

## Workspace Panel Stories

- Treat `spec/src/workspace-shell/panels.md` as the canonical reusable panel
  contract. Concrete Markdown behavior belongs to the owning page under
  `spec/src/markdown-plugin/panels/`; the checklist below explains how to apply
  those requirements while editing stories and components.
- Treat the shared panel-story helpers plus
  `stories/workspace/panels/AllProperties.stories.ts` as the reference pattern
  when adding or expanding stories for movable workspace panels. Put a panel's
  placement stories under one nested
  `Workspace/Panels/<Family>/<Panel>` group instead of adding a flat run of
  sibling stories to the family.
- Unless the mapped spec explicitly narrows the coverage, demonstrate the real
  panel in all six supported surfaces: Middle (Top Tabs), Stacked Tabs, Left
  Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. The bottom-panel
  scenario is a grouped panel and MUST use the real bottom-panel group chrome;
  the sidebar-group scenario MUST likewise use the real sidebar group.
- Use the smallest real persisted workspace shell for each placement. Mount
  exactly one instance of the panel, omit a visible Markdown/document leaf when
  it is not needed, and seed only the data required to exercise the panel. The
  panel's appearance and behavior—not surrounding demo content—remain the
  subject of the story.
- Panel roots and their content MUST fill the complete `WorkspaceViewHost`.
  `Sidebar.NestedProvider` supplies context but its inherited Content width can
  default to the legacy sidebar width, so menu panels must normalize the nested
  wrapper, Content, Menu, items, and collapsibles to the available width. Omit
  `MarkdownSidebarPanel` title/meta intro chrome unless it is genuine panel
  content. Tree panels align each nested guide beneath the expanded chevron tip
  and indent only at the start edge. Apply the panel's explicit disclosure
  policy: Tags reserves the disclosure column so hashes align by depth and each
  child hash ends on its immediate parent tag-name column, while Outline leaves
  reserve no disclosure space and a leaf child's text starts on its immediate
  parent label column. Keep any counts and the trailing row edge aligned
  independently of that start-edge policy.
- Test responsive panel behavior by resizing the owning workspace split through
  the real workspace controller, as the shell resize handle does.
  Do not set a width on the panel component or its content merely to trigger a
  breakpoint; that bypasses the tab layout and can leave Storybook previews in
  a synthetic constrained state when an assertion fails.
- Apply the same baseline to non-tree panels. File Properties remains a Mira
  `FrontmatterEditor`, adapted only through a full-width `markdown-widget-shell`
  wrapper and inherited workspace/0.75rem panel type variables. The editor must
  shrink with the panel and never introduce horizontal panel scrolling. Rely on
  Mira's own 250px container breakpoint to stack property keys and values into
  complete rows with the value aligned to the property label above it. Preserve
  Lapis type metadata but let Mira's native inline and pill-list
  controls render text, tags, aliases, and multitext; do not reintroduce generic
  textarea/comma inputs, competing input outlines, or resizable property
  textareas. Preserve the native Mira/Lapis property-row border/ring/radius, but
  derive the focused key/value fill from the resolved view foreground and
  background so it contrasts on both sidebar and workspace surfaces. Tags use
  the Lucide hash glyph. The wrapper stays transparent and supplies
  surface-aware Lapis focus, tag-, and alias-pill tokens; focused cells and
  alias pills must visibly contrast with both direct-sidebar and workspace
  paint.
  Never let a broad Mira surface override design-core's resolved panel paint.
  Backlinks and Outgoing Links must normalize every `NestedProvider` descendant
  to the available width, keep group and mention rows at 0.75rem, and align
  section/file counts to one trailing edge. Their hover/focus previews compose
  Design Core Hover Card plus the public app-bound `FileEmbed` from
  `@lapis-notes/markdown/embed`, which in turn uses Mira's portable embed
  surfaces and the Lapis `MiraFileAdapter`. The complete mention row is the
  native Trigger child. Rely on Hover Card/Bits UI for owner-document portals,
  700/300ms timing, safe pointer handoff, focus lifecycle, collision shift/flip,
  and topmost overlay paint; do not add manual open state, timers, conditional
  mounting, zero-width anchors, fixed sides, or panel-local portal detection.
  Constrained acceptance resizes the real owning split, restores it in
  `finally`, and asserts viewport containment plus `elementFromPoint` over the
  adjacent editor. Never fork another full-document preview inside a panel.
  Ordinary internal links inside Mira reading/live-preview documents remain
  Mira-owned: pass the writable Lapis `MiraFileAdapter`, then rely on Mira's
  portaled Bits UI preview for timing, collision, appearance, cross-pane paint,
  click-to-edit CodeMirror, 500ms serialized autosave, and dirty-buffer
  protection. Backlinks and Outgoing Links opt their public `FileEmbed` into
  editing and bind its editing state so the Design Core Hover Card stays open.
  Resolved note cards are content-only: omit filename/path chrome, inset
  rendered Markdown enough to preserve disclosure controls, and paint a 2px
  focus-ring border only while editing. In editable `FileEmbed` cards, omit the
  generic Mira embed guide and retain only a sticky top-right open-note action
  whose normal-flow row keeps content clear beneath it. Set blur return off,
  reject hover/focus close requests while editing, and route an outside pointer
  interaction through the public persistence-safe `exit()` before closing;
  Escape remains the keyboard dismissal and a failed save stays open. Direct
  document embeds remain read-only. Do not add a Lapis portal wrapper, editor,
  save timer, source alias, or clipping override. The middle-top-tabs Outgoing
  Links play is the linked-consumer regression for both ordinary and
  panel-result editable previews and must verify persisted vault content,
  minimal chrome, sticky action, padding, edit border, hover/focus pinning, and
  outside-click dismissal after that boundary.
  None of these panels render shell title/path intro copy.
- Compose Markdown editing through Mira's public
  `createMiraCodeMirrorExtensions({ includeBaseExtensions: false })` boundary
  inside the existing API `markupEditor` shell. Do not reconstruct a partial
  stack from parser or rich-editor internals: slash commands, command keymaps,
  tables, image handling, completions, smart paste, input handlers, block
  controls, and extension contributions travel together. The API shell remains
  the sole owner of base CodeMirror setup and live editor compartments.
- Every optional Markdown authoring surface must have one typed setting
  descriptor that supplies its configuration-schema property, Settings field,
  label, default, and runtime fallback. A feature flag is not a substitute for
  a visible surface setting. Keep the top toolbar edit-only and off by default;
  keep the selection toolbar and standard block handles on, the contextual
  block-type toolbar off, Doodle Dividers off, Mermaid on, and AI off. Never
  read the superseded `markdown.mira.features.toolbar` key.
- Keep the 20 Mira capability descriptors together in the design-core Boolean
  `toggle-table` group. Each descriptor owns its proper-case label, concise
  description, existing dotted key, default, and runtime gate; the group owns
  presentation only and must never enter the flat configuration schema or
  persisted configuration. Do not use the collection-oriented `object-grid`
  control for independent feature flags. Prove presentation changes through
  the real Editor Settings story and its `.obsidian/app.json` persistence path.
- Mount Mira extension styles and lifecycle callbacks with the owning Lapis
  CodeMirror view and clean them up on reconfiguration. Top-toolbar actions
  delegate to the existing Lapis `Editor`, configuration, image picker, and
  Markdown view-mode lifecycle; they must not create a second editor or
  persistence path. Keep Mira's outer framework border and radius out of both
  editing and Reading workspace surfaces. Pane menus put the Markdown View
  section first: Reading, Source while editing, then the toolbar toggle. Route
  that toggle and toolbar editor settings through Lapis configuration, and
  prove persistence by reading the canonical configuration file in the real
  in-memory editor demo. Demonstrate new authoring capabilities there,
  including a pointer test for drag behavior.
- Prefer the shared `PanelDemo.svelte` / `create-panel-demo.ts` harness over
  bespoke shell imitations. Keep placement differences in the workspace layout
  state so the story exercises the same view registration, imperative mount,
  grouping, and surface styling paths as the application.
- Autodocs MUST declare the real exported panel component, not `PanelDemo`, as
  `meta.component`. Keep harness-only panel kind and layout selection fixed in
  story `render` functions or parameters rather than args. The Controls and
  Properties tables must show only real component inputs; disable controls for
  injected object inputs such as `app`, and verify that `kind` / `layout` do not
  appear.
- Storybook-local intake components such as Tags MUST still declare the real
  fixture component and its genuine inputs. Their Docs source MUST use the
  actual co-located fixture import and clearly describe that package-boundary
  exception; never invent a public package export for documentation symmetry.
- Design-core's `WorkspaceViewHost` owns movable-panel surface paint through
  `--ui-workspace-view-background` and `--ui-workspace-view-foreground`. Panel
  roots and sticky chrome consume those resolved tokens: body, bottom-panel,
  grouped, mobile, floating, and standalone views use the white workspace
  surface; only ungrouped left/right sidebar views use panel paint. Keep Lapis
  view containers transparent. Do not add `data-workspace-surface` ancestry
  selectors, grouped resets, runtime leaf-parent inspection, cached placement,
  or placement props to a panel. An exceptional panel may override the view
  tokens on its own root only for component-specific paint.
- Render app-backed panel stories in isolated Autodocs iframes
  (`parameters.docs.story.inline: false`) at an explicit `700px` Docs height.
  Scope the canvas with `panel-demo-docs-canvas` and remove Storybook's shell
  padding with `.panel-demo-docs-canvas .docs-story .sb-story { padding: 0; }`
  so the real shell reaches the preview edges. Inline Autodocs stories share
  `globalThis.app`, so simultaneous examples can steal imperative views and no
  longer reflect their declared placements.
- Give every placement story its own explicit `parameters.docs.source` entry.
  Derive colocated example strings from the same workspace layout builder or
  canonical fixture used by the story, show public Lapis imports plus the real
  placement state, and assert distinguishing layout markers in the play. Never
  let Show Code fall back to `<PanelDemo …>` or another story-only harness.
- Each play function waits for the demo's explicit ready state, asserts one
  panel instance, the expected design-core destination host, and its nested
  `WorkspaceViewHost`. Verify that the view host resolves the white workspace
  paint for body, bottom, and grouped placement or panel paint for an ungrouped
  left/right sidebar, then assert the panel root and sticky chrome match that
  host. Exercise the panel's defining interaction; grouped stories also assert
  their real group control or chrome. For document-independent panel stories,
  assert that no
  unrelated Markdown view is mounted.
- New placement stories carry a literal `visual-pending` tag and an independent
  nested-import baseline path. Keep the Storybook catalog, mapped `spec/src/`
  requirements and verification entries, and `MIGRATION.md` progress in sync;
  do not approve or refresh visual baselines without human review. When the
  user explicitly excludes visual testing from a slice, declare the future
  independent paths and record capture as pending without generating or
  updating PNGs.

### Problems and diagnostic contributions

- Reusable diagnostic data, collection lifecycle, filtering, grouping, and the
  movable Problems presentation belong to
  `@lapismd/design-core/workspace/problems`. Lapis code adapts that public
  contract and must not fork the panel or place vault/editor types in Design
  Core.
- Design Core owns the transient Problems tree/table state and the table's
  shared shadcn Scroll Area. Consumers may choose an initial view mode but must
  not fork the columns, add a native panel scrollbar, or persist presentation
  state in workspace layout.
- Ephemeral Problems totals belong in Design Core's structured workspace view
  badge. Keep the persisted leaf title stable, render the badge through the
  shared leaf label on every surface, and do not duplicate the total inside the
  Problems toolbar or interpolate it into a stored title.
- Diagnostic hover cards MUST pin their originating diagnostic and placement
  while the pointer crosses the safe handoff corridor into interactive card
  controls. Do not retarget or reposition an open card from incidental editor
  mouse movement; cover the line-11 path to the far-right copy control in the
  real workspace pointer test.
- Keep the `View Problem` expansion inside the API editor styling boundary. Its
  pointer, warning accent, header/body separation, metadata, and close control
  use native editor CSS plus public workspace tokens; do not rely on an app-level
  Tailwind stylesheet to make the inline widget legible. `View Problem` must
  dismiss and clear its originating hover card before the inline surface opens;
  closing that surface must leave later diagnostic hovers operational. Cover
  the complete open/close/re-hover lifecycle in the real workspace pointer test.
- Lapis and community plugins create diagnostics through
  `Plugin.createDiagnosticCollection()`. Keep diagnostics serializable and put
  navigation, mutation, and quick-fix callbacks in the workspace adapter or
  collection `buildItemMenu` hook, never on diagnostic objects.
- A Problems quick fix for an open resource must update the CodeMirror document
  and vault before refreshing diagnostics. Story acceptance must finish with
  the gutter and Problems collection reporting the same issues.
- Language-service diagnostics cover open documents only. Reuse the shared
  request and code-action cache for the editor gutter and Problems panel; do not
  add a vault scan or let Markdownlint own workspace presentation.
- Read `spec/src/workspace-shell/panels/problems.md` before changing the API
  diagnostics bridge, language-service packages, Markdownlint, or Problems
  acceptance.

## Development Workflow

- The worktree may contain user changes. Do not revert unrelated edits.
- If the `jj` binary is available, use the `jj-jujutsu` skill and Jujutsu for
  version-control inspection, diffs, and commits instead of Git.
- After each verified change, run `jj commit` with a PR-quality message that
  explains what changed, why it changed, and the validation that passed. Keep the
  message descriptive enough for review context rather than using a terse label.
  When `jj` is unavailable, use Git with the same message quality.
- Keep changes scoped to the package or surface needed for the request. Do not
  add broad refactors or metadata churn unless required to complete the task.

## Tooling

- Use Turbo (`pnpm check`, `pnpm build`, `pnpm test`). Root `pnpm check` runs
  `spec:validate` before `check:no-tailwind`; root `pnpm test` runs `spec:test`
  before package tests. `pnpm spec:check` runs both validator lanes before
  mdBook and spec-first checks. Do **not** reintroduce multi-script first-party
  import-resolution gates from the full lapis-notes repo. Fix resolution issues
  inline when adding packages.
- Storybook is the browsable docs host (`pnpm dev` / port **7010**). Use
  `pnpm storybook:stop` / `pnpm storybook:restart` for the same checkout-owned
  supervisor lane as design-core (override with `STORYBOOK_PORT` or
  `.env.storybook.local`).
- Interaction + a11y: `pnpm test:storybook` (axe must fail on violations via
  `parameters.a11y.test: "error"`). Visual Delta: `pnpm test:visual` /
  `pnpm test:visual:update` (Playwright **1.61.1** for Docker capture parity).

## Verification

- Every workspace package exposes `check`, `build`, and `test`.
- For cross-cutting work: `pnpm check` (includes no-Tailwind gate), focused
  package tests, and `pnpm spec:check` when governance or protected surfaces
  change.
- For api-used UI changes: also `pnpm test:storybook` and Visual Delta as above.
