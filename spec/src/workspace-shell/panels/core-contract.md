# Panels / Integration contracts

## LN-MD-018 — Workspace Markdown and Tags side panels: use the shared MarkdownSidebarPanel. It MUST provide

<a id="ln-md-018"></a>

**Requirement.** Workspace Markdown and Tags side panels MUST use the shared `MarkdownSidebarPanel`. It MUST provide one `ScrollArea`, sticky in-viewport chrome, an optional `@lapis-notes/ui/search` control with white fill, panel-action hover tokens for toolbar actions, and the `--markdown-sidebar-*` and `--header-height` shell layout tokens.

## LN-MD-032 — Panel root and its consumer content: fill the complete WorkspaceViewHost, inherit the workspace

<a id="ln-md-032"></a>

**Requirement.** Every panel root and its consumer content MUST fill the complete `WorkspaceViewHost`, inherit the workspace font family, omit redundant shell title or metadata introduction copy, and use the established 0.75rem scale for panel list, tree, and result rows.

## LN-MD-033 — Panel roots and sticky chrome: consume design-core's resolved --ui-workspace-view-background and --ui-workspace-view-foreground tokens

<a id="ln-md-033"></a>

**Requirement.** Panel roots and sticky chrome MUST consume design-core's resolved `--ui-workspace-view-background` and `--ui-workspace-view-foreground` tokens. `WorkspaceViewHost` MUST remain the placement-paint authority: body, bottom panel, grouped sidebar, mobile, floating, and standalone views use workspace paint, while only ungrouped left and right sidebar views use panel paint.

## LN-MD-034 — Panels: remain placement-agnostic and MUST NOT inspect workspace

<a id="ln-md-034"></a>

**Requirement.** Panels MUST remain placement-agnostic and MUST NOT inspect workspace ancestry, reset grouped paint, inspect leaf parents at runtime, cache placement, or accept placement props. An exceptional panel MAY override the public view tokens on its own root for component-specific paint.

## LN-MD-035 — View getIcon(): return a Lucide short name for WorkspaceIcon

<a id="ln-md-035"></a>

**Requirement.** View `getIcon()` MUST return a Lucide short name for `WorkspaceIcon`; All Properties uses `archive`. Menu-style lists MAY wrap `sidebar-custom` `NestedProvider` without `Sidebar.Root`, but the wrapper, Content, Menu, items, and collapsibles MUST remove the legacy fixed sidebar width. Simple lists use the shell `__list` and `__row` helpers.

## LN-WS-050 — Canonical movable panel view: declare ViewAccess.command and receive one discoverable application

<a id="ln-ws-050"></a>

**Requirement.** Every canonical movable panel view MUST declare `ViewAccess.command` and receive one discoverable application opener from that registration.

## LN-WS-051 — Panel-opening command: activate and reveal existing leaves wherever

<a id="ln-ws-051"></a>

**Requirement.** A panel-opening command MUST activate and reveal existing leaves wherever the panel was moved. When none exists, it MUST create, activate, and reveal the canonical view in its documented default surface.

## LN-WS-052 — Load-only compatibility view aliases: declare ViewAccess.alias, reuse their canonical panel command

<a id="ln-ws-052"></a>

**Requirement.** Load-only compatibility view aliases MUST declare `ViewAccess.alias`, reuse their canonical panel command, and MUST NOT add duplicate user-facing commands.

## LN-WS-090 — Command-access movable panels in standalone first-party plugin: demonstrate the same six workspace surfaces as

<a id="ln-ws-090"></a>

**Requirement.** Command-access movable panels in standalone first-party plugin Storybooks MUST demonstrate the same six workspace surfaces as bundled panels. Placement MUST remain persisted layout state. Isolated Svelte pane stories MUST NOT satisfy this coverage.
