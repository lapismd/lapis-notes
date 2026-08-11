# Tags

Tags is a Storybook-local workspace-origin panel. It is documented beside the
Markdown panels because it follows the same movable surface contract, but it is
not exported from `@lapis-notes/markdown` or `@lapis-notes/workspace`.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-024 | Tags MUST count each hierarchical tag at most once per file and support bidirectional name and frequency sorting, toggleable search, flat and nested trees, expand and collapse all, highlighting, and metadata changed, deleted, and loaded refresh. Every entry renders a muted Lucide hash rather than a textual `#`; expandable entries retain a disclosure chevron while leaves reserve the same disclosure column so hashes align by depth. A branch guide sits beneath its expanded chevron tip, each child hash's trailing edge aligns with the start of its immediate parent tag name, child labels remain visibly indented, and counts share one trailing edge. The panel fills its `WorkspaceViewHost`, omits title or introduction copy, inherits resolved view paint and workspace typography, and uses the 0.75rem row scale. |
