# File Properties

File Properties edits the active Markdown file's frontmatter through Mira while
retaining Lapis metadata types and mutation ownership.

The persisted canonical view type is `file-properties`; `file:properties`
remains a load-only alias under `LN-MD-085`.

## Requirements

| ID        | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-MD-017 | File Properties MUST edit active-file frontmatter through registered type widgets and `updateFrontmatterProperty` or `processFrontMatter`, not a parallel save path.                                                                                                                                                                                                                                                                          |
| LN-MD-019 | File Properties MUST render Mira `FrontmatterEditor` through a Lapis `FrontmatterController` and `FrontmatterPropertyManager` adapter over `app.metadataTypeManager`. The panel MUST NOT mount a parallel editable property form.                                                                                                                                                                                                             |
| LN-MD-036 | File Properties MUST expose registered types, widget definitions, suggestions, rename, and `setType` through its Lapis frontmatter adapter.                                                                                                                                                                                                                                                                                                   |
| LN-MD-037 | The titleless File Properties editor MUST fill and shrink to the panel width, inherit workspace typography, use Mira's `markdown-widget-shell` token wrapper, and normalize controls to the 0.75rem panel scale without changing Mira's public runtime contract.                                                                                                                                                                              |
| LN-MD-038 | File Properties MUST NOT create horizontal panel scrolling. Below Mira's 250px container breakpoint, keys and values MUST form full-width rows whose value starts at the label text column.                                                                                                                                                                                                                                                   |
| LN-MD-039 | The File Properties wrapper MUST remain transparent and supply surface-aware focus, tag, and alias-pill tokens that contrast on sidebar and workspace backgrounds.                                                                                                                                                                                                                                                                            |
| LN-MD-040 | Standard Lapis property types MUST retain their registered label, icon, default, and validation definitions while using Mira's native renderers. Tags, aliases, and multitext use pill lists; text uses the non-resizable inline editor; Tags uses the Lucide hash glyph.                                                                                                                                                                     |
| LN-MD-041 | The active property MUST retain Mira/Lapis row-owned border, ring, and radius. Focused keys and values use a view-token-derived contrast fill, inline editors add no competing outline, and property textareas remain non-resizable.                                                                                                                                                                                                          |
| LN-MD-095 | File Properties MUST offer vault-wide value autocomplete for tags, aliases, and multitext through Mira `valueSuggestions` backed by `metadataTypeManager.getValues`. It MUST NOT reopen property-name suggestions or fork a Lapis pill editor.                                                                                                                                                                                                |
| LN-MD-096 | Wikilink pills in File Properties MUST resolve through the Lapis `MiraFileAdapter` so they hover and open like other NoteLink surfaces.                                                                                                                                                                                                                                                                                                       |
| LN-MD-113 | File Properties MUST preserve legacy value-editor affordances: tags, aliases, and multitext pills retain a surface-contrasting fill and a visible X removal icon, while focusing text or pill-list values exposes vault-wide `metadataTypeManager.getValues` suggestions in Mira's owner-document portal so workspace overflow cannot clip or cover the options.                                                                              |
| LN-MD-114 | Frontmatter value completion MUST remain advisory: users can type and commit custom text, tag, alias, or multitext values while suggestions are visible. Tag, alias, and multitext labels MUST wrap within the value column instead of truncating or causing horizontal overflow. Each chip background MUST enclose every wrapped line; tag chips MUST use the alias and multitext radius. Linked aliases MUST retain a readable label width. |

Responsive stories resize the owning workspace split as required by LN-ED-021;
they do not set a synthetic width on the component. The frontmatter controller
and property manager use the panel view's App, so metadata writes and type
lookups cannot follow another host's compatibility alias.
The controller hydrates the followed note with `getFileCacheAsync` before
synchronizing Mira state and discards a result if the followed file changes
while that read is pending.
The shared frontmatter property menu remains visible and hit-testable in this
panel under `LN-MD-111`. File Properties uses Mira's standard dropdown styling
and legacy-compatible hierarchy: `Property type` opens the checked type submenu,
each choice displays its registered type icon, and Cut, Copy, Paste, and Remove
remain top-level actions. The panel does not replace or override Mira's
portalled menu.
