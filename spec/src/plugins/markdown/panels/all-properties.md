# All Properties

All Properties is a vault-wide property index. It does not require an active
Markdown document and is the reference implementation for movable panel
Storybook coverage.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-MD-016 | All Properties MUST provide a sort menu, toggleable search, type icons from registered widgets, and property context actions for rename, type changes, and delete. It MUST use `@lapis-notes/ui/sidebar-custom` menu primitives inside `MarkdownSidebarPanel` without remounting `Sidebar.Root` in the leaf. |
| LN-MD-088 | Selecting an All Properties row MUST invoke `search:open-search` with its escaped bracket-property query. Nested property rows MUST search their normalized property path. |
| LN-MD-020 | The package MUST export the real `AllProperties` Svelte component with `app: App` as its only input. Its Storybook stories MUST declare that component as Autodocs authority while rendering it through the persisted workspace shell in all six movable surfaces. Fixture-only panel kind and layout selection MUST remain outside args, Controls, and Properties. Each scenario MUST contain exactly one All Properties view, omit a visible Markdown document, retain seeded metadata, and verify sort and search behavior. |

The catalog details are governed by LN-CAT-022. The shared surface, Docs, source,
and placement rules live under [Workspace Shell / Panels](../../../workspace-shell/panels.md).
All Properties derives top-level names, nested paths, counts, and observed
types from indexed property facets. Bulk edits page only the files that contain
the selected property; loading and database failures remain explicit.
