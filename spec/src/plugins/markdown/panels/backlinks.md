# Backlinks

Backlinks groups references to the active file by their source note.

The persisted canonical view type is `backlink`; `file:backlinks` remains a
load-only alias under `LN-MD-085`.

Late metadata and file restore for Backlinks are governed by `LN-MD-098` on the
[Markdown Panels](./index.md) page. The shared helper ignores a leaf event
that repeats the same followed path. Linked mentions read `getCache`/`getFileCache` and `resolvedLinks`
so a reload does not depend on `getAllItems()`.

Preview behavior is defined by [Link Previews](./link-previews.md).

## LN-MD-023 — Backlinks: group linked and exact alias-aware unlinked mentions

<a id="ln-md-023"></a>

**Requirement.** Backlinks MUST group linked and exact alias-aware unlinked mentions by source file while excluding frontmatter and existing link or embed ranges from unlinked detection.

## LN-MD-045 — Backlinks: support linked and unlinked section collapse, result

<a id="ln-md-045"></a>

**Requirement.** Backlinks MUST support linked and unlinked section collapse, result collapse, search, filename and time sorting, compact and expanded context, and live workspace and metadata refresh.

## LN-MD-046 — Selecting a Backlinks mention: open its source and position the editor

<a id="ln-md-046"></a>

**Requirement.** Selecting a Backlinks mention MUST open its source and position the editor at that mention.

## LN-MD-047 — Backlinks rows: use the shared 0.75rem result scale, normalize

<a id="ln-md-047"></a>

**Requirement.** Backlinks rows MUST use the shared 0.75rem result scale, normalize nested sidebar widths, align counts to one trailing edge, and provide accessible hover and focus previews through the shared Mira path.
