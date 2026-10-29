# Workspace Shell / Layout and persistence

Foreground App file navigation joins the same projection-aware reveal as
explicit view navigation. LN-WS-005 retains its original revision fence;
opening a note preserves a non-file tab and selects its intended main tab.
The same LN-WS-005/062 fence covers a projection already awaiting plugin/view
activation when a later explicit same-type query/scope transition completes.

## LN-WS-001 — Design Core layout engine

<a id="ln-ws-001"></a>

**Requirement.** The design-core `AppShellController` MUST be the live layout engine rendered by `@lapis-notes/workspace`; the api workspace tree MUST act as a stable compatibility projection rather than a separate renderer.

## LN-WS-002 — Compatible workspace wrapper identity

<a id="ln-ws-002"></a>

**Requirement.** Existing Lapis `Workspace`, split, tabs, sidebar, window, and leaf public signatures and observable behavior MUST remain compatible. Projection MUST reuse wrappers by serialized node id so grouped and main-tab leaves keep the same instance. Reconciliation MUST preserve a claimed single-panel sidebar group while its child is removed and reattached softly.

## LN-WS-062 — Persisted leaf view state

<a id="ln-ws-062"></a>

**Requirement.** Each persisted leaf record MUST include that leaf's view type and live `view.getState()` snapshot. `loadJson` and controller projection MUST NOT apply an empty or poorer snapshot onto a claimed leaf of the same type.

## LN-WS-070 — File-open event ordering

<a id="ln-ws-070"></a>

**Requirement.** `WorkspaceLeaf.openFile` MUST trigger `file-open` with the opened file after `onLoadFile` succeeds. It MUST fire even when layout persistence is suppressed.

## LN-WS-071 — Restoration of non-file views

<a id="ln-ws-071"></a>

**Requirement.** `WorkspaceLeaf.open` MUST load a non-file view even when persisted state includes a `file` path. It MUST call `openFile` only when that view is a `FileView`.

## LN-WS-003 — Public workspace-host integration boundary

<a id="ln-ws-003"></a>

**Requirement.** `@lapis-notes/api/workspace-host` MUST be the only public host integration subpath and MUST return the api-owned design-core controller without adding design-core types to the root compatibility export.

## LN-WS-004 — API-owned layout persistence

<a id="ln-ws-004"></a>

**Requirement.** Layout loading and saving MUST remain owned by the api workspace: normalize the existing Lapis JSON shape, read `/.lapis/<requested-file>`, and write `/.lapis/workspace.json` through the owning api instance's existing 1000 ms debounce with one writer.

## LN-WS-095 — Awaitable layout persistence

<a id="ln-ws-095"></a>

**Requirement.** `Workspace.flushLayout` MUST await pending controller projections and serialized layout writes, persist the latest live state without waiting for the debounce, and reject on persistence failure. A later flush MUST permit retry. Explicit flush and disposal MUST cancel obsolete timers; disposal MUST join accepted writes before releasing the host. Background write failures MUST remain observable without unhandled rejections.

## LN-WS-005 — Bidirectional controller synchronization

<a id="ln-ws-005"></a>

**Requirement.** Api mutations MUST commit to the design-core controller, and controller-originated layout changes MUST project back into api wrappers, lifecycle state, legacy events, and persistence without feedback loops. Projection reconciliation MUST remove against a child snapshot so no stale node survives mutation. A queued controller snapshot MUST NOT replace a newer explicit API view transition or activation before it is applied. Revealing a leaf MUST join in-flight projection and commit its selection unless superseded by newer navigation.

## LN-WS-008 — WorkspaceShell public inputs

<a id="ln-ws-008"></a>

**Requirement.** `WorkspaceShell` MUST accept `app`, optional `displayMode`, `workspaceLabel`, generic `workspaceNavigation`, optional `popoutHost`, and `class`, and MUST mount `AppShell.Root` with `autoStart={false}` because application and layout boot remain consumer-owned. It MUST forward navigation presentation without discovering profiles or owning selection policy.

## LN-WS-009 — Persisted desktop and mobile stories

<a id="ln-ws-009"></a>

**Requirement.** Storybook MUST provide persisted desktop and mobile shell stories backed by an actual api `App` and a story-only in-memory data adapter seeded at `/.lapis/workspace.json`. Navigation acceptance MUST wait for menu close completion, the host callback outcome and restored pointer ownership before continuing.

## LN-WS-011 — Application metadata in shell chrome

<a id="ln-ws-011"></a>

**Requirement.** The api-owned controller MUST expose Lapis application metadata to design-core so the status version action and About dialog render the application name, runtime version, and Lapis logo. Host overrides MUST remain plain api properties rather than leaking design-core types into the root compatibility export.

## LN-WS-016 — Debounced bottom-panel persistence

<a id="ln-ws-016"></a>

**Requirement.** Bottom-panel layout changes MUST round-trip through the existing api-owned 1000 ms workspace writer. Design-core settings, including `appearence.interface.scrollbarVisibility`, MUST persist separately through api configuration with atomic writes and no layout/configuration feedback loop.

On conditional-capable hosts, the Workspace configuration bridge applies
[LN-PKG-173](../packages/configuration-and-lifecycle.md#ln-pkg-173) and
[LN-PKG-174](../packages/configuration-and-lifecycle.md#ln-pkg-174) before the
presentation controller's debounce. A shared Settings change enters the owning
App's writer queue immediately. API recovery projection does not enqueue another
save, and the deferred presentation flush does not reenter a protected queue.

## LN-WS-017 — Imperative view lifetime

<a id="ln-ws-017"></a>

**Requirement.** Story-only Lapis imperative views MUST remain mounted through the API view bridge and visibly consume the live design-core `showInlineTitle` setting in their tab bodies, so shell settings demonstrate a view-supported inline title without adding production settings persistence.

## LN-WS-019 — Editor demo startup readiness

<a id="ln-ws-019"></a>

**Requirement.** The editor demo consumer MUST render the shell only after vault, configuration, required plugins, and layout boot successfully. Retry and story teardown MUST synchronously unload and destroy retained editors before asynchronous plugin/controller disposal, then release its compatibility lease. Story teardown MUST complete that asynchronous disposal before the next editor-demo boot begins.

## LN-WS-021 — Breadcrumb clipping before the final title

<a id="ln-ws-021"></a>

**Requirement.** design-core `WorkspaceViewHeader` MUST shrink/clip parent-path breadcrumbs before the final title when space is tight (prefer showing path segments nearest the title), and MUST support in-place title rename through `titleEditable` / `onTitleCommit` without hiding breadcrumbs or changing header layout.

## LN-WS-049 — New-tab focus preferences

<a id="ln-ws-049"></a>

**Requirement.** `WorkspaceShell` MUST map persisted `editor.alwaysFocusNewTabs` into Design Core's user-created-tab activation policy, defaulting to background creation while leaving explicit application opens unchanged.

## LN-WS-054 — Ribbon and status contributions

<a id="ln-ws-054"></a>

**Requirement.** API compatibility ribbon registrations and reactive status-bar descriptors MUST project into the API-owned Design Core shell registries. Projection MUST preserve identifiers, icons, labels, left/center/right alignment, priority, custom mounts, commands, menus, updates, and plugin teardown without introducing a second plugin-facing registration contract.

## LN-WS-075 — Status updates without layout writes

<a id="ln-ws-075"></a>

**Requirement.** Workspace status-bar projection MUST NOT emit `layout-change` or request a layout save when the visible status-item set is unchanged. An identical `upsertItem` MUST remain a no-op for layout persistence.

## LN-WS-057 — Default-disabled F-Mode

<a id="ln-ws-057"></a>

**Requirement.** Default shells MUST include Design Core `fModePlugin({ enabled: false })` on the API-owned controller. AppShell enablement MUST persist through Design Core `persistence.plugins`. Missing persistence MUST keep F-Mode disabled. Plugin-state load and save MUST resolve the App vault when they run.

Conditional hosts retain the acknowledged App Shell enablement snapshot in the
App-owned writer registry. Conflicts block shutdown and explicit disk recovery
projects the accepted choices through the existing plugin manager. Recovery
projection does not enqueue a second save.

## LN-WS-059 — Default sidebar layout

<a id="ln-ws-059"></a>

**Requirement.** When `loadLayout` finds no workspace file, the workspace MUST seed registered default sidebar views: left `file-explorer`, then `search`, then `bookmarks`; right `outline`, `file-properties`, then `tag`. It MUST open those docks, keep one empty main New Tab and a closed bottom dock, omit unregistered types, and MUST NOT write `workspace.json` during that seed.

## LN-WS-060 — Save and Load Workspace Layout commands

<a id="ln-ws-060"></a>

**Requirement.** The workspace MUST register Save workspace layout and Load workspace layout commands. Those commands MUST persist and restore named layouts in `.lapis/workspaces.json` while the live layout continues to write `workspace.json`.

## LN-WS-061 — Reset Workspace Layout command

<a id="ln-ws-061"></a>

**Requirement.** The workspace MUST register a Reset workspace layout command. Confirming it MUST apply the same default sidebar seed as a missing workspace file and persist the result to `workspace.json`.

## LN-WS-080 — Default Terminal leaf

<a id="ln-ws-080"></a>

**Requirement.** When the Terminal plugin is loaded and no `terminal` leaf exists after layout restore, the plugin MUST create one bottom-panel Terminal leaf and open the dock. Persisted terminal leaves MUST win.

## LN-WS-081 — Debounced view-state persistence

<a id="ln-ws-081"></a>

**Requirement.** `setViewState`, `open`, and `activateLeaf` MUST schedule the existing 1000 ms `workspace.json` writer. The written dock `currentTab` and, for a sidebar group, `selectedLeafId` MUST restore that dock's selected leaf or group after `loadLayout`. The writer MUST stay debounced.

## LN-WS-085 — Host-supplied App boundary

<a id="ln-ws-085"></a>

**Requirement.** The `@lapis-notes/workspace` public `0.1.0` package MUST remain a shell adapter around a host-supplied API `App`. Its release manifest, README, and package metadata MUST keep vault discovery, plugin boot, persistence, profile management, and backend setup outside the package.

## LN-WS-098 — Live popup projection

<a id="ln-ws-098"></a>

**Requirement.** Live controller projection MUST preserve session-only popup records and claimed leaf, view, editor and history identity. Compatibility windows MUST bind existing controller handles without opening another host. Cold restoration MUST omit popups. The API workspace MUST remain the sole layout writer.

## LN-WS-099 — Popup close admission

<a id="ln-ws-099"></a>

**Requirement.** Shared tab and popup removal MUST await focused-control blur, pending file writers and layout persistence through the owning App before destroying views, except when every closing view qualifies for the explicit layout-only policy in LN-WS-101. Rejected saving MUST preserve reachable content.

## LN-WS-100 — Focused popup command ownership

<a id="ln-ws-100"></a>

**Requirement.** Popup focus and commands MUST use the existing owned App and its document. Selecting a main tab while popups remain open MUST restore main-host command routing.

Plugin registration now retains unadopted data under LN-PLUG-112; workspace layout,
projection, guarded close and popup contracts remain unchanged. No host source
change is required to consume the generic registration repair.

Custom `mount(host)` descriptors MUST retain callback identity through projection
and dispose on replacement/removal. `Plugin.addStatusBarItem()` MUST register a
visible plugin-owned element through this same path, without a hidden fallback.
Plugins own their controls, CSS, accessibility and asynchronous resource lifetime.

Status-bar hosts MUST keep custom content in the same item ordering and context
visibility as standard descriptors. The mount callback is a rendering input;
replacing it MUST notify the shell even when text/icon metadata is unchanged.
