# Storybook Catalog / Plugin scenarios

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

## LN-CAT-055 — Plugins/AI/Chat: demonstrate the public @lapis-notes/ai chat panel

<a id="ln-cat-055"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate the public `@lapis-notes/ai` chat panel with Fake runtime, including send/complete plus pending permission and agent-question Composer Drawer paths, explicit Show Code, and `visual-pending` nested-import baselines.

## LN-CAT-059 — Plugins/AI/Chat: demonstrate vault-scoped @ file mentions

<a id="ln-cat-059"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate vault-scoped `@` file mentions through the public composer trigger, using Fake runtime, public Show Code, and a `visual-pending` nested-import baseline.

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

## LN-CAT-071 — Plugins/AI/Shell: include deterministic Local Conversations, Agent Switching,

<a id="ln-cat-071"></a>

**Requirement.** `Plugins/AI/Shell` MUST include deterministic Local Conversations, Agent Switching, and Recovery scenarios. Agent Switching MUST reconstruct Codex to Cursor to Codex from mixed portable records, assert full then delta audit fields, show the effective in-place model change, and prove typed handoff content did not enter `transcript.jsonl`. `Plugins/AI/Panels/History` MUST cover the Explorer-style tree, active scope, archived option, highlighted search, centered search chrome, placement-neutral paint, public Show Code, and all six governed placements.

## LN-CAT-092 — Plugins/AI/Panels/History plays: assert the dimmed creation-folder path, Design Core

<a id="ln-cat-092"></a>

**Requirement.** `Plugins/AI/Panels/History` plays MUST assert the dimmed creation-folder path, Design Core tooltips on chrome actions, that selecting a History tree folder updates that path, and that folder counts share one trailing edge.

## LN-CAT-107 — Populated plugin-management stories: cover next-action tooltip copy for enabled

<a id="ln-cat-107"></a>

**Requirement.** Populated plugin-management stories MUST cover next-action tooltip copy for enabled and disabled switches, Browse Uninstall, static-profile Bundled state, the uninstall dialog's passive action styling, and a focused Disable-instead interaction that proves the plugin remains installed.

## LN-CAT-108 — Populated plugin-management stories: expose approximate download counts in Installed, Browse

<a id="ln-cat-108"></a>

**Requirement.** Populated plugin-management stories MUST expose approximate download counts in Installed, Browse, Updates, and details. Browse interaction MUST select `Most downloaded`, assert descending 30-day order, and preserve the existing filter composition.

## LN-CAT-083 — Plugins/AI/Shell Desktop: expose the plugin's Open Chat left-ribbon action

<a id="ln-cat-083"></a>

**Requirement.** `Plugins/AI/Shell` Desktop MUST expose the plugin's Open Chat left-ribbon action and prove activating it reuses the existing main-area chat leaf.

## LN-CAT-087 — Plugins/AI/Chat: demonstrate a Fake folder skill, reserved /help

<a id="ln-cat-087"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate a Fake folder skill, reserved `/help` grouping, and a reserved composer slash command through the public chat panel. The play MUST use public Show Code and MUST NOT require a live agent.

## LN-CAT-088 — Plugins/AI/Chat: demonstrate extension /open-daily-note and that disposing

<a id="ln-cat-088"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate extension `/open-daily-note` and that disposing the registration removes it. The play MUST use public Show Code and MUST NOT require a live agent.

## LN-CAT-090 — Plugins/AI/Chat: demonstrate a completed notes_search tool item

<a id="ln-cat-090"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate a completed `notes_search` tool item with Search-owned hit rows. A hit click MUST open that vault file while the chat panel remains. The play MUST use public Show Code and MUST NOT require a live agent.

## LN-CAT-091 — Plugins/AI/Shell: demonstrate two descendant conversations in a Command

<a id="ln-cat-091"></a>

**Requirement.** `Plugins/AI/Shell` MUST demonstrate two descendant conversations in a Command View; use the transcript scope control to select Vault root and assert Explorer follows; open a stored folder conversation and assert both chat and Explorer scope; then pin it and keep that transcript after the active file changes. The play MUST use public Show Code and MUST NOT require a live agent.
