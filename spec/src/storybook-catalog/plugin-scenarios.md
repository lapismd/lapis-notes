# Storybook Catalog / Plugin scenarios

LN-SRCH-051 adds one metadata-only specification mirror for the Search/Problems provider boundary. Catalog runtime, harnesses, interaction setup and visual approval contracts are unchanged.

Plugin Management and Workspace/Plugins include `visual-pending` review stories
for LN-PLUG-132/134. Their plays cover selectable bulk-update/install Command
Views, the Installed homepage section, the removable Installed directory filter
and card-level update/uninstall actions before broader host acceptance resumes.

## LN-CAT-011 — Workspace/Shell: document the @lapis-notes/workspace integration with persisted desktop

<a id="ln-cat-011"></a>

**Requirement.** `Workspace/Shell` MUST document the `@lapis-notes/workspace` integration with persisted desktop and mobile stories linked to `workspace-shell.md`.

## LN-CAT-014 — Workspace shell stories: cover the persisted desktop and mobile shells

<a id="ln-cat-014"></a>

**Requirement.** Workspace shell stories MUST cover the persisted desktop and mobile shells, the populated notification center, the Lapis About dialog, and stacked empty tabs whose scroll width and selected-tab movement match design-core.

## LN-CAT-028 — All Properties stories: use the smallest real persisted Lapis shell

<a id="ln-cat-028"></a>

**Requirement.** All Properties stories MUST use the smallest real persisted Lapis shell that keeps one panel instance as the visual and interaction subject.

## LN-CAT-029 — All Properties play: assert the stable destination host, nested WorkspaceViewHost

<a id="ln-cat-029"></a>

**Requirement.** Each All Properties play MUST assert the stable destination host, nested `WorkspaceViewHost`, and resolved paint inherited by the panel and sticky chrome.

## LN-CAT-033 — Direct Lucide entry points used by governed: included in Storybook dependency optimization so clean

<a id="ln-cat-033"></a>

**Requirement.** Direct Lucide entry points used by governed panel and plugin-management stories, including empty-state illustrations and the uninstall dialog Power action, MUST be included in Storybook dependency optimization so clean browser tests do not reload during rendering.

## LN-CAT-120 — Version-specific UI dependency prebundling

<a id="ln-cat-120"></a>

**Requirement.** Storybook and its browser tests MUST prebundle the `tailwind-merge` instance owned by source-aliased Notes UI independently of the instances owned by API, Design Core and Mira. A frozen registry dependency update MUST NOT trigger a late helper optimization that reloads an active browser test.

## LN-CAT-034 — Retirement of flat comparison stories

<a id="ln-cat-034"></a>

**Requirement.** The retired flat dual-panel comparison stories MUST NOT remain in the Storybook catalog.

## LN-CAT-035 — Movable-panel stories: retain literal visual-pending tags and independent nested-import

<a id="ln-cat-035"></a>

**Requirement.** Movable-panel stories MUST retain literal `visual-pending` tags and independent nested-import baseline paths until human review. Baseline capture MAY remain deferred when visual testing is explicitly excluded.

## LN-CAT-036 — Bottom Panel and Sidebar As A Group: use the real grouped-panel and sidebar-group chrome

<a id="ln-cat-036"></a>

**Requirement.** Bottom Panel and Sidebar As A Group stories MUST use the real grouped-panel and sidebar-group chrome.

## LN-CAT-049 — Plugins/Bases/Views: cover table, editable cells with text-

<a id="ln-cat-049"></a>

**Requirement.** `Plugins/Bases/Views` MUST cover table, editable cells with text- and chrome-targeted edit mode, blur-dismissed autocomplete, a continuous active boundary, centered 1rem checkboxes, white on-accent glyphs, wrapped rows, a full-height shadcn Scroll Area without bottom or inline-end container frames but with a final-row separator, anchored filter selects, aligned value editors, highlighted expressions, filter width and leading right/down disclosure indicators, live resize and scroll alignment, cards, grouped list, map-unavailable, and unknown layouts.

## LN-CAT-056 — Plugins/Bases/Workflows: cover query controls, schema and view settings

<a id="ln-cat-056"></a>

**Requirement.** `Plugins/Bases/Workflows` MUST cover query controls, schema and view settings, and persisted typed metadata editing.

## LN-CAT-057 — Focused Bases Editable Cells story: hit-test the AND/OR and operator Select portals

<a id="ln-cat-057"></a>

**Requirement.** The focused Bases Editable Cells story MUST hit-test the AND/OR and operator Select portals above the enclosing filter panel and MUST prove the first Add Filter activation increments the visible predicate count.

## LN-CAT-058 — Focused Bases Editable Cells story: hit-test the filter panel above each intersecting

<a id="ln-cat-058"></a>

**Requirement.** The focused Bases Editable Cells story MUST hit-test the filter panel above each intersecting sticky table header before exercising nested filter menus.

## LN-CAT-064 — Real Bases editor-shell story: retain Search while starting and finishing

<a id="ln-cat-064"></a>

**Requirement.** The real Bases editor-shell story MUST retain Search while starting and finishing with the right sidebar collapsed. Its interaction MUST open the sidebar between those assertions and verify the indexed query and result before restoring the collapsed final state.

## LN-CAT-107 — Populated plugin-management stories: cover next-action tooltip copy for enabled

<a id="ln-cat-107"></a>

**Requirement.** Populated plugin-management stories MUST cover next-action tooltip copy for enabled and disabled switches, Browse Uninstall, static-profile Bundled state, the uninstall dialog's passive action styling, and a focused Disable-instead interaction that proves the plugin remains installed.

## LN-CAT-108 — Populated plugin-management stories: expose approximate download counts in Installed, Browse

<a id="ln-cat-108"></a>

**Requirement.** Populated plugin-management stories MUST expose approximate download counts in Installed, Browse, Updates, and details. Browse interaction MUST select `Most downloaded`, assert descending 30-day order, and preserve the existing filter composition.

Shared file-conflict presentation imports its retained action/setting icons
through the public icon package. The existing eager dependency inventory includes
those entries so the first cold review cannot trigger Vite re-optimization and
invalidate unrelated in-flight Editing Recovery stories (LN-CAT-033). No
startup/reload guard is relaxed; its real-App family is declared application in
the existing parity inventory and retains `visual-pending` metadata.

The explicit disk-deletion regression refreshes the existing captured conflict,
accepts its absent disk snapshot and proves that no empty file is recreated.
The Undo action icon is eager so this first cold render cannot reload tests.
