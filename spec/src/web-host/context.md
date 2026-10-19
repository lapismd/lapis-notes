# Web Host / Context

Web presentation resolves Design Core through the repository's portable npm
range and committed lockfile, matching the desktop application boundary.

Web session construction registers the shared daily-document provider before
configuration load and disposes it with the application. Browser storage does
not alter the provider's canonical front-matter-first lookup semantics.

The web host is a browser/PWA consumer ported from
`/Users/stevejuma/code/lapis-notes/packages/web` at commit `8ec68e18`.

The server build is selected by Vite's compile-time `server` mode and emits to
`dist-server`. That profile omits the PWA plugin, manifest generation, offline
cache, search-embedding worker registration, window-controls integration, and
service-worker registration. The ordinary build retains each of those paths.
Before mounting, the profile sets the root document runtime to `node-server`
without setting PWA-host attributes, making runtime ownership observable and
unambiguous.

Server boot queries public system information first, blocks mismatched protocol
majors, restores an authenticated cookie session when possible, and otherwise
shows a branded, theme-backed login. The managed chooser follows the existing
Web and desktop launcher composition and supports create, File System Access
folder import, ZIP import, open, rename, export, archive, restore, and logout.
Folder import creates the ZIP in the browser and reuses the authenticated,
bounded server import route. Opening constructs the explicit server vault,
event, plugin-asset, and database adapters before mounting the existing
workspace shell; AI and terminal host attachment remain disabled in this mode.

## Implemented host boundary

The web session imports Bases and its exported stylesheet from the package and
registers it after Search and before external Roles. The host audit fixes the
load, metadata, and layout ordering while the production PWA build verifies the
workspace dependency closure; browser behavior remains separate acceptance.
The web session binds PWA commands and status to its explicit App and provides
that App to the shell. Its compatibility lease is installed before plugin load
and released after the owned session closes, so vault replacement cannot leave
PWA actions attached to the previous compatibility alias.
Import and export command failures use that same explicit App notification
manager. They do not construct compatibility Notices, so typed web builds and
multi-session ownership keep the reporting attached to the active session.

- When live AI attach is configured, the shared bridge supplies provider model catalogs and runtime events over the authenticated host connection.

- Closing that connection rejects pending commands and terminates active chats with a visible error.

- The public `@lapismd/ai-host` process host uses the maintained ACP adapter supplied by its acpx release and tolerates sessions without a separate thinking option; the host also treats unsupported backend closure of disposable model sessions as successful local cleanup.

- The web host does not maintain a second provider protocol.

- For application tools, that same authenticated connection carries generic bridge open, result, close, call, and cancellation frames.

- The executor keeps the loopback broker and stdio shim local, revokes authorization on disconnect, and requires a fresh bridge before a resumed native binding can expose tools.

- Disconnect handling emits cancellation for every active bridged call before clearing connection state.

- ACP sessions also receive a visible closed-runtime event so controller retry creates a new binding instead of reusing stale bridge authorization.

- `@lapis-notes/web` owns the branded browser launcher and restores only OPFS or File System Access profiles.

- While a saved current profile is resolving, the host paints Design Core `WorkspaceStartup` instead of the chooser.

- Manage Vaults overlays that chooser over a retained session; Close returns without disposing.

- OPFS create collects the name in a compact New Browser Vault dialog, and Import Vault copies a picked local folder into a new OPFS profile before the session mounts.

- Copy progress names the current file and `N of M` counts on the notifications status item in-session, or on the startup task detail before App exists (LN-WEB-042, LN-WEB-043).

- An open OPFS session exposes Browser vault Settings actions and palette commands for import into or export from that vault.

- Recent rows use a kebab including OPFS Delete. “View all” opens an upper-viewport Dialog whose inner search list is Command View.

- It constructs the API session, loads Markdown, Markdownlint, File Explorer, Search, and Roles, reports that sequence through Design Core `WorkspaceStartup`, and then mounts the same `WorkspaceShell` used by the desktop and governed Storybook hosts.

- The package does not seed a demo vault or activate community plugins.

The production build emits the legacy manifest identity, generated icon set,
prompt-based Workbox lifecycle, `web+lapis` handler, window-controls overlay
metadata, cross-origin isolation headers, Turso WASM, and local embedding
runtime. Harper and other `*.wasm` responses use `application/wasm` so
`WorkerLinter` can instantiate (LN-WEB-030). Verified plugin assets enter a cache-only service-worker route only
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
the Deno desktop owner uses the same portable WASM setting in its renderer
provider in main.

For LN-WEB-004, App Profile acceptance compiles the installed public Svelte dependency graph through Vite. Temporary packed validation uses matching framework peers so external plugin constructors retain one API class identity; registry manifests and lockfiles remain unchanged.

For LN-PLUG-095, Web accepts explicit local catalog configuration in development
or the dedicated acceptance build. LN-WEB-011 installs the actual signed Bases
release before exercising its OPFS query, edit, and reload scenario. LN-WEB-030
acceptance installs the signed Spellcheck release before opening a misspelled
note, then verifies the same-origin WASM response and Harper Problems row. Both
scenarios first verify the four-plugin static profile and exclude Community.

LN-PKG-146 extends Web host entries to the public API import surface used by
all active bundles, including Bases editor helpers and Markdown embedding.
Development and static acceptance use the same generated module sources.

Plugin asset CacheOnly matching must survive Workbox callback serialization
without any captured build constants (LN-WEB-005, LN-WEB-006). Browser acceptance
fetches the installed signed module through the controlled service worker.

The signed plugin editor runtime also shares the approved CodeMirror and Lezer
core modules through LN-PKG-146 host entries. Language grammars remain local to
the plugin while editor classes, facets, and parser node properties resolve
through the same graph as the API editor.

LN-PKG-149 binds compiled Svelte archives to the exact renderer ABI supplied by
the host. Generated versioned entries and browser import maps share that module
graph without exposing original private host specifiers. API and host Svelte
peers retain the exact qualified compiler version; dependency drift fails the
host-catalogue build before archives can be installed.

Verified installed-plugin URLs must wait for a controlling service worker after
mirroring their hash-checked assets into Cache Storage. A bounded failure reports
asset transport unavailability; controller-change listeners and timeout handles
are removed on either completion or failure. First-load installation may not
return a route that the current page cannot yet fetch.

The static Web profile uses API-owned schema and build tooling under LN-PKG-150 and LN-PKG-151. Concrete Community NIP-29 startup composition remains deferred.

The web host registers the default Plugins browser before loading workspace layout and disposes it during session teardown (LN-PLUG-098–103). Built browser acceptance uses the controlling service worker for verified installed plugin assets and the existing host-configured registry.
