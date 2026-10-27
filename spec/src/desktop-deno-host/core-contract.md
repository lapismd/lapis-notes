# Deno Desktop Host / Host integration

The optional `native-repository` application profile is selected only by
Rust-hosted Web. It adds no import, activation or state change to this frozen host.

The Deno host is frozen. Its existing application-profile entry and four-plugin
static registration remain unchanged. The new private `native-chat` entry is
selected only by Tauri or Rust-hosted Web; Deno does not import or construct it.
[Native observer adoption](../architecture/rust-turn-admission.md) owns that
separate migration contract.

The declared target-mode contract under LN-CORE-009/010 applies only to that
native entry. Its metadata refresh cannot reactivate or change the frozen Deno
chat path.

The optional queue observer and target-discovery metadata under
[LN-CORE-036/037](../architecture/rust-turn-admission.md#ln-core-036) apply only
to that native entry. They add no command, capture constructor, timer or
activation to Deno. This shared-profile intake preserves the frozen host;
implementation and acceptance target Tauri and Rust-hosted Web.

The Design Core dependency refresh consumes released `0.5.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

## LN-DENO-010 — Renderer cross-origin isolation

<a id="ln-deno-010"></a>

**Requirement.** Development and production renderer responses MUST send the cross-origin isolation headers required by WASM Turso.

## LN-DENO-033 — Telemetry mode: identify renderer and native host as separate

<a id="ln-deno-033"></a>

**Requirement.** Telemetry mode MUST identify renderer and native host as separate services and propagate validated W3C trace context through a private versioned invocation envelope. Native dispatch MUST remove telemetry metadata before business handlers, while legacy unwrapped calls remain accepted.

### Acceptance details

Correlated desktop telemetry verifies:

- Renderer spans export under `lapis-notes-renderer` and native spans under `lapis-notes-desktop`.
- Selected renderer invocations produce valid remote-parent native spans.
- Malformed envelopes fail closed, while payload handlers receive no trace fields.

## LN-DENO-042 — System WebView and CEF Graph canvases: share the 1/128…8 camera range, deterministic visible

<a id="ln-deno-042"></a>

**Requirement.** System WebView and CEF Graph canvases MUST share the `1/128…8` camera range, deterministic visible entrance settlement, zoom-stable geometry, viewport culling, semantic colours, and animated neighbourhood emphasis. Reduced-motion OS preference MUST disable entrance and emphasis animation without changing the final graph.

## LN-DENO-045 — Close coordinator: defer renderer notification out of native close

<a id="ln-deno-045"></a>

**Requirement.** The close coordinator MUST defer renderer notification out of native close and binding callback stacks. It MUST use a private same-origin signal because programmatic close and hide are unreliable on secondary macOS WebViews. The renderer MUST replace the workspace with an opaque branded closing presentation before shared teardown and retain the structured ready acknowledgement. Telemetry flush MUST settle best-effort within one second.

### Acceptance details

The macOS close transport verifies:

- Native close MUST release the private pending renderer request on the next
  event-loop turn instead of invoking the secondary WebView from the close
  callback.
- The renderer MUST replace the workspace with the centered Lapis logo before
  disposing the active session and acknowledging readiness through the bounded
  native binding.
- Renderer telemetry MUST flush successfully or abandon pending export within
  one second before acknowledging readiness.
- Normal close MUST reach renderer-ready without waiting for the fail-safe or
  producing legacy request-abort warnings.

## LN-DENO-060 — Native-to-renderer server-sent event: receive a monotonic event id and remain

<a id="ln-deno-060"></a>

**Requirement.** Every native-to-renderer server-sent event MUST receive a monotonic event id and remain in the bounded replay ring after live delivery. A reconnect that supplies `Last-Event-ID` MUST replay only unseen retained events in source order, including an ACP terminal event.

## LN-DENO-065 — Desktop development renderer: pre-bundle deep @lapismd/mira modules used by registry-installed

<a id="ln-deno-065"></a>

**Requirement.** The desktop development renderer MUST pre-bundle deep `@lapismd/mira` modules used by registry-installed Markdown. System WebView and CEF MUST receive interoperable exports for their transitive CommonJS dependencies instead of importing raw CommonJS through native ESM URLs.

Frozen Deno retains its current host implementation. The shared optional native
participant projection under [LN-CORE-048](../architecture/rust-participants.md#ln-core-048)
is selected by admitted native hosts; its profile/read ports preserve existing
metadata-absent single-target behavior and the current complete Agent screen.
