# Hosted Server / Integration contracts

The shared Web client follows App-owned mobile preferences under LN-WS-105/106. Responsive presentation and mobile actions remain in the shared renderer and workspace adapter; this change adds no hosted server operation or native authority.

LN-WEB-090 adapts the desktop chooser's native paint for browser-local vaults; it does not add hosted-server operations.

The browser graph consumes published Core 0.10.1 for the native-control divider. The app.lapis.md Cloudflare deployment uses the standalone browser/PWA build. It does not deploy the retained hosted server profile, server credentials or API routes; those remain governed by this host chapter and the owning lapis-server specification. LN-WEB-087’s document-appearance bridge is selected only by the web-pwa runtime; LN-WEB-088 governs Cloudflare static caching separately from hosted responses.

Server integration requirements moved to the lapis-server specification:
<https://lapismd.github.io/lapis-server/>.

Shared browser-client behavior remains in
[the hosted client](../web-host/hosted-client.md). Shared observation streams
remain in
[Rust hosted runtime delivery](../architecture/rust-hosted-delivery.md).

The public generated plugin host module catalog includes CanvasTable, FilterBuilder and ToggleGroup for Notebook. The Node host consumes the same audited catalog and shared Svelte renderer; this intake does not change server routing or application services.

The renderer build adapter is a browser build facility shared by Web and electron-renderer admission. It does not change Node service routing or the frozen Deno host implementation.

The Web workspace keeps native AI opt-in for `node-server`; supplied native
Chat hosts default enabled only for `rust-server`. Registration remains
user-disableable and does not select an agent or start provider work.

The shared API/browser graph consumes released Mira 0.2 with Design Core
0.13.1. This dependency intake adds no hosted operation, credentials or native
authority and retains public package boundaries.
