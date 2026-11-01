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

The private Rust-hosted build flag `VITE_LAPIS_NATIVE_HISTORY=1` supplies the
same admitted client through `HostedResources` and `VaultSession` before App
construction. The port uses the generated start/status/query/context commands;
its lifetime is the existing client lease. It does not enable a Repository
screen without an admitted history reader. Node, standalone Web and ordinary
Rust profiles keep the port absent until their separate cutover gates.

## LN-WEB-083 — Production PWA deployment

<a id="ln-web-083"></a>

**Requirement.** Every validated main revision MUST publish the browser-only PWA to `https://app.lapis.md` through GitHub Actions and Cloudflare Workers Static Assets. The deployment MUST consume the exact tested artifact, reject stale main revisions and retain source and deployment identifiers for rollback. Production credentials MUST remain in the main-only GitHub environment.

## LN-WEB-084 — Oversized static WASM delivery

<a id="ln-web-084"></a>

**Requirement.** Deployment preparation MUST preserve application and precache URLs while replacing oversized WASM uploads with deterministic gzip assets. A streaming asset-only Worker MUST serve only generated mappings with correct WASM MIME, isolation, encoding, conditional and HEAD semantics. Missing scripts and WASM MUST NOT receive the SPA document.

## LN-WEB-085 — Installed window chrome

<a id="ln-web-085"></a>

**Requirement.** The PWA host MUST map live native control geometry to Design Core's public leading, trailing and title-bar-height tokens. Native-control exclusions MUST follow resize and layout changes without blocking interactive tabs or controls, and ordinary browser mode MUST clear the overlay geometry.

## LN-WEB-086 — Persistence-safe PWA updates

<a id="ln-web-086"></a>

**Requirement.** Foreground and online transitions MUST request service-worker update checks. Updates MUST remain prompt-based. Acceptance MUST await the owning workspace persistence and leave boundary before activation; a refused save MUST preserve the live session and available update.

## LN-WEB-087 — Browser appearance ownership

<a id="ln-web-087"></a>

**Requirement.** The browser host MUST apply the workspace's light, dark or system appearance to its document, persist the selected startup mode and follow system changes while system mode is selected. Browser-frame theme metadata MUST follow resolved shell paint in the launcher, running workspace and subsequent startup.

## LN-WEB-088 — Static asset cache identity

<a id="ln-web-088"></a>

**Requirement.** HTML, service-worker entrypoints, manifests and stable plugin entrypoints MUST revalidate; deployment metadata MUST bypass storage. Content-hashed assets, including the imported Workbox runtime, MUST use immutable caching.

## LN-WEB-089 — Revision-specific PWA installation

<a id="ln-web-089"></a>

**Requirement.** Every published source revision MUST produce a distinct service-worker installation identity, including revisions with no application-source changes. The running document MUST expose its build SHA so update acceptance can verify the active revision independently of uncached deployment metadata.
