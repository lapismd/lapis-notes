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
| LN-DESK-003 | The preload MUST use context isolation and expose only the typed `NativeDesktopBridge` operations plus bounded host events and shell metrics. Renderer Node integration and raw `ipcRenderer` exposure are forbidden. |
| LN-DESK-004 | The renderer MUST register the preload bridge before creating a vault session. It MUST mount the existing `WorkspaceShell` with an API `App` and MUST NOT copy the workspace renderer. |
| LN-DESK-005 | Startup MUST reopen a valid current `desktop-folder` profile from Electron main storage. If it is unavailable, startup MUST clear only the current-profile pointer, retain the saved record, and return to the branded launcher. |
| LN-DESK-006 | Cancelling a native folder picker MUST leave the branded launcher recoverable. Selecting a folder MUST create an `electron-desktop` session, open its app database, load the vault, restore `.obsidian/workspace.json`, and render the desktop shell. |
| LN-DESK-007 | The partial host MUST NOT seed files, register core or community plugins, hydrate metadata, or import Storybook Editor, Explorer, or Tags fixtures. Missing layouts MUST use the API default empty workspace. |
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
folder. Sidecars remain available for later plugin activation even though the
partial host does not load plugins during startup.

The desktop launcher retains the reference Lapis logo, create/open hierarchy,
recent-project search and actions, and persisted appearance selector. Demo
workspace seeding and browser-only storage choices remain outside this host.

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

`DesktopVaultLauncher.svelte` is the desktop-only adaptation of the reference
launcher. It consumes public API profile operations, Lapis fuzzy search, and
public Design Core primitives; `DesktopVaultHost.svelte` remains responsible
for orderly session replacement and hands selected profiles to that launcher.

The renderer imports the same public Design Core and Lapis style entries as the
Storybook host. API layout normalization supplies the captured desktop defaults
for a missing workspace file: one empty tab, a `22rem` open left dock, and
closed right and bottom docks. Electron acceptance verifies those controller
values together with the rendered shell geometry and typography.

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
