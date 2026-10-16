# Storybook Catalog / Context

Storybook resolves extracted first-party plugins, including
`@lapis-notes/spellcheck`, through their installed npm package exports.
The editor-demo catalog gives Reading outline geometry its own focused,
`visual-pending` story so viewport placement and scroll behavior do not depend
on the broader Markdown Authoring interaction sequence.
Workspace Plugin Management keeps its structured Browse detail fixture
self-contained so Overview, Changelog, Versions, platform badges, summary
links, and responsive Design Core Scroll Areas can be reviewed from one story.
The Chromium interaction project runs four deterministic shards in sequence and
runs story files serially inside each shard. Recycling Chromium between shards
bounds retained App/database resources. App-backed files share browser-level
compatibility, overlay, and worker resources only inside one shard, while plays
inside each file retain their normal ordered functional and axe assertions.

The governed Tags, All Properties, Backlinks, Outgoing Links, Search, Graph,
Local Graph, and Bases
families start from persisted indexed data and include visible async-query
failure/recovery acceptance. Their changed stories remain `visual-pending` and
capture may produce review artifacts, but this implementation does not approve
new baselines.

The application-tool story family uses deterministic transcript seeds and an
inert resumable runtime to keep approval cards pending without starting an
agent. Seeded read and write cards use the OpenClaw-named `read` and `edit`
tools. The community-tool shell story mutates the real AI settings contract and
verifies Search, Markdown `notes_list`, and API file-tool enablement plus the
disabled and newly enabled community-tool states.

The Specification sidebar follows SUMMARY order, including Deno Desktop Host,
Deno Desktop Parity Blockers, Web Host, and Deno Server Host in their canonical
positions. Those pages are metadata-only raw-import mirrors.

## Show Code source contract

- Production desktop and web hosts continue to register external Roles in their owned runtime order, but Lapis Storybook does not import that package.

- Focused Bases stories remain responsible for the governed public-surface and workflow scenarios rather than copying package source.

- The focused Bases view family boots that optional bundled plugin and shares one Projects seed across table, editable-cell, cards, grouped list, map fallback, and unknown-view scenarios.

- Its editable table verifies opaque controls, centered 1rem checkboxes, white on-accent glyphs, wrapped tag and multivalue rows, metadata suggestions, a full-height bottom-edge shadcn Scroll Area, legacy filter-popover geometry, start-position disclosure indicators, and aligned row and column geometry through live resizing and scrolling.

- The workflow family exercises query, filter, sort, grouping, limit, schema, formula, summary, visibility, view-management, layout, typed-editing, new-file, CSV, and every public custom-option contract.

- The real-App family exercises the file association in source and preview, read-only Markdown embeds, invalid YAML cleanup, and managed disable/restore without mutating the Bases document.

Show Code documents consumer integration, not Storybook implementation:

- Import a public component from its package boundary.
- Include the real props, state, composition, or persisted layout that produces
  the scenario.
- Replace automatic extraction with explicit `parameters.docs.source` when the
  story renders through a demo component, harness, decorator, or fixture.
- Keep nontrivial example strings beside the story and derive them from the same
  canonical data or layout builder.
- For an intentional Storybook-local component, show its real co-located import
  and state why no public package import exists.

`pnpm spec:validate` statically checks repository and authorized package-local
Autodocs stories that render through local demo, harness, or fixture
boundaries. Those stories must resolve an explicit source object with code,
language, and fixed `type: "code"` fields; acceptance-only stories tagged
`!autodocs` are outside this documentation gate.

## API verification families

Direct api imports (one story family each):

- `button`, `input`, `textarea`, `switch`, `slider`, `progress`
- `select`, `search`, `tooltip`, `popover`, `command`
- `dropdown-menu`, `context-menu`, `drawer`
- `modal`, `confirm-dialog`, `date-setting` (`@lapismd/design-core/forms` DatePicker/TimePicker)
- `scroll-area`, `table`, `toggle-group`
- `sidebar-custom`, `table-dnd`
- `helpers` (`cn` / `fuzzySearch`) — interaction-only, `skip-visual`

- The `Plugins/AI/Chat` attach play asserts a Command View host inside the paperclip popover, visible border and shadow, and stacking above an open composer drawer.

- The same Fake chat family includes a `skip-visual` automatic-memory-recall scenario.

- Its play enables recall, submits one turn, and proves a typed recall block reached the Fake session exactly once while the visible and durable user prompt remains authored text only.

- Memory maintenance and review surfaces stay unit- and command-covered until their visual review UI is promoted to a governed catalog family.

- The `Plugins/AI/Shell` Local Conversations play opens the composer overflow menu, asserts Archive Chat, Delete Chat, and New Chat, checks those labels are not clipped, and matches their font size to the model menu (LN-AI-109, LN-AI-123).

- It waits for menu teardown to restore pointer interaction before opening the History options, then verifies archive, restore, delete, and new-chat behavior (LN-CAT-071).

The structured plugin-panel catalog covers Explorer, Search, History, AI Chat, AI
History, AI Catalog, and the six Markdown command views. History compare stories assert
`History` plus parent-path header breadcrumbs and that History opens or reveals
the History panel. `Plugins/History/Shell` provides Desktop and Mobile full-app
stories with Explorer on the left, a multi-section Welcome compare in the
main area, and Search retained on the collapsed right. The Desktop play
opens Settings and proves the History exclude/include configuration. Every mapped story renders the
same registered view once in Middle Top Tabs, Stacked Tabs, both sidebars, a
real bottom-panel group, and a real sidebar group; new or changed captures stay
`visual-pending` until reviewed.

## Tooling

- Interaction + a11y tests: `pnpm test:storybook` (axe via addon-a11y; `a11y.test: "error"`)
- No-Tailwind sources: `pnpm check:no-tailwind` (component trees; stories excluded)
- Visual baselines: `pnpm build-storybook` then `pnpm test:visual:update` (generates nested-import baselines under `tests/visual/storybook.spec.ts-snapshots/stories/`)
- Visual regression: `pnpm test:visual`
- Workspace shell stories use the same interaction, a11y, and nested-import
  Visual Delta workflow as API stories and remain `visual-pending` until review.
- Editor-demo catalog entries identify the Ready, MarkdownProblems,
  MarkdownLintLoftBoarding, SameFileSplitSync, MarkdownFrontmatter,
  ExplorerMutations, EditorSettings, LoadingPlugins, MarkdownAuthoring,
  StartupFailure, and ExplorerOpeningVault stories individually so focused
  visual updates do not rewrite existing shell baselines. The loft-boarding
  Markdownlint story keeps literal `visual-pending` metadata without a
  captured baseline. MarkdownAuthoring uses the real in-memory app and editor stack,
  consumer-oriented Show Code, literal `visual-pending` metadata, and a future
  baseline path while its pointer test performs real block dragging.
- The bottom-panel/settings story keeps the Workspace settings page open in its
  final state so panel alignment and controller-backed settings are visible.
- Shell story views remain API-registered imperative Lapis views; their
  story-only body title responds to the live inline-title appearance setting so
  settings are demonstrated through the same view-host bridge as consumers.
- The visual helpers stage the sibling design-core and Visual Delta checkouts
  inside the Docker context for both compare and update runs. They exclude
  documented nonvisual stories, and the update helper accepts repeatable
  story-prefix filters; its defaults select API and workspace stories without
  rewriting unrelated baselines.
  App rebuild-vault-cache and rebuild-generated-state, plus web vault copy
  progress, stay on the notifications or startup-detail surfaces and do not add
  catalog stories (LN-PKG-097, LN-PKG-098, LN-WEB-042, LN-WEB-043).

Vite and Storybook hosts reuse the public Community Turso build integration in
client and worker graphs. This preserves the prebuilt WASM graph and avoids
recursive parsing without replacing the database implementation.

The shared dependency-optimization list also prebundles the installed Community
cryptography and Nostr leaves, plus the API file-tool kernel. Cold app-backed
stories must not discover these dependencies midway through a test and reload
the browser. This uses published exports without source aliases.

For LN-CAT-099, cold packed-registry acceptance prebundles the public Community schema, direct Nostr leaves and the accessibility runtime before stories start. The `LapisEditorDemo` Ready story and the complete interaction lane verify that dependency discovery does not invalidate an in-flight accessibility import.

Storybook consumes the API-owned Turso build helper under LN-PKG-151 and has no Community dependency for static plugin acceptance.

Plugin category and status icons, plus the directory's icon-only Clear all
action, participate in the direct Lucide prebundle contract (LN-CAT-033). The
responsive Plugins stories exercise real workspace sidebar resizing, mobile
filter-panel navigation, category counts and tooltip accessibility.

The app-owned Plugins browser is covered under `Workspace/Plugins`, including all six movable placements, homepage/category/detail navigation, verified action feedback, narrow layouts, and keyboard/accessibility acceptance. Stories remain `visual-pending`.

For LN-CAT-099, verified-image failure presentation prebundles the exact
`@lucide/svelte/icons/image-off` import before cold stories run. Late icon
discovery must not reload the optimizer and invalidate an active Axe import.

### Design Core 0.4.0 retained consumer acceptance

Notes retains public-package AI, Bases and Graph acceptance independently from
the source plugin catalog. Their opening-overlay and post-focus pointer checks
wait for the expected visible geometry without relaxing tolerances. Bases
accessibility qualification must use its published picker repair; the consumer
must not patch installed source or suppress the open-picker violations.

Retained AI shell plays also wait for menu closure to release pointer handling
before Settings, folder-scope and history actions. They retain the native
animations and normal userEvent pointer guards.
