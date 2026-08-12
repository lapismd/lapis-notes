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
| LN-DESK-005 | Startup MUST reopen a valid current `desktop-folder` profile from Electron main storage. If it is unavailable, startup MUST clear only the current-profile pointer, retain the saved record, and return to the folder picker. |
| LN-DESK-006 | Cancelling the native folder picker MUST leave a recoverable landing state. Selecting a folder MUST create an `electron-desktop` session, open its app database, load the vault, restore `.obsidian/workspace.json`, and render the desktop shell. |
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

## Distribution boundary

The package retains the legacy Electron Builder configuration, icons,
entitlements, artifact naming, and local macOS/Linux commands. GitHub release
publication, update upload, Homebrew automation, Windows targets, the notebook
DuckDB sidecar, demo-vault seeding, and the legacy full application bootstrap
are intentionally excluded.
