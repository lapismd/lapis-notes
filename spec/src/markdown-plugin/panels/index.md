# Markdown Panels

Markdown configuration and editor feature settings remain governed by the
[Markdown Plugin overview](../../markdown-plugin.md). They do not change the
movable-panel contracts in this chapter.

The Markdown plugin registers file- and vault-scoped views into the movable
[Workspace Shell panel contract](../../workspace-shell/panels.md). This page
defines the shared package boundary; each concrete panel has its own behavior
page.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-008 | The plugin MUST register All Properties, File Properties, Outline, Backlinks, and Outgoing Links using the same view types and commands as full-repo `plugin-markdown`. |
| LN-MD-011 | Storybook MUST provide focused `Workspace/Panels/Markdown/*` stories for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags. Tags remains workspace-origin intake rather than part of the Markdown package. |
| LN-MD-021 | The package MUST export app-only `FileProperties`, `Outline`, `Backlinks`, and `OutgoingLinks` Svelte components. Backlinks and Outgoing Links MUST fix their mode in those public wrappers; their shared mode selector remains private. |

## Panel pages

- [All Properties](./all-properties.md)
- [File Properties](./file-properties.md)
- [Outline](./outline.md)
- [Backlinks](./backlinks.md)
- [Outgoing Links](./outgoing-links.md)
- [Tags](./tags.md), the documented Storybook-local exception
- [Link Previews](./link-previews.md), shared by Backlinks and Outgoing Links

All production panels import through `@lapis-notes/markdown`. Tags documents its
real co-located fixture import and does not invent a package export.

This chapter owns reusable movable-panel conventions only. Markdown editor
authoring composition, settings, and editor-demo acceptance remain governed by
the Markdown Plugin overview and Editor Demo chapters rather than being copied
into individual panel contracts. Document title-bar actions and View-menu
contributions likewise use the API workspace bridge and are not panel chrome.
The document Reading surface removes Mira Editor's framework border; movable
panel paint remains governed by the separate workspace panel contract.
The reusable Problems view is specified under Workspace Shell / Panels rather
than as a Markdown panel because non-Markdown providers and non-Lapis hosts may
publish the same generic diagnostic model.
