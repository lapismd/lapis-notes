# Web Host / Browser integration

The Design Core dependency refresh consumes released `0.4.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

Complete CI browser acceptance under LN-PKG-161 includes the real server-host
editing, sharing and restart scenario. Its private bootstrap fixture is seeded
for the container user and retains the original browser assertions and deadlines.

## LN-WEB-032 — Web host: persist terminal-host URL and token as web.terminalHost.url

<a id="ln-web-032"></a>

**Requirement.** The web host MUST persist terminal-host URL and token as `web.terminalHost.url` and `web.terminalHost.token`. The token field MUST use password presentation. Live attach MUST require both values.

## LN-WEB-034 — WASM assets and Ghostty bundling

<a id="ln-web-034"></a>

**Requirement.** Web Vite MUST keep `*.wasm` assets, MUST exclude `ghostty-web` plus registry-installed Design Core Svelte source from dependency pre-bundling, and MUST keep compiled component CSS in the Svelte module rather than a separate virtual-CSS request. The packaged Ghostty renderer MUST resolve its WASM file, while Design Core rune modules and styles MUST pass through the Svelte transform without optimizer or Tailwind corruption.

## LN-WEB-024 — Web host: persist agent-runtime URL and token in app

<a id="ln-web-024"></a>

**Requirement.** The web host MUST persist agent-runtime URL and token in app configuration and show both fields in Settings. The token field MUST use password presentation so the value stays masked until revealed. Environment variables MAY prefill empty fields. Live attach MUST require both values.

### Acceptance details

Web agent-runtime Settings verify:

- Field ids MUST be `web.agentRuntime.url` and `web.agentRuntime.token`.
- The URL field MUST accept a WebSocket URI that includes the port.
- The token field MUST use `presentation: "password"`.
- Live attach MUST stay off until both values are non-empty.

## LN-WEB-045 — Source Editor startup order

<a id="ln-web-045"></a>

**Requirement.** The web host MUST register the default-enabled `@lapis-notes/source-editor` before Markdown so text, JSON, YAML, and YML files use the same source associations as desktop without transferring Markdown ownership.

## LN-WEB-046 — Production web build: provide an explicit 8 GiB Node heap

<a id="ln-web-046"></a>

**Requirement.** The production web build MUST provide an explicit 8 GiB Node heap budget so the registry-backed Design Core and Mira graph completes chunk rendering under the root package build.
