# Lapis Editor Demo / Editor scenarios / Part 1

LN-EXP-014 covers custom file artwork through the actual App and Explorer,
including plugin enable/disable, opening and rename. Editor-demo cold acceptance
retains its existing scenarios. The shared dependency optimizer includes API's
actual `zod/v3` entry so schema loading cannot reload an active browser test.

The desktop catalog's current dependency intake accepts Design Core 0.5.1
alongside 0.4 through public prepared archives. Its manual presentation review
does not qualify deferred source, interaction or native acceptance.

The reusable Explorer retains existing menu components while LN-EXP-009 makes
native/copy feedback explicitly App-owned. Unavailable clipboard support reports
failure through the existing notice owner instead of claiming success.

The Design Core dependency refresh consumes released `0.4.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

## LN-ED-001 — @lapis-notes/api: export a complete non-persistent MemoryVaultAdapter for deterministic

<a id="ln-ed-001"></a>

**Requirement.** `@lapis-notes/api` MUST export a complete non-persistent `MemoryVaultAdapter` for deterministic tests, Storybook demos, and consumers that explicitly choose volatile storage.

## LN-ED-002 — Public source-text file view

<a id="ln-ed-002"></a>

**Requirement.** `@lapis-notes/api` MUST export a concrete source-text file view which mounts the existing accessibly named CodeMirror editor without defining Markdown rendering policy.

## LN-ED-003 — Editor demo: register the production @lapis-notes/source-editor views for text

<a id="ln-ed-003"></a>

**Requirement.** The editor demo MUST register the production `@lapis-notes/source-editor` views for text (`txt`, `text`) and JSON (`json`, `data`); Markdown associations MUST be owned by `@lapis-notes/markdown` when that plugin is enabled.

## LN-ED-004 — While only the source-editor demo plugin is: remain source-only. When @lapis-notes/markdown is enabled it

<a id="ln-ed-004"></a>

**Requirement.** While only the source-editor demo plugin is enabled, Markdown MUST remain source-only. When `@lapis-notes/markdown` is enabled it MUST own Markdown with Mira `source`, `live-preview`, and `preview` modes.

## LN-ED-005 — API-owned design-core settings controller: load and save through API configuration atomically

<a id="ln-ed-005"></a>

**Requirement.** The API-owned design-core settings controller MUST load and save through API configuration atomically, preserve unrelated configuration, and avoid controller/configuration feedback loops.

## LN-ED-006 — Editor-view registry projection

<a id="ln-ed-006"></a>

**Requirement.** API editor-view contributions MUST be mirrored into the API-owned design-core registry so editor-association settings use live registered views.

## LN-ED-007 — Demo: adapt Design Core Explorer to the API

<a id="ln-ed-007"></a>

**Requirement.** The demo MUST adapt Design Core Explorer to the API vault for listing, active-file selection, create, open, rename, move, delete, persisted auto-reveal, and persisted show-hidden files. Dotted names MUST stay hidden unless that setting is on. The left-sidebar Explorer play MUST persist the toolbar toggle to `.lapis/app.json` and reveal `.env` and `.lapis`.

## LN-ED-008 — Empty landing view: expose functional Create note and Go

<a id="ln-ed-008"></a>

**Requirement.** The empty landing view MUST expose functional Create note and Go to file actions. Go to file MUST open the Design Core palette on the Files tab with its bounded starter files. Close MUST use the design-core leaf action.

The production Explorer's create/open continuation uses the owning App's file
operation admission on conditional hosts. The demo consumes that same public
component; it does not implement a second creation or persistence path.

## LN-ED-009 — Startup: report real vault, configuration, required-plugin, and layout

<a id="ln-ed-009"></a>

**Requirement.** Startup MUST report real vault, configuration, required-plugin, and layout tasks and present required-plugin failure. Retry and story teardown MUST synchronously destroy retained editors before asynchronous runtime disposal so HMR cannot retain editor-owned portals.

## LN-ED-010 — Two CodeMirror views for the same file: synchronize transactions immediately and persist one debounced

<a id="ln-ed-010"></a>

**Requirement.** Two CodeMirror views for the same file MUST synchronize transactions immediately and persist one debounced target-file update; different files MUST remain independent.

## LN-ED-011 — Storybook: provide one runnable demo plus focused source-editor

<a id="ln-ed-011"></a>

**Requirement.** Storybook MUST provide one runnable demo plus focused source-editor, Explorer, settings, loading, failure, and opening-vault scenarios from one canonical in-memory seed. Every full-shell Autodocs story in this family MUST use the shared LN-WS-013 isolated 700px padding-free shell viewport, and the authored MDX MUST identify every scenario and render its canonical story description before its canvas.

## LN-ED-012 — New or touched component paint: use design-core composition, native CSS, public --ui-\*

<a id="ln-ed-012"></a>

**Requirement.** New or touched component paint MUST use design-core composition, native CSS, public `--ui-*` tokens, and semantic `data-ui-*` hosts without Tailwind utility strings.

## LN-ED-013 — Default source editor shell: compose @lapismd/mira base CodeMirror extensions

<a id="ln-ed-013"></a>

**Requirement.** The default source editor shell MUST compose `@lapismd/mira` base CodeMirror extensions with the Obsidian theme through the linked package's built public exports, without a Storybook or Vite source alias. Source-editor Markdown language packs remain source-only. Rich Mira surfaces MUST be provided only by `@lapis-notes/markdown` when that plugin is enabled.

## LN-ED-019 — Application-profile integration demo: register exactly Source Editor, Markdown, reusable File

<a id="ln-ed-019"></a>

**Requirement.** The application-profile integration demo MUST register exactly Source Editor, Markdown, reusable File Explorer, and Search in the same order as Web and Deno. Extracted plugin component and workspace stories MUST live in the sibling `lapis-plugins` Storybook; Lapis Notes MAY retain only framework and management integration fixtures.

Unchanged contract: File Explorer passes the selected file-view icon through published Design Core `getIcon`. `ExplorerControllerOptions` does not declare `iconResolver`.

## LN-ED-020 — Storybook: provide focused panel stories for All Properties

<a id="ln-ed-020"></a>

**Requirement.** Storybook MUST provide focused panel stories for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags, plus editor-demo integration coverage for Markdown modes and Markdown/Mira settings.

## LN-ED-021 — Focused Markdown panel: use Plugins/Markdown/Panels/&lt;Panel&gt; with the six movable surfaces

<a id="ln-ed-021"></a>

**Requirement.** Every focused Markdown panel MUST use `Plugins/Markdown/Panels/<Panel>` with the six movable surfaces defined by All Properties. Vault-wide panels omit the document; file-scoped panels retain one minimal active Markdown leaf.

## LN-ED-022 — API editor: support self-owned or ancestor-owned vertical scrolling: self-owned

<a id="ln-ed-022"></a>

**Requirement.** The API editor MUST support self-owned or ancestor-owned vertical scrolling: self-owned `ScrollArea` fills its workspace view for oversized source or Markdown documents, while ancestor-owned embedding MUST not mount an inner scroll host. CodeMirror MUST expand without another vertical scrollbar. Markdown's full editing wrapper MUST use self-owned scrolling. Focused Storybook acceptance MUST prove one long-document range and changed scroll position in top-tab and stacked-tab workspaces.

## LN-ED-023 — Focused Backlinks and Outgoing Links acceptance: verify constrained Design Core Hover Card behavior

<a id="ln-ed-023"></a>

**Requirement.** Focused Backlinks and Outgoing Links acceptance MUST verify constrained Design Core Hover Card behavior through the real mention trigger.

### Acceptance details

The constrained preview scenario verifies:

- The card uses the panel-specific 26rem width and contains the public app-bound `FileEmbed` and embedded Markdown surface, not duplicated preview markup or a synthetic guided wrapper.
- The complete mention row remains the native clickable and focusable trigger.
- Resizing the owning split proves owner-document placement, viewport containment, collision adaptation, and topmost hit testing across the adjacent editor.
- Pointer handoff into the preview beyond the 300ms close delay keeps its embedded content open and interactive.

## LN-ED-024 — Focused Outgoing Links middle-top-tabs acceptance: also hover the ordinary internal note link

<a id="ln-ed-024"></a>

**Requirement.** Focused Outgoing Links middle-top-tabs acceptance MUST also hover the ordinary internal note link rendered inside `Welcome.md`. Mira's portable preview content MUST be mounted under the trigger document body, retain its 28rem viewport-capped size and embedded Markdown content, cross the workspace split without clipping, and remain the topmost hit target where it overlaps the adjacent Outgoing Links pane.

## LN-ED-025 — Focused Outgoing Links middle-top-tabs acceptance: verify editable ordinary-link and panel-result previews

<a id="ln-ed-025"></a>

**Requirement.** Focused Outgoing Links middle-top-tabs acceptance MUST verify editable ordinary-link and panel-result previews through one persistence-safe scenario.

### Acceptance details

The editable-preview scenario verifies:

- Both the ordinary `Welcome.md` internal-link preview and a panel-result `FileEmbed` preview can edit and persist content.
- Each card remains portaled, viewport-contained, topmost, and interactive before and after entering toolbar-free live-preview CodeMirror.
- Escape flushes the latest buffer before returning to preview and closing the card.
- Hover departure and focus movement keep editing pinned, while outside pointer dismissal uses the persistence-safe exit.

## LN-ED-026 — Focused Outgoing Links acceptance: verify the shared minimal note-preview presentation: resolved

<a id="ln-ed-026"></a>

**Requirement.** Focused Outgoing Links acceptance MUST verify the shared minimal note-preview presentation: resolved ordinary and panel cards omit visible filename/path chrome, rendered Markdown retains disclosure-safe all-round padding, and editing adds a two-pixel focus-ring border. The panel card MUST omit the outer embed guide and expose only an accessible open-note action in a sticky top-right row that remains clear of scrolled content.

## LN-ED-027 — Focused Outgoing Links middle-top-tabs acceptance: verify theme and scrolling parity across ordinary

<a id="ln-ed-027"></a>

**Requirement.** Focused Outgoing Links middle-top-tabs acceptance MUST verify theme and scrolling parity across ordinary Mira and panel `FileEmbed` live-edit surfaces.

### Acceptance details

The live-edit parity scenario verifies:

- Both preview families resolve an effective `obsidian` theme whose focus color matches design-core's Lapis workspace focus token.
- Nested frontmatter widgets retain zero inline padding so preview-only inset does not move metadata away from the editor content column.
- The panel editor exposes vertical overflow through CodeMirror inside the preview viewport without an outer preview scrollbar.

## LN-ED-028 — All Properties: demonstrate its real panel without a visible

<a id="ln-ed-028"></a>

**Requirement.** All Properties MUST demonstrate its real panel without a visible Markdown leaf in middle top tabs, stacked tabs, both sidebars, a grouped bottom panel, and a sidebar group.

## LN-ED-029 — All Properties public Docs inputs

<a id="ln-ed-029"></a>

**Requirement.** All Properties Autodocs MUST expose only `app: App` and MUST NOT expose Storybook-only panel kind or layout inputs.

## LN-ED-030 — Movable-panel fixtures: inherit design-core's resolved workspace-view paint, assert

<a id="ln-ed-030"></a>

**Requirement.** Movable-panel fixtures MUST inherit design-core's resolved workspace-view paint, assert their destination and `WorkspaceViewHost`, and remain free of panel-owned placement detection.

## LN-ED-031 — Outline placement acceptance: cover expandable and leaf siblings across multiple

<a id="ln-ed-031"></a>

**Requirement.** Outline placement acceptance MUST cover expandable and leaf siblings across multiple levels, chevron-aligned guides, unpadded leaves, parent-aligned leaf labels, visible indentation, and a shared trailing row edge.

## LN-ED-032 — Tags placement acceptance: cover parent-aligned child-hash trailing edges, disclosure glyphs

<a id="ln-ed-032"></a>

**Requirement.** Tags placement acceptance MUST cover parent-aligned child-hash trailing edges, disclosure glyphs, depth alignment, muted hash paint, and the shared count edge.

## LN-ED-033 — File Properties acceptance: resize the owning split below Mira's 250px

<a id="ln-ed-033"></a>

**Requirement.** File Properties acceptance MUST resize the owning split below Mira's 250px breakpoint, restore it in all outcomes, and verify full-row stacking, label-aligned values, and no horizontal overflow. It MUST NOT constrain the component root or editor content directly.

## LN-ED-034 — Retirement of the dual-panel fixture

<a id="ln-ed-034"></a>

**Requirement.** The legacy dual-panel comparison fixture MUST NOT remain a Storybook authority.

## LN-ED-035 — Editor demo: include a focused Markdown Authoring story using

<a id="ln-ed-035"></a>

**Requirement.** The editor demo MUST include a focused Markdown Authoring story using the real in-memory app. Acceptance MUST cover selection formatting, slash insertion, block handles and pointer reordering, Live Preview heading controls, table editing, completion, smart paste, image attachment, truthful toolbar defaults, and opt-in Doodle Dividers.

## LN-ED-036 — WorkspaceEmpty landing-page content

<a id="ln-ed-036"></a>

**Requirement.** The editor demo landing view MUST identify `WorkspaceEmpty` as page content so its paint matches the owning body view and remains white in the default theme.

## LN-ED-037 — Explorer root and toolbar: consume design-core's resolved workspace-view foreground and background

<a id="ln-ed-037"></a>

**Requirement.** The Explorer root and toolbar MUST consume design-core's resolved workspace-view foreground and background tokens. Direct sidebars use panel paint; body, bottom, grouped, floating, mobile, and standalone placements use workspace paint without component-owned placement logic.

## LN-ED-038 — API workspace bridge: project each compatibility view action into design-core

<a id="ln-ed-038"></a>

**Requirement.** The API workspace bridge MUST project each compatibility view action into design-core `WorkspaceViewChrome`, preserving its stable identity, label, icon, disabled state, event, and callback.

## LN-ED-039 — API workspace bridge: translate compatibility onPaneMenu contributions into the shared

<a id="ln-ed-039"></a>

**Requirement.** The API workspace bridge MUST translate compatibility `onPaneMenu` contributions into the shared design-core pane menu, preserving sections, separators, nested menus, labels, icons, checked and disabled states, and callbacks.

## LN-ED-040 — API workspace bridge: place translated compatibility pane-menu contributions before design-core's

<a id="ln-ed-040"></a>

**Requirement.** The API workspace bridge MUST place translated compatibility pane-menu contributions before design-core's generic pane actions while preserving their internal section order.

## LN-ED-041 — Focused Markdown Authoring acceptance: prove borderless Reading paint, inherited Design Core

<a id="ln-ed-041"></a>

**Requirement.** Focused Markdown Authoring acceptance MUST prove borderless Reading paint, inherited Design Core preview scrolling, View-first menu order, toolbar toggling, and persisted toolbar-driven editor settings.

## LN-ED-042 — Real Editor Settings story: show separate Markdown and Features sections, toggle

<a id="ln-ed-042"></a>

**Requirement.** The real Editor Settings story MUST show separate Markdown and Features sections, toggle a representative feature, and verify its existing dotted key in `.lapis/app.json`. It MUST verify that no `markdown.mira.features` group object is persisted. Optional-divider acceptance MUST wait for persisted enablement and reveal the divider in the editor viewport before checking its rendered SVG.

## LN-ED-043 — Runnable editor demo: register Markdownlint after Markdown and open

<a id="ln-ed-043"></a>

**Requirement.** The runnable editor demo MUST register Markdownlint after Markdown and open the generic Problems view in the bottom dock for focused acceptance. Only currently open Markdown notes MUST contribute provider diagnostics.

## LN-ED-044 — Storybook and production desktop hosts: consume the same built @lapis-notes/file-explorer public package

<a id="ln-ed-044"></a>

**Requirement.** Storybook and production desktop hosts MUST consume the same built `@lapis-notes/file-explorer` public package boundary, and publishable consumers MUST use its npm semver range. Tags MUST come from `@lapis-notes/markdown`. Storybook MAY parameterize Explorer loading state, but MUST NOT retain duplicate plugin or view implementations.

## LN-ED-045 — Search panel stories: boot the reusable Search plugin against

<a id="ln-ed-045"></a>

**Requirement.** Search panel stories MUST boot the reusable Search plugin against the shared panel demo vault and database, rather than a static result fixture or a Storybook-only query implementation.

## LN-ED-046 — Ready editor story: open Ideas.markdown, close the last visible sidebar

<a id="ln-ed-046"></a>

**Requirement.** The Ready editor story MUST open `Ideas.markdown`, close the last visible sidebar through real shell controls, and verify that the workspace pane expands while the readable editor body stabilizes at 700px instead of shrinking. The story MUST restore the sidebar and close the note after acceptance.

## LN-ED-047 — Explorer file activation: consume Design Core's current, reveal-or-new-tab, and new-tab

<a id="ln-ed-047"></a>

**Requirement.** Explorer file activation MUST consume Design Core's current, reveal-or-new-tab, and new-tab intents to distinguish single-click reuse, double-click reuse-or-create, and Command-click forced creation in the Lapis workspace adapter.

### Acceptance details

Focused Explorer acceptance verifies:

- Single-clicking a file MUST reveal and activate the first existing tab showing that file; when none exists, it MUST open the file in the current tab instead of creating another tab.
- Double-clicking a file MUST reveal and activate the first existing tab showing that file; when none exists, it MUST create and reveal a new tab without replacing the current tab.
- Command-clicking a file MUST always create and reveal a new tab without checking whether another tab already shows that file.

## LN-ED-048 — Editor settings schema: expose persisted editor.alwaysFocusNewTabs as a Boolean defaulting

<a id="ln-ed-048"></a>

**Requirement.** The Editor settings schema MUST expose persisted `editor.alwaysFocusNewTabs` as a Boolean defaulting to `false`, and `WorkspaceShell` MUST map it reactively to Design Core's user-created-tab activation policy without changing explicit opens.

## LN-ED-049 — Rendered Editor setting: reuse its canonical schema title, default, constraints

<a id="ln-ed-049"></a>

**Requirement.** Every rendered Editor setting MUST reuse its canonical schema title, default, constraints, and concise description so the configuration contract and Settings UI cannot drift.

## LN-ED-050 — Public embedded editor surface

<a id="ln-ed-050"></a>

**Requirement.** `@lapis-notes/api/editor` MUST export a reusable embedded editor surface that composes registered view-type extensions, preserves the supplied editor and leaf lifecycle, and falls back to the API source shell when no rich provider is active.

## LN-ED-051 — API Editor instances: support host-owned persistence, expose a flushable pending-change

<a id="ln-ed-051"></a>

**Requirement.** API `Editor` instances MUST support host-owned persistence, expose a flushable pending-change lifecycle, and keep file identity separate from whether the editor writes directly to the vault.

## LN-ED-063 — Same-document extension refresh

<a id="ln-ed-063"></a>

**Requirement.** Updating an editor's extensions MUST preserve its current document, selection and Undo/Redo history. Refresh MUST retain active edit protection and pending persistence. Explicit document replacement retains its existing history-reset semantics.

## LN-ED-064 — Embedded extension reaction ownership

<a id="ln-ed-064"></a>

**Requirement.** Embedded extension reactions MUST observe their declared surface inputs and registered configuration/plugin changes. Applying resolved extensions MUST NOT subscribe those reactions to incidental editor protection or persistence state.

## LN-ED-052 — Serialized Markdown return targets

<a id="ln-ed-052"></a>

**Requirement.** The public Markdown view state MUST support a generic serialized return target so a domain file preview can delegate whole-file editing to the registered Markdown leaf without importing Markdown implementation internals.

Explorer deletion now follows the shared FileManager guard under LN-ARCH-145
and LN-EXP-008. The existing App owns writer protection, native IO failure and
retry; the view continues to use its existing action and notice presentation.

Owned failure notices follow LN-WS-096 in the existing shell notification UI;
the editor demo receives no separate notification component or persistence.

LN-PKG-178 and LN-PKG-179 add opt-in exclusive creation and source-owned new-file
intent. Existing low-level overwrite behavior and unsupported legacy hosts stay
explicit; Deno host source remains frozen. Admission spans creation projection.

The reusable Explorer now connects the existing external-file drop callback to App-owned FileManager creation under LN-EXP-010/011/012. The editor demo consumes this same public package and component. Native byte, failure, rendering and restart qualification remains separate from deferred complete Storybook/axe and web lanes.
