# Deno Desktop Host

The Deno desktop host is the sole native Lapis Notes application. It requires
Deno 2.9.5+ `deno desktop` and reuses `NativeDesktopBridge`, `WorkspaceShell`,
and first-party plugins without copying their implementation. The private
package remains at `packages/desktop-deno` and the root launches it with
`pnpm dev:desktop`; `pnpm dev:desktop:cef` starts the same development host with
the Chromium Embedded Framework backend for renderer debugging. Windows
distribution is outside the supported matrix.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-DENO-001 | The native desktop host MUST create its window with Deno 2.9.5 or later `deno desktop` and `Deno.BrowserWindow`. It MUST NOT include a second desktop framework or builder.                                                                                                                                                                                                                                                                                                                            |
| LN-DENO-002 | The host MUST implement `NativeDesktopBridge` through `win.bind()` and register it with `setNativeDesktopBridge` before creating a vault session. The published runtime MUST be `deno-desktop`.                                                                                                                                                                                                                                                                                                        |
| LN-DENO-003 | Vault profiles MUST use the `desktop-folder` kind. Native filesystem bindings MUST reject paths outside the selected vault root.                                                                                                                                                                                                                                                                                                                                                                       |
| LN-DENO-004 | Open and create vault MAY collect an absolute folder path through a prompt or the `LAPIS_DENO_VAULT` environment variable until Deno ships a native picker. Cancelling MUST return to the branded launcher.                                                                                                                                                                                                                                                                                            |
| LN-DENO-005 | A Deno desktop session MUST open the app database through a native Turso handle owned by the Deno host. Its descriptor MUST report provider `turso-native-desktop`, engine `turso`, and transport `native`. Renderer access MUST use the bounded AppDatabase bridge and advertise database/search only when those operations are implemented.                                                                                                                                                          |
| LN-DENO-006 | Before restoring layout, the host MUST register the canonical enabled-by-default first-party plugin inventory and ordering, with Graph after Search and before Bookmarks. It MUST load only the configured enabled set, keep community plugins disabled until a public plugin host is available, and verify that inventory in packaged acceptance.                                                                                                                                                                                                    |
| LN-DENO-007 | Each vault session MUST install one compatibility App lease before plugin loading and release it only after plugin, workspace, metadata, and vault-session teardown.                                                                                                                                                                                                                                                                                                                                   |
| LN-DENO-008 | Language, plugin, AI, and terminal host services MUST use public package boundaries and Deno-owned process lifecycles. Terminal sessions MUST use sibling `@lapismd/terminal-host/deno`; Deno code MUST NOT import another desktop host.                                                                                                                                                                                                                                                               |
| LN-DENO-009 | Session boot MUST render Design Core `WorkspaceStartup` with vault, configuration, plugin, and layout tasks, then mount `WorkspaceShell` with an API `App`. It MUST NOT copy the workspace renderer.                                                                                                                                                                                                                                                                                                   |
| LN-DENO-010 | Development and production renderer responses MUST send the cross-origin isolation headers required by WASM Turso.                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-DENO-011 | The visible window MUST complete a bounded, retrying `win.bind()` invoke probe before mounting a vault session. One lost WebView return MUST NOT stall startup. The host MUST use Deno's public binding registry and MUST NOT patch `Map.prototype`.                                                                                                                                                                                                                                                   |
| LN-DENO-012 | On macOS, the visible window MUST provide full-bleed content with native traffic lights through Deno `transparentTitlebar`. Other platforms MUST retain native chrome. The host MUST NOT use private AppKit style-mask mutation.                                                                                                                                                                                                                                                                       |
| LN-DENO-013 | Launcher empty chrome and Design Core `data-desktop-drag-region` surfaces MUST move the window. Descendants marked `false` MUST NOT start a drag. The host MUST NOT re-declare Design Core `app-region` CSS.                                                                                                                                                                                                                                                                                           |
| LN-DENO-014 | The production renderer MUST bundle `@tursodatabase/database-wasm/bundle` as published ESM. It MUST NOT pass that file through Vite's CommonJS conversion.                                                                                                                                                                                                                                                                                                                                             |
| LN-DENO-015 | The production host MUST serve the built renderer from the launch working directory's `dist` folder. It MUST NOT resolve that folder relative to Deno's compiled module cache.                                                                                                                                                                                                                                                                                                                         |
| LN-DENO-016 | The Deno bridge MUST truthfully advertise resources, database/search, language services, plugin hosting/assets, file watching, notifications, file actions, agents, and terminals. Notebook and model MUST remain unavailable.                                                                                                                                                                                                                                                                         |
| LN-DENO-017 | Native notifications and file open/reveal actions MUST either complete on the current platform or report the capability unavailable. The bridge MUST NOT advertise an operation that resolves as an unimplemented command or silent no-op.                                                                                                                                                                                                                                                             |
| LN-DENO-018 | Deno MUST retain one application instance, deliver `lapis` and `lapis-notes` URLs to the ready workspace, and focus the existing window for later launches.                                                                                                                                                                                                                                                                                                                                            |
| LN-DENO-019 | Deno menus MUST expose the established application, File, Edit, View, Window, and Help actions where the platform supports them. Unsupported native roles MUST have a documented equivalent or remain disabled.                                                                                                                                                                                                                                                                                        |
| LN-DENO-020 | Window close and vault replacement MUST persist layout and dispose views, watches, databases, plugins, host services, and the compatibility lease before process exit or session replacement. Native close events from the adopted bootstrap or visible window MUST enter one coordinator. Renderer acknowledgement MUST precede native shutdown, with a bounded timeout as the fail-safe.                                                    |
| LN-DENO-021 | New windows MUST be limited to the workspace popout path. External HTTP and HTTPS links MUST open in the system browser instead of receiving a privileged Deno desktop window.                                                                                                                                                                                                                                                                                                                         |
| LN-DENO-022 | Local distribution MUST produce macOS and Linux artifacts with stable names, icons, verified target PTY libraries, and credential-safe signing hooks. It MUST reject Windows targets.                                                                                                                                                                                                                                                                                                                  |
| LN-DENO-023 | Automated acceptance MUST cover first selection, cancellation, reopening, missing-vault fallback, switching, layout, plugin restoration, retained services, app URLs, notifications, external links, and packaged startup.                                                                                                                                                                                                                                                                             |
| LN-DENO-024 | The native Markdown language service MUST consume the public language-service runtime and expose bounded capability, update, diagnostics, and code-action operations. The Markdown Lint plugin MUST be the sole renderer provider, pass live vault rules to the native service, and release its provider during teardown. The desktop host MUST NOT register a competing default-rule provider.                                                                                                        |
| LN-DENO-025 | Native vault watching MUST use `Deno.watchFs`, preserve vault containment across canonical filesystem paths, and deliver portable create, modify, and delete events. Closing a subscription or session MUST stop its native watcher.                                                                                                                                                                                                                                                                   |
| LN-DENO-026 | Verified plugin assets MUST register through the native bridge and load from a same-origin Deno HTTP route. The host MUST enforce installed plugin identity, version, path containment, supported type, byte size, and SHA-256 before serving an asset.                                                                                                                                                                                                                                                |
| LN-DENO-027 | The native agent runtime MUST consume the public `@lapismd/ai-host` executor for process and ACP sessions. Application tools MUST use its authenticated Web-standard MCP handler through the existing Deno loopback server, and host shutdown MUST close every owned agent resource.                                                                                                                                                                                                                   |
| LN-DENO-028 | Deno MUST expose all five `desktop_terminal_session_*` commands through the shared terminal service, emit raw output and one exit event, close every PTY during host shutdown, and package the checksum-verified Sigma native library for each macOS or Linux target.                                                                                                                                                                                                                                  |
| LN-DENO-029 | The desktop development launcher MUST run `deno desktop` without `--no-npm` so declared npm imports in `packages/desktop-deno/deno.json` can load. It MUST preserve HMR, inspector, sloppy-import resolution, and development exclusions for `node_modules`, `dist`, and renderer `src`. It MUST expose a CEF debug entrypoint for renderer DevTools. It MAY create ignored package-local symlinks for declared sibling and workspace Deno source imports, and MUST refuse to replace non-owned paths. |
| LN-DENO-030 | The desktop boot document MUST present a branded loading surface before the renderer mounts. It MUST center the Lapis logo, show muted `Loading…` text beneath it, support light and dark backgrounds, and retain the same status element for startup failures.                                                                                                                                                                                                                                        |
| LN-DENO-031 | Routine native bridge invocation logging MUST be disabled by default and enabled only at the `debug` severity through `LAPIS_DENO_LOG_LEVEL`. Development launch MUST suppress ordinary Deno diagnostics and keep native inspection opt-in because Deno 2.9.5 inspector mode emits binding payloads. Telemetry launch MUST reject native inspection. Default application logging retains bounded lifecycle notices, warnings, and failures without logging invocation payloads or credentials.         |
| LN-DENO-032 | Desktop observability MUST be an explicit local-development mode with root LGTM and telemetry launch commands. It MUST use loopback OTLP/HTTP, keep normal and packaged launches disabled, retain terminal logs, and MUST NOT require a Telemetry plugin or unstable Deno flag.                                                                                                                                                                                                                        |
| LN-DENO-033 | Telemetry mode MUST identify renderer and native host as separate services and propagate validated W3C trace context through a private versioned invocation envelope. Native dispatch MUST remove telemetry metadata before business handlers, while legacy unwrapped calls remain accepted.                                                                                                                                                                                                           |
| LN-DENO-034 | Desktop bridge tracing and metrics MUST cover only bounded database, language, AI, terminal, and telemetry operations. High-volume filesystem, PTY data, window, and per-file operations MUST remain untraced, and operation attributes MUST come from finite allowlists.                                                                                                                                                                                                                              |
| LN-DENO-035 | Renderer lifecycle logs MUST use an allowlisted structured native relay. Native console capture MUST retain terminal output, reject arbitrary events and attributes, and MUST NOT forward the renderer console or invocation payloads.                                                                                                                                                                                                                                                                 |
| LN-DENO-036 | Telemetry mode MUST trace desktop session startup as one root with bounded vault, configuration, plugin, and layout phases, then record readiness or failure and trace teardown. The renderer service MUST be installed before plugin loading, and session disposal MUST complete before provider flush and shutdown. Attributes and lifecycle logs MUST NOT contain vault identity, paths, plugin settings, or failure details.                                                                       |
| LN-DENO-037 | Vault resource URLs MUST use a capability-scoped same-origin HTTP route with vault-root containment, explicit content types, no-store and nosniff headers, and binary response bodies. Raw vault bytes and `file:` URLs MUST NOT cross the Laufey binding string boundary, and text reads containing NUL bytes MUST fail before producing a native string response.                                                                                                                                    |
| LN-DENO-038 | Before mounting application UI, the desktop renderer MUST mark the document engine from the native host's selected backend. The default and packaged system-webview backend MUST identify as WebKit, CEF MUST identify as Blink, and shared UI compatibility MUST NOT depend on Laufey's user-agent shape.                                                                                                                                                                                             |
| LN-DENO-039 | System WebView and CEF sessions MUST consume the same Design Core scrollbar visibility setting persisted through `.obsidian/app.json`. File Explorer, Markdown, and other shared Scroll Areas MUST use Design Core's engine strategy without desktop-local scrollbar CSS, and the File Explorer thumb MUST remain flush to its container edge.                                                                                                                                                         |
| LN-DENO-040 | The bounded native AppDatabase bridge MUST allow projected indexed-metadata pages and path-only Search matching without exposing SQL or unrequested document payloads. Native telemetry MAY classify the path-only operation as Search but MUST NOT record returned paths or query text. |
| LN-DENO-041 | Global Graph startup against a native Turso vault MUST render a valid persisted snapshot before stale reconciliation and MUST use one serialized projected scan when rebuilding. Rapid Graph opens, settings changes, metadata revisions, and manual refreshes MUST NOT saturate the native event channel. |
| LN-DENO-042 | System WebView and CEF Graph canvases MUST share the `1/128…8` camera range, deterministic visible entrance settlement, zoom-stable geometry, viewport culling, semantic colours, and animated neighbourhood emphasis. Reduced-motion OS preference MUST disable entrance and emphasis animation without changing the final graph. |
| LN-DENO-043 | Native Graph Groups MUST evaluate through the bounded path-only Search bridge, and chronological Animate/Stop MUST remain renderer-local. Group or time-lapse activity MUST NOT transfer query text, paths, tags, filenames, or node labels into native telemetry. System WebView and CEF MUST preserve Group order, colour precedence, force ranges, and time-lapse restoration. |
| LN-DENO-044 | On macOS, closing the left sidebar MUST apply the ribbon-adjusted native traffic-light inset to the leading top-tabs or stacked-tabs main-pane header through the Design Core window-controls token. Reopening the left sidebar MUST remove that main-pane offset while retaining the sidebar tab-bar inset, and ribbon-off sessions MUST use the full traffic-light inset. |
| LN-DENO-045 | The close coordinator MUST defer renderer notification out of native close and binding callback stacks. It MUST use a private same-origin signal because post-close script execution and programmatic close, hide, or opacity operations are unreliable on secondary macOS WebViews. The renderer MUST dismiss presentation before shared teardown and retain the structured ready acknowledgement. |
| LN-DENO-046 | On macOS, the native traffic-light buttons MUST share the open left-sidebar tab controls' vertical centreline. The desktop host MUST lower only the three standard window buttons through its platform-isolated native adapter and MUST NOT offset renderer controls or change Design Core geometry. |
| LN-DENO-047 | The pnpm desktop development launcher MUST supply the tracked Lapis application icon and declared Lapis application identity to `deno desktop`. Packaged icon and identity metadata MUST remain unchanged. |
| LN-DENO-048 | The native About menu action MUST open one reusable small desktop window containing Design Core's public Lapis About surface. It MUST work before vault readiness and focus an existing About window. Every dismissal MUST completely close the secondary native window without disposing the main application session. |

### LN-DENO-048 acceptance details

Native About-window acceptance verifies:

- The menu action creates at most one About window and focuses it on repeated selection.
- The window uses the public Design Core About component with native application metadata and the Lapis logo.
- OK, Escape, backdrop, and native window close remove the complete native About window; reopening creates a fresh secondary window.
- The main renderer does not depend on a plugin command or active vault to open About.

### LN-DENO-047 acceptance details

Development application identity verifies:

- The pnpm launcher passes the platform-appropriate tracked icon through Deno's supported `--icon` option.
- The Deno desktop configuration declares the spaced `Lapis Notes` name and stable identifier.
- Production packaging continues to provide its explicit icon and signed bundle metadata.

### LN-DENO-046 acceptance details

macOS traffic-light alignment verifies:

- Close, minimise, and zoom retain their native horizontal positions and move down by the same bounded offset.
- Repeated application and native relayout do not accumulate movement.
- The desktop stylesheet contains no vertical transform for the sidebar tab list, drag spacer, or close control.
- Browser and non-macOS geometry remain unchanged. On macOS, system WebView and CEF windows share only the native button adjustment; their renderer and closed-sidebar main-pane geometry remain unchanged.

### LN-DENO-044 acceptance details

Desktop window-chrome acceptance verifies the ribbon-on and ribbon-off token
mapping, left-sidebar open and closed states, and both top-tabs and stacked-tabs
main-pane layouts. The leading visible tab and the sidebar reopen control clear
the macOS traffic lights while declared drag regions remain usable.

- With the ribbon visible, the main-pane token uses the traffic-light clearance remaining after the ribbon width.
- Without the ribbon, the main-pane token uses the full macOS traffic-light clearance.
- Closing the left sidebar offsets the leading top-tabs and stacked-tabs header; reopening it removes that main-pane offset and keeps the left tab-strip inset.
- Native drag spacers remain drag regions while tab triggers and sidebar controls remain interactive.

### LN-DENO-039 acceptance details

Cross-renderer scrollbar acceptance verifies:

- Unsaved profiles default to `scroll`, and `scroll`, `hover`, and `always` changes persist through API configuration.
- System WebView uses the Design Core native viewport and overlay while CEF uses the Design Core Bits UI strategy.
- File Explorer, Markdown, and popout Scroll Areas inherit one live setting without consumer theme overrides.
- The File Explorer scrollbar is edge-aligned and remains draggable without reserving a native gutter.

### LN-DENO-038 acceptance details

Desktop renderer-engine selection verifies:

- Native platform metadata maps the default and explicit system-webview backend to WebKit.
- Native platform metadata maps the explicit CEF backend to Blink.
- The renderer applies the engine marker before mounting the desktop application.

### LN-DENO-036 acceptance details

Desktop session lifecycle telemetry verifies:

- The API telemetry service is installed before core plugin registration and loading.
- Startup contains only the four named phases and finishes with a bounded ready or failed outcome.
- Teardown completes before renderer telemetry is flushed and shut down.
- Lifecycle events relay to the native console without exporting vault or error text.

### LN-DENO-033 acceptance details

Correlated desktop telemetry verifies:

- Renderer spans export under `lapis-notes-renderer` and native spans under `lapis-notes-desktop`.
- Selected renderer invocations produce valid remote-parent native spans.
- Malformed envelopes fail closed, while payload handlers receive no trace fields.

### LN-DENO-034 acceptance details

Bounded native instrumentation verifies:

- Selected operations record static scope, operation, duration, bounded batch-size or result-count, and failure signals.
- Excluded high-volume commands create no bridge span.
- Span and metric attributes contain no vault, file, query, prompt, or terminal payload.

### LN-DENO-035 acceptance details

Structured desktop logging verifies:

- Only named session and reconciliation lifecycle events are accepted.
- Attribute keys and values use a finite, low-cardinality vocabulary.
- `capture` keeps logs visible in the terminal while Deno exports them.

### LN-DENO-032 acceptance details

Local desktop observability verifies:

- A matching healthy `lgtm` container is reused, while collisions fail without replacement.
- Telemetry launch defaults native and renderer service identities and uses the local OTLP HTTP endpoint.
- Normal launch receives no telemetry environment, and non-loopback endpoints are rejected.

### LN-DENO-031 acceptance details

Deno desktop logging verifies:

- An unset or invalid log level MUST use `info` and suppress native invocation traces.
- The development command MUST pass Deno `--quiet`, omit native inspection by default, and reject native inspection in telemetry mode so Deno's inspector-only binding trace cannot print invocation arguments or return payloads.
- `debug` MUST print only the invoked command name, never its payload.
- `warn`, `error`, and `silent` MUST progressively reduce console output while preserving the configured severity threshold.

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
- The host MUST NOT re-declare `app-region` CSS or mutate private native window styles.
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
  canonical order before `loadLayout`.
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
- The Markdown Lint plugin MUST select the native adapter and forward the
  current vault rule configuration on every diagnostics request.
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
- File, Edit, View, Window, and Help MUST preserve established labels and common
  accelerators where Deno supplies an equivalent role or host action.
- Unsupported force reload, zoom, and fullscreen actions MUST remain visible
  and disabled instead of silently performing a different action.
- Open Vault, About, developer tools, reload, and Learn More MUST reach their
  native or renderer-owned action.

### LN-DENO-020 acceptance details

Deno window close verifies:

- The first close event from either the adopted bootstrap or visible window
  MUST be cancelled and immediately dismiss the visible presentation while the
  renderer persists layout and disposes the active session normally.
- A bounded timeout MUST still close native watches, plugin asset state, and
  agent resources if the renderer never acknowledges the request.
- Renderer acknowledgement MUST exit only after native host shutdown settles;
  the host MUST NOT release the prevented event through programmatic secondary
  window close or hide.
- Packaged acceptance MUST request a real window close and observe a clean
  process exit without sending an external termination signal.

### LN-DENO-045 acceptance details

The macOS close transport verifies:

- Native close MUST release the private pending renderer request on the next
  event-loop turn instead of invoking the secondary WebView from the close
  callback.
- The renderer MUST hide its document before disposing the active session and
  acknowledging readiness through the bounded native binding.
- Normal close MUST reach renderer-ready without waiting for the fail-safe or
  producing legacy request-abort warnings.

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
- Linux arm64 and x64 targets MUST produce versioned AppImage and tar archives
  containing the executable, desktop entry, and Lapis icon with stable names.
- macOS signing MUST use either an explicit keychain identity or ad-hoc signing,
  notarization MUST use a configured keychain profile, and Linux signing MUST
  use an agent-backed GPG key. Every credential-dependent step MUST skip safely
  when its non-secret selector is absent.
- The macOS bundle MUST include Deno's runtime-update readiness marker before
  signing so first launch leaves the sealed application signature valid.
- Artifact creation MUST NOT print, persist, or pass account passwords, private
  keys, or authentication tokens through command arguments.

## Non-goals

This native host excludes community plugin sidecars until a public Deno-owned
execution host exists, Windows distribution, and remote release publication.
OS webview quirks require documented equivalents when they affect a visible
application feature.
