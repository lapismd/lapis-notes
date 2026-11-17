# Workspace Shell / Chrome and navigation

Prepared Workspace `0.4.7` consumes API `^0.6.7`, UI `^0.2.2` and the admitted
Core `^0.13.4` floor. Those mechanical internal range updates close the existing
three-package patch release plan; shell geometry, App ownership and plugin
activation are unchanged. Prepared package versions do not imply publication
or wider admission of the separately held consumers.

Deferred plugins retain declared ribbon and Markdown pane actions under
LN-PLUG-127/128. Invoking a declaration activates its owner before executing
the existing runtime command; activation replaces placeholders without
duplicate controls. Markdown actions retain and revalidate their originating
leaf/file, and disabled owners remove their declarations and fence old menus.

Workspace, API and retained UI directly consume published Design Core `^0.13.4`
through their public package graph. Root tooling, App Profile and File Explorer
retain their separately admitted ranges. This intake preserves shell placement,
App ownership, plugin activation and the public chrome contract. LN-WEB-085
owns browser geometry detection; the host supplies public leading, trailing and title-bar-height tokens to shared chrome.

LN-PKG-185 supplies common file/folder discovery exclusions to Explorer and
pickers through Vault. The workspace keeps its existing App, chrome and settings
presentation, adding the shared editable list under Workspace / File discovery
through the existing Design Core list control; no plugin-specific policy is added.

The shared Safe Mode banner uses an opaque workspace background and semantic
fallback, with database, search and restart icons beside its accessible action
names. Hosts retain recovery operations and failure status ownership.

Desktop Safe Mode presentation is shared under LN-PKG-175. Its established
labels and Design Core controls sit below the top tabs; the host supplies
restriction descriptions, operation status and callbacks.

The desktop chooser and startup precede the workspace through the shared
public presentation in LN-PKG-171. Native desktop hosts provide vault actions
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

**Requirement.** The workspace host MUST project each Lapis `notifications.activeProgress` entry whose location is not `silent` into the Design Core notification manager. The notifications status item MUST show busy plus that entry's title while it runs. Projection MUST preserve App-owned ordering so the currently advancing task remains first. Silent progress MUST NOT appear, and projected handles MUST be removed when they leave `activeProgress`.

## LN-WS-058 — Built-in desktop Settings action

<a id="ln-ws-058"></a>

**Requirement.** Default desktop shells MUST show Design Core's built-in Settings action in the left ribbon footer while the ribbon is visible. The action MUST expose the public "Open settings" label and activate the same settings dialog as any shell settings trigger.

## LN-WS-096 — Owned notice projection

<a id="ln-ws-096"></a>

**Requirement.** A workspace host MUST project its owning App's notice events through the existing Design Core notification manager, preserving identity, message, title, severity and source. Disposing the host MUST unsubscribe notice delivery so a retired App cannot publish into that host. First-party callers with an App MUST pass that owner explicitly to Notice.

## LN-WS-105 — Live mobile layout preferences

<a id="ln-ws-105"></a>

**Requirement.** Application hosts MUST leave WorkspaceShell display mode controlled by persisted mobile settings. Always and Never MUST switch immediately, and Auto MUST follow bounded app width and breakpoint changes. Explicit mode overrides MAY remain in deterministic stories and independently controlled embedded surfaces. Switching presentation MUST preserve the selected editor and desktop layout.

## LN-WS-106 — Lapis mobile actions and commands

<a id="ln-ws-106"></a>

**Requirement.** WorkspaceShell MUST supply Design Core with App-owned Search and new-note actions and register disposable legacy mobile layout/navigation commands. Search MUST execute its registered plugin command and reveal Search. New-note creation MUST use FileManager's available-path and tracked creation boundaries, serialize repeated requests, open the created file, and preserve existing files. Shell teardown MUST remove only its owned commands; mobile presentation MUST remain Design Core-owned.

## LN-WS-107 — Host-owned command line settings

<a id="ln-ws-107"></a>

**Requirement.** Hosts MUST register General → Advanced as a declarative section, group and field through the disposable `@lapis-notes/ui/cli` port on their owned settings controller. Host ports MUST own installation status, setup, removal, downloads and optional scoped desktop access. The shared presentation MUST show busy/error/recovery states, require explicit shell PATH consent and never infer browser-local installation. Secrets MUST NOT enter settings persistence.

The disposable UI registration owns each rendered field's ephemeral host binding;
rendered descriptor identity does not own that authority. Regression coverage
includes copied/proxied descriptors, independent controllers, replacement and
disposal. These checks retain the existing public port and persistence boundary.

### Acceptance details

The shared CLI settings registration is accepted when:

- General → Advanced uses the same Design Core Settings surface, heading and card composition as built-in Workspace and Appearance settings.
- Browser downloads use Design Core Select, Bash CodeBlock and checksum copy controls. A uniquely matching browser platform is preselected without claiming installation; unknown or ambiguous platforms require explicit selection.
- Status uses an icon-and-version badge with its command path on a full-width row. Install, repair and uninstall use aligned secondary actions with icons; Refresh retains distinct primary paint.
- Installation failures use the destructive Design Core Alert beneath the action and span the complete declarative settings row.
