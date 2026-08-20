# Markdown Plugin

The Markdown plugin owns Markdown document behavior and its integration with the
Lapis plugin, editor, metadata, and workspace APIs. Movable panel behavior is
specified separately under [Panels](./panels/index.md).

The production plugin also owns the Tags panel. Its persisted panel IDs follow
the canonical Obsidian-compatible names governed by `LN-MD-085` and
`LN-MD-086`, while former Lapis IDs remain load-only compatibility aliases.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-001 | The repo MAY ship `@lapis-notes/markdown` at `packages/plugins/plugin-markdown`. Markdownlint is separately authorized by the Problems and Packages specifications; other plugins still require mapped requirements. |
| LN-MD-002 | `@lapis-notes/markdown` MUST register through the existing API `Plugin` surface: `registerView`, `registerEditorView`, `registerExtensions`, `registerEditorExtension`, commands, and settings schema. |
| LN-MD-003 | The Plugin triad (`plugin.ts`, `plugin-manager.ts`, and `lapis-extension.ts`) MUST remain authoritative. Markdown MUST NOT introduce parallel loader, override-stack, or settings-framework APIs. |
| LN-MD-004 | Markdown document rendering MUST be provided by linked Mira packages through their built public exports, without consumer-owned source aliases. The full-repo local `richEditor` and `MarkdownPreview` stacks MUST NOT be retained. |
| LN-MD-005 | When enabled, the Markdown plugin MUST own view type `markdown` with `source`, `live-preview`, and `preview` modes, View-menu mode toggles, and leaf-state mode persistence from full-repo behavior. |
| LN-MD-006 | Lapis Path A (`EditorConfig` plus configuration `updated`) and Path B (`registerEditorExtension`, `workspace.updateOptions`, and `editor.updateExtensions`) MUST remain the extension-reload authority. |
| LN-MD-007 | Existing editor and workspace events (`editor-updated`, Editor `change`, file-change listeners, `active-leaf-change`, `editor-menu`, and `file-open`) MUST remain wired; Mira MUST NOT replace them. |
| LN-MD-009 | Markdown settings MUST expose Mira feature and Mira plugin toggles, including Mermaid and AI, under a Markdown settings section through the existing configuration schema and settings-section APIs. |
| LN-MD-010 | Living parity with the full repository MUST be tracked in `packages/plugins/plugin-markdown/PARITY.md` and linked from `MIGRATION.md`. |
| LN-MD-012 | The editor demo MUST register the source-editor plugin first, then `@lapis-notes/markdown` with Markdown associations enabled by default and exclusive priority, then Tags. |
| LN-MD-013 | The Markdown `MetadataProcessor.write` contract MUST serialize the frontmatter map passed by `MetadataCache.writeFrontmatter`, not a nested `{ frontmatter }` wrapper. |
| LN-MD-014 | When enabled, the Markdown plugin MUST register Lapis property type widgets (`unknown`, `text`, `number`, `checkbox`, `tags`, `aliases`, `multitext`, `date`, `datetime`, `array`, and `object`) through `Plugin.registerTypeWidget`. |
| LN-MD-015 | Storybook and demo hosts that load Markdown MUST call `metadataTypeManager.trackChanges()` or an equivalent `watchMetadata` helper after plugins load and dispose the watcher on teardown. |
| LN-MD-025 | The Markdown editor integration MUST compose Mira's public `createMarkdownCodeMirrorExtensions` source-decoration contract, not only its language parser. |
| LN-MD-051 | Markdown body text MAY retain the Lapis sans face, but revealed and source-mode frontmatter lines MUST resolve Mira's monospace token, using Source Code Pro under the Obsidian theme. |
| LN-MD-052 | Mira's inline fold controls MUST be the only visible Markdown fold presentation. Rendered frontmatter disclosure MUST collapse and expand its property content. |
| LN-MD-053 | API editor note-column spacing MUST NOT inset an embedded frontmatter preview. Its surface and disclosure chevron MUST share the Markdown content start. |
| LN-MD-071 | Lapis Markdown editing MUST compose `createMiraCodeMirrorExtensions` with `includeBaseExtensions: false` inside the API editor shell. The composed stack MUST retain Mira slash commands, command keymaps, parsing, tables, image handling, authoring helpers, rich editing, block controls, and extension contributions. |
| LN-MD-072 | Markdown Mira settings MUST derive schema properties, Settings fields, labels, and defaults from one typed descriptor list. Runtime resolution MUST use those declared defaults, and the superseded `markdown.mira.features.toolbar` value MUST remain unregistered and unread. |
| LN-MD-073 | Selection tools, standard block handles with drag and keyboard movement, block context actions, slash commands, Live Preview heading controls, tables, images, completions, smart paste, and input handlers MUST default on. The contextual block-type toolbar and AI MUST default off. |
| LN-MD-074 | `markdown.mira.editor.toolbar.enabled` MUST default to `false` and control a public Mira toolbar above the API `NoteEditor` only in Source and Live Preview. Its actions MUST delegate to the existing Lapis `Editor`, configuration, image picker, and mode lifecycle. The Lapis editing surface MUST remain borderless. |
| LN-MD-075 | `markdown.mira.editor.doodleDividers.enabled` MUST default to `false`. When enabled, Lapis MUST add Mira's public Doodle Dividers extension and its styles without recreating divider parsing, drawing, commands, or controls. |
| LN-MD-076 | While editing, Markdown MUST contribute a `book-open` title-bar action for Reading view; while reading, it MUST contribute a `pencil` action for editing. A plain click switches the current leaf, while Mod+click opens the target mode in a right split. |
| LN-MD-077 | Markdown's pane menu MUST expose Reading view, expose Source mode outside Reading view, persist mode changes, and append every registered `markdownViewMenuItems` provider contribution. |
| LN-MD-078 | The Mira Reading surface MUST fill its workspace view without the framework editor border or radius. Rendered Markdown retains its own content styling. |
| LN-MD-079 | Markdown's pane menu MUST place its View section before provider contributions and generic workspace actions. Reading view is first, followed by Source mode while editing. |
| LN-MD-080 | While editing, Markdown's View section MUST expose a checked `Show editor toolbar` item that toggles and persists `markdown.mira.editor.toolbar.enabled`. |
| LN-MD-081 | Mira toolbar changes to indentation guides, indentation type, and indentation width MUST persist through Lapis configuration before their updated state is reported. |
| LN-MD-082 | The 20 Mira capability flags MUST appear in one top-level Settings group with ID `markdown.mira.features` and `toggle-table` presentation. Every Boolean row MUST use an explicit proper-case label and a concise capability description. The Mermaid row MUST state that authoring also requires the Mermaid plugin setting. |
| LN-MD-083 | Grouped feature presentation MUST preserve every existing dotted feature key, default, and runtime gate. The configuration schema MUST remain flat and MUST NOT register or persist a `markdown.mira.features` group object. |
| LN-MD-084 | Markdown Source and Live Preview editors MUST compose the API language-service diagnostic extension with completion and hover disabled. Reading mode MUST remain outside the CodeMirror diagnostic lifecycle. |
| LN-MD-090 | Markdown's full editing surface MUST compose the public API embedded editor surface so file views and plugin-owned embedded editors resolve the same registered Markdown extension stack, configuration refresh, scrolling, and source fallback lifecycle. In a file leaf, its flex wrapper MUST constrain that surface so its Design Core Scroll Area owns the one usable vertical document scroll range. |
| LN-MD-091 | A Markdown file leaf MAY receive a serialized return target containing a registered view type, label, icon, and state. While editing, the title action MUST restore that view in the same leaf, preserve the current file, support Mod+click in a right split, and leave Markdown Reading and Source controls available in the pane menu. |
| LN-MD-093 | Markdown MUST register `notes_list` through the application tool registry. It MUST accept only normalized Markdown paths inside the trusted conversation scope, reject application-private directories, and return deterministically ordered bounded results. |
| LN-MD-094 | Markdown MUST NOT register `notes_patch`. Unique exact-hunk replacement belongs to API `edit`. Invalid scope, conflicts, cancellation, and denial MUST leave the target file unchanged. |
| LN-MD-100 | Markdown MUST NOT register `notes_read`. Bounded scoped file reads belong to the API `read` tool. |
| LN-MD-101 | Public `MarkdownEmbed` MUST render through Mira's embed preview using the owning App's `createLapisMiraFileAdapter` and `resolveMarkdownMiraExtensions`. It MUST refresh those extensions when configuration changes. Consumers MAY set `htmlPolicy`. |
| LN-MD-102 | `extractMetadata` MUST parse nested YAML maps and arrays in front matter, including `task:` objects. |
| LN-MD-103 | `extractMetadata` MUST index wiki links and standard Markdown links with the nearest preceding heading. |
| LN-MD-104 | Markdown MUST compose every registered API Markdown contribution into workspace Source or Live Preview, Reading mode, `MarkdownEmbed`, `FileEmbed`, and editable file surfaces. Each processor context MUST identify its mode, source path, front matter, source section, and owning surface. |
| LN-MD-105 | Markdown MUST register the API full-file surface provider. It MUST mount the real `TFile`, preserve serialized Mira writes and dirty-buffer protection, expose enter, flush, exit, and dispose controls, and report editing-state changes. |
| LN-MD-106 | A Markdown file surface MUST support manual, single-click, or double-click activation and configurable blur return. Double-click activation MUST ignore interactive descendants, and failed persistence MUST retain the dirty editor with an accessible error. Its root MUST establish the effective Mira `obsidian` theme for preview and live-edit descendants. |
| LN-MD-107 | A full-file surface MUST use its outer consumer scroll while previewing and its CodeMirror scroll while editing. It MUST NOT create two active vertical document scrollers in either state. |
| LN-MD-097 | Markdown `extractMetadata` MUST run off the renderer thread through a worker. Vault I/O, link resolution, `$state` apply, and `AppDatabase` writes MUST stay on the main thread. `read()` MAY use the same parse synchronously when a worker is unavailable. |
| LN-MD-099 | Published `parse-metadata` MUST import the metadata worker as `./metadata-worker?worker&inline` without a `.ts` suffix so Vite hosts resolve the packaged `metadata-worker.js`. |

File Properties value autocomplete and wikilink pills stay on the Lapis
frontmatter adapter and Mira file adapter. Metadata parse uses a Markdown
worker whose packaged import stays extensionless; heavy type widgets remain deferred. File-scoped Outline, Backlinks, and
Outgoing Links share one follow helper under `LN-MD-098` and do not rewrite
state when a leaf event repeats the same followed path.
Linked mentions paint from `getCache`/`getFileCache` even when `getAllItems()`
is still empty. Backlinks also read `resolvedLinks` for inbound sources.

## Ownership

Reusable Plugin and Editor contracts remain in `@lapis-notes/api`. Markdown
document policy lives in `@lapis-notes/markdown` and is implemented by Mira.
The Lapis package owns the app-bound `MiraFileAdapter` and reuses one instance
per App; portable rendering and editor behavior remain Mira-owned. Markdown views, renderers, frontmatter, and
Mira extension factories receive that App explicitly; static compatibility
entrypoints resolve only through the documented fallback. The diagnostics extension reference-counts
open editor views and reuses the manager's cached code actions; it does not
replace Mira completion or hover behavior.
The generic Problems leaf renders its live total through Design Core's
ephemeral view badge; Markdown and Markdownlint contribute diagnostics but do
not construct or persist that presentation.
Markdown also owns `notes_list`. That callback captures the plugin's Vault,
accepts only scoped portable Markdown paths outside `.obsidian`, `.lapis`, and
`.trash`, and returns bounded transport-neutral records. The list description
tells the agent to prefer it over host-cwd directory walking (LN-AI-108).
Bounded reads and mutating file edits belong to API `read`, `write`, `edit`,
and `apply_patch`.
The narrow `@lapis-notes/markdown/agent-tools` entry exposes the list factory
for package tests and explicit diagnostics; the root plugin remains responsible
for registering it in production.

Panel registration, package exports, and per-panel behavior are documented in
the [Markdown panel specification](./panels/index.md). Shared
workspace presentation and Storybook rules live under
[Workspace Shell / Panels](../../workspace-shell/panels.md).
The panel registry is also the command-discovery authority required by
`LN-MD-089`; document views continue to open through their file associations.

Tags and All Properties remain Markdown-owned metadata views. Their vault-wide
navigation delegates through the registered Search command described by the
[Search Plugin](../search/index.md); Markdown does not import Search internals.
The six canonical Markdown panels register `ViewAccess.command` openers from
their registry. Markdown and Media remain `ViewAccess.file`, and legacy panel
view types remain `ViewAccess.alias` without palette duplicates.
The canonical registry is mirrored by the generic Storybook command-panel
catalog, replacing Markdown-specific catalog arrays while retaining the same
real registrations and one instance per placement.
