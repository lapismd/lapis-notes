# Web Host / Application presentation

Delivered plugin URL navigation reveals the selected page above owning Settings
under [LN-PLUG-109](../plugin-model/app-ownership.md#ln-plug-109).

The registered `web+lapis` `/open?url=...` launch path dispatches through the
ready App, including the shared profile's plugin navigation action
([LN-PLUG-106](../plugin-model/app-ownership.md#ln-plug-106)). The requested
release is preserved; installation remains an explicit verified app action.

Rust-hosted native chat uses the shared profile's fresh declared target mode
under [LN-CORE-009/010](../architecture/rust-turn-admission.md#ln-core-009).
Unavailable metadata refuses before submission and preserves the draft. This
does not select native AI for standalone Web or advance the Rust cutover gate.

The opt-in R2.3 provider-screen journey uses the retained composer, vault menu,
Sign out and conversation History. It verifies explicit client release before
completion, then a fresh browser and cold Rust service read the same result and
transcript without another submission. Credentials remain native and test-owned
vault/profile data stays isolated; Linux delivery remains a separate gate.

## LN-WEB-001 — Private @lapis-notes/web version 2026.6.3: retain the legacy PWA identity, manifest, icons

<a id="ln-web-001"></a>

**Requirement.** Private `@lapis-notes/web` version `2026.6.3` MUST retain the legacy PWA identity, manifest, icons, update prompt, window-controls overlay, and `web+lapis` protocol handler.

## LN-WEB-030 — WASM response headers

<a id="ln-web-030"></a>

**Requirement.** Development, preview, and production web responses for `*.wasm` MUST use `Content-Type: application/wasm`. Those responses MUST carry isolation headers that allow Harper `WorkerLinter` to instantiate.

## LN-WEB-019 — Web launcher “View all” palette: compose @lapismd/design-core/shadcn/command-view for its inner search

<a id="ln-web-019"></a>

**Requirement.** The web launcher “View all” palette MUST compose `@lapismd/design-core/shadcn/command-view` for its inner search and result list.

## LN-WEB-020 — Retired Web application-tool proxy

<a id="ln-web-020"></a>

**Requirement.** Web MUST NOT publish a controller application-tool proxy or authorize remote agent calls. Shared application-tool registry contracts required by native desktop MUST remain available without starting a Web agent connection.

## LN-WEB-047 — Web development renderer: pre-bundle deep @lapismd/mira modules used by registry-installed

<a id="ln-web-047"></a>

**Requirement.** The Web development renderer MUST pre-bundle deep `@lapismd/mira` modules used by registry-installed Markdown so browsers receive interoperable exports for their transitive CommonJS dependencies instead of importing raw CommonJS through native ESM URLs.

## LN-WEB-051 — Server login surface: show the Lapis app mark centered above

<a id="ln-web-051"></a>

**Requirement.** The server login surface MUST show the Lapis app mark centered above its fields and compose Design Core inputs and theme-backed primary actions.
