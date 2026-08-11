# Outline

Outline follows the active note and presents its headings as a navigable tree.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-022 | Outline MUST render cleaned headings as a nested, collapsible tree with toggleable search, expand and collapse all, heading navigation, metadata refresh, selected-section tracking, and persisted `outline.autoScrollToCurrentSection` configuration defaulting to `false`. A newly followed file starts expanded while choices remain stable for the current file. The panel MUST fill its `WorkspaceViewHost`, omit title and path introduction copy, inherit resolved view paint and workspace typography, and add no hash icon. Leaf headings MUST NOT reserve disclosure space. Each nested guide remains under its expanded chevron tip, a leaf child's label aligns with its immediate parent label, child levels remain visibly indented, and every row preserves the trailing edge. |
