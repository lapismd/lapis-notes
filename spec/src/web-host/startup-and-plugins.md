# Web Host / Startup and plugins

## LN-WEB-002 — Web host: own its launcher, profile selection, session lifecycle

<a id="ln-web-002"></a>

**Requirement.** The web host MUST own its launcher, profile selection, session lifecycle, PWA registration, and plugin boot while `@lapis-notes/workspace` remains shell-only.

## LN-WEB-031 — Web host: keep terminal-host configuration and bridge attachment independent

<a id="ln-web-031"></a>

**Requirement.** The web host MUST keep terminal-host configuration and bridge attachment independent from static plugin composition. An installed `@lapis-notes/lapis-plugin-terminal` MUST load through configured plugin persistence rather than a host import.

## LN-WEB-033 — After configuration load and whenever those values: register or replace only a lapis-terminal-host contribution

<a id="ln-web-033"></a>

**Requirement.** After configuration load and whenever those values change, the web session MUST register or replace only a `lapis-terminal-host` contribution. It MUST NOT overwrite a desktop IPC bridge.

## LN-WEB-035 — After attaching or replacing the terminal-host contribution: refresh an installed Terminal plugin so already-constructed

<a id="ln-web-035"></a>

**Requirement.** After attaching or replacing the terminal-host contribution, the web session MUST refresh an installed Terminal plugin so already-constructed panels remount. Absence of that plugin MUST remain a no-op.

## LN-WEB-036 — Web Vite and the web package manifest: Do not contain a linked @lapis-notes/lapis-plugin-terminal source

<a id="ln-web-036"></a>

**Requirement.** Web Vite and the web package manifest MUST NOT contain a linked `@lapis-notes/lapis-plugin-terminal` source root. Registry-installed plugin assets, including Ghostty WASM, MUST be served through the verified plugin-asset contract.

## LN-WEB-008 — Owner shutdown or stale heartbeats: allow one proxy to promote without losing

<a id="ln-web-008"></a>

**Requirement.** Owner shutdown or stale heartbeats MUST allow one proxy to promote without losing committed metadata or search state. Session disposal MUST release workers, locks, channels, and pending requests.

## LN-WEB-009 — PWA service worker: retain prompt-based updates and verified plugin-asset caching

<a id="ln-web-009"></a>

**Requirement.** The PWA service worker MUST retain prompt-based updates and verified plugin-asset caching without precaching downloaded embedding models. Cached modules from one verified installation MUST share a stable fingerprint so relative chunks resolve, while each file remains size- and SHA-256-verified before caching.

## LN-WEB-010 — Root scripts: expose web development, port-freeing restart, Turbo-filtered build

<a id="ln-web-010"></a>

**Requirement.** Root scripts MUST expose web development, port-freeing restart, Turbo-filtered build, preview, and two-tab acceptance lanes through the workspace package. Web end-to-end preflight MUST reuse the same cached root build.

## LN-WEB-011 — Bases: absent from the static web profile

<a id="ln-web-011"></a>

**Requirement.** Bases MUST be absent from the static web profile and load only when installed and enabled through configured plugin persistence. Browser acceptance MUST install it, create and reopen a Bases fixture, query rows, edit frontmatter, and preserve the configured view after restart.

## LN-WEB-012 — AI: absent from the static web profile

<a id="ln-web-012"></a>

**Requirement.** AI MUST be absent from the static web profile and load only when installed and enabled through configured plugin persistence. Live runtimes MUST be available only when both a runtime URL and token are configured. Otherwise the installed chat MUST stay usable through Fake or an unavailable state.

## LN-WEB-014 — Web session: register an agent-runtime WebSocket bridge before loading

<a id="ln-web-014"></a>

**Requirement.** The web session MUST register an agent-runtime WebSocket bridge before loading configured plugins only when URL and token are both set. It MUST NOT overwrite an existing desktop bridge. The bridge MUST expose agent-scoped model discovery, reject pending commands on transport closure, and retain active-session cursors for reconnect rather than terminating them on a transient socket close.

## LN-WEB-013 — Web renderer: load the public Lapis CodeMirror autocomplete stylesheet

<a id="ln-web-013"></a>

**Requirement.** The web renderer MUST load the public Lapis CodeMirror autocomplete stylesheet after Design Core and Lapis theme paint so shared completion extensions render the same production popover chrome as desktop and Storybook.

## LN-WEB-015 — Web session: own its compatibility App lease. PWA commands

<a id="ln-web-015"></a>

**Requirement.** Each web session MUST own its compatibility App lease. PWA commands and status bindings MUST use the explicit session App, unbind before replacement, and MUST NOT poll or execute through `globalThis.app`.

## LN-WEB-017 — Standalone bridge: reconnect and resubscribe active sessions

<a id="ln-web-017"></a>

**Requirement.** The standalone bridge MUST reconnect and resubscribe active sessions from their last accepted sequence before admitting live frames. Duplicate or older frames MUST be discarded. A replay gap or unknown host session MUST become a retryable interrupted turn and MUST NOT automatically resend input that may have caused side effects.

## LN-WEB-023 — After layout restoration, web boot: start metadata index load. It MUST NOT

<a id="ln-web-023"></a>

**Requirement.** After layout restoration, web boot MUST start metadata index load. It MUST NOT start before `loadLayout` returns or block `WorkspaceShell`. Persisted queries MUST become available at `loaded`, and later committed revisions MUST refresh affected surfaces.

### Acceptance details

Web boot restores the layout before opening the metadata store:

- `metadataCache.load` MUST start after `loadLayout` returns.
- `WorkspaceShell` mount MUST NOT await that promise.
- `loaded` MUST make persisted metadata queries available before vault reconciliation completes.
- Tags, Outline, Backlinks, Outgoing Links, Search, Bases, and File Properties MUST refresh on readiness and relevant committed revisions.

## LN-WEB-025 — After configuration load and whenever those values: register or replace its lapis-ai-controller WebSocket bridge

<a id="ln-web-025"></a>

**Requirement.** After configuration load and whenever those values change, the web session MUST register or replace its `lapis-ai-controller` WebSocket bridge and refresh AI host runtimes. It MUST NOT overwrite a desktop IPC bridge.

### Acceptance details

Web attach after configuration verifies:

- Settings-backed attach MUST run after `configuration.load` and before `loadPlugins`.
- A later Settings change MUST replace only a `lapis-ai-controller` bridge.
- The loaded AI plugin MUST gain ACP and Codex host runtimes once the capability appears.

## LN-WEB-026 — While resolving a current profile, the host: Do not paint the branded launcher.

<a id="ln-web-026"></a>

**Requirement.** While resolving a current profile, the host MUST NOT paint the branded launcher. A valid current profile MUST continue to Design Core `WorkspaceStartup`. The launcher MUST appear only when no valid current profile exists or the user opened an explicit manage overlay.

### Acceptance details

Web restore verifies the host boot gate:

- `data-web-host-state` MUST stay `loading` or `opening` until a valid profile opens or restore falls back.
- Restore MUST NOT mount the branded launcher or paint `landing` while a current profile is resolving.
- A valid current profile MUST enter the session four-task `WorkspaceStartup` path.
- No profile or an invalid current profile MUST then show the branded chooser.

## LN-WEB-040 — Export: pick a folder, copy the current OPFS

<a id="ln-web-040"></a>

**Requirement.** Export MUST pick a folder, copy the current OPFS tree including `.obsidian` with overwrite, report determinate progress, and notify success through the session App. Picker cancel MUST be silent.

## LN-WEB-042 — In-session import and export: report each copied file through notifications.withProgress. After

<a id="ln-web-042"></a>

**Requirement.** In-session import and export MUST report each copied file through `notifications.withProgress`. After scanning completes, the progress message MUST include the current path and `N of M` counts. The report MUST keep determinate `current` and `total`.

### Acceptance details

In-session copy progress verifies the notification message:

- After the first file is known, import MUST report `Importing {n} of {total}: {path}`.
- After the first file is known, export MUST report `Exporting {n} of {total}: {path}`.
- Scanning MUST keep a `Scanning {name}...` message until `total` is greater than zero.

## LN-WEB-044 — Web host: Do not statically import or register @lapis-notes/lapis-plugin-tasks

<a id="ln-web-044"></a>

**Requirement.** The web host MUST NOT statically import or register `@lapis-notes/lapis-plugin-tasks`. When installed and enabled, Tasks MUST load through configured plugin persistence and register its own workspace views.

## LN-WEB-048 — Web development renderer: keep @lapis-notes/api outside dependency optimization and resolve

<a id="ln-web-048"></a>

**Requirement.** The Web development renderer MUST keep `@lapis-notes/api` outside dependency optimization and resolve it as a singleton across the host and packed static plugins. Registry releases and local release-candidate tarballs MUST bind the same API peer so API-owned workspace state remains visible.

## LN-WEB-056 — Server-mode Web build: publish @lapis-notes/api through an initial import map

<a id="ln-web-056"></a>

**Requirement.** The server-mode Web build MUST publish `@lapis-notes/api` through an initial import map and a build-owned module entry with preserved public export names. The host and verified ESM plugins MUST reuse that entry's module graph so API-owned class identity is shared without a compatibility App global.

## LN-WEB-057 — Web plugin host: publish the public @lapis-notes/api/workspace-host subpath

<a id="ln-web-057"></a>

**Requirement.** The Web plugin host MUST publish the public `@lapis-notes/api/workspace-host` subpath through the initial import map and a build-owned module entry. History and other verified ESM plugins that declare the subpath MUST install and load without a missing-host-module validation error.

## LN-WEB-058 — When Nostr registry discovery is re-enabled, Web: compose the configured relays, pinned curator keys

<a id="ln-web-058"></a>

**Requirement.** When Nostr registry discovery is re-enabled, Web MUST compose the configured relays, pinned curator keys, quorum, and optional Blossom endpoint. Nostr and HTTPS sources MUST start enabled unless preferences disable them. Invalid configuration MUST fail closed, and session teardown MUST close subscriptions. While discovery is deferred, the static Web profile MUST use HTTP without importing the Community binding.

## LN-WEB-063 — Web plugin asset server: finish mirroring verified bytes and obtain

<a id="ln-web-063"></a>

**Requirement.** The Web plugin asset server MUST finish mirroring verified bytes and obtain a controlling service worker before returning an executable asset URL. First-page installation MUST wait for control instead of enabling a route the current page cannot fetch.

## LN-WEB-064 — Web plugin asset readiness: report asset-server-unavailable after thirty seconds without control

<a id="ln-web-064"></a>

**Requirement.** Web plugin asset readiness MUST report `asset-server-unavailable` after thirty seconds without control. Completion and failure MUST remove their controller-change listeners and timer handles.
