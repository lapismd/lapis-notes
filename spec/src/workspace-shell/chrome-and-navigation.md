# Workspace Shell / Chrome and navigation

## LN-WS-014 — Desktop top and stacked main-workspace panes: expose design-core's pane-level maximize toggle beside tab

<a id="ln-ws-014"></a>

**Requirement.** Desktop top and stacked main-workspace panes MUST expose design-core's pane-level maximize toggle beside tab options. Its focused state MUST use primary paint and restore the pane when activated again; the retired focus-mode exit X MUST NOT be rendered. Top-tab add, maximize, and options actions MUST retain compact reserved hit areas before titles shrink or scroll. Floating size controls MUST use matching Lucide maximize/minimize glyphs.

## LN-WS-023 — Full-shell Autodocs for Workspace/Shell and Workspace/Lapis Editor: share the isolated 700px story height used

<a id="ln-ws-023"></a>

**Requirement.** Full-shell Autodocs for `Workspace/Shell` and `Workspace/Lapis Editor Demo` MUST share the isolated 700px story height used by movable panels and remove Storybook shell padding.

## LN-WS-068 — Workspace host: project each Lapis notifications.activeProgress entry whose location

<a id="ln-ws-068"></a>

**Requirement.** The workspace host MUST project each Lapis `notifications.activeProgress` entry whose location is not `silent` into the Design Core notification manager. The notifications status item MUST show busy plus that entry's title while it runs. Silent progress MUST NOT appear. Projected handles MUST be removed when they leave `activeProgress`.

## LN-WS-058 — Default desktop shells: show Design Core's built-in Settings action in

<a id="ln-ws-058"></a>

**Requirement.** Default desktop shells MUST show Design Core's built-in Settings action in the left ribbon footer while the ribbon is visible. The action MUST expose the public "Open settings" label and activate the same settings dialog as any shell settings trigger.
