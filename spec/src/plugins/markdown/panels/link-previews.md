# Link Previews

Editable link previews remain Markdown-owned full-file surfaces. Registered
domain contributions may enrich rendered content while Mira retains serialized
writes, dirty-buffer protection, blur return, and Escape handling.

Backlinks and Outgoing Links share one app-bound preview and editing contract.
Ordinary internal links rendered by Mira use the same adapter and appearance but
remain Mira-owned. Public `MarkdownEmbed` uses the same App adapter and the
current Mira editor-extension resolution for standalone Markdown strings.
Those embed surfaces retain their explicit default-collapsed frontmatter input;
the document default in LN-MD-108 applies only to workspace note surfaces.

Backlinks and Outgoing Links retain this preview behavior when a legacy
view-type alias is restored. Canonicalization changes only persisted workspace
identity, not link resolution or preview ownership.

The shared link sidebar rebuilds mention groups under `LN-MD-098` after late
metadata load or a new followed path, then applies this preview contract to those rows.
Linked rows come from indexed incoming or outgoing link queries plus async
per-file metadata. Unlinked candidates come from bounded Search queries, so
the panel never walks the vault-wide synchronous cache or every note body.
Outgoing candidate discovery tokenizes the active indexed Search document,
limits query and result counts, and reuses returned Search content. It MUST NOT
reread the active or candidate Markdown body when those documents are already
indexed.

## LN-MD-026 — Markdown package: adapt the Lapis vault, metadata cache, workspace

<a id="ln-md-026"></a>

**Requirement.** The Markdown package MUST adapt the Lapis vault, metadata cache, workspace navigation, and `EmbedRegistry` to Mira's public `MiraFileAdapter`. One App MUST reuse one adapter instance so preview effects do not churn.

## LN-MD-027 — Mira-owned internal-link previews

<a id="ln-md-027"></a>

**Requirement.** Ordinary internal links rendered by Mira in reading and live-preview modes MUST retain the Lapis `MiraFileAdapter` resolution, lazy preview, and navigation path while delegating timing, safe pointer handoff, owner-document mounting, collision placement, appearance, and topmost cross-pane paint to Mira's portable Bits UI `LinkPreview`. Lapis MUST NOT add a portal wrapper, source alias, or clipping workaround.

## LN-MD-028 — Lapis MiraFileAdapter: provide writeMarkdown through app.vault.modify for existing Markdown

<a id="ln-md-028"></a>

**Requirement.** The Lapis `MiraFileAdapter` MUST provide `writeMarkdown` through `app.vault.modify` for existing Markdown files and reject missing or non-Markdown targets.

## LN-MD-029 — Ordinary Mira note previews and link-panel FileEmbed: share minimal content-first chrome without a visible

<a id="ln-md-029"></a>

**Requirement.** Ordinary Mira note previews and link-panel `FileEmbed` previews MUST share minimal content-first chrome without a visible filename or path header. Rendered Markdown receives disclosure-safe inset, and editing uses a two-pixel focus-ring border.

## LN-MD-030 — Ordinary Mira note previews and link-panel FileEmbed: resolve the same Lapis-aligned Mira appearance

<a id="ln-md-030"></a>

**Requirement.** Ordinary Mira note previews and link-panel `FileEmbed` previews MUST resolve the same Lapis-aligned Mira appearance.

## LN-MD-054 — Reading mode and live preview: receive the Lapis Mira adapter so ordinary

<a id="ln-md-054"></a>

**Requirement.** Reading mode and live preview MUST receive the Lapis Mira adapter so ordinary internal note links and embeds use Mira's portable preview surfaces.

## LN-MD-055 — Backlinks and Outgoing Links previews: compose the public app-bound FileEmbed inside Design

<a id="ln-md-055"></a>

**Requirement.** Backlinks and Outgoing Links previews MUST compose the public app-bound `FileEmbed` inside Design Core Hover Card and Scroll Area instead of maintaining a private full-document preview. Their viewport-capped width defaults to 26rem.

## LN-MD-056 — Complete link-panel mention row: remain the clickable and focusable Trigger child

<a id="ln-md-056"></a>

**Requirement.** The complete link-panel mention row MUST remain the clickable and focusable Trigger child. Bits UI owns open/close timing, keyboard focus, pointer corridors, collision placement, and owner-document behavior; Lapis MUST NOT duplicate those mechanisms. The overlay remains topmost and interactive across constrained editors and floating panes.

## LN-MD-057 — Lapis Mira adapter: resolve source-relative links, read and watch Markdown

<a id="ln-md-057"></a>

**Requirement.** The Lapis Mira adapter MUST resolve source-relative links, read and watch Markdown, list files and headings, open workspace files, render registered embeds and images with cleanup, and decline unowned types for portable fallback.

## LN-MD-058 — Generic and direct embeds: preserve internal-embed, markdown-preview-surface--embedded, markdown-embed-surface, and data-markdown-embed. Editable

<a id="ln-md-058"></a>

**Requirement.** Generic and direct embeds MUST preserve `internal-embed`, `markdown-preview-surface--embedded`, `markdown-embed-surface`, and `data-markdown-embed`. Editable panel cards use embedded Markdown identifiers without fabricating the generic guided wrapper.

## LN-MD-059 — Ordinary Mira internal-link previews: become editable automatically. Backlinks and Outgoing Links

<a id="ln-md-059"></a>

**Requirement.** Ordinary Mira internal-link previews MUST become editable automatically. Backlinks and Outgoing Links MUST opt their public `FileEmbed` into the same `EditableMarkdownPreview` lifecycle and pin their Hover Card while editing.

## LN-MD-060 — Editable previews: enter toolbar-free live preview from a plain

<a id="ln-md-060"></a>

**Requirement.** Editable previews MUST enter toolbar-free live preview from a plain non-interactive click, debounce writes for 500ms, and flush on configured exits. Escape closes after a successful flush; failed writes retain an accessible dirty editor.

## LN-MD-061 — Direct document ![[file]] embeds: remain read-only. Lapis owns storage and Hover

<a id="ln-md-061"></a>

**Requirement.** Direct document `![[file]]` embeds MUST remain read-only. Lapis owns storage and Hover Card composition but MUST NOT copy Mira's editor, persistence coordinator, click filtering, or CodeMirror pipeline.

## LN-MD-062 — Editable panel FileEmbed: omit the embedded-note guide and retain

<a id="ln-md-062"></a>

**Requirement.** Editable panel `FileEmbed` MUST omit the embedded-note guide and retain a sticky top-right open-note action that stays visible while content scrolls and reserves normal-flow content space.

## LN-MD-063 — In edit mode, the preview viewport: constrain FileEmbed so CodeMirror owns vertical scrolling

<a id="ln-md-063"></a>

**Requirement.** In edit mode, the preview viewport MUST constrain `FileEmbed` so CodeMirror owns vertical scrolling. The outer Scroll Area MUST NOT clip an unconstrained editor or introduce a second scrollbar.

## LN-MD-064 — Editing cards: ignore hover departure and focus movement. Outside

<a id="ln-md-064"></a>

**Requirement.** Editing cards MUST ignore hover departure and focus movement. Outside pointer dismissal flushes and closes only after successful persistence; Escape remains keyboard dismissal, and failed saves keep the dirty editor open.

## LN-MD-065 — Mira-owned portaled previews and Lapis full-file Markdown: resolve the effective obsidian theme. Editable FileEmbed

<a id="ln-md-065"></a>

**Requirement.** Mira-owned portaled previews and Lapis full-file Markdown surfaces MUST resolve the effective `obsidian` theme. Editable `FileEmbed` and full-file surface roots MUST establish that theme explicitly so Mira descendants consume Lapis semantic appearance tokens instead of the portable fallback palette.

## LN-MD-066 — Local Obsidian alias layer: map Mira accent, focus, soft-accent, selection,

<a id="ln-md-066"></a>

**Requirement.** The local Obsidian alias layer MUST map Mira accent, focus, soft-accent, selection, and accent-foreground variables to design-core's Lapis semantic tokens. Preview-only inset MUST NOT affect nested live-edit frontmatter widgets.
