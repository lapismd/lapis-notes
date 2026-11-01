# Hosted Server / Integration contracts

The app.lapis.md Cloudflare deployment uses the standalone browser/PWA build. It does not deploy the retained hosted server profile, server credentials or API routes; those remain governed by this host chapter and the owning lapis-server specification. LN-WEB-087’s document-appearance bridge is selected only by the web-pwa runtime.

Server integration requirements moved to the lapis-server specification:
<https://lapismd.github.io/lapis-server/>.

Shared browser-client behavior remains in
[the hosted client](../web-host/hosted-client.md). Shared observation streams
remain in
[Rust hosted runtime delivery](../architecture/rust-hosted-delivery.md).

The public generated plugin host module catalog includes CanvasTable, FilterBuilder and ToggleGroup for Notebook. The Node host consumes the same audited catalog and shared Svelte renderer; this intake does not change server routing or application services.

The renderer build adapter is a browser build facility shared by Web and electron-renderer admission. It does not change Node service routing or the frozen Deno host implementation.
