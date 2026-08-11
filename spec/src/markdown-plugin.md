# Markdown Plugin

The Markdown plugin owns Markdown document behavior and its integration with the
Lapis plugin, editor, metadata, and workspace APIs. Movable panel behavior is
specified separately under [Panels](./markdown-plugin/panels/index.md).

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-001 | The repo MAY ship `@lapis-notes/markdown` at `packages/plugins/plugin-markdown` as the sole authorized plugin package until hosts, notebook, and language-service packages are separately specified. |
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
| LN-MD-025 | The Markdown editor integration MUST compose Mira's public `createMarkdownCodeMirrorExtensions` source-decoration contract, not only its language parser. Markdown body text MAY retain the Lapis sans face, but revealed or source-mode frontmatter lines MUST resolve the Mira monospace token (Source Code Pro under the Obsidian theme). Mira's inline fold controls MUST be the only visible Markdown fold presentation, rendered frontmatter disclosure MUST collapse and expand its property content, and the API editor's outer note-column spacing MUST NOT add padding to the embedded frontmatter preview; the frontmatter surface and disclosure chevron MUST therefore share the Markdown content start. |

## Ownership

Reusable Plugin and Editor contracts remain in `@lapis-notes/api`. Markdown
document policy lives in `@lapis-notes/markdown` and is implemented by Mira.
The Lapis package owns the app-bound `MiraFileAdapter`; portable rendering and
editor behavior remain Mira-owned.

Panel registration, package exports, and per-panel behavior are documented in
the [Markdown panel specification](./markdown-plugin/panels/index.md). Shared
workspace presentation and Storybook rules live under
[Workspace Shell / Panels](./workspace-shell/panels.md).
