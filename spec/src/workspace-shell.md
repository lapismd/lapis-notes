# Workspace Shell

## Requirements

| ID        | Requirement                                                                                                                                                                                                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-WS-001 | The design-core `AppShellController` MUST be the live layout engine rendered by `@lapis-notes/workspace`; the api workspace tree MUST act as a stable compatibility projection rather than a separate renderer.                                                                                                      |
| LN-WS-002 | Existing Lapis `Workspace`, split, tabs, sidebar, window, and leaf public signatures and observable behavior MUST remain compatible. Wrapper identity SHOULD be preserved by serialized node id across controller projections.                                                                                       |
| LN-WS-003 | `@lapis-notes/api/workspace-host` MUST be the only public host integration subpath and MUST return the api-owned design-core controller without adding design-core types to the root compatibility export.                                                                                                           |
| LN-WS-004 | Layout loading and saving MUST remain owned by the api workspace: normalize the existing Lapis JSON shape, read `/.obsidian/<requested-file>`, and write `/.obsidian/workspace.json` through the owning api instance's existing 1000 ms debounce with one writer.                                                    |
| LN-WS-005 | Api mutations MUST commit to the design-core controller, and controller-originated layout changes MUST project back into api wrappers, lifecycle state, legacy events, and persistence without feedback loops. Projection reconciliation MUST remove against a child snapshot so no stale node survives mutation.    |
| LN-WS-006 | Api view registration MUST expose registered Lapis views to design-core through imperative view definitions while retaining Lapis view creation, state, load, mount, unload, history, and missing-view behavior. The `empty` type MUST use design-core's built-in visual empty view.                                 |
| LN-WS-007 | The shell MUST render design-core's default desktop and mobile chrome. It MUST NOT call the Lapis plugin loader or install Lapis/community plugins; the design-core notifications presentation is the only required static shell plugin.                                                                             |
| LN-WS-008 | `WorkspaceShell` MUST accept `app`, optional `displayMode`, `workspaceLabel`, and `class`, and MUST mount `AppShell.Root` with `autoStart={false}` because application and layout boot remain consumer-owned.                                                                                                        |
| LN-WS-009 | Storybook MUST provide persisted desktop and mobile shell stories backed by an actual api `App` and a story-only in-memory data adapter seeded at `/.obsidian/workspace.json`.                                                                                                                                       |
| LN-WS-010 | New workspace stories MUST include interaction and accessibility assertions, carry `visual-pending`, and ship nested-import Visual Delta baselines without rewriting existing API baselines.                                                                                                                         |
| LN-WS-011 | The api-owned controller MUST expose Lapis application metadata to design-core so the status version action and About dialog render the application name, runtime version, and Lapis logo. Host overrides MUST remain plain api properties rather than leaking design-core types into the root compatibility export. |
| LN-WS-012 | Stacked workspace panes MUST use the public design-core stacked-pane width as their preferred width before container min/max clamping, so empty and content-rich views have the same horizontal overflow and selected-tab scrolling behavior.                                                                        |
| LN-WS-013 | Workspace Storybook canvases MUST occupy the complete story viewport in desktop and mobile modes. Mobile mode MUST exercise the responsive shell across the available canvas rather than mounting an artificial fixed-width device card.                                                                             |

## Ownership and data flow

1. The consumer creates and boots the api `App`, vault, and workspace.
2. The api workspace owns one `AppShellController` and hydrates it from the
   normalized Lapis workspace JSON.
3. `WorkspaceShell` renders that controller through design-core `AppShell`.
4. Api calls commit compatibility JSON into the controller. Design-core UI
   events project controller JSON into stable api wrappers and schedule the
   existing api persistence writer.
5. Registered Lapis views mount through imperative design-core view hosts;
   design-core renders the built-in empty state directly.
6. The api configures built-in application/version metadata and the minimal
   design-core notifications presentation without invoking the Lapis plugin
   loader.

Design-core's public workspace controller, legacy JSON bridge, imperative view
registry, and default shell surface are the dependency boundary. The shared
stacked-tabs stylesheet owns the preferred-width behavior; consumers MUST NOT
fork or override that layout logic locally.

The compatibility projection reuses split, tabs, group, window, and leaf
objects by serialized id. Api-origin changes are committed under a bridge guard;
controller-originated changes are projected asynchronously under persistence
suppression and emit one legacy layout-change/save request after reconciliation.
Projection teardown iterates snapshots of mutable child collections and keeps
projection identity state local to the workspace reconciliation, so removed tabs
cannot survive and separate api `App` instances cannot interfere with one another.
Persistence suppression remains active through the Svelte effect flush for each
queued projection so compatibility-only sidebar effects cannot write an older
layout back over a newer controller mutation.
