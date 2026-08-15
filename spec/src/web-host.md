# Web Host

The web host is a browser/PWA consumer ported from
`/Users/stevejuma/code/lapis-notes/packages/web` at commit `8ec68e18`.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-WEB-001 | Private `@lapis-notes/web` version `2026.6.3` MUST retain the legacy PWA identity, manifest, icons, update prompt, window-controls overlay, and `web+lapis` protocol handler. |
| LN-WEB-002 | The web host MUST own its launcher, profile selection, session lifecycle, PWA registration, and plugin boot while `@lapis-notes/workspace` remains shell-only. |
| LN-WEB-003 | The launcher MUST create OPFS vaults, open File System Access folders, restore valid saved profiles, and remain recoverable after cancellation or denied permission. |
| LN-WEB-004 | The web session MUST register File Explorer, Markdown, Markdown Lint, Search, Bases, and AI as optional bundled plugins plus enabled-by-default external Roles. It MUST load only their configured enabled set before metadata and layout restoration, then mount the shared `WorkspaceShell`. |
| LN-WEB-005 | LightningFS, demo vault seeding, notebooks, community-plugin activation, and the legacy full-app bootstrap MUST NOT be retained. |
| LN-WEB-006 | Development, preview, and production responses MUST provide cross-origin isolation required by the database and embedding workers. Production assets MUST include required WASM files. |
| LN-WEB-007 | One tab MUST own each vault database while secondary tabs delegate through typed RPC and expose a `DB Proxy` status marker. |
| LN-WEB-008 | Owner shutdown or stale heartbeats MUST allow one proxy to promote without losing committed metadata or search state. Session disposal MUST release workers, locks, channels, and pending requests. |
| LN-WEB-009 | The PWA service worker MUST retain prompt-based updates and verified plugin-asset caching without precaching downloaded embedding models. |
| LN-WEB-010 | Root scripts MUST expose web development, build, preview, and two-tab acceptance lanes through the workspace package. |
| LN-WEB-011 | The web host MUST load Bases after Search and before external Roles, metadata, and layout restoration. Browser acceptance MUST create and reopen a Bases fixture, query rows, edit frontmatter, and preserve the configured view without adding Bases to community-plugin configuration. |
| LN-WEB-012 | The web host MUST load AI after Bases and before external Roles, metadata, and layout restoration. Live runtimes MUST be available only when both a runtime URL and token are configured. Otherwise the chat MUST stay usable through Fake or an unavailable state. |
| LN-WEB-014 | The web session MUST register an agent-runtime WebSocket bridge before constructing `AiPlugin` only when URL and token are both set. It MUST NOT overwrite an existing desktop bridge. |
| LN-WEB-013 | The web renderer MUST load the public Lapis CodeMirror autocomplete stylesheet after Design Core and Lapis theme paint so shared completion extensions render the same production popover chrome as desktop and Storybook. |
| LN-WEB-015 | Each web session MUST own its compatibility App lease. PWA commands and status bindings MUST use the explicit session App, unbind before replacement, and MUST NOT poll or execute through `globalThis.app`. |

## Implemented host boundary

The web session imports Bases and its exported stylesheet from the package and
registers it after Search and before external Roles. The host audit fixes the
load, metadata, and layout ordering while the production PWA build verifies the
workspace dependency closure; browser behavior remains separate acceptance.
The web session binds PWA commands and status to its explicit App and provides
that App to the shell. Its compatibility lease is installed before plugin load
and released after the owned session closes, so vault replacement cannot leave
PWA actions attached to the previous compatibility alias.

`@lapis-notes/web` owns the branded browser launcher and restores only OPFS or
File System Access profiles. It constructs the API session, loads Markdown,
Markdownlint, File Explorer, Search, and Roles, and then mounts the same
`WorkspaceShell` used by the desktop and governed Storybook hosts. The package
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
