# Workspace Shell / Chrome and navigation

Desktop Safe Mode presentation is shared under LN-PKG-175. Its retained Deno
labels and Design Core controls sit below the top tabs; the host supplies
restriction descriptions, operation status and callbacks.

The desktop chooser and startup precede the workspace through the shared
public presentation in LN-PKG-171. Deno and Tauri provide native vault actions
and session ownership while reusing the same chooser markup, native CSS and
Lapis startup visual. The shared presentation contains no vault discovery,
session teardown or alternate workspace renderer.

The Design Core dependency refresh consumes released `0.4.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

Mobile acceptance uses the dock's count-bearing `Open N tabs` accessible name,
derives the initial count, and verifies its increment after adding a tab. The
selector repair already qualified on Design Core 0.4.0 in `f15b61b4` is retained
here without changing this migration's dependency target.

## LN-WS-014 — Desktop top and stacked main-workspace panes: expose design-core's pane-level maximize toggle beside tab

<a id="ln-ws-014"></a>

**Requirement.** Desktop top and stacked main-workspace panes MUST expose design-core's pane-level maximize toggle beside tab options. Its focused state MUST use primary paint and restore the pane when activated again; the retired focus-mode exit X MUST NOT be rendered. Top-tab add, maximize, and options actions MUST retain compact reserved hit areas before titles shrink or scroll. Floating size controls MUST use matching Lucide maximize/minimize glyphs.

## LN-WS-023 — Full-shell Autodocs for Workspace/Shell and Workspace/Lapis Editor: share the isolated 700px story height used

<a id="ln-ws-023"></a>

**Requirement.** Full-shell Autodocs for `Workspace/Shell` and `Workspace/Lapis Editor Demo` MUST share the isolated 700px story height used by movable panels and remove Storybook shell padding.

## LN-WS-068 — Workspace host: project each Lapis notifications.activeProgress entry whose location

<a id="ln-ws-068"></a>

**Requirement.** The workspace host MUST project each Lapis `notifications.activeProgress` entry whose location is not `silent` into the Design Core notification manager. The notifications status item MUST show busy plus that entry's title while it runs. Silent progress MUST NOT appear. Projected handles MUST be removed when they leave `activeProgress`.

## LN-WS-058 — Built-in desktop Settings action

<a id="ln-ws-058"></a>

**Requirement.** Default desktop shells MUST show Design Core's built-in Settings action in the left ribbon footer while the ribbon is visible. The action MUST expose the public "Open settings" label and activate the same settings dialog as any shell settings trigger.

## LN-WS-096 — Owned notice projection

<a id="ln-ws-096"></a>

**Requirement.** A workspace host MUST project its owning App's notice events through the existing Design Core notification manager, preserving identity, message, title, severity and source. Disposing the host MUST unsubscribe notice delivery so a retired App cannot publish into that host. First-party callers with an App MUST pass that owner explicitly to Notice.
