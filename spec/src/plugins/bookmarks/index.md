# Bookmarks Plugin

`@lapis-notes/bookmarks` owns the movable Bookmarks panel and Obsidian-compatible
`.obsidian/bookmarks.json`. It does not own Explorer, Search, or Graph.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-BM-001 | The repo MUST ship `@lapis-notes/bookmarks` at `packages/plugins/plugin-bookmarks` with runtime id `bookmarks`, `distribution: "bundled"`, and `enabledByDefault: true`. |
| LN-BM-002 | Bookmarks MUST persist `{ items }` to `.obsidian/bookmarks.json` through plugin data. Items MUST include `file` with optional `subpath`, `folder`, `group`, `search`, `url`, and `graph`. Unknown keys and item types MUST round-trip. |
| LN-BM-003 | The plugin MUST register the `bookmarks` view through `ViewAccess.command` with `open-bookmarks` / `Open Bookmarks`. The opener MUST reveal an existing instance or create, activate, and reveal the default left sidebar. The leaf title MUST be `Bookmarks` and the icon MUST be `bookmark`. |
| LN-BM-004 | The panel toolbar MUST offer bookmark the active file or Search query, new group, collapse/expand all, and show search filter. The palette MUST also offer Bookmark URL. Creating or removing a group MUST update the visible tree from persisted items. |
| LN-BM-005 | Adding a bookmark MUST show a dialog with the type-specific target — path, query, or an editable URL — and an optional title. A CommandView MUST then list existing groups plus Root. An unmatched query MUST offer Create group. |
| LN-BM-006 | Activating an item MUST dispatch by type through `openFile` or registered commands. Missing file or folder paths and disallowed URLs MUST Notice and MUST NOT invent a leaf. |
| LN-BM-007 | The tree MUST allow dragging every item kind to reparent into a group, reorder siblings, or move to root, and MUST persist `items` order. |
| LN-BM-008 | The filter MUST match title, path, query, URL, and subpath while keeping ancestor groups. Collapse/expand all MUST be one toggle. |
| LN-BM-009 | Vault rename MUST update matching `file.path` and `folder.path`. Missing targets MUST stay listed. |
| LN-BM-010 | Storybook MUST demonstrate the real Bookmarks panel in all six governed placements. Docs source MUST use public `@lapis-notes/bookmarks` imports. New visuals MUST stay `visual-pending`. |
| LN-BM-011 | Each known type MUST render its Lucide icon and fallback label. Graph rows MUST remain visible when Graph is unregistered. |
| LN-BM-012 | The Bookmarks tree MUST inset rows from every panel edge using the public Explorer content-padding token. The ScrollArea MUST stay flush so the scrollbar rides the panel edge. |
| LN-BM-013 | Bookmarks toolbar actions MUST use the public Explorer toolbar hover and pressed tokens so ghost-button muted hover stays visible on the panel. Pressed geometry MUST stay identical to idle. |
| LN-BM-014 | Bookmarks nested lists MUST use Explorer indent, guide, folder-gap, and row-gap tokens so the guide centers on the expanded chevron tip. Rows MUST NOT add a second depth indent. Leaf rows MUST NOT reserve a disclosure column. |

### LN-BM-006 acceptance details

Activation verifies:

- A `file` item opens through `openFile`. A resolved `subpath` moves the text editor to that heading or block.
- A `folder` item runs `lapis-file-explorer:reveal-path`. A `search` item runs `search:open-search` with the stored query.
- A `url` item opens `http:` or `https:` only. Other schemes Notice.
- A `graph` item Notices unless a `graph` view is registered, then opens that leaf.
- Bookmarks MUST NOT import Search or Explorer implementation files.

### LN-BM-011 acceptance details

Row presentation verifies:

- Groups use a disclosure chevron and no folder glyph. Leaf rows omit the disclosure spacer so their icon starts after the guide.
- Files use `file`, folders `folder`, searches `search`, URLs `external-link`, and graph items `git-fork`.
- Labels fall back to basename, folder name, query, URL, or `Graph` when `title` is omitted. A file `subpath` remains visible on the row.

## Runtime flow

```text
toolbar / CommandView / drag
        ↓
BookmarksStore
        ↓
.obsidian/bookmarks.json
        ↓
typed tree rows
        ↓
openFile or registered command
```

The plugin owns bookmark persistence and presentation. Cross-panel navigation
uses registered commands. The canonical palette opener is
`Bookmarks: Open Bookmarks` (`bookmarks:open-bookmarks`).
