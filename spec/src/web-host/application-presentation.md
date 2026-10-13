# Web Host / Application presentation

## LN-WEB-001 — Private @lapis-notes/web version 2026.6.3: retain the legacy PWA identity, manifest, icons

<a id="ln-web-001"></a>

**Requirement.** Private `@lapis-notes/web` version `2026.6.3` MUST retain the legacy PWA identity, manifest, icons, update prompt, window-controls overlay, and `web+lapis` protocol handler.

## LN-WEB-030 — WASM response headers

<a id="ln-web-030"></a>

**Requirement.** Development, preview, and production web responses for `*.wasm` MUST use `Content-Type: application/wasm`. Those responses MUST carry isolation headers that allow Harper `WorkerLinter` to instantiate.

## LN-WEB-019 — Web launcher “View all” palette: compose @lapismd/design-core/shadcn/command-view for its inner search

<a id="ln-web-019"></a>

**Requirement.** The web launcher “View all” palette MUST compose `@lapismd/design-core/shadcn/command-view` for its inner search and result list.

## LN-WEB-020 — Authenticated protocol-v3 web bridge: proxy application-tool calls, responses, and cancellation

<a id="ln-web-020"></a>

**Requirement.** An authenticated protocol-v3 web bridge MUST proxy application-tool calls, responses, and cancellation through its existing agent-runtime connection while the browser App executes the tool. A real stdio-shim round trip MUST use that same connection, and disconnect MUST revoke bridge authorization and cancel pending calls without retaining note contents in host replay.

## LN-WEB-047 — Web development renderer: pre-bundle deep @lapismd/mira modules used by registry-installed

<a id="ln-web-047"></a>

**Requirement.** The Web development renderer MUST pre-bundle deep `@lapismd/mira` modules used by registry-installed Markdown so browsers receive interoperable exports for their transitive CommonJS dependencies instead of importing raw CommonJS through native ESM URLs.

## LN-WEB-051 — Server login surface: show the Lapis app mark centered above

<a id="ln-web-051"></a>

**Requirement.** The server login surface MUST show the Lapis app mark centered above its fields and compose Design Core inputs and theme-backed primary actions.
