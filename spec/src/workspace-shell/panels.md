# Panels

Panel and domain surfaces embedding complete Markdown files use the public
file-surface provider rather than importing Markdown or Mira implementation
code. Consumer context does not move editor or persistence ownership. The
provider establishes the effective Mira `obsidian` theme at its root so both
preview and live-edit descendants resolve the Lapis semantic appearance layer.

Workspace panels are movable views. The Workspace Shell owns their destination
surfaces and geometry; individual plugins own only their content and behavior.
Markdown panel pages therefore build on this contract instead of repeating
placement or Storybook rules. Public `MarkdownEmbed` is an in-bubble string
preview and is not a movable workspace panel.

Plugin view aliases are a load-time API compatibility concern. Once a legacy or
previously unavailable view resolves, workspace serialization uses the opened
view's canonical `getViewType()` without moving registry policy into the shell.

## Requirements

| ID        | Requirement                                                                                                                                                                                                                                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-MD-018 | Workspace Markdown and Tags side panels MUST use the shared `MarkdownSidebarPanel`. It MUST provide one `ScrollArea`, sticky in-viewport chrome, an optional `@lapis-notes/ui/search` control with white fill, panel-action hover tokens for toolbar actions, and the `--markdown-sidebar-*` and `--header-height` shell layout tokens.                                            |
| LN-MD-032 | Every panel root and its consumer content MUST fill the complete `WorkspaceViewHost`, inherit the workspace font family, omit redundant shell title or metadata introduction copy, and use the established 0.75rem scale for panel list, tree, and result rows.                                                                                                                    |
| LN-MD-033 | Panel roots and sticky chrome MUST consume design-core's resolved `--ui-workspace-view-background` and `--ui-workspace-view-foreground` tokens. `WorkspaceViewHost` MUST remain the placement-paint authority: body, bottom panel, grouped sidebar, mobile, floating, and standalone views use workspace paint, while only ungrouped left and right sidebar views use panel paint. |
| LN-MD-034 | Panels MUST remain placement-agnostic and MUST NOT inspect workspace ancestry, reset grouped paint, inspect leaf parents at runtime, cache placement, or accept placement props. An exceptional panel MAY override the public view tokens on its own root for component-specific paint.                                                                                            |
| LN-MD-035 | View `getIcon()` MUST return a Lucide short name for `WorkspaceIcon`; All Properties uses `archive`. Menu-style lists MAY wrap `sidebar-custom` `NestedProvider` without `Sidebar.Root`, but the wrapper, Content, Menu, items, and collapsibles MUST remove the legacy fixed sidebar width. Simple lists use the shell `__list` and `__row` helpers.                              |
| LN-WS-050 | Every canonical movable panel view MUST declare `ViewAccess.command` and receive one discoverable application opener from that registration.                                                                                                                                                                                                                                       |
| LN-WS-051 | A panel-opening command MUST activate and reveal existing leaves wherever the panel was moved. When none exists, it MUST create, activate, and reveal the canonical view in its documented default surface.                                                                                                                                                                        |
| LN-WS-052 | Load-only compatibility view aliases MUST declare `ViewAccess.alias`, reuse their canonical panel command, and MUST NOT add duplicate user-facing commands.                                                                                                                                                                                                                        |

## Surface ownership

- Design Core owns the surface identity, view host, surrounding sidebar or
  bottom-panel chrome, resolved foreground and background, and resize behavior.
- A panel root fills the host and stays transparent to that resolved paint.
  Panel code must not inspect workspace ancestry, cache placement, introduce a
  placement prop, or add surface-specific selectors.
- A panel view receives App from its owning workspace leaf and passes it to
  app-only content; ambient compatibility state is not a panel data source.
- An exceptional panel may override the public view tokens on its own root only
  when its component contract genuinely requires different paint.
- Panel icons use Lucide short names through `WorkspaceIcon`. Content-specific
  icon requirements remain on the owning panel page.

## Layout and responsive behavior

- Panel roots, nested providers, menus, lists, collapsibles, and editor wrappers
  fill the available width and must not introduce horizontal panel scrolling.
- Sticky controls stay inside the panel's single scroll viewport. Surrounding
  shell headers and group chrome remain outside the panel implementation.
- Cross-panel navigation uses registered app commands or workspace APIs. A
  panel does not import another panel plugin's implementation to change views.
- Register a canonical panel view and its opening command through one
  auditable declaration. The command reveals a moved instance before creating
  the canonical view in its default surface; load-only aliases share that
  command.
- Responsive acceptance resizes the owning workspace split through the real
  controller and restores it in all outcomes. A story must not constrain the
  panel component directly to manufacture a breakpoint. Ordinary Mira
  document-link previews must keep one adapter instance per App across that
  resize.
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
padding removed. The same shared Docs story dimensions apply to full
`Workspace/Shell` and `Workspace/Lapis Editor Demo` examples. Every placement
follows the repo-wide Show Code source contract in LN-CAT-024 through
LN-CAT-026. Its source derives from the persisted layout, while the story
asserts the stable destination and nested `WorkspaceViewHost` and exercises the
defining interaction. New placement stories retain literal `visual-pending`
metadata and independent future paths; PNG baselines are not generated or
approved without explicit review.
File Properties value autocomplete and wikilink resolution remain Markdown
panel behavior over the shared host, not a new shell contract.
Outline, Backlinks, and Outgoing Links follow `LN-MD-098` so a restored
file-scoped panel paints after late metadata instead of staying empty.
Same-path leaf events do not rewrite that follow state.
Linked Backlinks and Outgoing Links query indexed link directions and hydrate
only the returned source paths. They do not read `getAllItems()`, `fileCache`,
`resolvedLinks`, or `unresolvedLinks` in first-party runtime code.
An open Backlinks panel refreshes for committed metadata changes from any source
path because the incoming-link set can change without modifying the followed
note. Query errors remain in the owning panel until a later revision or retry
completes successfully.
