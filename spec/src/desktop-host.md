# Desktop Host

The Electron host is a source-first intake from the legacy
`/Users/stevejuma/code/lapis-notes/packages/desktop-electron` package at commit
`8ec68e18`. Root `MIGRATION.md` records which legacy areas remain, change, or
are intentionally omitted.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-DESK-001 | The private `@lapis-notes/desktop-electron` package MUST retain the legacy Lapis Notes product identity, application ID, `lapis` and `lapis-notes` protocols, and version `2026.31.5`.                                                                                                                                                                                                                                       |
| LN-DESK-002 | Electron main MUST own application lifecycle, the single-instance lock, native menus, app-URL delivery, window chrome, protocol handlers, native notifications, and shutdown of main-owned services.                                                                                                                                                                                                                         |
| LN-DESK-003 | The preload MUST use context isolation and expose only the typed `NativeDesktopBridge` operations, platform metadata, and bounded host events. Renderer Node integration and raw `ipcRenderer` exposure are forbidden.                                                                                                                                                                                                       |
| LN-DESK-004 | The renderer MUST register the preload bridge before creating a vault session. It MUST mount the existing `WorkspaceShell` with an API `App` and MUST NOT copy the workspace renderer.                                                                                                                                                                                                                                       |
| LN-DESK-005 | Startup MUST reopen a valid current `desktop-folder` profile from Electron main storage. If it is unavailable, startup MUST clear only the current-profile pointer, retain the saved record, and return to the branded launcher.                                                                                                                                                                                             |
| LN-DESK-006 | Cancelling a native folder picker MUST leave the branded launcher recoverable. Selecting a folder MUST create an `electron-desktop` session, open its app database, load the vault, restore `.obsidian/workspace.json`, and render the desktop shell.                                                                                                                                                                        |
| LN-DESK-007 | The partial host MUST NOT seed files, load community plugins, or import the Storybook-only source-editor fixture. Missing layouts MUST use the API default empty workspace.                                                                                                                                                                                                                                                  |
| LN-DESK-008 | The bridge MUST advertise resource, database, search, language-service, plugin-sidecar, plugin-assets, file-watch, notifications, file-system-actions, and agent-runtime capabilities as available. Notebook and model capabilities MUST remain unavailable.                                                                                                                                                                 |
| LN-DESK-009 | Native IPC MUST validate sender ownership, payload bounds, and vault-root containment. Resource and plugin protocols MUST reject traversal, unregistered contexts, unsupported asset types, and metadata hash or size mismatches.                                                                                                                                                                                            |
| LN-DESK-010 | The native language-service sidecar MUST expose the current Markdown protocol only: capability probing, document updates, diagnostics, and code actions. It MUST enforce bounded payloads, timeouts, restart, and shutdown behavior.                                                                                                                                                                                         |
| LN-DESK-011 | The community-plugin sidecar MUST retain prepare, evaluate, activate, deactivate, and shutdown lifecycles with the current brokered capabilities. Hosted CommonJS imports MUST be limited to `lapis` and `@lapis-notes/api`.                                                                                                                                                                                                 |
| LN-DESK-012 | The renderer plugin-asset server MUST use public API contracts and register verified installed-plugin metadata before returning scoped `lapis-plugin` URLs. It MUST NOT import API source paths.                                                                                                                                                                                                                             |
| LN-DESK-013 | Switching vaults or closing the renderer MUST dispose the workspace controller, active views, bridge listeners, native watches, plugin and language sidecars, and the previous vault session before replacement or exit.                                                                                                                                                                                                     |
| LN-DESK-014 | New windows MUST be limited to the workspace `about:blank` popout path. External HTTP or HTTPS links MUST open through the system browser instead of receiving an Electron renderer window.                                                                                                                                                                                                                                  |
| LN-DESK-015 | Local distribution MUST produce macOS DMG and ZIP plus Linux AppImage and tar artifacts with stable hyphenated names. Signing and notarization hooks MUST skip safely without credentials, and release publication MUST remain out of scope.                                                                                                                                                                                 |
| LN-DESK-016 | Automated acceptance MUST cover first selection, cancellation, saved-vault reopening, missing-vault fallback, workspace persistence, vault switching, app URLs, retained IPC services, retained sidecars, and packaged application startup.                                                                                                                                                                                  |
| LN-DESK-017 | First launch MUST show the branded native-vault launcher derived from legacy commit `8ec68e18` without opening a picker automatically. It MUST offer create, open, recent-project management, search, and appearance settings while omitting the demo-workspace action.                                                                                                                                                      |
| LN-DESK-018 | The renderer MUST load Design Core's production styles, Lapis theme, and Lapis UI aliases through the Electron Vite pipeline. It MUST NOT rely on Storybook to supply workspace or launcher paint.                                                                                                                                                                                                                           |
| LN-DESK-019 | A native vault without `.obsidian/workspace.json` MUST show one empty `New Tab`, the left dock open at `22rem` with File Explorer then Search when those views are registered, and the right dock open with Outline, File Properties, then Tags when Markdown is enabled. The bottom dock MUST stay closed. Startup MUST NOT write a layout file or inject fixture views. |
| LN-DESK-020 | Native “Open Vault…” requests from a ready workspace MUST persist the session, keep it mounted, and show the launcher overlay without clearing the current profile. Selecting another vault MUST persist, dispose, and create a replacement session without retaining old watches or database handles.                                                                                                                                                                                   |
| LN-DESK-021 | The ready desktop shell MUST expose the legacy footer vault switcher with up to eight recent native vaults, the current vault disabled, folder descriptions, and a “Manage Vaults” action. Recent selection MUST use orderly session replacement and structured-cloneable profile records. Manage Vaults MUST persist the session, keep it mounted, retain the current-profile pointer and saved records, and show the branded launcher overlay. |
| LN-DESK-022 | The launcher and transient native-vault loading state MUST center their content within the Electron viewport when it fits, while an oversized launcher MUST remain scrollable from its top edge.                                                                                                                                                                                                                             |
| LN-DESK-023 | Launcher Settings MUST use a compact centered dialog. “View all” MUST use an upper-viewport searchable command palette containing recent projects rather than a drawer or bottom sheet. Both MUST retain the shared full-viewport modal scrim.                                                                                                                                                                               |
| LN-DESK-024 | The renderer MUST map typed Electron platform metadata to root CSS classes. macOS traffic-light clearance MUST derive from those classes and desktop CSS rather than renderer-injected geometry styles.                                                                                                                                                                                                                      |
| LN-DESK-025 | The development renderer MUST serve assets imported by linked Design Core and Mira packages, including their fonts. Its Vite filesystem allowlist MUST retain the Lapis workspace root and add only resolved linked-package or linked-workspace roots rather than using source aliases or a broad parent-directory grant.                                                                                                    |
| LN-DESK-026 | On macOS, an expanded left-sidebar tab bar MUST reserve a larger host-CSS traffic-light inset than the already-correct collapsed main-tab control. Both values MUST derive from the typed platform root class rather than inline geometry.                                                                                                                                                                                   |
| LN-DESK-027 | Before restoring a vault layout, the desktop host MUST register Markdown, Markdown Lint, Spell Check, File Explorer, Search, History, Word Count, and Bases as optional bundled plugins enabled by default. It MUST load only their configured enabled set before metadata and layout restoration while keeping community plugins disabled.                                                                                                           |
| LN-DESK-028 | When a persisted `empty` leaf carries `state.__missingViewType`, layout restoration MUST retry that requested type after core plugins load. A now-available view MUST be restored and subsequently persist its canonical type; a still-unavailable Search, Bookmarks, or other view MUST remain an explicit placeholder.                                                                                                     |
| LN-DESK-029 | The desktop host MUST register and load `@lapis-notes/search` before metadata and layout restoration. A vault without persisted layout MUST include File Explorer then Search in its default left tabs. Persisted Search leaves MUST use the session's native app database without a renderer-only search backend.                                                                                                                              |
| LN-DESK-030 | The desktop host MUST register and load `@lapis-notes/lapis-plugin-cv-roles` as an optional core plugin enabled by default before metadata and layout restoration so persisted `role`, `roles`, and `cv` leaves restore with the plugin-owned legacy page presentation available.                                                                                                                                            |
| LN-DESK-031 | The desktop host MUST register and load `@lapis-notes/bases` after Search and before external Roles, metadata, and layout restoration. It MUST use package-exported styles, restore persisted Bases placeholders after re-enabling, and MUST NOT create a default Bases leaf.                                                                                                                                                |
| LN-DESK-032 | The desktop host MUST register and load `@lapis-notes/ai` after Bases and before external Roles, metadata, and layout restoration. It MUST advertise `agent-runtime` for process-backed ACP and Codex sessions and MUST NOT create a default AI leaf.                                                                                                                                                                        |
| LN-DESK-033 | The Electron renderer MUST load the public Lapis CodeMirror autocomplete stylesheet after Design Core and Lapis theme paint so shared completion extensions render production popover chrome without Storybook-owned CSS.                                                                                                                                                                                                    |
| LN-DESK-034 | Electron MUST forward model and thinking on `desktop_agent_acp_start` to sibling `@lapismd/ai-host`. It MUST keep acpx out of the renderer.                                                                                                                                                                                                                                                                                 |
| LN-DESK-035 | Electron MUST accept a first-class `agent` on `desktop_agent_acp_start` and forward that name to sibling `@lapismd/ai-host`. The renderer MUST NOT import acpx.                                                                                                                                                                                                                                                              |
| LN-DESK-036 | Electron agent-runtime IPC MUST call sibling `@lapismd/ai-host` for ACP sessions and process spawn. It MUST NOT keep a second acpx import path.                                                                                                                                                                                                                                                                             |
| LN-DESK-037 | Each desktop vault session MUST install one compatibility App lease before plugin loading and release it only after plugin, workspace, metadata, language-service, and vault-session teardown.                                                                                                                                                                                                                               |
| LN-DESK-039 | Electron MUST expose provider model discovery through `desktop_agent_acp_models` by calling sibling `@lapismd/ai-host`. The renderer MUST NOT open an acpx session.                                                                                                                                                                                                                                                          |
| LN-DESK-040 | ACP turn iteration and terminal result failures MUST emit one runtime error event to the renderer. Electron MUST forward standalone transport closure from sibling `@lapismd/ai-host` so pending commands reject and a visible interruption appears only when replay cannot recover the turn.                                                                                                                              |
| LN-DESK-038 | Local Electron smoke setup MUST bundle the main process after TypeScript compilation, matching the production main-process module boundary before launching the real app.                                                                                                                                                                                                                                                    |
| LN-DESK-041 | Electron end-to-end and distribution scripts MUST reuse the root Turbo-filtered desktop build before host-specific icon and packaging work.                                                                                                                                                                                                                                                                                  |
| LN-DESK-042 | Desktop vault text replacement MUST use a crash-safe same-directory replacement, and text append MUST use a native append operation rather than renderer read-and-rewrite. Existing vault confinement and renderer ownership checks MUST apply to both operations. |
| LN-DESK-043 | Electron ACP events MUST preserve the `{sessionId, runId, sequence, event}` envelope across protocol v3, and prompt IPC MUST return its run ID. Electron MAY deliver live-only frames and MUST NOT persist host replay as conversation history. |
| LN-DESK-044 | The developer-only native-agent smoke lane MUST seed one folder as both the Electron vault and absolute agent working tree, open the AI leaf with Codex Native selected, and preserve local conversations across relaunch. Its package prerequisite build MUST use Turbo's cached dependency graph. |
| LN-DESK-045 | The launcher “View all” palette MUST compose `@lapismd/design-core/shadcn/command-view` for search and results. Dialog MUST keep overlay, scrim, and upper-viewport placement. |
| LN-DESK-046 | Agent-runtime protocol v3 MUST add authenticated application-tool bridge open, response, close, call, and cancellation messages while preserving protocol-v2 agent fallback without tools. Tool authorization MUST bind to the host connection, conversation, native binding, and fixed scope; disconnect MUST revoke the bridge and its pending calls. |
| LN-DESK-047 | Electron MUST package the executable unpacked MCP shim from sibling `@lapismd/ai-host`, keep stdout protocol-only, reserve `lapis-tools`, keep bridge credentials out of arguments and durable state, and cancel in-flight calls when their owning connection closes. |
| LN-DESK-048 | Explorer MUST consume the advertised `file-system-actions` capability through the existing resolve, open, and reveal desktop IPC. It MUST NOT add a command or a second IPC channel for those actions. |
| LN-DESK-049 | After a vault is open, Design Core spacer, stacked chrome, view-header title container, and startup root MUST compute `-webkit-app-region: drag`. Interactive controls on those surfaces MUST compute `no-drag`. Lapis MUST NOT re-declare that CSS. |
| LN-DESK-050 | Desktop session boot MUST render Design Core `WorkspaceStartup` with live vault, configuration, plugin, and layout tasks. Failure MUST stay on that surface with Retry that tears down and reboots. It MUST NOT keep the Opening vault stub or return a mid-boot failure to the launcher. While the plugins task is active, the live status MUST show the current plugin name. |
| LN-DESK-051 | After layout restoration, desktop boot MUST start metadata cache load. It MUST NOT start that load before `loadLayout` returns or wait for it before mounting `WorkspaceShell`. Metadata-backed surfaces MUST refresh on `loaded`. |
| LN-DESK-052 | While resolving a current profile, the host MUST NOT paint the branded launcher. A valid current `desktop-folder` profile MUST continue to Design Core `WorkspaceStartup`. The launcher MUST appear only when no valid current profile exists or the user opened an explicit manage or Open Vault overlay. |
| LN-DESK-053 | A Manage Vaults or Open Vault… overlay MUST keep the ready session mounted and hidden without clearing the current profile. Close MUST sit immediately right of Settings, use Return to previous vault, and return without `WorkspaceStartup`. First launch MUST omit close. |

### LN-DESK-049 acceptance details

Electron acceptance verifies Design Core drag chrome:

- Ready top-tab spacer, stacked-tab chrome, view-header title container, and session startup root MUST compute `-webkit-app-region: drag`.
- Interactive descendants on those surfaces MUST compute `no-drag`.
- Lapis stylesheets MUST NOT re-declare `app-region` or `-webkit-app-region`.

### LN-DESK-050 acceptance details

Desktop session boot verifies the shared startup surface:

- The four task ids MUST be `vault`, `configuration`, `plugins`, and `layout`.
- `WorkspaceShell` MUST stay unmounted until that sequence completes.
- Retry MUST reuse the mounted session and MUST NOT open the branded launcher.
- While plugins are active, the status message MUST name the current plugin.

### LN-DESK-051 acceptance details

Desktop boot restores the layout before opening the metadata store:

- `metadataCache.load` MUST start after `loadLayout` returns.
- `WorkspaceShell` mount MUST NOT await that promise.
- Tags, Outline, Backlinks, Outgoing Links, Search, Bases, and File Properties MUST refresh when `loaded` fires.
- While load, rebuild, or reconcile runs, the notifications status item MUST show busy progress. The shell MUST NOT wait for that work before mounting.

### LN-DESK-052 acceptance details

Desktop restore verifies the host boot gate:

- `data-desktop-host-state` MUST stay `loading` or `opening` until a valid profile opens or restore falls back.
- Restore MUST NOT mount the branded launcher or paint `landing` while a current profile is resolving.
- A valid current profile MUST enter the session four-task `WorkspaceStartup` path.
- No profile or an invalid current profile MUST then show the branded chooser.

### LN-DESK-053 acceptance details

Desktop overlay verifies:

- Manage Vaults and native Open Vault… MUST keep the live session mounted and hidden.
- Close MUST sit immediately after Settings and return to that session without a second startup.
- Opening or creating a different vault MUST persist, dispose, then replace the session.
- First launch MUST omit the close control.

## Boot flow

The renderer imports Bases and its exported stylesheet from the package, then
registers it after Search and before external Roles. A source-order audit and
the production renderer build verify plugin loading precedes metadata and
layout restoration; Bases is not added to the default leaf policy.
Each mounted desktop session provides its App to the shell and installs one
compatibility lease for legacy consumers. Teardown releases that lease only
after the session-owned workspace, plugins, metadata, and services close.
The main process also owns one loopback tool broker. The context-isolated
preload forwards bridge call and cancellation events, and packaged builds copy
the standalone MCP shim to unpacked `dist-electron` output so Electron can run
it in Node mode without putting its token on the command line.
Protocol-v3 ACP starts receive `mcpServers` plus the opaque application bridge
ID, while protocol-v2 starts retain the legacy external-server field and omit
the application bridge. Codex Native receives only the shim command in its MCP
configuration and inherits its bridge credential through the child environment.

```text
Electron main
  -> context-isolated preload
  -> NativeDesktopBridge registration
  -> desktop-owned vault bootstrap
  -> API vault session and App
  -> Design Core WorkspaceStartup
  -> @lapis-notes/workspace WorkspaceShell
```

The ready renderer corresponds to the behavior demonstrated by
`Workspace/Shell / PersistedDesktop`, but its adapter is a selected native
folder. The desktop consumer loads the checkout's reusable core plugins before
layout restoration; retained sidecars remain available to those plugins and to
later community-plugin work. The Markdown sidecar consumes
`@lapis-notes/language-service/markdownlint/runtime`, which groups same-rule
fixes in a diagnostic range so hover and Problems actions stay unique by title.
That runtime applies vault `markdown-lint.disabledRules`, which seed MD013 off
to match vscode-markdownlint, and formats each diagnostic as the rule-name
path plus description used by vscode-markdownlint.

The desktop launcher retains the reference Lapis logo, create/open hierarchy,
recent-project search and actions, and persisted appearance selector. While a
saved current profile is resolving, the host paints Design Core
`WorkspaceStartup` instead of the chooser. Manage Vaults and native Open Vault…
overlay that chooser over a retained session; Close returns without disposing.
Create still uses the native folder picker and names the vault from the folder
basename. Its
loading and overlay geometry use scoped desktop classes, while Settings and the
command palette retain Design Core's shared modal scrim. The “View all” inner
search and result list compose Command View. Demo workspace seeding and
browser-only storage choices remain outside this host.

## Distribution boundary

The package retains the legacy Electron Builder configuration, icons,
entitlements, artifact naming, and local macOS/Linux commands. GitHub release
publication, update upload, Homebrew automation, Windows targets, the notebook
DuckDB sidecar, demo-vault seeding, and the legacy full application bootstrap
are intentionally excluded.

## Implementation evidence

The retained host lives in `packages/desktop-electron`. Its focused Vitest
contract suite covers the exact capability registry, IPC allowlist, and native
path containment. The production Electron suite covers picker cancellation,
empty-shell startup, saved-profile reopening, missing-folder fallback, layout
persistence, session switching, database/search persistence, Markdown service
recovery, plugin sidecar lifecycle, plugin asset validation, and real
second-instance app-URL delivery to the ready API app.

Packaged renderer assets are served from the contained
`lapis-app://app/` scheme with cross-origin isolation headers. Main owns native
Turso handles by renderer and vault and exposes only bounded database methods;
the Intel package loads Turso WASM from the same isolated renderer scheme.

`DesktopVaultLauncher.svelte` is the desktop-only adaptation of the reference
launcher. It consumes public API profile operations, Lapis fuzzy search, and
public Design Core primitives; `DesktopVaultHost.svelte` remains responsible
for orderly session replacement and hands selected profiles to that launcher.

The renderer imports the same public Design Core and Lapis style entries as the
Storybook host. API layout normalization supplies the captured desktop defaults
for a missing workspace file: one empty tab, a `22rem` open left dock, and
closed right and bottom docks. Electron acceptance verifies those controller
values together with the rendered shell geometry and typography. The preload's
typed platform metadata selects namespaced root classes; desktop CSS uses the
macOS class to clear native traffic lights without an inline geometry value.
The development Vite server resolves Design Core's installed link to its real
package root and Mira's installed link to its workspace root so stylesheet and
font dependencies remain inside the explicit filesystem boundary without
bypassing public package exports.
The Electron renderer deduplicates the same CodeMirror and Lezer singleton
peers as Storybook so Markdown views receive one extension identity across the
linked Mira packages.

The renderer-close handshake gives the desktop host time to persist layout and
database state and dispose workspace, watch, and sidecar resources before main
closes the window. A five-second main-process fallback prevents an unresponsive
renderer from blocking application exit.

`pnpm --filter @lapis-notes/desktop-electron package:dir` creates the unpacked
application, and `test:packaged` launches that output with an isolated user-data
directory and native vault. The macOS distribution command produces arm64 and
x64 DMG and ZIP artifacts plus blockmaps. Each platform distribution writes a
local-only JSON manifest containing artifact sizes, SHA-256 checksums, and
blockmap metadata. Linux AppImage and tar production is defined by `dist:linux`
and must be executed on a Linux x64 builder.
