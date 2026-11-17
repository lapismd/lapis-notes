# Hosted Server / Integration contracts

Current framework dependency intake selects published Design Core `0.13.5`.
API, retained UI, Workspace and Web require `^0.13.5`; the separate App Profile
minimum remains `^0.13.4`. Root tooling and File Explorer resolve the same
registry identity within their existing ranges. Public exports, App ownership
and host lifecycle remain governed by this chapter; qualification is recorded
in [the Core intake receipt](../../records/2026-11-17-core-0135-intake.md).

Hosted clients may consume App Profile’s built shared session and native
Repository registration. The server retains its authenticated transport and
credential custody; package qualification alone does not establish server
adoption or cold hosted acceptance.

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

Deferred plugin ribbon and Markdown-pane controls preserve discovery without
loading a dormant runtime at startup. Invocation follows existing plugin
admission; this API change adds no hosted operation or server authority.

The shared API/browser graph consumes released Mira 0.2 with Design Core
0.13.2. This dependency intake adds no hosted operation, credentials or native
authority and retains public package boundaries.

## Shared skill-management API qualification

The shared profile/API release qualifies explicit startup retry under
[LN-PKG-191](../packages/app-and-services.md#ln-pkg-191) and raw-byte conditional
skill writes under [LN-PKG-192](../packages/vault-and-storage.md#ln-pkg-192).
Hosted consumers select the released API version carrying those guards through
the profile's public dependency range. This package qualification does not
establish native Server adoption: the owning Server release separately verifies
its filesystem byte preservation, authenticated CLI write authority, shared-vault
app/CLI commands and cold restart. Existing read-only credentials gain no write
authority from installing or upgrading the shared profile.

The [current release evidence](../../records/2026-11-15-profile-registry-security.md)
keeps public-package qualification and remaining Server/Desktop adoption
separate, including the explicitly accepted catalog-only limitations.
