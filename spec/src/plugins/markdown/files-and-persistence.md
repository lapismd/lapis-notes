# Markdown Plugin / Files and persistence

## LN-MD-001 — Independent Markdown package ownership

<a id="ln-md-001"></a>

**Requirement.** The sibling `lapis-plugins` repository MUST own and ship `@lapis-notes/markdown`; Lapis Notes MUST consume its public npm package and retain only application-profile and host integration contracts. Markdownlint remains separately governed by its owning package specification.

## LN-MD-013 — Markdown MetadataProcessor.write contract: serialize the frontmatter map passed by MetadataCache.writeFrontmatter

<a id="ln-md-013"></a>

**Requirement.** The Markdown `MetadataProcessor.write` contract MUST serialize the frontmatter map passed by `MetadataCache.writeFrontmatter`, not a nested `{ frontmatter }` wrapper.

## LN-MD-052 — Mira's inline fold controls: the only visible Markdown fold presentation. Rendered

<a id="ln-md-052"></a>

**Requirement.** Mira's inline fold controls MUST be the only visible Markdown fold presentation. Rendered frontmatter disclosure MUST collapse and expand its property content.

## LN-MD-083 — Grouped feature presentation: preserve every existing dotted feature key, default

<a id="ln-md-083"></a>

**Requirement.** Grouped feature presentation MUST preserve every existing dotted feature key, default, and runtime gate. The configuration schema MUST remain flat and MUST NOT register or persist a `markdown.mira.features` group object.

## LN-MD-091 — Markdown file leaf: receive a serialized return target containing

<a id="ln-md-091"></a>

**Requirement.** A Markdown file leaf MAY receive a serialized return target containing a registered view type, label, icon, and state. While editing, the title action MUST restore that view in the same leaf, preserve the current file, support Mod+click in a right split, and leave Markdown Reading and Source controls available in the pane menu.

## LN-MD-094 — Exact-hunk patch tool ownership

<a id="ln-md-094"></a>

**Requirement.** Markdown MUST NOT register `notes_patch`. Unique exact-hunk replacement belongs to API `edit`. Invalid scope, conflicts, cancellation, and denial MUST leave the target file unchanged.

## LN-MD-100 — Bounded file-read tool ownership

<a id="ln-md-100"></a>

**Requirement.** Markdown MUST NOT register `notes_read`. Bounded scoped file reads belong to the API `read` tool.

## LN-MD-105 — Markdown: register the API full-file surface provider. It

<a id="ln-md-105"></a>

**Requirement.** Markdown MUST register the API full-file surface provider. It MUST mount the real `TFile`, preserve serialized Mira writes and dirty-buffer protection, expose enter, flush, exit, and dispose controls, and report editing-state changes.

## LN-MD-108 — Markdown.mira.frontmatter.defaultOpen: default to false and supply the initial

<a id="ln-md-108"></a>

**Requirement.** `markdown.mira.frontmatter.defaultOpen` MUST default to `false` and supply the initial frontmatter disclosure state for newly opened Live Preview and Reading surfaces. Manual disclosure changes MUST remain available. Explicit embed `frontmatterOpen` inputs MUST remain independent and default collapsed.

## LN-MD-111 — Portalled frontmatter property dropdowns

<a id="ln-md-111"></a>

**Requirement.** Frontmatter property controls in Live Preview and File Properties MUST expose Mira's standard portalled dropdown with a `Property type` submenu above Cut, Copy, Paste, and Remove. Each type choice MUST show its registered icon. Both menus MUST remain visible and hit-testable outside the property row and workspace viewport; types MUST NOT be flattened into a custom panel.

## LN-MD-097 — Markdown extractMetadata: run off the renderer thread

<a id="ln-md-097"></a>

**Requirement.** Markdown `extractMetadata` MUST run off the renderer thread through a worker. Vault I/O, link resolution, `$state` apply, and `AppDatabase` writes MUST stay on the main thread. `read()` MAY use the same parse synchronously when a worker is unavailable.
