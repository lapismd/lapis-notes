# Web Host / Startup and plugins

While a hosted attachment opens, its retained workspace startup/recovery surface
stays visible. The chooser can hide a retained ready session; it cannot hide a
prepared session's progress or failure while waiting for that session's readiness.

## LN-WEB-002 — Web host: own its launcher, profile selection, session lifecycle

<a id="ln-web-002"></a>

**Requirement.** The web host MUST own its launcher, profile selection, session lifecycle, PWA registration, and plugin boot while `@lapis-notes/workspace` remains shell-only.

## LN-WEB-031 — Desktop-only Terminal identity

<a id="ln-web-031"></a>

**Requirement.** Web MUST exclude Terminal from its static profile and reject activation of the `terminal` identity through the App-owned host restriction, including older installed manifests that advertise Web support. Saved plugin data, disabled preferences and layout MUST remain intact.

## LN-WEB-033 — No Terminal bridge attachment

<a id="ln-web-033"></a>

**Requirement.** Web startup and configuration changes MUST NOT publish a terminal runtime contribution or connect to a terminal-host service.

## LN-WEB-035 — No Terminal runtime refresh

<a id="ln-web-035"></a>

**Requirement.** Web MUST NOT refresh installed Terminal runtime clients. The desktop-only rejection MUST precede external module evaluation and command or view registration.

## LN-WEB-036 — Retired Terminal distribution inputs

<a id="ln-web-036"></a>

**Requirement.** The Web package and Vite configuration MUST NOT import the standalone Terminal plugin, terminal-host client or Ghostty assets. Other compatible installed plugins MUST retain verified asset delivery.

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

## LN-WEB-012 — Desktop-only AI identity

<a id="ln-web-012"></a>

**Requirement.** Web MUST exclude AI from its static profile and reject activation of the `ai` identity through App-owned host restrictions, including older installed manifests that advertise Web support. Discovery MUST report desktop-only compatibility without deleting conversations, enabled preferences or saved layout.

## LN-WEB-014 — No AI environment attachment

<a id="ln-web-014"></a>

**Requirement.** Web startup MUST NOT publish an AI bridge or connect to an agent runtime, regardless of obsolete URL/token environment variables. Retired service environment prefixes MUST NOT be exposed to the Web renderer.

## LN-WEB-013 — Web renderer: load the public Lapis CodeMirror autocomplete stylesheet

<a id="ln-web-013"></a>

**Requirement.** The web renderer MUST load the public Lapis CodeMirror autocomplete stylesheet after Design Core and Lapis theme paint so shared completion extensions render the same production popover chrome as desktop and Storybook.

## LN-WEB-015 — Web session: own its compatibility App lease. PWA commands

<a id="ln-web-015"></a>

**Requirement.** Each web session MUST own its compatibility App lease. PWA commands and status bindings MUST use the explicit session App, unbind before replacement, and MUST NOT poll or execute through `globalThis.app`.

## LN-WEB-017 — Retired Web agent subscriptions

<a id="ln-web-017"></a>

**Requirement.** Web MUST NOT establish agent-session subscriptions, reconnect streams or replay agent input. Reusable native/runtime protocols and development-only catalog fixtures MUST remain outside the Web product graph.

## LN-WEB-023 — Metadata indexing after layout restoration

<a id="ln-web-023"></a>

**Requirement.** After layout restoration, web boot MUST start metadata index load. It MUST NOT start before `loadLayout` returns or block `WorkspaceShell`. Persisted queries MUST become available at `loaded`, and later committed revisions MUST refresh affected surfaces.

### Acceptance details

Web boot restores the layout before opening the metadata store:

- `metadataCache.load` MUST start after `loadLayout` returns.
- `WorkspaceShell` mount MUST NOT await that promise.
- `loaded` MUST make persisted metadata queries available before vault reconciliation completes.
- Tags, Outline, Backlinks, Outgoing Links, Search, Bases, and File Properties MUST refresh on readiness and relevant committed revisions.

## LN-WEB-025 — No AI configuration attachment

<a id="ln-web-025"></a>

**Requirement.** Web configuration changes MUST NOT attach or replace an AI controller contribution or refresh AI host runtimes. Existing unrelated host lifecycle and configuration behavior MUST remain unchanged.

## LN-WEB-026 — Launcher visibility during profile resolution

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

**Requirement.** Export MUST pick a folder, copy the current OPFS tree including `.lapis` with overwrite, report determinate progress, and notify success through the session App. Picker cancel MUST be silent.

## LN-WEB-042 — In-session import and export: report each copied file through notifications.withProgress. After

<a id="ln-web-042"></a>

**Requirement.** In-session import and export MUST report each copied file through `notifications.withProgress`. After scanning completes, the progress message MUST include the current path and `N of M` counts. The report MUST keep determinate `current` and `total`.

### Acceptance details

In-session copy progress verifies the notification message:

- After the first file is known, import MUST report `Importing {n} of {total}: {path}`.
- After the first file is known, export MUST report `Exporting {n} of {total}: {path}`.
- Scanning MUST keep a `Scanning {name}...` message until `total` is greater than zero.

## LN-WEB-044 — Independent Tasks view registration

<a id="ln-web-044"></a>

**Requirement.** The web host MUST NOT statically import or register `@lapis-notes/lapis-plugin-tasks`. When installed and enabled, Tasks MUST load through configured plugin persistence and register its own workspace views.

## LN-WEB-070 — Staged native Tasks ownership

<a id="ln-web-070"></a>

**Requirement.** When explicitly selected, the staged Rust-hosted App MUST receive the admitted native Tasks and required native metadata owner before construction. Installed Tasks MUST retain its existing UI and observe native projections. Final workspace teardown MUST detach and drain native observation before unloading every configured plugin and releasing its client. Unknown lifecycle results MUST remain inspectable through persisted plugin references without replay.

Tasks selection is default-off through `VITE_LAPIS_NATIVE_TASKS`. Selecting it binds the shared native metadata owner and editor-intent transport together, so renderer metadata cannot compete with native Tasks publication. Startup reconciliation waits for settled declarations. Recoverable startup Retry keeps its existing App controller/cache observers live; only final teardown disposes them. The normal configured
plugin loader retains installed-byte verification. Community/development plugin
lifecycle receives the same passive teardown ordering as core plugins. The
[hosted Tasks record](../../records/2026-10-26-hosted-native-tasks.md) separates
source, actual UI, timezone and installed-plugin integrity acceptance from
publication, default cutover and app signing. Standalone browser behavior is
unchanged.

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

The Rust client exposes generated native indexing controls under LN-CORE-004.
The ordinary hosted profile keeps its renderer selection; the explicit native
metadata option below stages hosted observation separately from final R3 parity.

## LN-WEB-066 — Opt-in hosted native metadata

<a id="ln-web-066"></a>

**Requirement.** An explicitly selected Rust hosted native-metadata profile MUST pass its existing admitted indexing transport into `VaultSession` before App construction. It MUST reuse the admitted vault/database connection and existing App observer, with passive detach and visible service failure. Node, standalone Web and the default Rust profile MUST retain their current indexing selection.

The private build flag `VITE_LAPIS_NATIVE_METADATA=1` selects this staged profile.
It supplies no new scheduler or native path authority. Native Search remains a
separate plugin/archive and host-acceptance gate; metadata-only selection keeps
the retained Search writer available until that gate is admitted.

## LN-WEB-067 — Thin hosted indexed History adapter

<a id="ln-web-067"></a>

**Requirement.** An explicitly selected Rust hosted History adapter MUST expose the shared start, status, query and context service through its existing admitted client. Views MUST observe the native owner without renderer batch scheduling. Teardown MUST fence later requests and drain accepted observation without disabling native work. Ordinary Node, Rust and standalone Web defaults MUST retain their existing profiles until separately qualified.

## LN-WEB-068 — Selected hosted native Search

<a id="ln-web-068"></a>

**Requirement.** The qualified Search plugin MUST use the existing native indexing opt-in and admitted Rust client for provider/chunk declarations, refresh and rebuild. The renderer MUST retain existing Search presentation and queries without publishing Search rows. Native work MUST survive detach. A replacement App with persisted Search disabled MUST drain that selection while retaining native metadata and saved files; ordinary hosted profiles MUST remain renderer-owned.

## LN-WEB-069 — Retained hosted Repository screen

<a id="ln-web-069"></a>

**Requirement.** The explicitly selected Rust History profile MUST bind the
public RepositoryFactory before plugin loading and use the retained Repository
screen for reads, Search and blame. Workspace close MUST fence new requests,
drain accepted reads and release its handles before detaching its admitted
client. It MUST NOT add a replacement screen, renderer indexing scheduler or
fake navigation. Ordinary hosted and standalone defaults MUST remain unchanged.

## LN-WEB-071 — Hosted editing-intent binding

<a id="ln-web-071"></a>

**Requirement.** The Rust-hosted App MUST receive native editing intents through its existing vault admission before editable surfaces become ready. The binding MUST preserve typed commands and snapshots, map only a typed missing-file result to absence, and retain all other failures without replay. Existing editing registry guards MUST coordinate flush, yield, native mutation and rearm.

[Hosted Tasks acceptance](../../records/2026-10-26-hosted-native-tasks.md) tracks
actual two-browser editor/refusal/rearm behavior separately from transport source
checks. Native authority and intent contracts belong to the shared application
services; the hosted binding adds no second journal, save path or scheduler.

## LN-WEB-072 — Retained hosted restore review

<a id="ln-web-072"></a>

**Requirement.** The selected Rust Repository profile MUST adapt the public RestoreService and retain its existing file/vault review, pending intent and explicit recovery controls. It MUST preserve exact request identities, validate preview identity and fence late responses. Workspace close MUST reject new restores and drain accepted observations. The adapter MUST NOT add a screen, writer, retry policy or automatic replay.

## LN-WEB-073 — Retained backup settings and observation

<a id="ln-web-073"></a>

**Requirement.** The selected hosted Repository MUST reuse its public backup settings/status components and optional persisted-selection service. Observer start/stop MUST remain passive. Explicit selection MUST join the App configuration-file guard, fetch its expected version after pending writes, and enqueue read-only baseline reconciliation before later configuration saves. Failed acknowledgements MUST reconcile without automatically replaying setting or file mutations.

## LN-WEB-074 — Guarded hosted workspace leave

<a id="ln-web-074"></a>

**Requirement.** Hosted vault switch, archive and logout MUST preflight native recovery and flush registered writers under their guard before disposing views, plugins, registry or clients. Refusal MUST retain the same App, draft and Problems, report through existing notifications and permit explicit retry. Concurrent callers MUST join complete disposal. Later cleanup failure MUST remain distinct from refusal and failed on subsequent leave requests without replay or admission release.

## LN-WEB-075 — Retained independent repository sources

<a id="ln-web-075"></a>

**Requirement.** Hosted Repository surfaces MUST retain each selected source, exact operation pin and independent tab/read lifetime. Opening, refreshing or closing a view MUST NOT initialize, capture or mutate either repository. Both source clients MUST use the existing preparation queue and drain their own handles before release. An unavailable or fenced original scope MUST refuse without falling back to managed backup.
