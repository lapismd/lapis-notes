# Deno Desktop Host

The Deno desktop host began as a Deno 2.9.5+ `deno desktop` spike and now tracks
user-facing parity with the Electron host. It reuses the existing
`NativeDesktopBridge`, `WorkspaceShell`, and first-party plugins without
copying their implementation. It MUST NOT replace Electron until equivalent
packaged acceptance passes. The private package lives at
`packages/desktop-deno` and is launched with `pnpm dev:desktop-deno`.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-DENO-001 | The experimental host MUST create its window with Deno 2.9.5 or later `deno desktop` and `Deno.BrowserWindow`. It MUST NOT use Electron main, preload, or electron-builder.                                                                                                          |
| LN-DENO-002 | The host MUST implement `NativeDesktopBridge` through `win.bind()` and register it with `setNativeDesktopBridge` before creating a vault session. The published runtime MUST be `deno-desktop`.                                                                                      |
| LN-DENO-003 | Vault profiles MUST use the `desktop-folder` kind. Native filesystem bindings MUST reject paths outside the selected vault root.                                                                                                                                                     |
| LN-DENO-004 | Open and create vault MAY collect an absolute folder path through a prompt or the `LAPIS_DENO_VAULT` environment variable until Deno ships a native picker. Cancelling MUST return to the branded launcher.                                                                          |
| LN-DENO-005 | A Deno desktop session MUST open the app database through Turso WASM. It MUST advertise database and search only when their Deno bridge operations are implemented.                                                                                                                  |
| LN-DENO-006 | Before restoring layout, the host MUST register the same enabled-by-default first-party plugin inventory and ordering as Electron. It MUST load only the configured enabled set and keep community plugins disabled until the plugin host is available.                              |
| LN-DENO-007 | Each vault session MUST install one compatibility App lease before plugin loading and release it only after plugin, workspace, metadata, and vault-session teardown.                                                                                                                 |
| LN-DENO-008 | Language, plugin, AI, and terminal host services MUST use public package boundaries and Deno-owned process lifecycles. Deno code MUST NOT import Electron main or preload modules.                                                                                                   |
| LN-DENO-009 | Session boot MUST render Design Core `WorkspaceStartup` with vault, configuration, plugin, and layout tasks, then mount `WorkspaceShell` with an API `App`. It MUST NOT copy the workspace renderer.                                                                                 |
| LN-DENO-010 | Development and production renderer responses MUST send the cross-origin isolation headers required by WASM Turso.                                                                                                                                                                   |
| LN-DENO-011 | The visible window MUST complete a bounded, retrying `win.bind()` invoke probe before mounting a vault session. One lost WebView return MUST NOT stall startup. The host MUST use Deno's public binding registry and MUST NOT patch `Map.prototype`.                                 |
| LN-DENO-012 | On macOS, the visible window MUST provide full-bleed content with native traffic lights through Deno `transparentTitlebar`. Other platforms MUST retain native chrome. The host MUST NOT use Electron `titleBarStyle` or AppKit style-mask mutation.                                 |
| LN-DENO-013 | Launcher empty chrome and Design Core `data-desktop-drag-region` surfaces MUST move the window. Descendants marked `false` MUST NOT start a drag. The host MUST NOT re-declare Design Core `app-region` CSS.                                                                         |
| LN-DENO-014 | The production renderer MUST bundle `@tursodatabase/database-wasm/bundle` as published ESM. It MUST NOT pass that file through Vite's CommonJS conversion.                                                                                                                           |
| LN-DENO-015 | The production host MUST serve the built renderer from the launch working directory's `dist` folder. It MUST NOT resolve that folder relative to Deno's compiled module cache.                                                                                                       |
| LN-DENO-016 | The Deno bridge MUST provide the Electron user-facing capabilities for resources, database/search, language services, plugin hosting/assets, file watching, notifications, file actions, agents, and terminals. Notebook and model MUST remain unavailable.                          |
| LN-DENO-017 | Native notifications and file open/reveal actions MUST either complete on the current platform or report the capability unavailable. The bridge MUST NOT advertise an operation that resolves as an unimplemented command or silent no-op.                                           |
| LN-DENO-018 | Deno MUST retain one application instance, deliver `lapis` and `lapis-notes` URLs to the ready workspace, and focus the existing window for later launches.                                                                                                                          |
| LN-DENO-019 | Deno menus MUST expose the same application, File, Edit, View, Window, and Help actions as Electron where the platform supports them. Unsupported native roles MUST have a documented equivalent or remain disabled.                                                                 |
| LN-DENO-020 | Window close and vault replacement MUST persist layout and dispose views, watches, databases, plugins, host services, and the compatibility lease before process exit or session replacement.                                                                                        |
| LN-DENO-021 | New windows MUST be limited to the workspace popout path. External HTTP and HTTPS links MUST open in the system browser instead of receiving a privileged Deno desktop window.                                                                                                       |
| LN-DENO-022 | Local distribution MUST produce macOS and Linux artifacts with stable names, icons, and credential-safe signing hooks. Deno MUST remain non-default until packaged startup and vault acceptance pass on both platforms.                                                              |
| LN-DENO-023 | Automated acceptance MUST cover first selection, cancellation, reopening, missing-vault fallback, switching, layout, plugin restoration, retained services, app URLs, notifications, external links, and packaged startup.                                                           |
| LN-DENO-024 | The native Markdown language service MUST consume the public language-service runtime and expose bounded capability, update, diagnostics, and code-action operations. The renderer MUST register its provider before plugin loading and release it during teardown.                  |
| LN-DENO-025 | Native vault watching MUST use `Deno.watchFs`, preserve vault containment across canonical filesystem paths, and deliver portable create, modify, and delete events. Closing a subscription or session MUST stop its native watcher.                                                 |
| LN-DENO-026 | Verified plugin assets MUST register through the native bridge and load from a same-origin Deno HTTP route. The host MUST enforce installed plugin identity, version, path containment, supported type, byte size, and SHA-256 before serving an asset.                              |
| LN-DENO-027 | The native agent runtime MUST consume the public `@lapismd/ai-host` executor for process and ACP sessions. Application tools MUST use its authenticated Web-standard MCP handler through the existing Deno loopback server, and host shutdown MUST close every owned agent resource. |

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

### LN-DENO-024 acceptance details

The native Markdown language service verifies:

- Deno MUST consume `@lapis-notes/language-service/markdownlint/runtime`
  without copying its implementation.
- Capability probing, document updates, diagnostics, and code actions MUST
  validate protocol versions and bounded document payloads.
- A packaged saved-vault session MUST report at least one native Markdown
  diagnostic before acceptance completes.

### LN-DENO-025 acceptance details

Native vault watching verifies:

- macOS canonical `/private/var` events MUST remain inside a vault opened
  through its equivalent `/var` path.
- Atomic final renames MUST publish a portable modification while host-created
  UUID temporary files MUST NOT create change churn.
- Each native event MUST reach the matching renderer subscription through the
  bounded native event bridge.
- Packaged acceptance MUST write a vault file and observe its event before the
  watcher is closed.

### LN-DENO-026 acceptance details

Verified plugin asset hosting verifies:

- The renderer MUST read verified installed-plugin metadata through the public
  API asset helpers before registering native context.
- The native host MUST resolve every asset beneath that plugin's selected-vault
  directory and reject traversal or mismatched metadata.
- JavaScript, styles, data, WASM, and supported image assets MUST use explicit
  content types with `nosniff`, no-store, and isolation headers.
- Packaged acceptance MUST fetch a seeded verified JavaScript asset and match
  its complete content and content type.

### LN-DENO-027 acceptance details

Native agent execution verifies:

- Every `desktop_agent_process_*`, `desktop_agent_acp_*`, and
  `desktop_agent_tools_*` command MUST delegate through the public executor.
- Runtime, process, tool-call, and tool-cancel events MUST reach the renderer
  through the bounded native event bridge.
- Application tools MUST use a bearer-authenticated Streamable HTTP MCP route
  attached to Deno's existing `127.0.0.1` renderer server.
- Packaged acceptance MUST open and close an application-tool bridge and run a
  process through the compiled app without a system Node host.

### LN-DENO-018 acceptance details

Deno application activation verifies:

- The primary process MUST hold an exclusive application-data lock and publish
  an authenticated loopback endpoint readable only by the current user.
- A later process MUST forward valid `lapis` and `lapis-notes` arguments, focus
  the primary window, and exit before creating another application host.
- Startup and later-launch URLs MUST remain queued until the renderer subscribes
  and the ready `App` MUST dispatch them through its public URL registry.
- The macOS application bundle and Linux desktop metadata MUST declare both URL
  schemes without embedding credentials or environment-specific paths.

### LN-DENO-019 acceptance details

Deno application menus verify:

- macOS MUST put About and Quit in the first application submenu; other
  platforms MUST expose About through Help.
- File, Edit, View, Window, and Help MUST preserve Electron labels and common
  accelerators where Deno supplies an equivalent role or host action.
- Unsupported force reload, zoom, and fullscreen actions MUST remain visible
  and disabled instead of silently performing a different action.
- Open Vault, About, developer tools, reload, and Learn More MUST reach their
  native or renderer-owned action.

### LN-DENO-020 acceptance details

Deno window close verifies:

- The first close request MUST be cancelled while the renderer persists layout
  and disposes the active session through its normal teardown path.
- A bounded timeout MUST still close native watches, plugin asset state, and
  agent resources if the renderer never acknowledges the request.
- Renderer acknowledgement MUST release the prevented close and exit only
  after native host shutdown settles.
- Packaged acceptance MUST request a real window close and observe a clean
  process exit without sending an external termination signal.

### LN-DENO-021 acceptance details

Deno window navigation verifies:

- Renderer-created blank windows MAY be used by the shared workspace popout
  host; other non-HTTP new-window targets MUST be rejected.
- HTTP and HTTPS new-window requests and anchor activations MUST invoke a
  validated system-browser action instead of navigating a privileged webview.
- System-browser commands MUST pass the complete URL as one process argument
  and MUST reject unsupported schemes.

### LN-DENO-022 acceptance details

Deno desktop distribution verifies:

- macOS MUST produce a versioned, architecture-qualified application bundle
  and ZIP that use the Lapis icon and declare both application URL schemes.
- Linux x64 MUST produce a versioned AppImage and tar archive containing the
  executable, desktop entry, and Lapis icon with stable names.
- macOS signing MUST use either an explicit keychain identity or ad-hoc signing,
  notarization MUST use a configured keychain profile, and Linux signing MUST
  use an agent-backed GPG key. Every credential-dependent step MUST skip safely
  when its non-secret selector is absent.
- The macOS bundle MUST include Deno's runtime-update readiness marker before
  signing so first launch leaves the sealed application signature valid.
- Artifact creation MUST NOT print, persist, or pass account passwords, private
  keys, or authentication tokens through command arguments.

## Non-goals

This parity track excludes importing Electron modules, making Deno the default
before packaged acceptance, Windows distribution, and remote release
publication. OS webview quirks require documented equivalents when they affect
an Electron-visible feature.
