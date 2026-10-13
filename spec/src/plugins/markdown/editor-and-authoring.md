# Markdown Plugin / Editor and authoring

## LN-MD-002 — @lapis-notes/markdown: register through the existing API Plugin surface

<a id="ln-md-002"></a>

**Requirement.** `@lapis-notes/markdown` MUST register through the existing API `Plugin` surface: `registerView`, `registerEditorView`, `registerExtensions`, `registerEditorExtension`, commands, and settings schema.

## LN-MD-003 — Authoritative Markdown plugin lifecycle

<a id="ln-md-003"></a>

**Requirement.** The Plugin triad (`plugin.ts`, `plugin-manager.ts`, and `lapis-extension.ts`) MUST remain authoritative. Markdown MUST NOT introduce parallel loader, override-stack, or settings-framework APIs.

## LN-MD-004 — Markdown document rendering: provided by published Mira packages

<a id="ln-md-004"></a>

**Requirement.** Markdown document rendering MUST be provided by published Mira packages through their built public exports, without consumer-owned source aliases or sibling-path assumptions. The full-repo local `richEditor` and `MarkdownPreview` stacks MUST NOT be retained.

## LN-MD-005 — When enabled, the Markdown plugin: own view type markdown with source, live-preview

<a id="ln-md-005"></a>

**Requirement.** When enabled, the Markdown plugin MUST own view type `markdown` with `source`, `live-preview`, and `preview` modes, View-menu mode toggles, and leaf-state mode persistence from full-repo behavior.

## LN-MD-006 — Lapis Path A (EditorConfig plus configuration updated): remain the extension-reload authority

<a id="ln-md-006"></a>

**Requirement.** Lapis Path A (`EditorConfig` plus configuration `updated`) and Path B (`registerEditorExtension`, `workspace.updateOptions`, and `editor.updateExtensions`) MUST remain the extension-reload authority.

## LN-MD-007 — Existing editor and workspace events

<a id="ln-md-007"></a>

**Requirement.** Existing editor and workspace events (`editor-updated`, Editor `change`, file-change listeners, `active-leaf-change`, `editor-menu`, and `file-open`) MUST remain wired; Mira MUST NOT replace them.

## LN-MD-009 — Markdown settings: expose Mira feature and Mira plugin toggles

<a id="ln-md-009"></a>

**Requirement.** Markdown settings MUST expose Mira feature and Mira plugin toggles, including Mermaid and AI, under a Markdown settings section through the existing configuration schema and settings-section APIs.

## LN-MD-010 — Markdown behavior and parity tracking

<a id="ln-md-010"></a>

**Requirement.** Living behavior, parity, and Storybook verification MUST be tracked with the Markdown package in the sibling `lapis-plugins` repository. Lapis Notes migration records MAY retain cutover evidence but MUST NOT become the plugin behavior authority.

## LN-MD-012 — Editor demo: register the source-editor plugin first, then @lapis-notes/markdown

<a id="ln-md-012"></a>

**Requirement.** The editor demo MUST register the source-editor plugin first, then `@lapis-notes/markdown` with Markdown associations enabled by default and exclusive priority, then Tags.

## LN-MD-025 — Markdown editor integration: compose Mira's public createMarkdownCodeMirrorExtensions source-decoration contract, not

<a id="ln-md-025"></a>

**Requirement.** The Markdown editor integration MUST compose Mira's public `createMarkdownCodeMirrorExtensions` source-decoration contract, not only its language parser.

## LN-MD-051 — Markdown body text: retain the Lapis sans face, but revealed

<a id="ln-md-051"></a>

**Requirement.** Markdown body text MAY retain the Lapis sans face, but revealed and source-mode frontmatter lines MUST resolve Mira's monospace token, using Source Code Pro under the Obsidian theme.

## LN-MD-053 — Embedded frontmatter spacing

<a id="ln-md-053"></a>

**Requirement.** API editor note-column spacing MUST NOT inset an embedded frontmatter preview. Its surface and disclosure chevron MUST share the Markdown content start.

## LN-MD-071 — Lapis Markdown editing: compose createMiraCodeMirrorExtensions with includeBaseExtensions: false inside

<a id="ln-md-071"></a>

**Requirement.** Lapis Markdown editing MUST compose `createMiraCodeMirrorExtensions` with `includeBaseExtensions: false` inside the API editor shell. The composed stack MUST retain Mira slash commands, command keymaps, parsing, tables, image handling, authoring helpers, rich editing, block controls, and extension contributions.

## LN-MD-072 — Markdown Mira settings: derive schema properties, Settings fields, labels,

<a id="ln-md-072"></a>

**Requirement.** Markdown Mira settings MUST derive schema properties, Settings fields, labels, and defaults from one typed descriptor list. Runtime resolution MUST use those declared defaults, and the superseded `markdown.mira.features.toolbar` value MUST remain unregistered and unread.

## LN-MD-073 — Selection tools, standard block handles with drag: default on. The contextual block-type toolbar

<a id="ln-md-073"></a>

**Requirement.** Selection tools, standard block handles with drag and keyboard movement, block context actions, slash commands, Live Preview heading controls, tables, images, completions, smart paste, and input handlers MUST default on. The contextual block-type toolbar and AI MUST default off.

## LN-MD-074 — Markdown.mira.editor.toolbar.enabled: default to false and control a public

<a id="ln-md-074"></a>

**Requirement.** `markdown.mira.editor.toolbar.enabled` MUST default to `false` and control a public Mira toolbar above the API `NoteEditor` only in Source and Live Preview. Its actions MUST delegate to the existing Lapis `Editor`, configuration, image picker, and mode lifecycle. The Lapis editing surface MUST remain borderless.

## LN-MD-075 — Doodle Dividers default and gate

<a id="ln-md-075"></a>

**Requirement.** `markdown.mira.editor.doodleDividers.enabled` MUST default to `false`. When enabled, Lapis MUST add Mira's public Doodle Dividers extension and its styles without recreating divider parsing, drawing, commands, or controls.

## LN-MD-076 — While editing, Markdown: contribute a book-open title-bar action for Reading

<a id="ln-md-076"></a>

**Requirement.** While editing, Markdown MUST contribute a `book-open` title-bar action for Reading view; while reading, it MUST contribute a `pencil` action for editing. A plain click switches the current leaf, while Mod+click opens the target mode in a right split.

## LN-MD-077 — Markdown's pane menu: expose Reading view, expose Source mode outside

<a id="ln-md-077"></a>

**Requirement.** Markdown's pane menu MUST expose Reading view, expose Source mode outside Reading view, persist mode changes, and append every registered `markdownViewMenuItems` provider contribution.

## LN-MD-078 — Mira Reading surface: fill its workspace view without the framework

<a id="ln-md-078"></a>

**Requirement.** The Mira Reading surface MUST fill its workspace view without the framework editor border or radius. Rendered Markdown retains its own content styling.

## LN-MD-079 — Markdown's pane menu: place its View section before provider contributions

<a id="ln-md-079"></a>

**Requirement.** Markdown's pane menu MUST place its View section before provider contributions and generic workspace actions. Reading view is first, followed by Source mode while editing.

## LN-MD-080 — While editing, Markdown's View section: expose a checked Show editor toolbar item

<a id="ln-md-080"></a>

**Requirement.** While editing, Markdown's View section MUST expose a checked `Show editor toolbar` item that toggles and persists `markdown.mira.editor.toolbar.enabled`.

## LN-MD-081 — Mira toolbar changes to indentation guides, indentation: persist through Lapis configuration before their updated

<a id="ln-md-081"></a>

**Requirement.** Mira toolbar changes to indentation guides, indentation type, and indentation width MUST persist through Lapis configuration before their updated state is reported.

## LN-MD-082 — 20 Mira capability flags: appear in one top-level Settings group

<a id="ln-md-082"></a>

**Requirement.** The 20 Mira capability flags MUST appear in one top-level Settings group with ID `markdown.mira.features` and `toggle-table` presentation. Every Boolean row MUST use an explicit proper-case label and a concise capability description. The Mermaid row MUST state that authoring also requires the Mermaid plugin setting.

## LN-MD-084 — Markdown Source and Live Preview editors: compose the API language-service diagnostic extension

<a id="ln-md-084"></a>

**Requirement.** Markdown Source and Live Preview editors MUST compose the API language-service diagnostic extension with completion and hover disabled. Reading mode MUST remain outside the CodeMirror diagnostic lifecycle.

## LN-MD-090 — Markdown's full editing surface: compose the public API embedded editor surface

<a id="ln-md-090"></a>

**Requirement.** Markdown's full editing surface MUST compose the public API embedded editor surface so file views and plugin-owned embedded editors resolve the same registered Markdown extension stack, configuration refresh, scrolling, and source fallback lifecycle. In a file leaf, its flex wrapper MUST constrain that surface so its Design Core Scroll Area owns the one usable vertical document scroll range.

## LN-MD-101 — Public MarkdownEmbed: render through Mira's embed preview using

<a id="ln-md-101"></a>

**Requirement.** Public `MarkdownEmbed` MUST render through Mira's embed preview using the owning App's `createLapisMiraFileAdapter` and `resolveMarkdownMiraExtensions`. It MUST refresh those extensions when configuration changes. Consumers MAY set `htmlPolicy`.

## LN-MD-104 — Registered Markdown contribution composition

<a id="ln-md-104"></a>

**Requirement.** Markdown MUST compose every registered API Markdown contribution into workspace Source or Live Preview, Reading mode, `MarkdownEmbed`, `FileEmbed`, and editable file surfaces. Each processor context MUST identify its mode, source path, front matter, source section, and owning surface.

## LN-MD-106 — Markdown file surface: support manual, single-click, or double-click activation

<a id="ln-md-106"></a>

**Requirement.** A Markdown file surface MUST support manual, single-click, or double-click activation and configurable blur return. Double-click activation MUST ignore interactive descendants, and failed persistence MUST retain the dirty editor with an accessible error. Its root MUST establish the effective Mira `obsidian` theme for preview and live-edit descendants.

## LN-MD-107 — Full-file Scroll Area ownership

<a id="ln-md-107"></a>

**Requirement.** A full-file surface MUST use a Design Core Scroll Area as its outer consumer scroll while previewing and its CodeMirror scroll while editing. The preview MUST inherit the application scrollbar visibility preference and MUST NOT retain Mira's native inner scroll owner. It MUST NOT create two active vertical document scrollers in either state.

## LN-MD-109 — Flat outline-navigation setting

<a id="ln-md-109"></a>

**Requirement.** `markdown.mira.features.outline-navigation` MUST remain a flat Boolean setting in the Markdown Features toggle table and default to `true`. Reading mode MUST pass it to Mira's `floating` outline. The standalone Outline workspace view and command MUST remain independent.

## LN-MD-110 — Reading mode's floating outline: stay vertically centered in the visible document

<a id="ln-md-110"></a>

**Requirement.** Reading mode's floating outline MUST stay vertically centered in the visible document pane while its shared Scroll Area scrolls. The reading document MUST reserve inline-end clearance so the collapsed heading-marker rail does not cover body content.

## LN-MD-112 — Reading mode's floating outline: resolve the actual document scroll owner. As

<a id="ln-md-112"></a>

**Requirement.** Reading mode's floating outline MUST resolve the actual document scroll owner. As the shared Scroll Area moves, the rail stroke and expanded outline item MUST both identify the current section without requiring outline interaction.
