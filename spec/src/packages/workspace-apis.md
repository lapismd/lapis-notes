# Packages / Workspace APIs

LN-WS-005/063 foreground file routing awaits the existing reveal contract.
Public package exports, signatures and generic workspace ownership are unchanged.

The optional WorkspaceShell popup host in LN-WS-008 uses the public Design Core
host contract. API host binding remains on the host-only subpath; LN-WS-098
projects existing handles rather than constructing another App or host.

The LN-WS-006/064 attachment correction changes no public export or root API
type. Controller-opened views attach their retained API container after the
existing projection completes, with disposal fencing the pending attachment.

## LN-PKG-171 — Shared desktop vault presentation

<a id="ln-pkg-171"></a>

**Requirement.** `@lapis-notes/workspace` MUST export the existing desktop vault chooser and branded startup components for Deno and Tauri consumers. The chooser MUST retain the Deno layout, labels, recent-project search, appearance controls and drag exclusions through native CSS and public Design Core primitives. Hosts MUST inject profile storage and actions; unavailable profile operations MUST remain absent. Vault selection and session ownership MUST remain host-owned.

## LN-PKG-175 — Shared desktop recovery presentation

<a id="ln-pkg-175"></a>

**Requirement.** Workspace MUST export the existing desktop Safe Mode banner using public Design Core controls and native CSS. The banner MUST describe active restrictions and expose metadata rebuild, Search rebuild and normal restart through host-owned callbacks. It MUST keep startup policy, App ownership and persistence in the host, remain outside the top tab strips, and omit unavailable recovery capabilities.

The recovery banner uses an opaque themed background and relevant icons for
metadata rebuild, Search rebuild and restart. Decorative icons retain each
button's existing accessible name and callback.

## LN-PKG-009 — @lapis-notes/api: expose the design-core V3 bottom panel

<a id="ln-pkg-009"></a>

**Requirement.** `@lapis-notes/api` MUST expose the design-core V3 bottom panel through Lapis-native workspace wrappers and controls without leaking design-core types through the root api export. API layout commits MUST keep a host-registered Problems leaf as that view type rather than a missing-view placeholder. Claimed leaves MUST keep their id and live `getState()`; default file navigation MUST NOT replace a non-file main view.

## LN-PKG-049 — @lapis-notes/lapis-plugin-cv-roles: live in the sibling lapis-plugin-cv-roles repository, version

<a id="ln-pkg-049"></a>

**Requirement.** `@lapis-notes/lapis-plugin-cv-roles` MUST live in the sibling `lapis-plugin-cv-roles` repository, version independently, and expose `build`, `check`, and `test`. It owns Roles workflows, retained CV behavior, and the ported legacy Applications presentation while delegating reusable leaf controls to public Design Core APIs.

## LN-PKG-090 — API StatusBarManager.upsertItem: notify subscribers only when a visible status

<a id="ln-pkg-090"></a>

**Requirement.** API `StatusBarManager.upsertItem` MUST notify subscribers only when a visible status field changes. Identical id, text, segments, icon, spin, tooltip, command, when, alignment, priority, sourcePlugin, and custom mount identity MUST NOT notify. A `buildMenu` replacement alone MUST NOT count as a visible change.

## LN-PKG-020 — Editable FileEmbed: expose an imperative exit() that delegates

<a id="ln-pkg-020"></a>

**Requirement.** Editable `FileEmbed` MUST expose an imperative `exit()` that delegates to Mira's persistence-safe editable-preview exit contract and accept an additive `returnToPreviewOnBlur` input. Link-panel consumers MUST disable blur exit and use the imperative operation for outside-click dismissal; default and read-only consumers MUST remain source-compatible.

## LN-PKG-026 — Shared movable-panel chrome: consume design-core's resolved workspace-view foreground and background

<a id="ln-pkg-026"></a>

**Requirement.** Shared movable-panel chrome MUST consume design-core's resolved workspace-view foreground and background tokens without duplicating workspace placement detection or surface selectors.

## LN-PKG-029 — Link-panel previews: compose Design Core Hover Card, use

<a id="ln-pkg-029"></a>

**Requirement.** Link-panel previews MUST compose Design Core Hover Card, use a viewport-capped 26rem width, follow the trigger document, and remain open during pointer or focus handoff from the full mention row into interactive content.

## LN-PKG-137 — @lapis-notes/workspace: keep installed-versus-bundled registry actions, enablement action labels

<a id="ln-pkg-137"></a>

**Requirement.** `@lapis-notes/workspace` MUST keep installed-versus-bundled registry actions, enablement action labels, and uninstall-or-disable confirmation policy private to plugin management while composing public Design Core Button, Field, Switch, Tooltip, and Alert Dialog primitives.

## LN-PKG-138 — @lapis-notes/api: expose typed download-summary parsing and an optional

<a id="ln-pkg-138"></a>

**Requirement.** `@lapis-notes/api` MUST expose typed download-summary parsing and an optional distribution-manager accessor. Default registry sources MAY declare a statistics URL; Workspace MUST consume counts through that public boundary rather than fetching registry-owned files directly.

## LN-PKG-078 — @lapis-notes/api: own the generic ViewAccess registration contract, plugin-name

<a id="ln-pkg-078"></a>

**Requirement.** `@lapis-notes/api` MUST own the generic `ViewAccess` registration contract, plugin-name command prefixing, and live command-palette projection. First-party plugins MUST own their view classifications and activation callbacks, while the repository-local validator MUST own first-party-only enforcement.

## LN-PKG-100 — App-owned agent result-view registry

<a id="ln-pkg-100"></a>

**Requirement.** `@lapis-notes/api` MUST own the agent result-view registry. Search MUST own the `notes_search` view. AI MUST own lookup, CodeBlock fallback, and `/skills` `/tools` inventories. AI MUST NOT import Search internals, and Search MUST NOT import AI internals.

## LN-PKG-092 — @lapis-notes/lapis-plugin-terminal: live in the sibling lapis-plugin-terminal repository, version

<a id="ln-pkg-092"></a>

**Requirement.** `@lapis-notes/lapis-plugin-terminal` MUST live in the sibling `lapis-plugin-terminal` repository, version independently, and expose `build`, `check`, and `test`. It owns the `terminal` view and commands. Consumer plugins MUST NOT depend on `@lapismd/terminal-host` at runtime.

## LN-PKG-101 — @lapis-notes/lapis-plugin-tasks: live in the sibling lapis-plugin-tasks repository, version

<a id="ln-pkg-101"></a>

**Requirement.** `@lapis-notes/lapis-plugin-tasks` MUST live in the sibling `lapis-plugin-tasks` repository, version independently, and expose `build`, `check`, and `test`. Desktop and web hosts MUST NOT register it statically; when installed it MUST register its own Tasks workspace views through the configured plugin lifecycle.

## LN-PKG-105 — @lapis-notes/api: own the bridge from Design Core pane-menu

<a id="ln-pkg-105"></a>

**Requirement.** `@lapis-notes/api` MUST own the bridge from Design Core pane-menu split actions to Lapis `WorkspaceLeaf` duplication. Lapis-hosted imperative views MUST keep live leaf ids, containers, copied view state, translated split directions, and projected host layout before the new pane renders.

LN-WS-096 projects notices from the explicit App into the existing shared
notification UI and removes that subscription on host disposal. Explorer passes
its owned App to Notice; native error handling keeps the existing presentation.

API view-state transitions and leaf activation retain their existing public
signatures. Internal layout replay does not count as a newer user mutation;
queued older snapshots cannot discard a later live view or its selected leaf.

The projection repair carries API patch intent and a verified public archive
for Tauri intake. Publication remains at the migration release gate.

The existing `Workspace.revealLeaf` promise joins in-flight host projection and
publishes the requested selection under LN-WS-005. Package signatures and
instance ownership remain unchanged; a superseding navigation fences the reveal.
