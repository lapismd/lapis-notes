# Panels

Workspace panels are movable views. The Workspace Shell owns their destination
surfaces and geometry; individual plugins own only their content and behavior.
Markdown panel pages therefore build on this contract instead of repeating
placement or Storybook rules.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-018 | Workspace Markdown and Tags side panels MUST use shared `MarkdownSidebarPanel`: one `ScrollArea` with sticky in-viewport chrome (toolbar plus optional `@lapis-notes/ui/search` with white control fill), panel-action hover tokens for toolbar icons rather than ghost `--muted`, and shell layout tokens (`--markdown-sidebar-*` and `--header-height`). Every panel root and its consumer content MUST fill the complete `WorkspaceViewHost`, inherit the workspace font family, omit redundant shell title or metadata introduction copy, and use the established 0.75rem scale for panel list, tree, and result rows. Its root and sticky chrome MUST consume design-core's resolved `--ui-workspace-view-background` and `--ui-workspace-view-foreground` tokens. Design Core's `WorkspaceViewHost` is the placement-paint authority: body, bottom-panel, grouped-sidebar, mobile, floating, and standalone views use workspace paint (white in the light Lapis theme), while only ungrouped left and right sidebar views resolve to panel paint. Panels MUST remain placement-agnostic: no `data-workspace-surface` ancestry selectors, grouped resets, runtime leaf-parent inspection, cached placement, or placement props. An exceptional panel MAY override the view tokens on its own root for component-specific paint. View `getIcon()` MUST return Lucide short names for `WorkspaceIcon` (All Properties uses `archive`). Menu-style lists MAY wrap `sidebar-custom` `NestedProvider` without `Sidebar.Root`; their wrapper, Content, Menu, items, and collapsibles MUST normalize away the legacy fixed sidebar width. Simple lists use shell `__list` and `__row` helpers. |

## Surface ownership

- Design Core owns the surface identity, view host, surrounding sidebar or
  bottom-panel chrome, resolved foreground and background, and resize behavior.
- A panel root fills the host and stays transparent to that resolved paint.
  Panel code must not inspect workspace ancestry, cache placement, introduce a
  placement prop, or add surface-specific selectors.
- An exceptional panel may override the public view tokens on its own root only
  when its component contract genuinely requires different paint.
- Panel icons use Lucide short names through `WorkspaceIcon`. Content-specific
  icon requirements remain on the owning panel page.

## Layout and responsive behavior

- Panel roots, nested providers, menus, lists, collapsibles, and editor wrappers
  fill the available width and must not introduce horizontal panel scrolling.
- Sticky controls stay inside the panel's single scroll viewport. Surrounding
  shell headers and group chrome remain outside the panel implementation.
- Responsive acceptance resizes the owning workspace split through the real
  controller and restores it in all outcomes. A story must not constrain the
  panel component directly to manufacture a breakpoint.
- Tree panels align guides and disclosure geometry according to the explicit
  policy on their panel page. Counts and trailing row edges remain independent
  from start-edge indentation.

## Storybook coverage

The mapped Storybook requirements are LN-ED-020, LN-ED-021, LN-CAT-022, and
LN-CAT-023. Together they require each movable Markdown panel to demonstrate:

1. Middle (Top Tabs)
2. Stacked Tabs
3. Left Sidebar
4. Right Sidebar
5. Bottom Panel with real grouped-panel chrome
6. Sidebar As a Group with real sidebar-group chrome

Each story uses the smallest persisted shell that supports the panel, mounts
one real panel, and omits an unrelated document for vault-wide panels. The real
component is the Autodocs authority; harness-only kind and layout inputs do not
appear in Controls or Properties.

App-backed Docs canvases render as isolated 700px iframes with Storybook shell
padding removed. Every placement supplies consumer-usable Show Code derived
from its persisted layout, asserts the stable destination and nested
`WorkspaceViewHost`, and exercises the defining interaction. New placement
stories retain literal `visual-pending` metadata and independent future paths;
PNG baselines are not generated or approved without explicit review.
