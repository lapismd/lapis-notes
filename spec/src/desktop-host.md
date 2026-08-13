# Desktop Host

The Electron host is a source-first intake from the legacy
`/Users/stevejuma/code/lapis-notes/packages/desktop-electron` package at commit
`8ec68e18`. Root `MIGRATION.md` records which legacy areas remain, change, or
are intentionally omitted.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-DESK-001 | The private `@lapis-notes/desktop-electron` package MUST retain the legacy Lapis Notes product identity, application ID, `lapis` and `lapis-notes` protocols, and version `2026.31.5`. |
| LN-DESK-002 | Electron main MUST own application lifecycle, the single-instance lock, native menus, app-URL delivery, window chrome, protocol handlers, native notifications, and shutdown of main-owned services. |
| LN-DESK-003 | The preload MUST use context isolation and expose only the typed `NativeDesktopBridge` operations, platform metadata, and bounded host events. Renderer Node integration and raw `ipcRenderer` exposure are forbidden. |
| LN-DESK-004 | The renderer MUST register the preload bridge before creating a vault session. It MUST mount the existing `WorkspaceShell` with an API `App` and MUST NOT copy the workspace renderer. |
| LN-DESK-005 | Startup MUST reopen a valid current `desktop-folder` profile from Electron main storage. If it is unavailable, startup MUST clear only the current-profile pointer, retain the saved record, and return to the branded launcher. |
| LN-DESK-006 | Cancelling a native folder picker MUST leave the branded launcher recoverable. Selecting a folder MUST create an `electron-desktop` session, open its app database, load the vault, restore `.obsidian/workspace.json`, and render the desktop shell. |
| LN-DESK-007 | The partial host MUST NOT seed files, load community plugins, or import the Storybook-only source-editor fixture. Missing layouts MUST use the API default empty workspace. |
| LN-DESK-008 | The bridge MUST advertise resource, database, search, language-service, plugin-sidecar, plugin-assets, file-watch, notifications, and file-system-actions capabilities as available. Notebook and model capabilities MUST remain unavailable. |
| LN-DESK-009 | Native IPC MUST validate sender ownership, payload bounds, and vault-root containment. Resource and plugin protocols MUST reject traversal, unregistered contexts, unsupported asset types, and metadata hash or size mismatches. |
| LN-DESK-010 | The native language-service sidecar MUST expose the current Markdown protocol only: capability probing, document updates, diagnostics, and code actions. It MUST enforce bounded payloads, timeouts, restart, and shutdown behavior. |
| LN-DESK-011 | The community-plugin sidecar MUST retain prepare, evaluate, activate, deactivate, and shutdown lifecycles with the current brokered capabilities. Hosted CommonJS imports MUST be limited to `lapis` and `@lapis-notes/api`. |
| LN-DESK-012 | The renderer plugin-asset server MUST use public API contracts and register verified installed-plugin metadata before returning scoped `lapis-plugin` URLs. It MUST NOT import API source paths. |
| LN-DESK-013 | Switching vaults or closing the renderer MUST dispose the workspace controller, active views, bridge listeners, native watches, plugin and language sidecars, and the previous vault session before replacement or exit. |
| LN-DESK-014 | New windows MUST be limited to the workspace `about:blank` popout path. External HTTP or HTTPS links MUST open through the system browser instead of receiving an Electron renderer window. |
| LN-DESK-015 | Local distribution MUST produce macOS DMG and ZIP plus Linux AppImage and tar artifacts with stable hyphenated names. Signing and notarization hooks MUST skip safely without credentials, and release publication MUST remain out of scope. |
| LN-DESK-016 | Automated acceptance MUST cover first selection, cancellation, saved-vault reopening, missing-vault fallback, workspace persistence, vault switching, app URLs, retained IPC services, retained sidecars, and packaged application startup. |
| LN-DESK-017 | First launch MUST show the branded native-vault launcher derived from legacy commit `8ec68e18` without opening a picker automatically. It MUST offer create, open, recent-project management, search, and appearance settings while omitting the demo-workspace action. |
| LN-DESK-018 | The renderer MUST load Design Core's production styles, Lapis theme, and Lapis UI aliases through the Electron Vite pipeline. It MUST NOT rely on Storybook to supply workspace or launcher paint. |
| LN-DESK-019 | A native vault without `.obsidian/workspace.json` MUST show one empty `New Tab`, the left dock open at `22rem`, and the right and bottom docks closed. It MUST NOT seed a layout file, fixture view, or plugin. |
| LN-DESK-020 | Native “Open Vault…” requests from a ready workspace MUST persist and dispose the active session before showing the launcher. Selecting another vault MUST create a replacement session without retaining old watches or database handles. |
| LN-DESK-021 | The ready desktop shell MUST expose the legacy footer vault switcher with up to eight recent native vaults, the current vault disabled, folder descriptions, and a “Manage Vaults” action. Recent selection MUST use orderly session replacement and structured-cloneable profile records; management MUST dispose the session, clear only the current-profile pointer, retain saved records, and show the branded launcher. |
| LN-DESK-022 | The launcher and transient native-vault loading state MUST center their content within the Electron viewport when it fits, while an oversized launcher MUST remain scrollable from its top edge. |
| LN-DESK-023 | Launcher Settings MUST use a compact centered dialog. “View all” MUST use an upper-viewport searchable command palette containing recent projects rather than a drawer or bottom sheet. Both MUST retain the shared full-viewport modal scrim. |
| LN-DESK-024 | The renderer MUST map typed Electron platform metadata to root CSS classes. macOS traffic-light clearance MUST derive from those classes and desktop CSS rather than renderer-injected geometry styles. |
| LN-DESK-025 | The development renderer MUST serve assets imported by linked Design Core and Mira packages, including their fonts. Its Vite filesystem allowlist MUST retain the Lapis workspace root and add only resolved linked-package or linked-workspace roots rather than using source aliases or a broad parent-directory grant. |
| LN-DESK-026 | On macOS, an expanded left-sidebar tab bar MUST reserve a larger host-CSS traffic-light inset than the already-correct collapsed main-tab control. Both values MUST derive from the typed platform root class rather than inline geometry. |
| LN-DESK-027 | Before restoring a vault layout, the desktop host MUST register and load every core plugin implementation shipped by this checkout: Markdown (including its Tags view), Markdownlint, and File Explorer. It MUST load configuration and metadata for those plugins while keeping community plugins disabled. |
| LN-DESK-028 | When a persisted `empty` leaf carries `state.__missingViewType`, layout restoration MUST retry that requested type after core plugins load. A now-available view MUST be restored and subsequently persist its canonical type; a still-unavailable Search, Bookmarks, or other view MUST remain an explicit placeholder. |
| LN-DESK-029 | The desktop host MUST register and load `@lapis-notes/search` before metadata and layout restoration. A vault without persisted layout MUST include Search in its default left tabs. Persisted Search leaves MUST use the session's native app database without a renderer-only search backend. |
| LN-DESK-030 | The desktop host MUST register and load `@lapis-notes/roles` as an optional core plugin enabled by default before metadata and layout restoration so persisted `role`, `roles`, and `cv` leaves restore as available. |

## Boot flow

```text
Electron main
  -> context-isolated preload
  -> NativeDesktopBridge registration
  -> desktop-owned vault bootstrap
  -> API vault session and App
  -> @lapis-notes/workspace WorkspaceShell
```

The ready renderer corresponds to the behavior demonstrated by
`Workspace/Shell / PersistedDesktop`, but its adapter is a selected native
folder. The desktop consumer loads the checkout's reusable core plugins before
layout restoration; retained sidecars remain available to those plugins and to
later community-plugin work.

The desktop launcher retains the reference Lapis logo, create/open hierarchy,
recent-project search and actions, and persisted appearance selector. Its
loading and overlay geometry use scoped desktop classes, while Settings and the
command palette retain Design Core's shared modal scrim. Demo workspace seeding
and browser-only storage choices remain outside this host.

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
