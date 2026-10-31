# Deno Desktop Host / Startup and lifecycle

The frozen Deno host retains its existing application profile. The staged
[Rust-owned chat navigator](../architecture/rust-turn-admission.md) and
[native index owner](../architecture/rust-indexing-lifetime.md) are Tauri/hosted
migration work; neither changes Deno startup or selects a new Deno writer.

The shared private profile now uses published Markdown `^0.2.0`. This dependency
intake changes no frozen Deno startup, service or writer contract.

The shared private profile now accepts published Agent UI `^0.2.0`, History
`^0.2.0`, and Design Core `^0.7.4`. This dependency intake changes no frozen
Deno startup, service or writer contract.

## LN-DENO-008 — Language, plugin, AI, and terminal host services: use public package boundaries and Deno-owned process

<a id="ln-deno-008"></a>

**Requirement.** Language, plugin, AI, and terminal host services MUST use public package boundaries and Deno-owned process lifecycles. Terminal sessions MUST use public `@lapismd/terminal-host/deno`; Deno code MUST NOT import another desktop host. Retained host-service subpaths MUST forward portable kernels without changing the frozen desktop runtime.

## LN-DENO-015 — Production host: serve the built renderer from the launch

<a id="ln-deno-015"></a>

**Requirement.** The production host MUST serve the built renderer from the launch working directory's `dist` folder. It MUST NOT resolve that folder relative to Deno's compiled module cache.

### Acceptance details

The production renderer launch verifies:

- Root and emitted asset requests MUST resolve beneath `<launch working directory>/dist`.
- Static responses MUST retain the renderer's cross-origin isolation headers.
- A production-mode Deno launch MUST restore an isolated vault, load the full portable plugin inventory, and reach workspace-ready through the native bridge.

## LN-DENO-028 — Deno: expose all five desktop*terminal_session*\* commands

<a id="ln-deno-028"></a>

**Requirement.** Deno MUST expose all five `desktop_terminal_session_*` commands through the shared terminal service, emit raw output and one exit event, close every PTY during host shutdown, and package the checksum-verified Sigma native library for each macOS or Linux target.

## LN-DENO-030 — Branded startup loading surface

<a id="ln-deno-030"></a>

**Requirement.** The desktop boot document MUST present a branded loading surface before the renderer mounts. It MUST center only the Lapis logo visually, expose `Loading Lapis Notes` as the accessible status name, support light and dark backgrounds, and replace the logo with startup failures through the same status element.

## LN-DENO-032 — Desktop observability: an explicit local-development mode with root LGTM

<a id="ln-deno-032"></a>

**Requirement.** Desktop observability MUST be an explicit local-development mode with root LGTM and telemetry launch commands. It MUST use loopback OTLP/HTTP, keep normal and packaged launches disabled, retain terminal logs, and MUST NOT require a Telemetry plugin or unstable Deno flag. Telemetry launch MUST verify the configured collector before starting the renderer and fail with actionable local-stack guidance when unavailable.

### Acceptance details

Local desktop observability verifies:

- A matching healthy `lgtm` container is reused, while collisions fail without replacement.
- Telemetry launch defaults native and renderer service identities and uses the local OTLP HTTP endpoint.
- Telemetry launch probes that endpoint before starting the renderer and reports the local LGTM command when it is unavailable.
- Normal launch receives no telemetry environment, and non-loopback endpoints are rejected.

## LN-DENO-035 — Renderer lifecycle logs: use an allowlisted structured native relay. Native

<a id="ln-deno-035"></a>

**Requirement.** Renderer lifecycle logs MUST use an allowlisted structured native relay. Native console capture MUST retain terminal output, reject arbitrary events and attributes, and MUST NOT forward the renderer console or invocation payloads.

### Acceptance details

Structured desktop logging verifies:

- Only named session and reconciliation lifecycle events are accepted.
- Attribute keys and values use a finite, low-cardinality vocabulary.
- `capture` keeps logs visible in the terminal while Deno exports them.

## LN-DENO-047 — Pnpm desktop development launcher: supply a tracked Lapis application icon

<a id="ln-deno-047"></a>

**Requirement.** The pnpm desktop development launcher MUST supply a tracked Lapis application icon with a visible rounded background and the declared Lapis application identity to `deno desktop`. The host MUST retain distinct light and dark icon assets, and the macOS Dock icon MUST follow the operating-system colour scheme without exposing an application or plugin setting. Packaged identity metadata MUST remain unchanged.

### Acceptance details

Development application identity verifies:

- The pnpm launcher passes the platform-appropriate tracked fallback icon through Deno's supported `--icon` option.
- Light and dark icons retain the established Lapis mark on distinct opaque rounded tiles, while transparent pixels are limited to the outer rounded silhouette.
- The main renderer reports the operating-system colour-scheme media query through a private binding; the macOS host updates AppKit's application icon only when that appearance changes and disposes its native adapter during shutdown.
- Linux and unavailable-native-adapter paths retain the tracked visible-background fallback without claiming dynamic Dock support.
- The Deno desktop configuration declares the spaced `Lapis Notes` name and stable identifier.
- Production packaging embeds both runtime variants while continuing to provide its explicit fallback icon and signed bundle metadata.

## LN-DENO-050 — Generated macOS development host: ad-hoc signed after its application identity is

<a id="ln-deno-050"></a>

**Requirement.** A generated macOS development host MUST be ad-hoc signed after its application identity is patched and again after Deno replaces its runtime library. If Deno reuses an unchanged runtime library, the launcher MUST accept it only while the existing deep strict signature remains valid. Reuse MUST require or repair a valid deep strict signature in addition to the recorded identity and Deno version; stale generated hosts MUST be rebuilt without changing Deno's shared Laufey cache.

## LN-DENO-054 — Ready desktop session with recovery restrictions: show a Safe Mode banner describing those

<a id="ln-deno-054"></a>

**Requirement.** A ready desktop session with recovery restrictions MUST show a Safe Mode banner describing those restrictions, provide metadata and Search rebuild actions, and allow a normal restart that clears session recovery state. Community-plugin and notebook recovery controls MUST remain absent while those capabilities are unavailable in the Deno host.

## LN-DENO-055 — External ACP session ownership

<a id="ln-deno-055"></a>

**Requirement.** First-party desktop MUST NOT initialize ACP sessions in-process. It MUST supervise `lapis-ai-controller` and expose only an authenticated connection. Leftover ACP embed helpers MAY advertise deferred start so prompt, cancel, close, and one startup error remain available. Restricted processor starts MUST stay isolated from workspace and tools.

### Acceptance details

First-party desktop and leftover ACP embed acceptance verifies:

- Desktop start advertises a `lapis-ai-controller` connection and does not
  initialize an ACP session in the native response.
- Leftover ACP embed helpers MAY still return a reserved session id before
  initialization begins so prompt, cancel, and close remain callable.
- A restricted processor start remains isolated from workspace paths, App
  tools, MCP servers, and resumable session state.

## LN-DENO-056 — First-party model discovery: use the shared controller client. Leftover ACP

<a id="ln-deno-056"></a>

**Requirement.** First-party model discovery MUST use the shared controller client. Leftover ACP embed helpers MAY advertise deferred model discovery and deliver catalogs through compatibility runtime events without holding a Deno binding.

### Acceptance details

First-party listing and leftover ACP embed acceptance verifies:

- First-party model discovery uses the shared controller client.
- Leftover ACP embed helpers MAY still return the renderer's request id
  before discovery begins and deliver the catalog as a later runtime event.
- Concurrent Cursor and Codex catalogs cannot satisfy each other's requests.
- Older desktop hosts continue to return their catalog directly.

## LN-DENO-057 — Native-to-renderer events: use a same-origin loopback event stream

<a id="ln-deno-057"></a>

**Requirement.** Native-to-renderer events MUST use a same-origin loopback event stream and schedule application delivery in a later renderer task so renderer handlers never re-enter native work while a stream write is active. The stream MUST accept only `GET`, encode payloads as JSON, buffer a bounded number of startup events, retain source order, reconnect through the browser event-source contract, and become a no-op after host shutdown.

### Acceptance details

Renderer event acceptance verifies:

- Native producers enqueue JSON events without calling browser-window evaluation.
- The renderer subscribes to the reserved same-origin event-stream route, ignores malformed messages, and schedules valid delivery after the stream callback returns.
- Startup events remain ordered until the renderer connects, and host shutdown closes every active stream.

## LN-DENO-058 — Shared controller prompt submission

<a id="ln-deno-058"></a>

**Requirement.** First-party prompt submission MUST use the shared controller client and MUST NOT hold a Deno binding for the turn. Leftover ACP embed helpers MAY reserve a run id and stream later-task events.

### Acceptance details

First-party prompt and leftover ACP embed acceptance verifies:

- First-party prompt submission uses the shared controller client and does not
  hold a Deno binding for the turn.
- Leftover ACP embed helpers MAY still return a reserved run id before the
  underlying turn starts and stream later-task events.
- A configured Codex turn still renders its complete response and leaves the
  composer enabled.

## LN-DENO-061 — First-party run state: come from the shared controller journal. Compatibility

<a id="ln-deno-061"></a>

**Requirement.** First-party run state MUST come from the shared controller journal. Compatibility protocol-v4 hosts MAY expose active run state and retained terminal events by session id for leftover adapters.

## LN-DENO-063 — Desktop and browser agent-runtime capabilities: identify lapis-ai-controller/1. Model discovery, session configuration, tools

<a id="ln-deno-063"></a>

**Requirement.** Desktop and browser agent-runtime capabilities MUST identify `lapis-ai-controller/1`. Model discovery, session configuration, tools, approvals and transcript recovery MUST use the shared controller client and negotiated provider capabilities. Hosts MUST NOT interpret provider configuration keys.

## LN-DENO-064 — Desktop development renderer: exclude Harper and registry-installed Design Core Svelte

<a id="ln-deno-064"></a>

**Requirement.** The desktop development renderer MUST exclude Harper and registry-installed Design Core Svelte source from Vite dependency optimization and MUST keep compiled component CSS in the Svelte module rather than a separate virtual-CSS request. Harper's imported WASM MUST resolve to a WASM response rather than the HTML fallback, while Design Core rune modules and styles MUST pass through the Svelte transform without optimizer or Tailwind corruption. Spell Check warmup MAY fail independently, but it MUST NOT corrupt or block workspace startup.

## LN-DENO-067 — Desktop renderer: keep @lapis-notes/api outside dependency optimization, expose @lapis-notes/api

<a id="ln-deno-067"></a>

**Requirement.** The desktop renderer MUST keep `@lapis-notes/api` outside dependency optimization, expose `@lapis-notes/api` and `@lapis-notes/api/workspace-host` through host-owned plugin import-map proxy entries in development and production, and resolve them as singletons across the host and packed static plugins. Registry releases and local release-candidate tarballs MUST bind the same API peer so workspace host bindings and other API-owned state remain visible.

The shared native bridge also accepts `tauri-desktop` under LN-ARCH-141. This
adds a host runtime identity without changing the Deno command transport. The
Tauri database admission boundary follows LN-DB-055.

The renderer module registry includes Notebook’s declared public Design Core ToggleGroup density control. This does not change frozen Deno startup or native service contracts; shared renderer imports remain fail closed.

The renderer host resolves Design Core through `^0.8.0` so its build-owned plugin import map can resolve the public CanvasTable and FilterBuilder modules. Native service ownership and startup ordering remain unchanged.

Notebook module admission MUST include its declared Markdown and CodeMirror Markdown entries. Producer bundles use the admitted versioned Svelte renderer namespace; host resolution MUST retain one shared runtime during development optimization and production builds. Unknown modules and renderer-version mismatches MUST fail closed. This changes no native Deno service capability.
