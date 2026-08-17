# Markdown Panels

Markdown configuration and editor feature settings remain governed by the
[Markdown Plugin overview](../index.md). They do not change the
movable-panel contracts in this chapter.

The Markdown plugin registers file- and vault-scoped views into the movable
[Workspace Shell panel contract](../../../workspace-shell/panels.md). This page
defines the shared package boundary; each concrete panel has its own behavior
page.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-008 | The plugin MUST register All Properties, File Properties, Outline, Backlinks, and Outgoing Links with the Obsidian-compatible canonical view types `all-properties`, `file-properties`, `outline`, `backlink`, and `outgoing-link`. |
| LN-MD-011 | Storybook MUST provide focused `Plugins/Markdown/Panels/*` stories for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags. Tags is registered and exported by the Markdown package. |
| LN-MD-021 | The package MUST export app-only `FileProperties`, `Outline`, `Backlinks`, and `OutgoingLinks` Svelte components. Backlinks and Outgoing Links MUST fix their mode in those public wrappers; their shared mode selector remains private. |
| LN-MD-085 | Markdown panel registration MUST retain the former `file:properties`, `file:outline`, `file:backlinks`, and `file:outgoing-links` view types as load-only aliases. Restored aliases MUST resolve to views whose `getViewType()` returns the canonical Obsidian-compatible ID. |
| LN-MD-089 | Markdown MUST declare All Properties, Outline, File Properties, Backlinks, Outgoing Links, and Tags in one panel registry that pairs every canonical view with unique opening-command metadata. |
| LN-MD-092 | A serialized Markdown return target MUST replace only the editing title action. Reading and Source controls plus registered Markdown view-menu provider contributions MUST remain available in the pane menu, and the delegated document MUST NOT become a movable Markdown panel. |

## Panel pages

- [All Properties](./all-properties.md)
- [File Properties](./file-properties.md)
- [Outline](./outline.md)
- [Backlinks](./backlinks.md)
- [Outgoing Links](./outgoing-links.md)
- [Tags](./tags.md)
- [Link Previews](./link-previews.md), shared by Backlinks and Outgoing Links

All production panels import through `@lapis-notes/markdown` and receive App
state from their owning registered view rather than ambient host state.

This chapter owns reusable movable-panel conventions only. Markdown editor
authoring composition, settings, and editor-demo acceptance remain governed by
the Markdown Plugin overview and Editor Demo chapters rather than being copied
into individual panel contracts. Document title-bar actions and View-menu
contributions likewise use the API workspace bridge and are not panel chrome.
Markdown application tools are package-owned non-view contributions and do not
open, relocate, or depend on these panel registrations.
Their narrow package entry likewise exports no panel component, placement
metadata, workspace controller, or view command.
The document Reading surface removes Mira Editor's framework border; movable
panel paint remains governed by the separate workspace panel contract.
The reusable Problems view is specified under Workspace Shell / Panels rather
than as a Markdown panel because non-Markdown providers and non-Lapis hosts may
publish the same generic diagnostic model. Its live leaf badge is likewise
Design Core chrome rather than Markdown panel content.

Tags and All Properties may hand a query to the separately registered Search
plugin. That command boundary preserves Markdown ownership of metadata panels
without giving them Search indexing, query execution, or layout policy.

The Markdown and Media document views remain file-backed editor registrations.
They open through editor associations rather than panel-opening commands.
Markdown document editing composes the public API embedded editor host; this
does not make the editor a movable panel or move Markdown extension policy into
the panel package boundary. Its file-view wrapper gives the embedded editor a
bounded flex area, leaving the embedded Design Core Scroll Area as the one
vertical owner for a long document.
Former panel view IDs are compatibility aliases and resolve through the
canonical command described by `LN-WS-052`.
The canonical registry uses one `Open …` command per panel and reuses an
existing leaf before creating, activating, and revealing the documented
right-sidebar default.
Every canonical panel story lives at
`Plugins/Markdown/Panels/<Panel>` and exports the same six placement names used
by the cross-plugin panel audit. Link Preview Acceptance remains supporting
behavior rather than an additional command-access view.
