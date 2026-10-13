# Architecture / Editor integration

## LN-ARCH-010 — Runnable editor demo: keep demo bootstrap and source-editor policy in

<a id="ln-arch-010"></a>

**Requirement.** The runnable editor demo MUST keep demo bootstrap and source-editor policy in Storybook fixtures while reusable runtime contracts remain in API, reusable File Explorer remains in `@lapis-notes/file-explorer`, Markdown owns Tags, and generic startup presentation remains in Design Core. Design Core MUST own current, reveal-or-create, and forced-new-tab Explorer intents while Lapis maps them to workspace leaves.

## LN-ARCH-020 — Api source-editor shell: expose the configured CodeMirror fold gutter

<a id="ln-arch-020"></a>

**Requirement.** The api source-editor shell MUST expose the configured CodeMirror fold gutter for language-provided fold ranges outside Markdown. Markdown MUST use Mira's inline fold controls without also painting the generic gutter.

## LN-ARCH-021 — Source editor's design-core ScrollArea: remain bounded by its workspace view

<a id="ln-arch-021"></a>

**Requirement.** The source editor's design-core ScrollArea MUST remain bounded by its workspace view and own vertical document scrolling. Nested CodeMirror scrollers MUST expand with content and MUST NOT paint a second vertical scrollbar. Its scrollbar interaction rail MUST remain pointer-reachable above an adjacent workspace resize rail.

## LN-ARCH-026 — API editor: consume diagnostic glyphs and semantic colours

<a id="ln-arch-026"></a>

**Requirement.** The API editor MUST consume diagnostic glyphs and semantic colours from Design Core's public workspace contract. It MUST keep CodeMirror-specific marker mounting, tooltip geometry, and pointer lifecycle inside the editor boundary. An open diagnostic card MUST retain its origin and placement throughout pointer handoff.

## LN-ARCH-027 — API editor: own CodeMirror inline-problem structure and styling. It

<a id="ln-arch-027"></a>

**Requirement.** The API editor MUST own CodeMirror inline-problem structure and styling. It MUST consume public workspace semantic tokens without moving editor-specific widgets into Design Core or application-global styles.

## LN-ARCH-033 — @lapis-notes/search: keep indexing and query execution behind API

<a id="ln-arch-033"></a>

**Requirement.** `@lapis-notes/search` MUST keep indexing and query execution behind API contracts while composing its grouped tree, settings, facets, badges, and overlays from public Design Core exports. Markdown panels MAY invoke Search only through commands.

## LN-ARCH-039 — Roles: own the ported legacy Applications page presentation

<a id="ln-arch-039"></a>

**Requirement.** Roles MUST own the ported legacy Applications page presentation and adapt only domain, vault, navigation, and Markdown/editor boundaries to Lapis APIs. Design Core remains the source of shared controls and Lapis remains the source of the outer workspace shell; neither boundary may recompose the ticket board, activity timeline, actions board, or `detail-perma` role sheet into a visually different page.

## LN-ARCH-053 — Bases: own advanced-filter draft validation inside its query

<a id="ln-arch-053"></a>

**Requirement.** Bases MUST own advanced-filter draft validation inside its query workflow. CodeMirror presents and describes the draft's accessible invalid state, while only a valid expression may cross into the applied document filter; API and Design Core contracts remain unchanged.

## LN-ARCH-065 — API: own plugin-scoped Markdown extension and file-surface registries

<a id="ln-arch-065"></a>

**Requirement.** API MUST own plugin-scoped Markdown extension and file-surface registries. Domain plugins MAY contribute CodeMirror and rendered-Markdown behavior through public contracts, while the bundled Markdown plugin remains the sole Mira adapter and full-file surface provider. Contributions and providers MUST be disposed with their registering plugin.

## LN-ARCH-080 — Graph: cross the AppDatabase boundary through bounded metadata

<a id="ln-arch-080"></a>

**Requirement.** Graph MUST cross the AppDatabase boundary through bounded metadata and link batches. Graph view failures remain locally visible and MUST also enter an owner-scoped Problems collection as active-file or workspace diagnostics; successful recovery clears them without transferring Graph lifecycle ownership to the shell.

## LN-ARCH-082 — Design Core: own the reusable structured-query input, completion presentation

<a id="ln-arch-082"></a>

**Requirement.** Design Core MUST own the reusable structured-query input, completion presentation, colour popover, and sortable-row interaction. API MUST own the shared vault syntax/completion model. Graph MUST depend only on those public contracts, AppDatabase path-only membership, and the public Markdown read-only embed while retaining viewport-clamped settings-panel composition with guttered handles, divider-free idle rows, rounded whole-row focus paint with an outer trailing gap, and visible padding-owned row actions with an internal trailing gutter; it MUST NOT import Search-plugin internals or duplicate Markdown rendering.

## LN-ARCH-086 — AI: own the read-only .jsonl file association because

<a id="ln-arch-086"></a>

**Requirement.** AI MUST own the read-only `.jsonl` file association because it owns the portable transcript and agent record schemas. The view MUST cross only public API file-view, Design Core chat, and Markdown embed boundaries; it MUST NOT transfer append-only persistence authority to workspace presentation, add a file command, or make Source Editor interpret AI records.

## LN-ARCH-088 — Workspace-owned plugin management: compose public Design Core SearchFilterBar, FilterCommandPicker, Resizable

<a id="ln-arch-088"></a>

**Requirement.** Workspace-owned plugin management MAY compose public Design Core SearchFilterBar, FilterCommandPicker, Resizable, and settings navigation primitives. Registry state, verified Markdown, filtering, installation actions, and application policy MUST remain in Lapis; reusable search, command-option, resizing, and responsive settings-shell behavior MUST remain in Design Core.
