# Panels / Context

Panel and domain surfaces embedding complete Markdown files use the public
file-surface provider rather than importing Markdown or Mira implementation
code. Consumer context does not move editor or persistence ownership. The
provider establishes the effective Mira `obsidian` theme at its root so both
preview and live-edit descendants resolve the Lapis semantic appearance layer.

Workspace panels are movable views. The Workspace Shell owns their destination
surfaces and geometry; individual plugins own only their content and behavior.
Markdown panel pages therefore build on this contract instead of repeating
placement or Storybook rules. Public `MarkdownEmbed` is an in-bubble string
preview, keeps its explicit collapsed frontmatter default, and is not a movable
workspace panel. Mira's inline Reading outline is likewise not the movable
Outline panel.
File Properties value suggestions may portal to the owner document to escape
panel overflow, while their trigger, focus return, and data source remain owned
by the panel's App-backed Markdown surface.

Plugin view aliases are a load-time API compatibility concern. Once a legacy or
previously unavailable view resolves, workspace serialization uses the opened
view's canonical `getViewType()` without moving registry policy into the shell.

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

The mapped Storybook requirements are LN-ED-020, LN-ED-021, LN-CAT-022,
LN-CAT-023, LN-CAT-075, LN-CAT-109, LN-CAT-110, and LN-WS-090. Together they
require each command-access movable panel, including those owned by standalone
first-party plugins, to demonstrate:

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

- App-backed Docs canvases render as isolated 700px iframes with Storybook shell padding removed.

- The same shared Docs story dimensions apply to full `Workspace/Shell` and `Workspace/Lapis Editor Demo` examples.

- Every placement follows the repo-wide Show Code source contract in LN-CAT-024 through LN-CAT-026.

- Its source derives from the persisted layout, while the story asserts the stable destination and nested `WorkspaceViewHost` and exercises the defining interaction.

- New placement stories retain literal `visual-pending` metadata and independent future paths; PNG baselines are not generated or approved without explicit review.

- File Properties value autocomplete and wikilink resolution remain Markdown panel behavior over the shared host, not a new shell contract.

- Outline, Backlinks, and Outgoing Links follow `LN-MD-098` so a restored file-scoped panel paints after late metadata instead of staying empty.

- Same-path leaf events do not rewrite that follow state.

- Linked Backlinks and Outgoing Links query indexed link directions and hydrate only the returned source paths.

- They do not read `getAllItems()`, `fileCache`, `resolvedLinks`, or `unresolvedLinks` in first-party runtime code.

- An open Backlinks panel refreshes for committed metadata changes from any source path because the incoming-link set can change without modifying the followed note.

- Query errors remain in the owning panel until a later revision or retry completes successfully.
