# Tags

Tags is a Storybook-local workspace-origin panel. It is documented beside the
Markdown panels because it follows the same movable surface contract, but it is
not exported from `@lapis-notes/markdown` or `@lapis-notes/workspace`.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-024 | Tags MUST count each hierarchical tag at most once per file and support bidirectional name and frequency sorting, toggleable search, flat and nested trees, expand and collapse all, highlighting, and metadata changed, deleted, and loaded refresh. |
| LN-MD-048 | Every Tags entry MUST render a muted Lucide hash instead of textual `#`. Expandable entries retain a chevron, while leaves reserve the disclosure column so hashes align by depth. |
| LN-MD-049 | Tags branch guides MUST sit beneath expanded chevron tips. Each child hash ends at its immediate parent tag-name column, child labels remain visibly indented, and counts share one trailing edge. |
| LN-MD-050 | Tags MUST fill its `WorkspaceViewHost`, omit title and introduction copy, inherit resolved view paint and workspace typography, and use the 0.75rem row scale. |
