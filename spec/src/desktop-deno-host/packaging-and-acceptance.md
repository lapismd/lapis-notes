# Deno Desktop Host / Packaging and acceptance

## LN-DENO-038 — Before mounting application UI, the desktop renderer: mark the document engine from the native

<a id="ln-deno-038"></a>

**Requirement.** Before mounting application UI, the desktop renderer MUST mark the document engine from the native host's selected backend. The default and packaged system-webview backend MUST identify as WebKit, CEF MUST identify as Blink, and shared UI compatibility MUST NOT depend on Laufey's user-agent shape.

### Acceptance details

Desktop renderer-engine selection verifies:

- Native platform metadata maps the default and explicit system-webview backend to WebKit.
- Native platform metadata maps the explicit CEF backend to Blink.
- The renderer applies the engine marker before mounting the desktop application.

## LN-DENO-075 — Atomic acceptance-report publication

<a id="ln-deno-075"></a>

**Requirement.** Packaged acceptance reports MUST become visible through an atomic rename after complete JSON serialization. A reader MUST NOT observe a partially written report, and report publication failure MUST remain a failed acceptance result.
