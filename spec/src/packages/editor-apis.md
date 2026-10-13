# Packages / Editor APIs

## LN-PKG-004 — Notebook and remaining unlisted plugin packages: Do not be added until specified

<a id="ln-pkg-004"></a>

**Requirement.** Notebook and remaining unlisted plugin packages MUST NOT be added until specified and tracked in `MIGRATION.md`. The production hosts are Deno desktop and web. Authorized plugins are Source Editor, Markdown, Markdownlint, Spell Check, File Explorer, Bookmarks, Search, Graph, Bases, AI, History, Word Count, Roles, Tasks, Docs, and Terminal. Authorized host infrastructure MAY include public `@lapismd/ai-host` and `@lapismd/terminal-host`.

## LN-PKG-011 — CodeMirror Markdown and JSON language packages used: remain root development dependencies rather than runtime

<a id="ln-pkg-011"></a>

**Requirement.** CodeMirror Markdown and JSON language packages used by Storybook intake plugins MUST remain root development dependencies rather than runtime dependencies of api or workspace.

## LN-PKG-013 — @lapis-notes/api: paint the source-editor inline filename title

<a id="ln-pkg-013"></a>

**Requirement.** `@lapis-notes/api` MUST paint the source-editor inline filename title with public `--ui-editor-inline-title-*` tokens and MUST contribute file-view breadcrumbs, leaf history, and header title rename (`titleEditable` / `onTitleCommit`) through the workspace-host `getChrome` projection. Non-file views MAY contribute prefix crumbs and a breadcrumb file path through View hooks.

## LN-PKG-014 — @lapis-notes/api markupEditor: accept a language ID for data-language host

<a id="ln-pkg-014"></a>

**Requirement.** `@lapis-notes/api` `markupEditor` MUST accept a language ID for `data-language` host attributes and default the editor face to Mira monospace with Markdown and text sans overrides.

## LN-PKG-048 — @lapis-notes/api markupEditor: retain a 700px readable content column

<a id="ln-pkg-048"></a>

**Requirement.** `@lapis-notes/api` `markupEditor` MUST retain a 700px readable content column when its workspace pane is wide enough. Narrow panes MAY use the configured file margins, but closing either sidebar MUST NOT shrink the editor body.

## LN-PKG-059 — @lapis-notes/api/editor: export the embedded editor component and extension-resolution

<a id="ln-pkg-059"></a>

**Requirement.** `@lapis-notes/api/editor` MUST export the embedded editor component and extension-resolution helpers used by separately versioned plugins. Its `scrollOwner` input MUST default to `self` and permit `ancestor` without mounting an inner Scroll Area. The export MUST remain usable when the bundled Markdown plugin is disabled.

## LN-PKG-060 — @lapis-notes/api: export the Markdown view return-target and serialized-state

<a id="ln-pkg-060"></a>

**Requirement.** `@lapis-notes/api` MUST export the Markdown view return-target and serialized-state types used by separately versioned domain plugins. The bundled Markdown package MUST consume that public state without adding a runtime dependency from the external plugin to Markdown implementation code.

## LN-PKG-067 — @lapis-notes/ui/codemirror-autocomplete.css: remain a native-CSS public stylesheet that consumes

<a id="ln-pkg-067"></a>

**Requirement.** `@lapis-notes/ui/codemirror-autocomplete.css` MUST remain a native-CSS public stylesheet that consumes Design Core Popover and Command semantics without requiring a host Tailwind theme. Storybook, web, and desktop hosts MUST load it after the shared theme, while Bases MUST remain independent of `@lapis-notes/ui`.

## LN-PKG-018 — @lapis-notes/markdown: expose its reusable Mira-backed FileEmbed, MarkdownEmbed,

<a id="ln-pkg-018"></a>

**Requirement.** `@lapis-notes/markdown` MUST expose its reusable Mira-backed `FileEmbed`, `MarkdownEmbed`, and `NoteLink` surfaces through the root package and the narrow `@lapis-notes/markdown/embed` export.

## LN-PKG-021 — Lapis FileEmbed wrapper and full-file Markdown surface: establish data-mira-theme="obsidian" for portable Mira descendants. Editable-card

<a id="ln-pkg-021"></a>

**Requirement.** The Lapis `FileEmbed` wrapper and full-file Markdown surface MUST establish `data-mira-theme="obsidian"` for portable Mira descendants. Editable-card padding MUST target only the rendered preview branch of `EditableMarkdownPreview`; it MUST NOT match CodeMirror's nested rendered widgets or change live-edit frontmatter geometry. No new public component input is introduced.

## LN-PKG-023 — @lapis-notes/api markupEditor: mount the configured CodeMirror fold gutter

<a id="ln-pkg-023"></a>

**Requirement.** `@lapis-notes/api` `markupEditor` MUST mount the configured CodeMirror fold gutter when language ranges and settings enable it. The Markdown integration MUST be able to suppress that gutter because Mira supplies inline fold controls.

## LN-PKG-024 — API-owned editor ScrollArea: fill without exceeding its workspace view

<a id="ln-pkg-024"></a>

**Requirement.** The API-owned editor ScrollArea MUST fill without exceeding its workspace view and own long-document scrolling. Its nested CodeMirror scroller MUST expand without a vertical scrollbar. The editor scrollbar MUST retain its complete pointer target above adjacent workspace resize rails.

## LN-PKG-027 — Specialist Markdown panel content: shrink to the complete available inline size

<a id="ln-pkg-027"></a>

**Requirement.** Specialist Markdown panel content MUST shrink to the complete available inline size and MUST NOT request two-axis panel scrolling to preserve a fixed internal width.

## LN-PKG-033 — @lapis-notes/markdown: render grouped Boolean Settings through design-core's public

<a id="ln-pkg-033"></a>

**Requirement.** `@lapis-notes/markdown` MUST render grouped Boolean Settings through design-core's public `WorkspaceSettingGroup` toggle-table contract. It MUST NOT introduce a package-local settings table or stored group value.

## LN-PKG-091 — Markdownlint worker document shim: report document.compatMode as CSS1Compat. It MUST NOT

<a id="ln-pkg-091"></a>

**Requirement.** The Markdownlint worker document shim MUST report `document.compatMode` as `CSS1Compat`. It MUST NOT leave the worker global in quirks mode when renderer libraries inspect that field.

## LN-PKG-035 — @lapis-notes/markdown-lint: live in the sibling lapis-plugins monorepo as

<a id="ln-pkg-035"></a>

**Requirement.** `@lapis-notes/markdown-lint` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on the public API and language-service contracts without importing Design Core presentation.

## LN-PKG-036 — @lapis-notes/api: provide compact, interactive CodeMirror diagnostic hover cards

<a id="ln-pkg-036"></a>

**Requirement.** `@lapis-notes/api` MUST provide compact, interactive CodeMirror diagnostic hover cards and centered severity gutter markers. The card MUST remain stable while the pointer enters its controls. The implementation MUST consume public Design Core icons without importing Problems presentation internals.

## LN-PKG-082 — @lapis-notes/api: render diagnostic hover-card actions with unique list

<a id="ln-pkg-082"></a>

**Requirement.** `@lapis-notes/api` MUST render diagnostic hover-card actions with unique list keys even when titles repeat. The card MUST NOT throw when two actions share a name.

## LN-PKG-084 — @lapis-notes/api: Do not read CodeMirror editor layout

<a id="ln-pkg-084"></a>

**Requirement.** `@lapis-notes/api` MUST NOT read CodeMirror editor layout from a diagnostic hover-card plugin during a view update. Tooltip positioning MUST run in the view measure cycle after the update completes.

## LN-PKG-088 — @lapis-notes/api lint hover: resolve a diagnostic from .cm-lintRange or .cm-lint-marker

<a id="ln-pkg-088"></a>

**Requirement.** `@lapis-notes/api` lint hover MUST resolve a diagnostic from `.cm-lintRange` or `.cm-lint-marker` only. It MUST NOT open a card from a document-position hit on the same line.

## LN-PKG-121 — @lapis-notes/graph: compose Design Core query, colour-picker, and sortable-row

<a id="ln-pkg-121"></a>

**Requirement.** `@lapis-notes/graph` MUST compose Design Core query, colour-picker, and sortable-row contracts inside its viewport-clamped compact settings panel with guttered handles, divider-free idle rows, rounded whole-row focus paint with an outer trailing gap, and visible padding-owned row actions with an internal trailing gutter; preserve the simplified `GraphGroupRule` export; and own delayed canvas emphasis, structured membership policy, preview orchestration, and chronological time-lapse. It MUST depend on the public Markdown embed for read-only note previews and MUST NOT add a direct dependency on `@lapis-notes/search`.

## LN-PKG-122 — @lapis-notes/graph: own bind-safe Local Graph frontier batching

<a id="ln-pkg-122"></a>

**Requirement.** `@lapis-notes/graph` MUST own bind-safe Local Graph frontier batching and its build-failure diagnostic lifecycle through the public API Problems contract. It MUST retain the inline view error, clear recovered diagnostics, and avoid opening the Problems view as a side effect.

## LN-PKG-127 — @lapis-notes/source-editor: live in the sibling lapis-plugins monorepo

<a id="ln-pkg-127"></a>

**Requirement.** `@lapis-notes/source-editor` MUST live in the sibling `lapis-plugins` monorepo and remain an enabled-by-default member of the Lapis Notes static profile. It MUST own the shared Editor settings plus text, JSON, and YAML source associations through API and Design Core public contracts, while Markdown associations remain owned by `@lapis-notes/markdown`.

## LN-PKG-128 — @lapis-notes/ai: own the ai-jsonl read-only file view

<a id="ln-pkg-128"></a>

**Requirement.** `@lapis-notes/ai` MUST own the `ai-jsonl` read-only file view and `.jsonl` default association. It MUST reuse API file-view registration, Design Core chat primitives, the public Markdown embed, and AI-owned durable record validation/projection without moving append-only transcript authority into the view or adding a Source Editor override.

## LN-PKG-037 — @lapis-notes/api: style the CodeMirror inline problem created by

<a id="ln-pkg-037"></a>

**Requirement.** `@lapis-notes/api` MUST style the CodeMirror inline problem created by `View Problem` through the editor stylesheet and public workspace tokens. The widget MUST NOT depend on application-global utility CSS.

## LN-PKG-038 — Executing View Problem: dismiss its originating hover card and clear

<a id="ln-pkg-038"></a>

**Requirement.** Executing `View Problem` MUST dismiss its originating hover card and clear the active diagnostic before rendering the inline problem. Closing the inline problem MUST leave later hover discovery operational.

## LN-PKG-076 — @lapis-notes/api/desktop-native: expose the native bridge and capability contract

<a id="ln-pkg-076"></a>

**Requirement.** `@lapis-notes/api/desktop-native` MUST expose the native bridge and capability contract without evaluating the Svelte component barrel. Node-side AI runtime adapters and real-host diagnostics MUST consume that narrow entry.

## LN-PKG-095 — @lapis-notes/ai: depend on @lapis-notes/markdown only for the public

<a id="ln-pkg-095"></a>

**Requirement.** `@lapis-notes/ai` MUST depend on `@lapis-notes/markdown` only for the public embed preview. It MUST NOT depend on `@lapismd/mira` or `@lapismd/mira-editor`. Chat styles MUST keep that embed preview surface transparent and MUST NOT nest a vertical scroller inside the bubble.

## LN-PKG-102 — @lapis-notes/lapis-plugin-docs: live in the sibling lapis-plugin-docs repository, version

<a id="ln-pkg-102"></a>

**Requirement.** `@lapis-notes/lapis-plugin-docs` MUST live in the sibling `lapis-plugin-docs` repository, version independently, and expose `build`, `check`, and `test`. It owns Core Docs notes, books, cards, and FSRS review while delegating reusable leaf controls to Design Core and Markdown reading to Mira. Desktop and web hosts MUST NOT register it statically; when installed it MUST register its own views.
