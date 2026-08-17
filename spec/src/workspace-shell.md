# Workspace Shell

The shell's reusable movable-view contract is documented separately under
[Panels](./workspace-shell/panels.md). This overview retains controller,
persistence, and application-host responsibilities.

## Requirements

| ID        | Requirement                                                                                                                                                                                                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-WS-001 | The design-core `AppShellController` MUST be the live layout engine rendered by `@lapis-notes/workspace`; the api workspace tree MUST act as a stable compatibility projection rather than a separate renderer.                                                                                                      |
| LN-WS-002 | Existing Lapis `Workspace`, split, tabs, sidebar, window, and leaf public signatures and observable behavior MUST remain compatible. Wrapper identity SHOULD be preserved by serialized node id across controller projections.                                                                                       |
| LN-WS-003 | `@lapis-notes/api/workspace-host` MUST be the only public host integration subpath and MUST return the api-owned design-core controller without adding design-core types to the root compatibility export.                                                                                                           |
| LN-WS-004 | Layout loading and saving MUST remain owned by the api workspace: normalize the existing Lapis JSON shape, read `/.obsidian/<requested-file>`, and write `/.obsidian/workspace.json` through the owning api instance's existing 1000 ms debounce with one writer.                                                    |
| LN-WS-005 | Api mutations MUST commit to the design-core controller, and controller-originated layout changes MUST project back into api wrappers, lifecycle state, legacy events, and persistence without feedback loops. Projection reconciliation MUST remove against a child snapshot so no stale node survives mutation.    |
| LN-WS-006 | Api view registration MUST expose registered Lapis views to design-core through imperative view definitions while retaining Lapis view creation, state, load, mount, unload, history, and missing-view behavior. Each imperative compatibility root MUST fill its Design Core view host without depending on a host-global utility stylesheet. Each transition MUST remove the previous view root before mounting the next while reattaching the shared `ItemView` content element when required. The `empty` type MUST use design-core's built-in visual empty view. |
| LN-WS-007 | The shell MUST render design-core's default desktop and mobile chrome. It MUST NOT call the Lapis plugin loader or install Lapis/community plugins. The design-core notifications presentation is the only required static shell plugin. F-Mode MAY be present as an optional static plugin. |
| LN-WS-008 | `WorkspaceShell` MUST accept `app`, optional `displayMode`, `workspaceLabel`, generic `workspaceNavigation`, and `class`, and MUST mount `AppShell.Root` with `autoStart={false}` because application and layout boot remain consumer-owned. It MUST forward navigation presentation without discovering profiles or owning selection policy. |
| LN-WS-009 | Storybook MUST provide persisted desktop and mobile shell stories backed by an actual api `App` and a story-only in-memory data adapter seeded at `/.obsidian/workspace.json`.                                                                                                                                       |
| LN-WS-010 | New workspace stories MUST include interaction and accessibility assertions, including theme-sensitive hover contrast for shell actions on sidebar-coloured surfaces and floating-window headers; they MUST carry `visual-pending` and ship nested-import Visual Delta baselines without rewriting existing API baselines.                       |
| LN-WS-011 | The api-owned controller MUST expose Lapis application metadata to design-core so the status version action and About dialog render the application name, runtime version, and Lapis logo. Host overrides MUST remain plain api properties rather than leaking design-core types into the root compatibility export. |
| LN-WS-012 | Stacked workspace panes MUST use the public design-core stacked-pane width as their preferred width before container min/max clamping, so empty and content-rich views have the same horizontal overflow and selected-tab scrolling behavior.                                                                        |
| LN-WS-013 | Workspace Storybook canvases MUST occupy the complete available story viewport. |
| LN-WS-014 | Desktop top and stacked main-workspace panes MUST expose design-core's pane-level maximize toggle beside tab options. Its focused state MUST use primary paint and restore the pane when activated again; the retired focus-mode exit X MUST NOT be rendered. Top-tab add, maximize, and options actions MUST retain compact reserved hit areas before titles shrink or scroll. Floating size controls MUST use matching Lucide maximize/minimize glyphs. |
| LN-WS-015 | The api façade MUST preserve design-core's V3 bottom-panel tabs, groups, open state, height, active leaf, events, and view lifecycle through a stable Lapis-native wrapper. It MUST expose bottom-leaf creation and panel open, size, toggle, and alignment controls while rejecting focus mode and split-edge operations for bottom-panel leaves. |
| LN-WS-016 | Bottom-panel layout changes MUST round-trip through the existing api-owned 1000 ms workspace writer. Design-core settings MUST persist separately through api configuration with atomic writes and no layout/configuration feedback loop.                                                                                          |
| LN-WS-017 | Story-only Lapis imperative views MUST remain mounted through the API view bridge and visibly consume the live design-core `showInlineTitle` setting in their tab bodies, so shell settings demonstrate a view-supported inline title without adding production settings persistence. |
| LN-WS-018 | API editor-view registrations MUST project into the design-core controller registry so shell Editor Associations options match API path resolution and plugin teardown.                                                                                                                                                |
| LN-WS-019 | The editor demo consumer MUST render the shell only after vault, configuration, required plugins, and layout boot successfully. Retry and story teardown MUST synchronously unload and destroy retained editors before asynchronous plugin/controller disposal, then release its compatibility lease. |
| LN-WS-020 | API imperative file-view chrome MUST project parent-path breadcrumbs and leaf back/forward history into design-core `WorkspaceViewHeader` via `getChrome`, while non-file views MAY omit breadcrumbs or contribute them through View breadcrumb hooks. A history-enabled first navigation MUST snapshot the initiating leaf before target-view construction so Back restores it. Repeated equivalent states MUST NOT consume an extra Back step. |
| LN-WS-021 | design-core `WorkspaceViewHeader` MUST shrink/clip parent-path breadcrumbs before the final title when space is tight (prefer showing path segments nearest the title), and MUST support in-place title rename through `titleEditable` / `onTitleCommit` without hiding breadcrumbs or changing header layout. |
| LN-WS-022 | Mobile Workspace stories MUST exercise the responsive shell across the available canvas rather than mounting an artificial fixed-width device card. |
| LN-WS-023 | Full-shell Autodocs for `Workspace/Shell` and `Workspace/Lapis Editor Demo` MUST share the isolated 700px story height used by movable panels and remove Storybook shell padding. |
| LN-WS-024 | Authored shell MDX MUST identify every scenario and render its canonical Storybook description immediately before the corresponding canvas. |
| LN-WS-049 | `WorkspaceShell` MUST map persisted `editor.alwaysFocusNewTabs` into Design Core's user-created-tab activation policy, defaulting to background creation while leaving explicit application opens unchanged. |
| LN-WS-053 | The `@lapis-notes/workspace` package MUST publish `WorkspaceShell` as a versioned shell adapter so separately versioned plugin catalogs can render an initialized public `App` without copying the AppShell composition. |
| LN-WS-054 | API compatibility ribbon registrations and reactive status-bar descriptors MUST project into the API-owned Design Core shell registries. Projection MUST preserve identifiers, icons, labels, alignment, priority, commands, menus, updates, and plugin teardown without introducing a second plugin-facing registration contract. |
| LN-WS-055 | Every workspace root MUST bind to its owning `Workspace`; leaves and views MUST derive App through that ownership chain. `WorkspaceShell` MUST provide its required App to descendant Svelte components without making compatibility state authoritative. |
| LN-WS-057 | Default shells MUST include Design Core `fModePlugin({ enabled: false })` on the API-owned controller. AppShell enablement MUST persist through Design Core `persistence.plugins`. Missing persistence MUST keep F-Mode disabled. Plugin-state load and save MUST resolve the App vault when they run. |
| LN-WS-058 | Default desktop shells MUST show Design Core's built-in Settings action in the left ribbon bottom while the ribbon is visible. Activating it MUST open the same settings dialog as the sidebar trigger. |
| LN-WS-059 | When `loadLayout` finds no workspace file, the workspace MUST seed registered default sidebar views: left `file-explorer` then `search`; right `outline`, `file-properties`, then `tag`. It MUST open those docks, keep one empty main New Tab and a closed bottom dock, omit unregistered types, and MUST NOT write `workspace.json` during that seed. |
| LN-WS-060 | The workspace MUST register Save workspace layout and Load workspace layout commands. Those commands MUST persist and restore named layouts in `.obsidian/workspaces.json` while the live layout continues to write `workspace.json`. |
| LN-WS-061 | The workspace MUST register a Reset workspace layout command. Confirming it MUST apply the same default sidebar seed as a missing workspace file and persist the result to `workspace.json`. |

## Ownership and data flow

1. The consumer creates and boots the api `App`, vault, and workspace, then
   provides that App to the shell's descendant context.
2. The api workspace owns one `AppShellController` and hydrates it from the
   normalized Lapis workspace JSON.
3. `WorkspaceShell` renders that controller through design-core `AppShell`.
4. Api calls commit compatibility JSON, including the bottom panel, into the controller. Design-core UI
   events project controller JSON into stable api wrappers and schedule the
   existing api persistence writer.
5. Registered Lapis views mount through imperative design-core view hosts;
   design-core renders the built-in empty state directly.
6. The api configures built-in application/version metadata and the minimal
   design-core notifications presentation without invoking the Lapis plugin
   loader.

Views and leaves derive App from their owning workspace. Compatibility state is
never consulted when that ownership chain or the shell context is available.

Design-core's public workspace controller, legacy JSON bridge, imperative view
registry, and default shell surface are the dependency boundary. The shared
stacked-tabs stylesheet owns the preferred-width behavior; consumers MUST NOT
fork or override that layout logic locally.

Focus-mode presentation is also design-core-owned. The consumer verifies the
public maximize/restore control in both top and stacked stories but does not add
local buttons, focus state, compact action geometry, or paint overrides.

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

The bottom panel is projected as one top-level tabs wrapper rather than a
recursive split. Center tab and group moves are supported; split-edge and focus
mode operations remain restricted to the main workspace. Built-in shell settings
use design-core's controller directly and do not share the workspace JSON writer.
Default desktop chrome shows that Settings action in the left ribbon bottom
while the ribbon is visible. A missing workspace file seeds File Explorer then
Search on the left and Outline, File Properties, then Tags on the right when
those views are registered, without writing workspace.json during that seed.
Save and Load workspace layout commands store named snapshots in
`.obsidian/workspaces.json`. Reset workspace layout reapplies that default seed
and then persists `workspace.json`.
The controller's settings persistence delegates to atomic API configuration
batches. Successful API updates reconcile matching controller fields, while
equality checks and unchanged-batch elision prevent a persistence feedback
write. API editor-view updates replace the corresponding controller registry
entry exactly, including filename-pattern removal and plugin disposal.
Storybook's editor-demo consumer owns the real startup sequence. It does not
mount the shell until the sequence completes, and retry follows the same
deterministic teardown path as story disposal before rebuilding from the
canonical seed.
