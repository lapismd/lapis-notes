# Tags

Tags is a reusable panel registered and exported by `@lapis-notes/markdown`.
It follows the same movable surface contract as the other Markdown panels and
is not exported from `@lapis-notes/workspace`.

## LN-MD-024 — Tags: count each hierarchical tag at most once

<a id="ln-md-024"></a>

**Requirement.** Tags MUST count each hierarchical tag at most once per file and support bidirectional name and frequency sorting, toggleable search, flat and nested trees, expand and collapse all, highlighting, and metadata changed, deleted, and loaded refresh.

## LN-MD-048 — Tags entry: render a muted Lucide hash instead of

<a id="ln-md-048"></a>

**Requirement.** Every Tags entry MUST render a muted Lucide hash instead of textual `#`. Expandable entries retain a chevron, while leaves reserve the disclosure column so hashes align by depth.

## LN-MD-049 — Tags branch guides: sit beneath expanded chevron tips. Each child

<a id="ln-md-049"></a>

**Requirement.** Tags branch guides MUST sit beneath expanded chevron tips. Each child hash ends at its immediate parent tag-name column, child labels remain visibly indented, and counts share one trailing edge.

## LN-MD-050 — Tags: fill its WorkspaceViewHost, omit title and introduction

<a id="ln-md-050"></a>

**Requirement.** Tags MUST fill its `WorkspaceViewHost`, omit title and introduction copy, inherit resolved view paint and workspace typography, and use the 0.75rem row scale.

## LN-MD-086 — Markdown plugin: register the Obsidian-compatible canonical Tags view type

<a id="ln-md-086"></a>

**Requirement.** The Markdown plugin MUST register the Obsidian-compatible canonical Tags view type `tag` and retain `tags` as a load-only alias whose view persists the canonical type.

## LN-MD-087 — Selecting a Tags row: invoke search:open-search with an escaped tag: query

<a id="ln-md-087"></a>

**Requirement.** Selecting a Tags row MUST invoke `search:open-search` with an escaped `tag:` query. It MUST remain non-fatal when Search is unavailable.
