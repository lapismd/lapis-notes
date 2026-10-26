# Packages / Editor APIs

Native hosts select the optional [editor-intent lifecycle](../architecture/native-editor-intents.md)
through `AppStateProperties.nativeEditingIntents` or the admitted `VaultSession`.
The public `@lapis-notes/api/native-editing-intents` entry carries generated
transport DTOs and read-only saved-snapshot access. Existing generic writer
registrations add native input protection and saved-text authority when that
port is selected; ordinary browser writers retain their existing behavior.

LN-ARCH-137 and LN-ARCH-138 define guarded atomic `Editor.loadDocument` and
publication cancellation. Text file views use that boundary while independent
Mira and host flush/shutdown integration remain required for production Sync.

LN-ARCH-132 through LN-ARCH-135 connect API editor documents to the App-owned
registry and qualify protection, retained close-time saves and explicit external
writer barriers. Workspace navigation and application shutdown integration
remain necessary before production Sync selects the registry as its guard.

LN-ARCH-125 through LN-ARCH-128 define serialized saves, captured destinations,
guarded file refresh and workspace-wide Sync flushing. These API boundaries
preserve inactive buffers without transferring Mira persistence into the kernel.
LN-ARCH-129 through LN-ARCH-131 add `App.fileEditingSessions` for independent
file writers. The portable session contract has no dependency on Mira; production
Sync guard selection remains gated on complete writer integration.
API builds also compile public editing-session usage against emitted declarations
through `check:pack-types`; source-aliased Storybook alone does not prove the
handwritten App declaration consumed by installed plugins.

`EmbedRegistry` keeps one renderer per file extension and a separate declinable
Markdown embedder list. The first embedder that accepts a file owns that
full-file embed, and `Plugin.registerMarkdownEmbedder` removes its registration
on unload.

## LN-PKG-004 — Specification before new package intake

<a id="ln-pkg-004"></a>

**Requirement.** Notebook and remaining unlisted plugin packages MUST NOT be added until specified and tracked in `MIGRATION.md`. Production hosts are Deno desktop and web, and MAY include public `@lapismd/ai-host` and `@lapismd/terminal-host`. Authorized plugins are Source Editor, Markdown, Markdownlint, Spell Check, File Explorer, Bookmarks, Search, Graph, Bases, AI, History, Word Count, Roles, Tasks, Docs, Terminal, PDF, and CSV. PDF and CSV are specified in `lapis-plugins/spec/src/plugins/pdf/index.md` and `lapis-plugins/spec/src/plugins/csv/index.md`, and both stay in that repository.

## LN-PKG-011 — Development-only CodeMirror language dependencies

<a id="ln-pkg-011"></a>

**Requirement.** CodeMirror Markdown and JSON language packages used by Storybook intake plugins MUST remain root development dependencies rather than runtime dependencies of api or workspace.

## LN-PKG-013 — Inline filename-title styling

<a id="ln-pkg-013"></a>

**Requirement.** `@lapis-notes/api` MUST paint the source-editor inline filename title with public `--ui-editor-inline-title-*` tokens and MUST contribute file-view breadcrumbs, leaf history, and header title rename (`titleEditable` / `onTitleCommit`) through the workspace-host `getChrome` projection. Non-file views MAY contribute prefix crumbs and a breadcrumb file path through View hooks.

## LN-PKG-014 — Editor language metadata

<a id="ln-pkg-014"></a>

**Requirement.** `@lapis-notes/api` `markupEditor` MUST accept a language ID for `data-language` host attributes and default the editor face to Mira monospace with Markdown and text sans overrides.

## LN-PKG-048 — Readable editor column

<a id="ln-pkg-048"></a>

**Requirement.** `@lapis-notes/api` `markupEditor` MUST retain a 700px readable content column when its workspace pane is wide enough. Narrow panes MAY use the configured file margins, but closing either sidebar MUST NOT shrink the editor body.

## LN-PKG-059 — Public embedded editor and extension resolution

<a id="ln-pkg-059"></a>

**Requirement.** `@lapis-notes/api/editor` MUST export the embedded editor component and extension-resolution helpers used by separately versioned plugins. Its `scrollOwner` input MUST default to `self` and permit `ancestor` without mounting an inner Scroll Area. The export MUST remain usable when the bundled Markdown plugin is disabled.

## LN-PKG-060 — Public Markdown return-state contracts

<a id="ln-pkg-060"></a>

**Requirement.** `@lapis-notes/api` MUST export the Markdown view return-target and serialized-state types used by separately versioned domain plugins. The bundled Markdown package MUST consume that public state without adding a runtime dependency from the external plugin to Markdown implementation code.

## LN-PKG-067 — Portable autocomplete stylesheet

<a id="ln-pkg-067"></a>

**Requirement.** `@lapis-notes/ui/codemirror-autocomplete.css` MUST remain a native-CSS public stylesheet that consumes Design Core Popover and Command semantics without requiring a host Tailwind theme. Storybook, web, and desktop hosts MUST load it after the shared theme, while Bases MUST remain independent of `@lapis-notes/ui`.

## LN-PKG-018 — Public Mira-backed Markdown embeds

<a id="ln-pkg-018"></a>

**Requirement.** `@lapis-notes/markdown` MUST expose its reusable Mira-backed `FileEmbed`, `MarkdownEmbed`, and `NoteLink` surfaces through the root package and the narrow `@lapis-notes/markdown/embed` export.

## LN-PKG-021 — Mira theme inheritance in embeds

<a id="ln-pkg-021"></a>

**Requirement.** The Lapis `FileEmbed` wrapper and full-file Markdown surface MUST establish `data-mira-theme="obsidian"` for portable Mira descendants. Editable-card padding MUST target only the rendered preview branch of `EditableMarkdownPreview`; it MUST NOT match CodeMirror's nested rendered widgets or change live-edit frontmatter geometry. No new public component input is introduced.

## LN-PKG-023 — Configured CodeMirror fold gutter

<a id="ln-pkg-023"></a>

**Requirement.** `@lapis-notes/api` `markupEditor` MUST mount the configured CodeMirror fold gutter when language ranges and settings enable it. The Markdown integration MUST be able to suppress that gutter because Mira supplies inline fold controls.

## LN-PKG-024 — Editor ScrollArea containment

<a id="ln-pkg-024"></a>

**Requirement.** The API-owned editor ScrollArea MUST fill without exceeding its workspace view and own long-document scrolling. Its nested CodeMirror scroller MUST expand without a vertical scrollbar. The editor scrollbar MUST retain its complete pointer target above adjacent workspace resize rails.

## LN-PKG-027 — Specialist panel width containment

<a id="ln-pkg-027"></a>

**Requirement.** Specialist Markdown panel content MUST shrink to the complete available inline size and MUST NOT request two-axis panel scrolling to preserve a fixed internal width.

## LN-PKG-033 — Shared Boolean Settings presentation

<a id="ln-pkg-033"></a>

**Requirement.** `@lapis-notes/markdown` MUST render grouped Boolean Settings through design-core's public `WorkspaceSettingGroup` toggle-table contract. It MUST NOT introduce a package-local settings table or stored group value.

## LN-PKG-091 — Markdownlint worker document compatibility

<a id="ln-pkg-091"></a>

**Requirement.** The Markdownlint worker document shim MUST report `document.compatMode` as `CSS1Compat`. It MUST NOT leave the worker global in quirks mode when renderer libraries inspect that field.

## LN-PKG-035 — Independent Markdown Lint package ownership

<a id="ln-pkg-035"></a>

**Requirement.** `@lapis-notes/markdown-lint` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on the public API and language-service contracts without importing Design Core presentation.

## LN-PKG-036 — Interactive diagnostic hover cards

<a id="ln-pkg-036"></a>

**Requirement.** `@lapis-notes/api` MUST provide compact, interactive CodeMirror diagnostic hover cards and centered severity gutter markers. The card MUST remain stable while the pointer enters its controls. The implementation MUST consume public Design Core icons without importing Problems presentation internals.

## LN-PKG-082 — Unique diagnostic-action keys

<a id="ln-pkg-082"></a>

**Requirement.** `@lapis-notes/api` MUST render diagnostic hover-card actions with unique list keys even when titles repeat. The card MUST NOT throw when two actions share a name.

## LN-PKG-084 — CodeMirror measurement boundaries

<a id="ln-pkg-084"></a>

**Requirement.** `@lapis-notes/api` MUST NOT read CodeMirror editor layout from a diagnostic hover-card plugin during a view update. Tooltip positioning MUST run in the view measure cycle after the update completes.

## LN-PKG-088 — Diagnostic range and marker targeting

<a id="ln-pkg-088"></a>

**Requirement.** `@lapis-notes/api` lint hover MUST resolve a diagnostic from `.cm-lintRange` or `.cm-lint-marker` only. It MUST NOT open a card from a document-position hit on the same line.

## LN-PKG-121 — Shared Graph query and styling controls

<a id="ln-pkg-121"></a>

**Requirement.** `@lapis-notes/graph` MUST compose Design Core query, colour-picker, and sortable-row contracts inside its viewport-clamped compact settings panel with guttered handles, divider-free idle rows, rounded whole-row focus paint with an outer trailing gap, and visible padding-owned row actions with an internal trailing gutter; preserve the simplified `GraphGroupRule` export; and own delayed canvas emphasis, structured membership policy, preview orchestration, and chronological time-lapse. It MUST depend on the public Markdown embed for read-only note previews and MUST NOT add a direct dependency on `@lapis-notes/search`.

## LN-PKG-122 — Local Graph frontier batching

<a id="ln-pkg-122"></a>

**Requirement.** `@lapis-notes/graph` MUST own bind-safe Local Graph frontier batching and its build-failure diagnostic lifecycle through the public API Problems contract. It MUST retain the inline view error, clear recovered diagnostics, and avoid opening the Problems view as a side effect.

## LN-PKG-127 — Independent Source Editor ownership

<a id="ln-pkg-127"></a>

**Requirement.** `@lapis-notes/source-editor` MUST live in the sibling `lapis-plugins` monorepo and remain an enabled-by-default member of the Lapis Notes static profile. It MUST own the shared Editor settings plus text, JSON, and YAML source associations through API and Design Core public contracts, while Markdown associations remain owned by `@lapis-notes/markdown`.

## LN-PKG-128 — Read-only AI transcript file view

<a id="ln-pkg-128"></a>

**Requirement.** `@lapis-notes/ai` MUST own the `ai-jsonl` read-only file view and `.jsonl` default association. It MUST reuse API file-view registration, Design Core chat primitives, the public Markdown embed, and AI-owned durable record validation/projection without moving append-only transcript authority into the view or adding a Source Editor override.

## LN-PKG-037 — Inline View Problem styling

<a id="ln-pkg-037"></a>

**Requirement.** `@lapis-notes/api` MUST style the CodeMirror inline problem created by `View Problem` through the editor stylesheet and public workspace tokens. The widget MUST NOT depend on application-global utility CSS.

## LN-PKG-038 — View Problem hover dismissal

<a id="ln-pkg-038"></a>

**Requirement.** Executing `View Problem` MUST dismiss its originating hover card and clear the active diagnostic before rendering the inline problem. Closing the inline problem MUST leave later hover discovery operational.

## LN-PKG-076 — Public desktop-native bridge

<a id="ln-pkg-076"></a>

**Requirement.** `@lapis-notes/api/desktop-native` MUST expose the native bridge and capability contract without evaluating the Svelte component barrel. Node-side AI runtime adapters and real-host diagnostics MUST consume that narrow entry.

## LN-PKG-095 — Public Markdown dependency for AI embeds

<a id="ln-pkg-095"></a>

**Requirement.** `@lapis-notes/ai` MUST depend on `@lapis-notes/markdown` only for the public embed preview. It MUST NOT depend on `@lapismd/mira` or `@lapismd/mira-editor`. Chat styles MUST keep that embed preview surface transparent and MUST NOT nest a vertical scroller inside the bubble.

## LN-PKG-102 — Independent Docs plugin ownership

<a id="ln-pkg-102"></a>

**Requirement.** `@lapis-notes/lapis-plugin-docs` MUST live in the sibling `lapis-plugin-docs` repository, version independently, and expose `build`, `check`, and `test`. It owns Core Docs notes, books, cards, and FSRS review while delegating reusable leaf controls to Design Core and Markdown reading to Mira. Desktop and web hosts MUST NOT register it statically; when installed it MUST register its own views.
