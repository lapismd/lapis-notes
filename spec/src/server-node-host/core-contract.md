# Hosted Server / Integration contracts

LN-CAT-125 updates Notes' browser registry acceptance to a retired-AI-free
fixture while retaining category, install and persistence checks. It changes
no hosted-server transport, credentials or runtime selection and does not
substitute Notes browser checks for lapis-server acceptance.

LN-WEB-093 decouples the shared Web icon build step from frozen Deno desktop artwork. The unchanged generated assets do not alter hosted service routing, runtime selection or PWA identity.

<!-- dependency-intake:framework-registry:start -->

Current registry dependency coordinates; qualification remains separate.

<!-- prettier-ignore -->
| Manifest | Dependency | Range | Locked version |
| --- | --- | --- | --- |
| `package.json` (devDependencies) | `@lapismd/design-core` | `^0.13.7` | `0.13.7` |
| `packages/api/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.7` | `0.13.7` |
| `packages/api/package.json` (peerDependencies) | `@lapismd/design-core` | `^0.8.0 \|\| ^0.9.0 \|\| ^0.10.0 \|\| ^0.12.0 \|\| ^0.13.0` | Peer support |
| `packages/app-profile/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.7` | `0.13.7` |
| `packages/file-explorer/package.json` (dependencies) | `@lapismd/design-core` | `^0.7.0 \|\| ^0.8.0 \|\| ^0.9.0 \|\| ^0.10.0 \|\| ^0.12.0 \|\| ^0.13.0` | `0.13.7` |
| `packages/ui/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.7` | `0.13.7` |
| `packages/ui/package.json` (peerDependencies) | `@lapismd/design-core` | `^0.7.0 \|\| ^0.8.0 \|\| ^0.9.0 \|\| ^0.10.0 \|\| ^0.12.0 \|\| ^0.13.0` | Peer support |
| `packages/web/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.7` | `0.13.7` |
| `packages/workspace/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.7` | `0.13.7` |

Manifest, peer and integrity facts SHA256: `5dee5973d840b6737b39d0845655ae63ecbc0321f794f1003dae9377314b39d2`.

<!-- dependency-intake:framework-registry:end -->

Hosted clients may consume App Profile’s built shared session and native
Repository registration. The server retains its authenticated transport and
credential custody; package qualification alone does not establish server
adoption or cold hosted acceptance.

The shared Web client follows App-owned mobile preferences under LN-WS-105/106. Responsive presentation and mobile actions remain in the shared renderer and workspace adapter; this change adds no hosted server operation or native authority.

LN-WEB-090 adapts the desktop chooser's native paint for browser-local vaults; it does not add hosted-server operations.

The browser graph consumes published Core 0.10.1 for the native-control divider. The app.lapis.md Cloudflare deployment uses the standalone browser/PWA build. It does not deploy the retained hosted server profile, server credentials or API routes; those remain governed by this host chapter and the owning lapis-server specification. LN-WEB-087’s standalone appearance follows the framework-neutral presentation entry under LN-WEB-094. The hosted consumer selects the same entry independently of its runtime and credentials; LN-WEB-088 governs Cloudflare static caching separately from hosted responses.

The shared browser host also applies LN-WEB-095's single page-exit vault close
to hosted sessions. LN-WEB-096 remains standalone-PWA update policy and does not
add a hosted service worker. Neither contract adds offline server authority or
credential persistence; the owning Server retains its reconnect and
authenticated-session policy.

Server integration requirements moved to the lapis-server specification:
<https://lapismd.github.io/lapis-server/>.

Shared browser-client behavior remains in
[the hosted client](../web-host/hosted-client.md). Shared observation streams
remain in
[Rust hosted runtime delivery](../architecture/rust-hosted-delivery.md).

The public generated plugin host module catalog includes CanvasTable, FilterBuilder and ToggleGroup for Notebook. The Node host consumes the same audited catalog and shared Svelte renderer; this intake does not change server routing or application services.

The renderer build adapter is a browser build facility shared by Web and native-renderer admission. It does not change Node service routing.

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
