# Deno Desktop Host

The Deno desktop host began as a Deno 2.9.5+ `deno desktop` spike and now tracks
user-facing parity with the Electron host. It reuses the existing
`NativeDesktopBridge`, `WorkspaceShell`, and first-party plugins without
copying their implementation. It MUST NOT replace Electron until equivalent
packaged acceptance passes. The private package lives at
`packages/desktop-deno` and is launched with `pnpm dev:desktop-deno`.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-DENO-001 | The experimental host MUST create its window with Deno 2.9.5 or later `deno desktop` and `Deno.BrowserWindow`. It MUST NOT use Electron main, preload, or electron-builder.                                                                                 |
| LN-DENO-002 | The host MUST implement `NativeDesktopBridge` through `win.bind()` and register it with `setNativeDesktopBridge` before creating a vault session. The published runtime MUST be `deno-desktop`.                                                             |
| LN-DENO-003 | Vault profiles MUST use the `desktop-folder` kind. Native filesystem bindings MUST reject paths outside the selected vault root.                                                                                                                            |
| LN-DENO-004 | Open and create vault MAY collect an absolute folder path through a prompt or the `LAPIS_DENO_VAULT` environment variable until Deno ships a native picker. Cancelling MUST return to the branded launcher.                                                 |
| LN-DENO-005 | A Deno desktop session MUST open the app database through Turso WASM. It MUST advertise database and search only when their Deno bridge operations are implemented.                                                                                         |
| LN-DENO-006 | Before restoring layout, the host MUST register the same enabled-by-default first-party plugin inventory and ordering as Electron. It MUST load only the configured enabled set and keep community plugins disabled until the plugin host is available.     |
| LN-DENO-007 | Each vault session MUST install one compatibility App lease before plugin loading and release it only after plugin, workspace, metadata, and vault-session teardown.                                                                                        |
| LN-DENO-008 | Language, plugin, AI, and terminal host services MUST use public package boundaries and Deno-owned process lifecycles. Deno code MUST NOT import Electron main or preload modules.                                                                          |
| LN-DENO-009 | Session boot MUST render Design Core `WorkspaceStartup` with vault, configuration, plugin, and layout tasks, then mount `WorkspaceShell` with an API `App`. It MUST NOT copy the workspace renderer.                                                        |
| LN-DENO-010 | Development and production renderer responses MUST send the cross-origin isolation headers required by WASM Turso.                                                                                                                                          |
| LN-DENO-011 | The visible window MUST complete a bounded, retrying `win.bind()` invoke probe before mounting a vault session. One lost WebView return MUST NOT stall startup. The host MUST use Deno's public binding registry and MUST NOT patch `Map.prototype`.        |
| LN-DENO-012 | On macOS, the visible window MUST provide full-bleed content with native traffic lights through Deno `transparentTitlebar`. Other platforms MUST retain native chrome. The host MUST NOT use Electron `titleBarStyle` or AppKit style-mask mutation.        |
| LN-DENO-013 | Launcher empty chrome and Design Core `data-desktop-drag-region` surfaces MUST move the window. Descendants marked `false` MUST NOT start a drag. The host MUST NOT re-declare Design Core `app-region` CSS.                                                |
| LN-DENO-014 | The production renderer MUST bundle `@tursodatabase/database-wasm/bundle` as published ESM. It MUST NOT pass that file through Vite's CommonJS conversion.                                                                                                  |
| LN-DENO-015 | The production host MUST serve the built renderer from the launch working directory's `dist` folder. It MUST NOT resolve that folder relative to Deno's compiled module cache.                                                                              |
| LN-DENO-016 | The Deno bridge MUST provide the Electron user-facing capabilities for resources, database/search, language services, plugin hosting/assets, file watching, notifications, file actions, agents, and terminals. Notebook and model MUST remain unavailable. |
| LN-DENO-017 | Native notifications and file open/reveal actions MUST either complete on the current platform or report the capability unavailable. The bridge MUST NOT advertise an operation that resolves as an unimplemented command or silent no-op.                  |
| LN-DENO-018 | Deno MUST retain one application instance, deliver `lapis` and `lapis-notes` URLs to the ready workspace, and focus the existing window for later launches.                                                                                                 |
| LN-DENO-019 | Deno menus MUST expose the same application, File, Edit, View, Window, and Help actions as Electron where the platform supports them. Unsupported native roles MUST have a documented equivalent or remain disabled.                                        |
| LN-DENO-020 | Window close and vault replacement MUST persist layout and dispose views, watches, databases, plugins, host services, and the compatibility lease before process exit or session replacement.                                                               |
| LN-DENO-021 | New windows MUST be limited to the workspace popout path. External HTTP and HTTPS links MUST open in the system browser instead of receiving a privileged Deno desktop window.                                                                              |
| LN-DENO-022 | Local distribution MUST produce macOS and Linux artifacts with stable names, icons, and credential-safe signing hooks. Deno MUST remain non-default until packaged startup and vault acceptance pass on both platforms.                                     |
| LN-DENO-023 | Automated acceptance MUST cover first selection, cancellation, reopening, missing-vault fallback, switching, layout, plugin restoration, retained services, app URLs, notifications, external links, and packaged startup.                                  |

### LN-DENO-011 acceptance details

Deno window binding verifies:

- Deno 2.9.5 or later MUST provide the public per-window binding registry after the lazy-op upgrade.
- The visible macOS overlay window MUST return `desktop_app_info_get` before the renderer mounts a vault session, retrying when an earlier probe remains pending.
- The host MUST NOT install the superseded `Map.prototype.get` binding shim.

### LN-DENO-012 acceptance details

macOS Deno window chrome verifies:

- The first `BrowserWindow` adopts Deno's bootstrap window, so macOS MUST create a second window for creation-only chrome.
- The visible window MUST set `transparentTitlebar: true` and `frameless: false` so full-size content retains native traffic lights.
- The adopted bootstrap window MUST remain invisible and MUST NOT steal focus after Deno's automatic navigation.
- Platform metadata MUST enable the existing macOS traffic-light clearance only when the overlay window is active.

### LN-DENO-013 acceptance details

Deno window dragging verifies:

- Launcher empty chrome and Design Core `data-desktop-drag-region` surfaces MUST start a window drag. Descendants marked `false` MUST NOT.
- The host MUST NOT re-declare `app-region` CSS or use Electron `titleBarStyle`.
- Pointer release and cancellation MUST end the native drag.

### LN-DENO-014 acceptance details

The production Turso WASM build verifies:

- The CommonJS exclusion MUST target only Turso's published `bundle/main.es.js` file.
- Vite MUST still emit the self-contained Turso bundle with its embedded worker and WASM data.
- The package production build MUST complete without a CommonJS resolver stack overflow.

### LN-DENO-015 acceptance details

The production renderer launch verifies:

- Root and emitted asset requests MUST resolve beneath `<launch working directory>/dist`.
- Static responses MUST retain the renderer's cross-origin isolation headers.
- A production-mode Deno launch MUST restore an isolated vault, load the full portable plugin inventory, and reach workspace-ready through the native bridge.

### LN-DENO-002 acceptance details

The Deno bridge registration verifies:

- `NativeDesktopBridge.runtime` MUST be `deno-desktop`.
- `setNativeDesktopBridge` MUST publish `globalThis.__LAPIS_NATIVE_DESKTOP__`.
- Renderer `invoke` MUST reach allowlisted `win.bind()` handlers only.

### LN-DENO-006 acceptance details

Plugin registration parity verifies:

- Markdown, Markdown Lint, Spell Check, File Explorer, Search, Bookmarks,
  History, Word Count, Bases, AI, Terminal, and Roles MUST register in the
  Electron order before `loadLayout`.
- `loadPlugins` MUST keep community plugins disabled.
- A plugin whose required host capability is unavailable MUST remain visible
  with a bounded unavailable state instead of failing session boot.

### LN-DENO-009 acceptance details

Deno session boot verifies the shared startup surface:

- The four task ids MUST be `vault`, `configuration`, `plugins`, and `layout`.
- `WorkspaceShell` MUST stay unmounted until that sequence completes.
- The host MUST consume `@lapis-notes/workspace` rather than a copied shell.

## Non-goals

This parity track excludes importing Electron modules, making Deno the default
before packaged acceptance, Windows distribution, and remote release
publication. OS webview quirks require documented equivalents when they affect
an Electron-visible feature.
