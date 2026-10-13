# Workspace Shell / View lifecycle

## LN-WS-063 — Workspace.getLeaf() without a new-leaf flag and App.openFile: reuse an empty or file-backed main-area leaf

<a id="ln-ws-063"></a>

**Requirement.** `Workspace.getLeaf()` without a new-leaf flag and `App.openFile` MUST reuse an empty or file-backed main-area leaf, or create a new main tab. They MUST NOT replace a non-file main-area view and MUST NOT reuse a sidebar leaf.

## LN-WS-064 — Imperative view host: remount a Lapis view only

<a id="ln-ws-064"></a>

**Requirement.** An imperative view host MUST remount a Lapis view only when the tab id or view type changes. Remount MUST look up the existing leaf by that id and reattach its `containerEl`.

## LN-WS-065 — Missing-view placeholder: use the Lucide ghost icon on

<a id="ln-ws-065"></a>

**Requirement.** A missing-view placeholder MUST use the Lucide `ghost` icon on the leaf and the Design Core empty surface. An ordinary empty New Tab MUST keep the file empty icon.

## LN-WS-006 — Api view registration: expose registered Lapis views to design-core

<a id="ln-ws-006"></a>

**Requirement.** Api view registration MUST expose registered Lapis views to design-core through imperative view definitions while retaining Lapis view creation, state, load, mount, unload, history, and missing-view behavior. Each imperative compatibility root MUST fill its Design Core view host without depending on a host-global utility stylesheet. Each transition MUST remove the previous view root before mounting the next while reattaching the shared `ItemView` content element when required. The `empty` type MUST use design-core's built-in visual empty view.

## LN-WS-012 — Stacked workspace panes: use the public design-core stacked-pane width as

<a id="ln-ws-012"></a>

**Requirement.** Stacked workspace panes MUST use the public design-core stacked-pane width as their preferred width before container min/max clamping, so empty and content-rich views have the same horizontal overflow and selected-tab scrolling behavior.

## LN-WS-013 — Workspace Storybook canvases: occupy the complete available story viewport

<a id="ln-ws-013"></a>

**Requirement.** Workspace Storybook canvases MUST occupy the complete available story viewport.

## LN-WS-015 — Api façade: preserve design-core's V3 bottom-panel tabs, groups, open

<a id="ln-ws-015"></a>

**Requirement.** The api façade MUST preserve design-core's V3 bottom-panel tabs, groups, open state, height, active leaf, events, and view lifecycle through a stable Lapis-native wrapper. It MUST expose bottom-leaf creation and panel open, size, toggle, and alignment controls while rejecting focus mode and split-edge operations for bottom-panel leaves.

## LN-WS-020 — API imperative file-view chrome: project parent-path breadcrumbs and leaf back/forward history

<a id="ln-ws-020"></a>

**Requirement.** API imperative file-view chrome MUST project parent-path breadcrumbs and leaf back/forward history into design-core `WorkspaceViewHeader` via `getChrome`, while non-file views MAY omit breadcrumbs or contribute them through View breadcrumb hooks. A history-enabled first navigation MUST snapshot the initiating leaf before target-view construction so Back restores it. Repeated equivalent states MUST NOT consume an extra Back step.

## LN-WS-022 — Mobile Workspace stories: exercise the responsive shell across the available

<a id="ln-ws-022"></a>

**Requirement.** Mobile Workspace stories MUST exercise the responsive shell across the available canvas rather than mounting an artificial fixed-width device card.

## LN-WS-053 — @lapis-notes/workspace package: publish WorkspaceShell as a versioned shell adapter

<a id="ln-ws-053"></a>

**Requirement.** The `@lapis-notes/workspace` package MUST publish `WorkspaceShell` as a versioned shell adapter so separately versioned plugin catalogs can render an initialized public `App` without copying the AppShell composition.

## LN-WS-055 — Workspace root: bind to its owning Workspace; leaves

<a id="ln-ws-055"></a>

**Requirement.** Every workspace root MUST bind to its owning `Workspace`; leaves and views MUST derive App through that ownership chain. `WorkspaceShell` MUST provide its required App to descendant Svelte components without making compatibility state authoritative.

## LN-WS-082 — Workspace: record each successfully opened file on file-open

<a id="ln-ws-082"></a>

**Requirement.** Workspace MUST record each successfully opened file on `file-open` in a most-recent-first ring. `getLastOpenFiles` MUST return those paths. `getRecentFiles` MUST resolve surviving vault files in that order.

## LN-WS-083 — Workspace: register app:go-to-file. Activating it MUST call Design

<a id="ln-ws-083"></a>

**Requirement.** Workspace MUST register `app:go-to-file`. Activating it MUST call Design Core `openPalette({ tab: "files" })`. Empty-view Go to file and See recent files MUST use that command.

## LN-WS-084 — Workspace shell pane menu: split Lapis-hosted views by duplicating the active

<a id="ln-ws-084"></a>

**Requirement.** The workspace shell pane menu MUST split Lapis-hosted views by duplicating the active API leaf before the Design Core pane appears. The duplicated pane MUST project with translated host directions and render the same view type with copied state for both Split right and Split down.

## LN-WS-091 — Workspace plugin activation: accept a verified renderer ESM module whose

<a id="ln-ws-091"></a>

**Requirement.** Workspace plugin activation MUST accept a verified renderer ESM module whose plugin constructor is a named `Plugin` subclass when no default export exists. Supporting constants, views, settings helpers, and manifest exports MUST remain available without becoming constructor candidates.
