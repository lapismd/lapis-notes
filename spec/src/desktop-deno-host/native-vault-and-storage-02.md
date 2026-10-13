# Deno Desktop Host / Native vault and storage / Part 2

## LN-DENO-039 — System WebView and CEF sessions: consume the same Design Core scrollbar visibility

<a id="ln-deno-039"></a>

**Requirement.** System WebView and CEF sessions MUST consume the same Design Core scrollbar visibility setting persisted through `.obsidian/app.json`. File Explorer, Markdown, and other shared Scroll Areas MUST use Design Core's engine strategy without desktop-local scrollbar CSS, and the File Explorer thumb MUST remain flush to its container edge.

### Acceptance details

Cross-renderer scrollbar acceptance verifies:

- Unsaved profiles default to `scroll`, and `scroll`, `hover`, and `always` changes persist through API configuration.
- System WebView uses the Design Core native viewport and overlay while CEF uses the Design Core Bits UI strategy.
- File Explorer, Markdown, and popout Scroll Areas inherit one live setting without consumer theme overrides.
- The File Explorer scrollbar is edge-aligned and remains draggable without reserving a native gutter.

## LN-DENO-040 — Bounded native AppDatabase bridge: allow projected indexed-metadata pages and path-only Search

<a id="ln-deno-040"></a>

**Requirement.** The bounded native AppDatabase bridge MUST allow projected indexed-metadata pages and path-only Search matching without exposing SQL or unrequested document payloads. Native telemetry MAY classify the path-only operation as Search but MUST NOT record returned paths or query text.

## LN-DENO-041 — Global Graph startup against a native Turso: render a valid persisted snapshot before stale

<a id="ln-deno-041"></a>

**Requirement.** Global Graph startup against a native Turso vault MUST render a valid persisted snapshot before stale reconciliation and MUST use one serialized projected scan when rebuilding. Rapid Graph opens, settings changes, metadata revisions, and manual refreshes MUST NOT saturate the native event channel.

## LN-DENO-043 — Native Graph Groups: evaluate through the bounded path-only Search bridge

<a id="ln-deno-043"></a>

**Requirement.** Native Graph Groups MUST evaluate through the bounded path-only Search bridge, and chronological Animate/Stop MUST remain renderer-local. Group or time-lapse activity MUST NOT transfer query text, paths, tags, filenames, or node labels into native telemetry. System WebView and CEF MUST preserve Group order, colour precedence, force ranges, and time-lapse restoration.

## LN-DENO-048 — Native About menu action: open one reusable small desktop window containing

<a id="ln-deno-048"></a>

**Requirement.** The native About menu action MUST open one reusable small desktop window containing Design Core's public Lapis About surface. It MUST work before vault readiness and focus an existing About window. Every dismissal MUST completely close the secondary native window without disposing the main application session.

### Acceptance details

Native About-window acceptance verifies:

- The menu action creates at most one About window and focuses it on repeated selection.
- The window uses the public Design Core About component with native application metadata and the Lapis logo.
- OK, Escape, backdrop, and native window close remove the complete native About window; reopening creates a fresh secondary window.
- The main renderer does not depend on a plugin command or active vault to open About.

## LN-DENO-051 — Native vault filesystem operations: preserve portable missing-path, permission, wrong-type, busy,

<a id="ln-deno-051"></a>

**Requirement.** Native vault filesystem operations MUST preserve portable missing-path, permission, wrong-type, busy, and existence failure codes. Existence and stat MAY treat only a missing path as absent; they MUST NOT convert permission or host failures into `false`, `null`, or `ENOENT`.

## LN-DENO-052 — Failed saved-vault restore: retain the profile and recent-vault entry, show

<a id="ln-deno-052"></a>

**Requirement.** A failed saved-vault restore MUST retain the profile and recent-vault entry, show the actual failure, and allow another vault to be selected. Session startup failures MUST keep the failed phase visible and expose the error message, complete stack and copyable diagnostic, including WebKit stacks that omit their message. They MUST NOT return to an indefinite loading surface.

## LN-DENO-053 — Desktop startup recovery: offer retry, Manage Vaults, optional-core-plugin disablement, layout-skip

<a id="ln-deno-053"></a>

**Requirement.** Desktop startup recovery MUST offer retry, Manage Vaults, optional-core-plugin disablement, layout-skip, and saved-layout reset when relevant. Recovery state MUST be session-scoped, pass through the API `AppSafeModeState`, govern plugin and layout startup, and never change canonical vault configuration merely by entering recovery.

## LN-DENO-059 — Native Turso lifecycle and AppDatabase methods: execute in a dedicated Deno worker. Synchronous

<a id="ln-deno-059"></a>

**Requirement.** Native Turso lifecycle and AppDatabase methods MUST execute in a dedicated Deno worker. Synchronous native driver steps MUST NOT run on the desktop runtime thread that owns window bindings, controller, or renderer events. Session close and host shutdown MUST close worker databases and terminate the worker.

## LN-DENO-062 — Deno desktop development and distribution compile: explicitly include the native database worker entry

<a id="ln-deno-062"></a>

**Requirement.** Every Deno desktop development and distribution compile MUST explicitly include the native database worker entry module so the worker and its statically imported runtime are available from the compiled snapshot.

## LN-DENO-068 — Local Nostr secret keys, bunker invitation data: remain in macOS Keychain or Linux Secret

<a id="ln-deno-068"></a>

**Requirement.** Local Nostr secret keys, bunker invitation data, and NIP-46 client keys MUST remain in macOS Keychain or Linux Secret Service. Secrets MUST enter native credential commands through stdin rather than argv, logs, telemetry, files, or renderer responses. macOS writes MUST use a non-interactive Security framework command, and every native credential command MUST fail after a bounded timeout rather than leave a renderer request pending indefinitely. Unsupported platforms MUST advertise Nostr signing as unavailable and MUST NOT use a plaintext fallback.

## LN-DENO-069 — Native desktop host: implement local and NIP-46 signing behind desktop*nostr_signer*\*

<a id="ln-deno-069"></a>

**Requirement.** The native desktop host MUST implement local and NIP-46 signing behind `desktop_nostr_signer_*` commands. The renderer MUST receive only a scoped session capability, opaque account metadata, and signed or encrypted results. The native service MUST validate exact event templates and signer output, retain non-secret account metadata in a private-mode application file, reconnect NIP-46 with the persisted client identity, and close active sessions during host shutdown.

## LN-DENO-070 — When Nostr registry discovery is re-enabled, desktop: compose public relay, curator, quorum, and optional

<a id="ln-deno-070"></a>

**Requirement.** When Nostr registry discovery is re-enabled, desktop MUST compose public relay, curator, quorum, and optional Blossom configuration, keep transport separate from signer secrets, and close subscriptions with the session. Nostr and HTTPS sources MUST start enabled unless preferences disable them. Explicit configuration MUST override opted-in local fixtures. While discovery is deferred, the static desktop profile MUST use HTTP without importing the Community binding.

## LN-DENO-071 — Native vault bridge: support cancellable ranged read streams and atomic

<a id="ln-deno-071"></a>

**Requirement.** The native vault bridge MUST support cancellable ranged read streams and atomic streamed writes through temporary files and replacement, with an expected file-ID and content-generation guard. Interrupted writes MUST NOT expose a partial final file.

## LN-DENO-072 — Desktop sync keys: remain behind the host crypto service

<a id="ln-deno-072"></a>

**Requirement.** Desktop sync keys MUST remain behind the host crypto service and use the available OS credential store for persisted envelopes or key references. Plugin workers MUST receive neither key bytes nor ambient filesystem, environment, network, or credential authority.

## LN-DENO-073 — Deno plugin runtime: bind plugin identity and grants

<a id="ln-deno-073"></a>

**Requirement.** The Deno plugin runtime MUST bind plugin identity and grants when its worker is created, validate every RPC message, and terminate or revoke its capability channel when disabled. Network and vault access MUST occur only through equivalent public broker operations.

## LN-DENO-074 — Stable vault identity during sync unlock

<a id="ln-deno-074"></a>

**Requirement.** Desktop sync unlock MUST NOT create a new vault identity. Explicit new-vault, paired-device, and recovery enrollment MUST obtain wrapping material through the OS credential adapter, while recovery bundle passphrases remain host-owned interaction and MUST NOT enter plugin callbacks.

## LN-DENO-076 — Renderer HTTP proxy: remove Content-Encoding and Content-Length from decoded upstream

<a id="ln-deno-076"></a>

**Requirement.** The renderer HTTP proxy MUST remove `Content-Encoding` and `Content-Length` from decoded upstream Fetch responses while preserving their status, content type, cache validators and body bytes. Raw vault, plugin and filesystem responses MUST retain their own representation headers. The renderer MUST load compressed upstream documents without a second decoding attempt.

## LN-DENO-077 — Native filesystem adapter: restore portable error codes from Deno binding

<a id="ln-deno-077"></a>

**Requirement.** The native filesystem adapter MUST restore portable error codes from Deno binding Error rejections, including the binding Error prefix. Explicit error codes MUST take precedence and unexpected errors MUST remain observable.

## LN-DENO-078 — Desktop database host: wait for worker readiness before dispatching requests

<a id="ln-deno-078"></a>

**Requirement.** The desktop database host MUST wait for worker readiness before dispatching requests. Startup MUST fail within a bounded interval if readiness never arrives. Closing or failing a starting worker MUST reject queued requests, cancel readiness work, and ignore late messages from that worker.
