# Web Host / Browser integration

The explicit `server-rust` profile connects the retained hosted screen to
Rust-generated commands through admitted HTTP client IDs. It omits PWA startup
and browser storage. Its initial configured-vault workflow and later hosted
feature parity retain separate evidence; Node remains the serving baseline.

The Design Core dependency refresh consumes released `0.5.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

Complete CI browser acceptance under LN-PKG-161 includes the real server-host
editing, sharing and restart scenario. Its private bootstrap fixture is seeded
for the container user and retains the original browser assertions and deadlines.
That scenario runs in the dedicated Node server browser config; the PWA config
continues to execute its complete independent browser suite. Both jobs remain
blocking, and server acceptance checks a read-only Node 24 container with no Deno
executable before editing and retained-volume restart.

Browser acceptance invokes the CLI entry declared by the Web package's pinned
`@playwright/test` dependency. PWA and hosted runners use that same installed
module as their tests/configuration, avoiding a stale or hoisted `playwright`
shim from a different package version.

## LN-WEB-032 — Retired Terminal connection settings

<a id="ln-web-032"></a>

**Requirement.** The Web host MUST NOT register terminal-host URL or token fields. After configuration loads it MUST remove the obsolete dedicated `web.terminalHost.token` secret without deleting Terminal plugin data or unrelated configuration.

## LN-WEB-034 — Packaged WASM and Svelte source

<a id="ln-web-034"></a>

**Requirement.** Web Vite MUST retain `*.wasm` assets and exclude Harper plus registry-installed Design Core Svelte source from dependency optimization. Component CSS MUST remain in its compiled Svelte module. The retired Ghostty integration MUST NOT remain a Web dependency or optimizer exclusion.

## LN-WEB-024 — Retired AI connection settings

<a id="ln-web-024"></a>

**Requirement.** The Web host MUST NOT register agent URL or token fields or prefill them from environment values. After configuration loads it MUST remove the obsolete dedicated `web.agentRuntime.token` secret while preserving conversations, plugin data and unrelated configuration.

## LN-WEB-045 — Source Editor startup order

<a id="ln-web-045"></a>

**Requirement.** The web host MUST register the default-enabled `@lapis-notes/source-editor` before Markdown so text, JSON, YAML, and YML files use the same source associations as desktop without transferring Markdown ownership.

## LN-WEB-046 — Production web build: provide an explicit 8 GiB Node heap

<a id="ln-web-046"></a>

**Requirement.** The production web build MUST provide an explicit 8 GiB Node heap budget so the registry-backed Design Core and Mira graph completes chunk rendering under the root package build.

Vault-local settings and installed-plugin assets use the shared `.lapis`
default through the public API path contract under LN-ARCH-140 and LN-PKG-165.
