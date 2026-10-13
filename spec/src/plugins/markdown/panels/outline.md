# Outline

Outline follows the active note and presents its headings as a navigable tree.

The persisted canonical view type is `outline`; `file:outline` remains a
load-only alias under `LN-MD-085`.

Late metadata and file restore for Outline are governed by `LN-MD-098` on the
[Markdown Panels](./index.md) page. The shared helper ignores a leaf event
that repeats the same followed path.
The helper hydrates headings through the async per-file database lookup and
sorts them by source offset. The view generation prevents a slower previous
file from replacing the current outline.

## LN-MD-022 — Outline: render cleaned headings as a nested collapsible

<a id="ln-md-022"></a>

**Requirement.** Outline MUST render cleaned headings as a nested collapsible tree with toggleable search, expand and collapse all, heading navigation, metadata refresh, selected-section tracking, and persisted `outline.autoScrollToCurrentSection` configuration defaulting to `false`.

## LN-MD-042 — Newly followed Outline file: start expanded while expansion choices remain stable

<a id="ln-md-042"></a>

**Requirement.** A newly followed Outline file MUST start expanded while expansion choices remain stable for the current file.

## LN-MD-043 — Outline: fill its WorkspaceViewHost, omit title and path

<a id="ln-md-043"></a>

**Requirement.** Outline MUST fill its `WorkspaceViewHost`, omit title and path introduction copy, inherit resolved view paint and workspace typography, and add no hash icon.

## LN-MD-044 — Outline leaf headings: Do not reserve disclosure space. Nested guides

<a id="ln-md-044"></a>

**Requirement.** Outline leaf headings MUST NOT reserve disclosure space. Nested guides remain beneath expanded chevron tips, leaf-child labels align with their immediate parent labels, child levels remain visibly indented, and rows preserve their trailing edge.
