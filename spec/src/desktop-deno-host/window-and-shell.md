# Deno Desktop Host / Window and shell

Delivered plugin URL navigation reveals the selected page above owning Settings
under [LN-PLUG-109](../plugin-model/app-ownership.md#ln-plug-109).

The existing URL activation queue also delivers `lapis://plugins?id=...` to the
ready App's disposable profile handler
([LN-PLUG-106](../plugin-model/app-ownership.md#ln-plug-106)). The optional
version selects the Plugins detail page; receiving a link does not install it.

## LN-DENO-001 — Native desktop host: create its window with Deno 2.9.5

<a id="ln-deno-001"></a>

**Requirement.** The native desktop host MUST create its window with Deno 2.9.5 or later `deno desktop` and `Deno.BrowserWindow`. It MUST NOT include a second desktop framework or builder.

## LN-DENO-012 — On macOS, the visible window: provide full-bleed content with native traffic lights

<a id="ln-deno-012"></a>

**Requirement.** On macOS, the visible window MUST provide full-bleed content with native traffic lights through Deno `transparentTitlebar`. Other platforms MUST retain native chrome. The host MUST NOT use private AppKit style-mask mutation.

### Acceptance details

macOS Deno window chrome verifies:

- The first `BrowserWindow` adopts Deno's bootstrap window, so macOS MUST create a second window for creation-only chrome.
- The visible window MUST set `transparentTitlebar: true` and `frameless: false` so full-size content retains native traffic lights.
- The adopted bootstrap window MUST remain invisible, MUST NOT mount an application renderer, and MUST NOT steal focus after Deno's automatic navigation. Only the visible window entry may mount a vault session.
- Platform metadata MUST enable the existing macOS traffic-light clearance only when the overlay window is active.

## LN-DENO-013 — Launcher drag regions

<a id="ln-deno-013"></a>

**Requirement.** Launcher empty chrome and Design Core `data-desktop-drag-region` surfaces MUST move the window. Descendants marked `false` MUST NOT start a drag. The host MUST NOT re-declare Design Core `app-region` CSS.

### Acceptance details

Deno window dragging verifies:

- Launcher empty chrome and Design Core `data-desktop-drag-region` surfaces MUST start a window drag. Descendants marked `false` MUST NOT.
- The host MUST NOT re-declare `app-region` CSS or mutate private native window styles.
- Pointer release and cancellation MUST end the native drag.

## LN-DENO-018 — Deno: retain one application instance, deliver lapis

<a id="ln-deno-018"></a>

**Requirement.** Deno MUST retain one application instance, deliver `lapis` and `lapis-notes` URLs to the ready workspace, and focus the existing window for later launches.

### Acceptance details

Deno application activation verifies:

- The primary process MUST hold an exclusive application-data lock and publish
  an authenticated loopback endpoint readable only by the current user.
- A later process MUST forward valid `lapis` and `lapis-notes` arguments, focus
  the primary window, and exit before creating another application host.
- Startup and later-launch URLs MUST remain queued until the renderer subscribes
  and the ready `App` MUST dispatch them through its public URL registry.
- The renderer MUST NOT drain the native URL queue without a subscriber. A batch
  fetched during subscriber replacement MUST retain its order until delivery;
  acceptance acknowledgement MUST follow subscriber delivery.
- The macOS application bundle and Linux desktop metadata MUST declare both URL
  schemes without embedding credentials or environment-specific paths.

## LN-DENO-021 — New windows: limited to the workspace popout path. External

<a id="ln-deno-021"></a>

**Requirement.** New windows MUST be limited to the workspace popout path. External HTTP and HTTPS links MUST open in the system browser instead of receiving a privileged Deno desktop window.

### Acceptance details

Deno window navigation verifies:

- Renderer-created blank windows MAY be used by the shared workspace popout
  host; other non-HTTP new-window targets MUST be rejected.
- HTTP and HTTPS new-window requests and anchor activations MUST invoke a
  validated system-browser action instead of navigating a privileged webview.
- System-browser commands MUST pass the complete URL as one process argument
  and MUST reject unsupported schemes.

## LN-DENO-044 — On macOS, maximized groups: reserve the full native traffic-light inset independent

<a id="ln-deno-044"></a>

**Requirement.** On macOS, maximized groups MUST reserve the full native traffic-light inset independent of ribbon and sidebar state. Closing the left sidebar MUST apply the ribbon-adjusted native traffic-light inset to the leading top-tabs or stacked-tabs main-pane header through the Design Core window-controls token. Reopening the left sidebar MUST remove that main-pane offset while retaining the sidebar tab-bar inset, and ribbon-off sessions MUST use the full traffic-light inset.

### Acceptance details

Desktop window-chrome acceptance verifies the ribbon-on and ribbon-off token
mapping, left-sidebar open and closed states, and both top-tabs and stacked-tabs
main-pane layouts. The leading visible tab and the sidebar reopen control clear
the macOS traffic lights while declared drag regions remain usable.

- With the ribbon visible, the main-pane token uses the traffic-light clearance remaining after the ribbon width.
- Without the ribbon, the main-pane token uses the full macOS traffic-light clearance.
- Closing the left sidebar offsets the leading top-tabs and stacked-tabs header; reopening it removes that main-pane offset and keeps the left tab-strip inset.
- Maximized top and stacked headers consume the full inset regardless of ribbon visibility or sidebar state; restoring returns to normal ribbon-adjusted geometry.
- Native drag spacers remain drag regions while tab triggers and sidebar controls remain interactive.

## LN-DENO-046 — On macOS, the native traffic-light buttons: share the open left-sidebar tab controls' vertical

<a id="ln-deno-046"></a>

**Requirement.** On macOS, the native traffic-light buttons MUST share the open left-sidebar tab controls' vertical centreline. The desktop host MUST lower only the three standard window buttons through its platform-isolated native adapter and MUST NOT offset renderer controls or change Design Core geometry.

### Acceptance details

macOS traffic-light alignment verifies:

- Close, minimise, and zoom retain their native horizontal positions. Their vertical origins use the actual titlebar container height and coordinate orientation to align at the 20px centreline of the 40px workspace header.
- Only a visible window with an overlay titlebar qualifies; parked bootstrap and framed About windows are excluded.
- Load, resize and focus reapply the bounded adjustment without accumulating movement; close removes queued work and listeners.
- The desktop stylesheet contains no vertical transform for the sidebar tab list, drag spacer, or close control.
- Browser and non-macOS geometry remain unchanged. On macOS, system WebView and CEF windows share only the native button adjustment; their renderer and closed-sidebar main-pane geometry remain unchanged.

## LN-DENO-049 — On macOS, development and packaged hosts: show Lapis Notes as the first application

<a id="ln-deno-049"></a>

**Requirement.** On macOS, development and packaged hosts MUST show `Lapis Notes` as the first application menu title. Because the shared Laufey bundle reports `Deno`, the pnpm launcher MUST prepare an ignored package-local backend bundle under `release/dev-laufey`, apply the declared identity, and select it through Deno's development-host boundary. A root Deno workspace MUST include every Deno host package and own cache-only npm resolution without changing `pnpm-workspace.yaml`. The launcher MUST NOT mutate Deno's shared cache or affect non-macOS hosts.

### Acceptance details

Native application-menu identity verifies:

- The platform-neutral menu model retains `Lapis Notes` as the first macOS submenu and preserves its About and Quit actions.
- The pnpm launcher builds each requested macOS backend host once with the pinned Deno runtime, sets `CFBundleName`, `CFBundleDisplayName`, and `CFBundleIdentifier` to the declared application identity, and reuses it only while the Deno version and identity marker match.
- Deno receives the generated parent through `LAUFEY_DEV_DIR`; the generated bundle remains ignored and Deno's shared Laufey download stays untouched.
- Missing adapters and non-macOS hosts retain Deno's public menu behavior without a failed startup.

## LN-DENO-066 — After navigating a created macOS renderer window: immediately refresh its public binding registry

<a id="ln-deno-066"></a>

**Requirement.** After navigating a created macOS renderer window, the native host MUST immediately refresh its public binding registry and MUST refresh it again on later document loads. Binding listeners MUST be removed during ordered shutdown.
