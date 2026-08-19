# Deno Desktop Host

The experimental Deno desktop host is a spike that proves Deno 2.9.5+
`deno desktop` can implement the existing `NativeDesktopBridge` well enough to
open a `desktop-folder` vault and mount `WorkspaceShell`. It MUST NOT replace
the Electron host. API session creation accepts runtime `deno-desktop` and
opens Turso WASM rather than Electron native IPC. The private package lives at
`packages/desktop-deno` and is launched with `pnpm dev:desktop-deno`.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-DENO-001 | The experimental host MUST create its window with Deno 2.9.5 or later `deno desktop` and `Deno.BrowserWindow`. It MUST NOT use Electron main, preload, or electron-builder.                                                                                                                  |
| LN-DENO-002 | The host MUST implement `NativeDesktopBridge` through `win.bind()` and register it with `setNativeDesktopBridge` before creating a vault session. The published runtime MUST be `deno-desktop`.                                                                                              |
| LN-DENO-003 | Vault profiles MUST use the `desktop-folder` kind. Native filesystem bindings MUST reject paths outside the selected vault root.                                                                                                                                                             |
| LN-DENO-004 | Open and create vault MAY collect an absolute folder path through a prompt or the `LAPIS_DENO_VAULT` environment variable until Deno ships a native picker. Cancelling MUST return to the branded launcher.                                                                                  |
| LN-DENO-005 | A Deno desktop session MUST open the app database through Turso WASM. The host MUST NOT advertise `database` as available or implement `desktop_db_*` commands.                                                                                                                              |
| LN-DENO-006 | Before restoring layout, the host MUST register Markdown and File Explorer as optional bundled plugins, load only their enabled set, and keep community plugins disabled. It MUST NOT register Search, Bases, AI, Terminal, or Roles in this spike.                                          |
| LN-DENO-007 | Each vault session MUST install one compatibility App lease before plugin loading and release it only after plugin, workspace, metadata, and vault-session teardown.                                                                                                                         |
| LN-DENO-008 | The spike MUST NOT add language-service, plugin-eval, AI, or terminal sidecars, or CEF-required distribution artifacts.                                                                                                                                                                      |
| LN-DENO-009 | Session boot MUST render Design Core `WorkspaceStartup` with vault, configuration, plugin, and layout tasks, then mount `WorkspaceShell` with an API `App`. It MUST NOT copy the workspace renderer.                                                                                         |
| LN-DENO-010 | Development and production renderer responses MUST send the cross-origin isolation headers required by WASM Turso.                                                                                                                                                                           |
| LN-DENO-011 | The visible window MUST complete `win.bind()` invoke returns before mounting a vault session. The host MUST use Deno's public binding registry and MUST NOT patch `Map.prototype`.                                                                                                          |
| LN-DENO-012 | On macOS, the visible window MUST provide full-bleed content with native traffic lights through Deno `transparentTitlebar`. Other platforms MUST retain native chrome. The host MUST NOT use Electron `titleBarStyle` or AppKit style-mask mutation.                                            |
| LN-DENO-013 | Launcher empty chrome and Design Core `data-desktop-drag-region` surfaces MUST move the window. Descendants marked `false` MUST NOT start a drag. The host MUST NOT re-declare Design Core `app-region` CSS.                                                                                     |

### LN-DENO-011 acceptance details

Deno window binding verifies:

- Deno 2.9.5 or later MUST provide the public per-window binding registry after the lazy-op upgrade.
- The visible macOS overlay window MUST return `desktop_app_info_get` before the renderer mounts a vault session.
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

### LN-DENO-002 acceptance details

The Deno bridge registration verifies:

- `NativeDesktopBridge.runtime` MUST be `deno-desktop`.
- `setNativeDesktopBridge` MUST publish `globalThis.__LAPIS_NATIVE_DESKTOP__`.
- Renderer `invoke` MUST reach allowlisted `win.bind()` handlers only.

### LN-DENO-006 acceptance details

Spike plugin registration verifies:

- Markdown and File Explorer MUST register before `loadLayout`.
- `loadPlugins` MUST keep community plugins disabled.
- Search, Bases, AI, Terminal, and Roles MUST stay unregistered.

### LN-DENO-009 acceptance details

Deno session boot verifies the shared startup surface:

- The four task ids MUST be `vault`, `configuration`, `plugins`, and `layout`.
- `WorkspaceShell` MUST stay unmounted until that sequence completes.
- The host MUST consume `@lapis-notes/workspace` rather than a copied shell.

## Non-goals

This spike excludes Electron replacement, a shared desktop-renderer package,
native Turso RPC, language-service and plugin-eval sidecars, AI and terminal
hosts, and packaged `deno desktop` distribution. OS webview quirks are host
limitations unless they block vault open.
