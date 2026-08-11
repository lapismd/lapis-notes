# File Properties

File Properties edits the active Markdown file's frontmatter through Mira while
retaining Lapis metadata types and mutation ownership.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-017 | File Properties MUST edit active-file frontmatter through registered type widgets and `updateFrontmatterProperty` or `processFrontMatter`, not a parallel save path. |
| LN-MD-019 | File Properties MUST render Mira `FrontmatterEditor` driven by a Lapis `FrontmatterController` and `FrontmatterPropertyManager` adapter over `app.metadataTypeManager`, including types, registered widget definitions, suggestions, rename, and `setType`. The panel MUST NOT mount a parallel local property form as editable authority. Its titleless editor surface MUST fill and shrink to the available panel width, use Mira's `markdown-widget-shell` token wrapper, inherit the workspace font family, and normalize controls to the 0.75rem panel scale without changing Mira's public runtime contract. It MUST NOT create horizontal panel scrolling; Mira's container contract stacks keys and values into separate full-width rows below 250px and aligns the value start with the label text above it. The wrapper remains transparent so resolved view paint stays authoritative while supplying surface-aware Lapis focus, tag, and alias-pill tokens that contrast on sidebar and workspace backgrounds. Standard Lapis types retain their registered label, icon, default, and validation definitions while using Mira's native renderers: tags, aliases, and multitext use the pill-list editor rather than comma inputs; text uses the non-resizable inline editor; and Tags uses the Lucide hash glyph. The active property retains Mira/Lapis row-owned border, ring, and radius, the focused key or value uses a view-token-derived contrast fill, the inline editor adds no competing outline, and manual textarea resizing remains disabled. |

Responsive stories resize the owning workspace split as required by LN-ED-021;
they do not set a synthetic width on the component.
