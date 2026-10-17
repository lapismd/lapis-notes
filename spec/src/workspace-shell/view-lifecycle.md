# Workspace Shell / View lifecycle

## LN-WS-097 — File change projection

<a id="ln-ws-097"></a>

**Requirement.** App-owned reconciliation MUST forward external file changes through existing workspace events so clean editors refresh while dirty drafts remain protected. Rename/delete projection MUST use existing file-view and layout lifecycle APIs. Dirty or retained failed writers MUST prevent automatic retargeting or removal of their views and receive an existing notification explaining the change. Explicit recovery MUST retain its existing owner.

- Clean internal rename/move projection MUST run after the admitted editing guard releases and before a later queued mutation can interfere. Rebinding MUST preserve ordered event snapshots and the existing editor save owner.

Text file loading registers and protects its target under LN-ARCH-137 and
LN-ARCH-138. A failed original save preserves the old binding; superseded or
unloaded reads cannot publish stale content. Managed rename protects and flushes all registered writers under LN-ARCH-139.
Workspace navigation-event ordering remains part of the complete host integration.

API editor destruction begins persistence rather than dropping pending timers
under LN-ARCH-134. Retired failed sessions remain owned by the original App;
host shutdown must drain them before disposing storage. Workspace navigation
and complete host teardown integration remain required for production Sync.

Plugin disable awaits the host security revocation described by LN-ARCH-118.
Closing a workspace leaf continues to use its view/component lifetime; the
owning plugin and application host control runtime revocation and disposal.

LN-ARCH-128 discovers owned editors through the complete leaf tree, including
inactive tabs, docked groups and floating hosts. Persistence failures remain
visible to the caller; switching a document during flush rejects that snapshot.
Independent writers register outside leaf discovery through the App-owned
registry in LN-ARCH-129 through LN-ARCH-131. Detaching a dirty session does not
remove its persistence barrier; hosts must await explicit registry cleanup at
their complete lifetime boundary before releasing backing storage.

## LN-WS-063 — Workspace.getLeaf() without a new-leaf flag and App.openFile: reuse an empty or file-backed main-area leaf

<a id="ln-ws-063"></a>

**Requirement.** `Workspace.getLeaf()` without a new-leaf flag and `App.openFile` MUST reuse an empty or file-backed main-area leaf, or create a new main tab. They MUST NOT replace a non-file main-area view and MUST NOT reuse a sidebar leaf.

## LN-WS-064 — Imperative view host: remount a Lapis view only

<a id="ln-ws-064"></a>

**Requirement.** An imperative view host MUST remount a Lapis view only when the tab id or view type changes. Remount MUST look up the existing leaf by that id and reattach its `containerEl`. Cross-document attachment MUST retarget a retained editor to its new document without replacing its state or history.

## LN-WS-065 — Missing-view placeholder: use the Lucide ghost icon on

<a id="ln-ws-065"></a>

**Requirement.** A missing-view placeholder MUST use the Lucide `ghost` icon on the leaf and the Design Core empty surface. An ordinary empty New Tab MUST keep the file empty icon.

## LN-WS-006 — Api view registration: expose registered Lapis views to design-core

<a id="ln-ws-006"></a>

**Requirement.** Api view registration MUST expose registered Lapis views to design-core through imperative view definitions while retaining Lapis view creation, state, load, mount, unload, history, and missing-view behavior. Each imperative compatibility root MUST fill its Design Core view host without depending on a host-global utility stylesheet. Each transition MUST remove the previous view root before mounting the next while reattaching the shared `ItemView` content element when required. The `empty` type MUST use design-core's built-in visual empty view.

- Attachment MUST wait for the original queued compatibility projection when the controller opens a leaf before its API wrapper exists. Completion MUST attach that wrapper's retained container without recreating its view.
- A disposed mount MUST fence its deferred attachment so later projection cannot attach content to a retired host.

## LN-WS-012 — Stacked-pane width tokens

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

## LN-WS-083 — Go to File command

<a id="ln-ws-083"></a>

**Requirement.** Workspace MUST register `app:go-to-file`. Activating it MUST call Design Core `openPalette({ tab: "files" })`. Empty-view Go to file and See recent files MUST use that command.

## LN-WS-084 — Workspace shell pane menu: split Lapis-hosted views by duplicating the active

<a id="ln-ws-084"></a>

**Requirement.** The workspace shell pane menu MUST split Lapis-hosted views by duplicating the active API leaf before the Design Core pane appears. The duplicated pane MUST project with translated host directions and render the same view type with copied state for both Split right and Split down.

## LN-WS-091 — Workspace plugin activation: accept a verified renderer ESM module whose

<a id="ln-ws-091"></a>

**Requirement.** Workspace plugin activation MUST accept a verified renderer ESM module whose plugin constructor is a named `Plugin` subclass when no default export exists. Supporting constants, views, settings helpers, and manifest exports MUST remain available without becoming constructor candidates.

Link-preview pointer acceptance follows the current
`plugins-markdown-panels-link-preview-acceptance` catalog family. Renamed
catalog paths retain the original preview interaction assertions.
