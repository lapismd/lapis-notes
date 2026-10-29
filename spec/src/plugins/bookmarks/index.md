# Bookmarks Plugin

`@lapis-notes/bookmarks` owns the movable Bookmarks panel and Obsidian-compatible
`.lapis/bookmarks.json`. It does not own Explorer, Search, or Graph.

The package consumes the published Design Core semver contract and MUST NOT
assume a sibling-repository path or a workspace `link:` override.

## Runtime flow

```text
toolbar / CommandView / drag
        ↓
BookmarksStore
        ↓
.lapis/bookmarks.json
        ↓
typed tree rows
        ↓
openFile or registered command
```

The plugin owns bookmark persistence and presentation. Cross-panel navigation
uses registered commands. The canonical palette opener is
`Bookmarks: Open Bookmarks` (`bookmarks:open-bookmarks`).

## LN-BM-001 — Sibling lapis-plugins repository: ship @lapis-notes/bookmarks at packages/bookmarks with runtime id

<a id="ln-bm-001"></a>

**Requirement.** The sibling `lapis-plugins` repository MUST ship `@lapis-notes/bookmarks` at `packages/bookmarks` with runtime id `bookmarks` and support static composition or registry installation.

## LN-BM-002 — Bookmarks: persist { items } to .lapis/bookmarks.json

<a id="ln-bm-002"></a>

**Requirement.** Bookmarks MUST persist `{ items }` to `.lapis/bookmarks.json` through plugin data. Items MUST include `file` with optional `subpath`, `folder`, `group`, `search`, `url`, and `graph`. Unknown keys and item types MUST round-trip.

## LN-BM-003 — Plugin: register the bookmarks view through ViewAccess.command

<a id="ln-bm-003"></a>

**Requirement.** The plugin MUST register the `bookmarks` view through `ViewAccess.command` with `open-bookmarks` / `Open Bookmarks`. The opener MUST reveal an existing instance or create, activate, and reveal the default left sidebar. The leaf title MUST be `Bookmarks` and the icon MUST be `bookmark`.

## LN-BM-004 — Panel toolbar: offer bookmark the active file or Search

<a id="ln-bm-004"></a>

**Requirement.** The panel toolbar MUST offer bookmark the active file or Search query, new group, collapse/expand all, and show search filter. The palette MUST also offer Bookmark URL. Creating or removing a group MUST update the visible tree from persisted items.

## LN-BM-005 — Adding a bookmark: show a dialog with the type-specific target

<a id="ln-bm-005"></a>

**Requirement.** Adding a bookmark MUST show a dialog with the type-specific target — path, query, or an editable URL — and an optional title. A CommandView MUST then list existing groups plus Root. An unmatched query MUST offer Create group.

## LN-BM-006 — Activating an item: dispatch by type through openFile or registered

<a id="ln-bm-006"></a>

**Requirement.** Activating an item MUST dispatch by type through `openFile` or registered commands. Missing file or folder paths and disallowed URLs MUST Notice and MUST NOT invent a leaf.

### Acceptance details

Activation verifies:

- A `file` item opens through `openFile`. A resolved `subpath` moves the text editor to that heading or block.
- A `folder` item runs `lapis-file-explorer:reveal-path`. A `search` item runs `search:open-search` with the stored query.
- A `url` item opens `http:` or `https:` only. Other schemes Notice.
- A `graph` item Notices unless a `graph` view is registered, then opens that leaf.
- Bookmarks MUST NOT import Search or Explorer implementation files.

## LN-BM-007 — Tree: allow dragging every item kind to reparent

<a id="ln-bm-007"></a>

**Requirement.** The tree MUST allow dragging every item kind to reparent into a group, reorder siblings, or move to root, and MUST persist `items` order.

## LN-BM-008 — Filter: match title, path, query, URL, and subpath

<a id="ln-bm-008"></a>

**Requirement.** The filter MUST match title, path, query, URL, and subpath while keeping ancestor groups. Collapse/expand all MUST be one toggle.

## LN-BM-009 — Vault rename: update matching file.path and folder.path. Missing targets

<a id="ln-bm-009"></a>

**Requirement.** Vault rename MUST update matching `file.path` and `folder.path`. Missing targets MUST stay listed.

## LN-BM-010 — Storybook: demonstrate the real Bookmarks panel in all

<a id="ln-bm-010"></a>

**Requirement.** Storybook MUST demonstrate the real Bookmarks panel in all six governed placements. Docs source MUST use public `@lapis-notes/bookmarks` imports. New visuals MUST stay `visual-pending`.

## LN-BM-011 — Known type: render its Lucide icon and fallback label

<a id="ln-bm-011"></a>

**Requirement.** Each known type MUST render its Lucide icon and fallback label. Graph rows MUST remain visible when Graph is unregistered.

### Acceptance details

Row presentation verifies:

- Groups use a disclosure chevron and no folder glyph. Leaf rows omit the disclosure spacer so their icon starts after the guide.
- Files use `file`, folders `folder`, searches `search`, URLs `external-link`, and graph items `git-fork`.
- Labels fall back to basename, folder name, query, URL, or `Graph` when `title` is omitted. A file `subpath` remains visible on the row.

## LN-BM-012 — Bookmarks tree: inset rows from every panel edge using

<a id="ln-bm-012"></a>

**Requirement.** The Bookmarks tree MUST inset rows from every panel edge using the public Explorer content-padding token. The ScrollArea MUST stay flush so the scrollbar rides the panel edge.

## LN-BM-013 — Bookmarks toolbar actions: use the public Explorer toolbar hover

<a id="ln-bm-013"></a>

**Requirement.** Bookmarks toolbar actions MUST use the public Explorer toolbar hover and pressed tokens so ghost-button muted hover stays visible on the panel. Pressed geometry MUST stay identical to idle.

## LN-BM-014 — Bookmarks nested lists: use Explorer indent, guide, folder-gap, and row-gap

<a id="ln-bm-014"></a>

**Requirement.** Bookmarks nested lists MUST use Explorer indent, guide, folder-gap, and row-gap tokens so the guide centers on the expanded chevron tip. Rows MUST NOT add a second depth indent. Leaf rows MUST NOT reserve a disclosure column.
