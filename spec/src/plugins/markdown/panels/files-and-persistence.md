# Markdown Panels / Files and persistence

## LN-MD-008 — Plugin: register All Properties, File Properties, Outline, Backlinks

<a id="ln-md-008"></a>

**Requirement.** The plugin MUST register All Properties, File Properties, Outline, Backlinks, and Outgoing Links with the Obsidian-compatible canonical view types `all-properties`, `file-properties`, `outline`, `backlink`, and `outgoing-link`.

## LN-MD-011 — Sibling lapis-plugins Storybook: provide focused Markdown panel stories for All

<a id="ln-md-011"></a>

**Requirement.** The sibling `lapis-plugins` Storybook MUST provide focused Markdown panel stories for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags. Lapis Notes Storybook MUST retain only profile and plugin-management integration coverage for the published Markdown package.

## LN-MD-085 — Markdown panel registration: retain the former file:properties, file:outline, file:backlinks,

<a id="ln-md-085"></a>

**Requirement.** Markdown panel registration MUST retain the former `file:properties`, `file:outline`, `file:backlinks`, and `file:outgoing-links` view types as load-only aliases. Restored aliases MUST resolve to views whose `getViewType()` returns the canonical Obsidian-compatible ID.

## LN-MD-089 — Markdown: declare All Properties, Outline, File Properties, Backlinks

<a id="ln-md-089"></a>

**Requirement.** Markdown MUST declare All Properties, Outline, File Properties, Backlinks, Outgoing Links, and Tags in one panel registry that pairs every canonical view with unique opening-command metadata.

## LN-MD-098 — Active-file tracking in Markdown panels

<a id="ln-md-098"></a>

**Requirement.** Outline, Backlinks, and Outgoing Links MUST follow `workspace.getActiveFile()`. They MUST paint from async indexed metadata on mount, readiness, relevant committed changes, and followed-file assignment. Stale query results MUST NOT replace newer state. They MUST share one follow helper and MUST NOT write panel state when a leaf event repeats the same followed path.

### Acceptance details

File-scoped Markdown panels recover after late metadata and file restore:

- They MUST resolve the followed note through `workspace.getActiveFile()`, then a root `FileView` scan.
- Mount MUST issue the indexed query immediately when `metadataCache` has already loaded.
- They MUST refresh on `loaded`, relevant `index-changed`, and followed-file assignment through one shared helper.
- Backlinks MUST also refresh when another note's committed metadata changes because that note can add or remove an incoming link to the followed file.
- They MUST NOT write reactive panel state when `file-open` or `active-leaf-change` repeats the same followed path.
- Linked Backlinks and Outgoing Links MUST use indexed link queries plus Search-backed unlinked candidates instead of cache enumeration.
- An older async response MUST NOT overwrite a later followed path or metadata revision.
- Governed Storybook acceptance MUST begin from persisted indexed data, surface an async query failure, recover after a later invalidation, and exercise live link changes without acquiring a snapshot lease.
- They MUST NOT stay empty until the user switches tabs or a layout write fires.
