# Outgoing Links

Outgoing Links groups references made by the active file and opens their target
notes.

The persisted canonical view type is `outgoing-link`; `file:outgoing-links`
remains a load-only alias under `LN-MD-085`.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-031 | Outgoing Links MUST group linked and exact alias-aware unlinked references by target file while excluding frontmatter and existing link or embed ranges from unlinked detection. |
| LN-MD-067 | Outgoing Links MUST support section and result collapse, search, filename and time sorting, compact and expanded context, and live workspace and metadata refresh. |
| LN-MD-068 | Selecting a resolved Outgoing Links result MUST open the target note. |
| LN-MD-069 | Outgoing Links rows MUST use the 0.75rem result scale, normalize nested sidebar widths, align counts to one trailing edge, and provide shared Mira hover and focus previews instead of the retired renderer. |
| LN-MD-070 | Outgoing Links MUST use the valid Lucide `external-link` icon in every placement. |

Late metadata and file restore for Outgoing Links are governed by `LN-MD-098` on
the [Markdown Panels](./index.md) page. The shared helper ignores a leaf event
that repeats the same followed path. Linked mentions read `getCache`/`getFileCache`
so a reload does not depend on `getAllItems()`.

Preview behavior is defined by [Link Previews](./link-previews.md).
