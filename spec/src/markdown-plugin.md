# Markdown Plugin

The Markdown plugin owns Markdown document behavior and its integration with the
Lapis plugin, editor, metadata, and workspace APIs. Movable panel behavior is
specified separately under [Panels](./markdown-plugin/panels/index.md).

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

## Ownership

Reusable Plugin and Editor contracts remain in `@lapis-notes/api`. Markdown
document policy lives in `@lapis-notes/markdown` and is implemented by Mira.
The Lapis package owns the app-bound `MiraFileAdapter`; portable rendering and
editor behavior remain Mira-owned.

Panel registration, package exports, and per-panel behavior are documented in
the [Markdown panel specification](./markdown-plugin/panels/index.md). Shared
workspace presentation and Storybook rules live under
[Workspace Shell / Panels](./workspace-shell/panels.md).
