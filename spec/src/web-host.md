# Web Host

The web host is a browser/PWA consumer ported from
`/Users/stevejuma/code/lapis-notes/packages/web` at commit `8ec68e18`.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-WEB-001 | Private `@lapis-notes/web` version `2026.6.3` MUST retain the legacy PWA identity, manifest, icons, update prompt, window-controls overlay, and `web+lapis` protocol handler.                                                                                                                                      |
| LN-WEB-002 | The web host MUST own its launcher, profile selection, session lifecycle, PWA registration, and plugin boot while `@lapis-notes/workspace` remains shell-only.                                                                                                                                                     |
| LN-WEB-003 | The launcher MUST create OPFS vaults, open File System Access folders, restore valid saved profiles, and remain recoverable after cancellation or denied permission.                                                                                                                                               |
| LN-WEB-004 | The web session MUST register File Explorer, Markdown, Markdown Lint, Search, History, Word Count, Bases, and AI as optional bundled plugins plus enabled-by-default external Roles. It MUST load only their configured enabled set before metadata and layout restoration, then mount the shared `WorkspaceShell`.            |
| LN-WEB-005 | LightningFS, demo vault seeding, notebooks, community-plugin activation, and the legacy full-app bootstrap MUST NOT be retained.                                                                                                                                                                                   |
| LN-WEB-006 | Development, preview, and production responses MUST provide cross-origin isolation required by the database and embedding workers. Production assets MUST include required WASM files.                                                                                                                             |
| LN-WEB-007 | One tab MUST own each vault database while secondary tabs delegate through typed RPC and expose a `DB Proxy` status marker.                                                                                                                                                                                        |
| LN-WEB-008 | Owner shutdown or stale heartbeats MUST allow one proxy to promote without losing committed metadata or search state. Session disposal MUST release workers, locks, channels, and pending requests.                                                                                                                |
| LN-WEB-009 | The PWA service worker MUST retain prompt-based updates and verified plugin-asset caching without precaching downloaded embedding models.                                                                                                                                                                          |
| LN-WEB-010 | Root scripts MUST expose web development, Turbo-filtered build, preview, and two-tab acceptance lanes through the workspace package. Web end-to-end preflight MUST reuse the same cached root build.                                                                                                               |
| LN-WEB-011 | The web host MUST load Bases after Search and before external Roles, metadata, and layout restoration. Browser acceptance MUST create and reopen a Bases fixture, query rows, edit frontmatter, and preserve the configured view without adding Bases to community-plugin configuration.                           |
| LN-WEB-012 | The web host MUST load AI after Bases and before external Roles, metadata, and layout restoration. Live runtimes MUST be available only when both a runtime URL and token are configured. Otherwise the chat MUST stay usable through Fake or an unavailable state.                                                |
| LN-WEB-014 | The web session MUST register an agent-runtime WebSocket bridge before constructing `AiPlugin` only when URL and token are both set. It MUST NOT overwrite an existing desktop bridge. The bridge MUST expose agent-scoped model discovery, reject pending commands on transport closure, and retain active-session cursors for reconnect rather than terminating them on a transient socket close. |
| LN-WEB-013 | The web renderer MUST load the public Lapis CodeMirror autocomplete stylesheet after Design Core and Lapis theme paint so shared completion extensions render the same production popover chrome as desktop and Storybook.                                                                                         |
| LN-WEB-015 | Each web session MUST own its compatibility App lease. PWA commands and status bindings MUST use the explicit session App, unbind before replacement, and MUST NOT poll or execute through `globalThis.app`.                                                                                                       |
| LN-WEB-016 | The browser vault adapter MUST serialize append operations and append through a kept-data writable at the current file size rather than reading the complete transcript into renderer memory. |
| LN-WEB-017 | The standalone bridge MUST reconnect and resubscribe active sessions from their last accepted sequence before admitting live frames. Duplicate or older frames MUST be discarded. A replay gap or unknown host session MUST become a retryable interrupted turn and MUST NOT automatically resend input that may have caused side effects. |
| LN-WEB-018 | The web launcher “View all” action MUST open an upper-viewport searchable palette of recent vaults rather than a drawer or bottom sheet. It MUST retain Design Core’s shared full-viewport modal scrim. |
| LN-WEB-019 | The web launcher “View all” palette MUST compose `@lapismd/design-core/shadcn/command-view` for its inner search and result list. |
| LN-WEB-020 | An authenticated protocol-v3 web bridge MUST proxy application-tool calls, responses, and cancellation through its existing agent-runtime connection while the browser App executes the tool. A real stdio-shim round trip MUST use that same connection, and disconnect MUST revoke bridge authorization and cancel pending calls without retaining note contents in host replay. |
| LN-WEB-021 | Web session boot MUST render Design Core `WorkspaceStartup` with live vault, configuration, plugin, and layout tasks. Failure MUST stay on that surface with Retry that tears down and reboots. It MUST NOT keep the Opening vault stub or return a mid-boot failure to the launcher. While the plugins task is active, the live status MUST show the current plugin name. |
| LN-WEB-022 | A web vault without `.obsidian/workspace.json` MUST use the same default sidebar seed as desktop: File Explorer then Search on the left, and Outline, File Properties, then Tags on the right when those views are registered. |
| LN-WEB-023 | After layout restoration, web boot MUST start metadata cache load. It MUST NOT start that load before `loadLayout` returns or wait for it before mounting `WorkspaceShell`. Metadata-backed surfaces MUST refresh on `loaded`. |

### LN-WEB-021 acceptance details

Web session boot verifies the shared startup surface:

- The four task ids MUST be `vault`, `configuration`, `plugins`, and `layout`.
- `WorkspaceShell` MUST stay unmounted until that sequence completes.
- Retry MUST reuse the mounted session and MUST NOT open the branded launcher.
- While plugins are active, the status message MUST name the current plugin.

### LN-WEB-023 acceptance details

Web boot restores the layout before opening the metadata store:

- `metadataCache.load` MUST start after `loadLayout` returns.
- `WorkspaceShell` mount MUST NOT await that promise.
- Tags, Outline, Search, Bases, and File Properties MUST refresh when `loaded` fires.

## Implemented host boundary

The web session imports Bases and its exported stylesheet from the package and
registers it after Search and before external Roles. The host audit fixes the
load, metadata, and layout ordering while the production PWA build verifies the
workspace dependency closure; browser behavior remains separate acceptance.
The web session binds PWA commands and status to its explicit App and provides
that App to the shell. Its compatibility lease is installed before plugin load
and released after the owned session closes, so vault replacement cannot leave
PWA actions attached to the previous compatibility alias.

When live AI attach is configured, the shared bridge supplies provider model
catalogs and runtime events over the authenticated host connection. Closing
that connection rejects pending commands and terminates active chats with a
visible error. The standalone host uses the maintained ACP adapter supplied by
its acpx release and tolerates sessions without a separate thinking option; the
host also treats unsupported backend closure of disposable model sessions as
successful local cleanup. The web host does not maintain a second provider
protocol.
For application tools, that same authenticated connection carries generic
bridge open, result, close, call, and cancellation frames. The executor keeps
the loopback broker and stdio shim local, revokes authorization on disconnect,
and requires a fresh bridge before a resumed native binding can expose tools.
Disconnect handling emits cancellation for every active bridged call before
clearing connection state. ACP sessions also receive a visible closed-runtime
event so controller retry creates a new binding instead of reusing stale bridge
authorization.

`@lapis-notes/web` owns the branded browser launcher and restores only OPFS or
File System Access profiles. “View all” opens an upper-viewport Dialog whose
inner search list is Command View. It constructs the API session, loads Markdown,
Markdownlint, File Explorer, Search, and Roles, reports that sequence through
Design Core `WorkspaceStartup`, and then mounts the same `WorkspaceShell` used
by the desktop and governed Storybook hosts. The package
does not seed a demo vault or activate community plugins.

The production build emits the legacy manifest identity, generated icon set,
prompt-based Workbox lifecycle, `web+lapis` handler, window-controls overlay
metadata, cross-origin isolation headers, Turso WASM, and local embedding
runtime. Verified plugin assets enter a cache-only service-worker route only
after the public API asset boundary confirms their registered version, path,
size, and SHA-256 digest.

Web Locks elect one Turso owner for each vault. Secondary sessions call the
same `AppDatabase` contract through a bounded, fixed BroadcastChannel method
catalogue and display `DB Proxy`; their descriptor is obtained from the real
owner rather than inferred. Stale-heartbeat takeover reopens Turso through the
same provider and changes the surviving marker to `DB Owner`. Closing or
switching sessions drains metadata and workspace persistence before releasing
database requests, embedding workers, channels, and locks. Transformers.js is
constructed lazily inside the owner tab's dedicated embedding worker, while
the Electron owner maps the same portable WASM setting to its CPU execution
provider in main.
