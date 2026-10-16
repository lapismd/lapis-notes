# Deno Desktop Host / Native vault and storage / Part 1

The optional conditional text port is governed by
[LN-PKG-168](../packages/vault-and-storage.md#ln-pkg-168). A shared adapter method
alone does not make it available: this legacy host does not advertise that
capability, so calls reject before invocation. Existing filesystem bindings and
database authority retain their own contracts.

## LN-DENO-002 — Host: implement NativeDesktopBridge through win.bind() and register it

<a id="ln-deno-002"></a>

**Requirement.** The host MUST implement `NativeDesktopBridge` through `win.bind()` and register it with `setNativeDesktopBridge` before creating a vault session. The published runtime MUST be `deno-desktop`.

### Acceptance details

The Deno bridge registration verifies:

- `NativeDesktopBridge.runtime` MUST be `deno-desktop`.
- `setNativeDesktopBridge` MUST publish `globalThis.__LAPIS_NATIVE_DESKTOP__`.
- Renderer `invoke` MUST reach allowlisted `win.bind()` handlers only.

## LN-DENO-003 — Vault profiles: use the desktop-folder kind. Native filesystem bindings

<a id="ln-deno-003"></a>

**Requirement.** Vault profiles MUST use the `desktop-folder` kind. Native filesystem bindings MUST reject paths outside the selected vault root.

## LN-DENO-004 — Open and create vault: collect an absolute folder path

<a id="ln-deno-004"></a>

**Requirement.** Open and create vault MAY collect an absolute folder path through a prompt or the `LAPIS_DENO_VAULT` environment variable until Deno ships a native picker. Cancelling MUST return to the branded launcher.

## LN-DENO-005 — Deno desktop session: open the app database through a native

<a id="ln-deno-005"></a>

**Requirement.** A Deno desktop session MUST open the app database through a native Turso handle owned by the Deno host. Its descriptor MUST report provider `turso-native-desktop`, engine `turso`, and transport `native`. Renderer access MUST use the bounded AppDatabase bridge, including typed derived-memory methods, and advertise database/search only when those operations are implemented. Raw SQL, memory files, transcript contents, and non-AppDatabase operations MUST remain outside the bridge catalogue.

## LN-DENO-006 — Before restoring layout, the host: register the shared application-owned notesPluginProfile containing exactly

<a id="ln-deno-006"></a>

**Requirement.** Before restoring layout, the host MUST register the shared application-owned `notesPluginProfile` containing exactly Source Editor, Markdown, File Explorer, and Search in that order. All four MUST default enabled and remain user-disableable. The host MUST load configured installed plugins unless Safe Mode disables community plugins and MUST verify this profile and persistence in packaged acceptance. Local desktop development MUST prepare verified packed plugin packages before launch.

The [approved registry consumer snapshot](../packages/releases-and-exports.md#approved-registry-consumer-snapshot--2026-10-14)
refreshes the profile through public npm ranges and portable lockfiles. Both
native packaged lanes exercise the updated public exports while retaining
profile ordering, shared API identity, and installed-plugin persistence.

### Acceptance details

Plugin registration parity verifies:

- The shared profile contains Source Editor, Markdown, File Explorer, and
  Search exactly once in that order.
- All four profile entries are optional and default enabled.
- Desktop and web consume the same exported profile.
- Configured installed plugins load after the static profile and survive
  restart.
- Safe Mode disables installed community plugins without changing the static
  profile.
- A plugin whose required host capability is unavailable remains visible with
  a bounded unavailable state instead of failing session boot.

## LN-DENO-007 — Vault session: install one compatibility App lease before plugin

<a id="ln-deno-007"></a>

**Requirement.** Each vault session MUST install one compatibility App lease before plugin loading and release it only after plugin, workspace, metadata, and vault-session teardown.

## LN-DENO-009 — Session boot: render Design Core WorkspaceStartup with vault, configuration

<a id="ln-deno-009"></a>

**Requirement.** Session boot MUST render Design Core `WorkspaceStartup` with vault, configuration, plugin, and layout tasks, then mount `WorkspaceShell` with an API `App`. While loading without failure, it MUST replace the visible title with the package-local Lapis logo while retaining the title as the region's accessible name. It MUST NOT copy the workspace renderer.

### Acceptance details

Deno session boot verifies the shared startup surface:

- The four task ids MUST be `vault`, `configuration`, `plugins`, and `layout`.
- `WorkspaceShell` MUST stay unmounted until that sequence completes.
- The host MUST consume `@lapis-notes/workspace` rather than a copied shell.
- Saved-vault resolution and session startup MUST share the logo-only loading visual.

## LN-DENO-011 — Visible window: complete a bounded, retrying win.bind() invoke probe

<a id="ln-deno-011"></a>

**Requirement.** The visible window MUST complete a bounded, retrying `win.bind()` invoke probe before mounting a vault session. Parse-time binding absence and one lost WebView return MUST be treated as retryable until the bound deadline so a cold launch does not require a renderer refresh. The host MUST use Deno's public binding registry and MUST NOT patch `Map.prototype`.

### Acceptance details

Deno window binding verifies:

- Deno 2.9.5 or later MUST provide the public per-window binding registry after the lazy-op upgrade.
- The visible macOS overlay window MUST return `desktop_app_info_get` before the renderer mounts a vault session, retrying when an earlier probe remains pending.
- The host MUST NOT install the superseded `Map.prototype.get` binding shim.

## LN-DENO-014 — Published ESM for renderer Turso WASM

<a id="ln-deno-014"></a>

**Requirement.** The production renderer MUST bundle `@tursodatabase/database-wasm/bundle` as published ESM. It MUST NOT pass that file through Vite's CommonJS conversion.

### Acceptance details

The production Turso WASM build verifies:

- The CommonJS exclusion MUST target only Turso's published `bundle/main.es.js` file.
- Vite MUST still emit the self-contained Turso bundle with its embedded worker and WASM data.
- The package production build MUST complete without a CommonJS resolver stack overflow.

## LN-DENO-016 — Deno bridge: truthfully advertise resources, database/search, language services, plugin

<a id="ln-deno-016"></a>

**Requirement.** The Deno bridge MUST truthfully advertise resources, database/search, language services, plugin hosting/assets, file watching, notifications, file actions, agents, and terminals. Notebook and model MUST remain unavailable.

## LN-DENO-017 — Native notifications and file open/reveal actions: either complete on the current platform

<a id="ln-deno-017"></a>

**Requirement.** Native notifications and file open/reveal actions MUST either complete on the current platform or report the capability unavailable. The bridge MUST NOT advertise an operation that resolves as an unimplemented command or silent no-op.

## LN-DENO-019 — Deno menus: expose the established application, File, Edit, View

<a id="ln-deno-019"></a>

**Requirement.** Deno menus MUST expose the established application, File, Edit, View, Window, and Help actions where the platform supports them. Unsupported native roles MUST have a documented equivalent or remain disabled.

### Acceptance details

Deno application menus verify:

- macOS MUST put About and Quit in the first application submenu; other
  platforms MUST expose About through Help.
- File, Edit, View, Window, and Help MUST preserve established labels and common
  accelerators where Deno supplies an equivalent role or host action.
- Unsupported force reload, zoom, and fullscreen actions MUST remain visible
  and disabled instead of silently performing a different action.
- Open Vault, About, developer tools, reload, and Learn More MUST reach their
  native or renderer-owned action.

## LN-DENO-020 — Window close and vault replacement: persist layout and dispose views, watches, databases

<a id="ln-deno-020"></a>

**Requirement.** Window close and vault replacement MUST persist layout and dispose views, watches, databases, plugins, host services, and the compatibility lease before process exit or session replacement. Native close events from the adopted bootstrap or visible window MUST enter one coordinator. Renderer acknowledgement MUST precede native shutdown, with a bounded timeout as the fail-safe.

### Acceptance details

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

## LN-DENO-022 — Local distribution: produce macOS and Linux artifacts with stable

<a id="ln-deno-022"></a>

**Requirement.** Local distribution MUST produce macOS and Linux artifacts with stable names, icons, verified target PTY libraries, and credential-safe signing hooks. It MUST reject Windows targets.

### Acceptance details

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

## LN-DENO-023 — Automated acceptance: cover first selection, cancellation, reopening, missing-vault fallback

<a id="ln-deno-023"></a>

**Requirement.** Automated acceptance MUST cover first selection, cancellation, reopening, missing-vault fallback, switching, layout, plugin restoration, retained services, app URLs, notifications, external links, and packaged startup.

## LN-DENO-024 — Native Markdown language service: consume the built @lapis-notes/language-service/markdownlint/runtime export

<a id="ln-deno-024"></a>

**Requirement.** The native Markdown language service MUST consume the built `@lapis-notes/language-service/markdownlint/runtime` export through its published npm semver package and expose bounded capability, update, diagnostics, and code-action operations. The Markdown Lint plugin MUST be the sole renderer provider, pass live vault rules to the native service, and release its provider during teardown. The desktop host MUST NOT register a competing default-rule provider.

### Acceptance details

The native Markdown language service verifies:

- Deno MUST consume `@lapis-notes/language-service/markdownlint/runtime`
  without copying its implementation.
- Capability probing, document updates, diagnostics, and code actions MUST
  validate protocol versions and bounded document payloads.
- The Markdown Lint plugin MUST select the native adapter and forward the
  current vault rule configuration on every diagnostics request.
- A packaged saved-vault session MUST report at least one native Markdown
  diagnostic before acceptance completes.

## LN-DENO-025 — Native vault watching: use Deno.watchFs, preserve vault containment across canonical

<a id="ln-deno-025"></a>

**Requirement.** Native vault watching MUST use `Deno.watchFs`, preserve vault containment across canonical filesystem paths, and deliver portable create, modify, and delete events. Closing a subscription or session MUST stop its native watcher.

### Acceptance details

Native vault watching verifies:

- macOS canonical `/private/var` events MUST remain inside a vault opened
  through its equivalent `/var` path.
- Atomic final renames MUST publish a portable modification while host-created
  UUID temporary files MUST NOT create change churn.
- Each native event MUST reach the matching renderer subscription through the
  bounded native event bridge.
- Packaged acceptance MUST write a vault file and observe its event before the
  watcher is closed.

## LN-DENO-026 — Verified plugin assets: register through the native bridge and load

<a id="ln-deno-026"></a>

**Requirement.** Verified plugin assets MUST register through the native bridge and load from a same-origin Deno HTTP route in development and packaged hosts. One verified-installation fingerprint MUST remain stable across relative module chunks, and every response MUST still enforce its file's size and SHA-256. The development route MUST serve registered plugin assets before falling through to Vite. The host MUST enforce identity, version, containment, and supported type.

### Acceptance details

Verified plugin asset hosting verifies:

- The renderer MUST read verified installed-plugin metadata through the public
  API asset helpers before registering native context.
- The native host MUST resolve every asset beneath that plugin's selected-vault
  directory and reject traversal or mismatched metadata.
- JavaScript, styles, data, WASM, and supported image assets MUST use explicit
  content types with `nosniff`, no-store, and isolation headers.
- Packaged acceptance MUST fetch a seeded verified JavaScript asset and match
  its complete content and content type.

## LN-DENO-027 — Native agent runtime: supervise a separate lapis-ai-controller process

<a id="ln-deno-027"></a>

**Requirement.** The native agent runtime MUST supervise a separate `lapis-ai-controller` process through the public managed client. It MUST expose only an authenticated connection descriptor to the renderer, bind each service to a canonical vault workspace and private durable database, and close owned services on host shutdown.

### Acceptance details

Native agent execution verifies:

- Concurrent requests for a canonical workspace MUST share one supervised service and preserve the managed ready descriptor schema when returning its authenticated connection.
- A failed or exited service MUST allow a later connection request to restart it.
- Connection credentials MUST remain out of logs, capability metadata and process arguments.
- Host shutdown MUST await and close services whose startup is still pending.
- Packaged acceptance MUST connect through the standalone controller and exercise
  renderer-owned application tools through the shared client.

## LN-DENO-029 — Desktop development launcher: run deno desktop without --no-npm so declared

<a id="ln-deno-029"></a>

**Requirement.** The desktop development launcher MUST run `deno desktop` without `--no-npm` so declared npm imports in `packages/desktop-deno/deno.json` can load. It MUST preserve HMR, inspector, sloppy-import resolution, and development exclusions for `node_modules`, `dist`, and renderer `src`. It MUST expose a CEF debug entrypoint for renderer DevTools. It MAY prepare ignored package-local files for declared owned Deno source imports, and MUST refuse to replace non-owned paths.

## LN-DENO-031 — Routine native bridge invocation logging: disabled by default and enabled only at

<a id="ln-deno-031"></a>

**Requirement.** Routine native bridge invocation logging MUST be disabled by default and enabled only at the `debug` severity through `LAPIS_DENO_LOG_LEVEL`. Development launch MUST suppress ordinary Deno diagnostics and keep native inspection opt-in because Deno 2.9.5 inspector mode emits binding payloads. Telemetry launch MUST reject native inspection. Default application logging retains bounded lifecycle notices, warnings, and failures without logging invocation payloads or credentials.

### Acceptance details

Deno desktop logging verifies:

- An unset or invalid log level MUST use `info` and suppress native invocation traces.
- The development command MUST pass Deno `--quiet`, omit native inspection by default, and reject native inspection in telemetry mode so Deno's inspector-only binding trace cannot print invocation arguments or return payloads.
- `debug` MUST print only the invoked command name, never its payload.
- `warn`, `error`, and `silent` MUST progressively reduce console output while preserving the configured severity threshold.

## LN-DENO-034 — Desktop bridge tracing and metrics: cover only bounded database, language, AI, terminal

<a id="ln-deno-034"></a>

**Requirement.** Desktop bridge tracing and metrics MUST cover only bounded database, language, AI, terminal, and telemetry operations. High-volume filesystem, PTY data, window, and per-file operations MUST remain untraced, and operation attributes MUST come from finite allowlists.

### Acceptance details

Bounded native instrumentation verifies:

- Selected operations record static scope, operation, duration, bounded batch-size or result-count, and failure signals.
- Excluded high-volume commands create no bridge span.
- Span and metric attributes contain no vault, file, query, prompt, or terminal payload.

## LN-DENO-036 — Telemetry mode: trace desktop session startup as one root

<a id="ln-deno-036"></a>

**Requirement.** Telemetry mode MUST trace desktop session startup as one root with bounded vault, configuration, plugin, and layout phases, then record readiness or failure and trace teardown. The renderer service MUST be installed before plugin loading, and session disposal MUST complete before provider flush and shutdown. Attributes and lifecycle logs MUST NOT contain vault identity, paths, plugin settings, or failure details.

### Acceptance details

Desktop session lifecycle telemetry verifies:

- The API telemetry service is installed before core plugin registration and loading.
- Startup contains only the four named phases and finishes with a bounded ready or failed outcome.
- Teardown completes before renderer telemetry is flushed and shut down.
- Lifecycle events relay to the native console without exporting vault or error text.

## LN-DENO-037 — Vault resource URLs: use a capability-scoped same-origin HTTP route

<a id="ln-deno-037"></a>

**Requirement.** Vault resource URLs MUST use a capability-scoped same-origin HTTP route with vault-root containment, explicit content types, no-store and nosniff headers, and binary response bodies. Raw vault bytes and `file:` URLs MUST NOT cross the Laufey binding string boundary, and text reads containing NUL bytes MUST fail before producing a native string response.
