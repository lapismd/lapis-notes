# Web Host

The web host is a browser/PWA consumer ported from
`/Users/stevejuma/code/lapis-notes/packages/web` at commit `8ec68e18`.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-WEB-001 | Private `@lapis-notes/web` version `2026.6.3` MUST retain the legacy PWA identity, manifest, icons, update prompt, window-controls overlay, and `web+lapis` protocol handler. |
| LN-WEB-002 | The web host MUST own its launcher, profile selection, session lifecycle, PWA registration, and plugin boot while `@lapis-notes/workspace` remains shell-only. |
| LN-WEB-003 | The launcher MUST create OPFS vaults, open File System Access folders, restore valid saved profiles, and remain recoverable after cancellation or denied permission. |
| LN-WEB-004 | The web session MUST load File Explorer, Markdown, Markdownlint, Search, and Roles before metadata and layout restoration, then mount the shared `WorkspaceShell`. |
| LN-WEB-005 | LightningFS, demo vault seeding, notebooks, community-plugin activation, and the legacy full-app bootstrap MUST NOT be retained. |
| LN-WEB-006 | Development, preview, and production responses MUST provide cross-origin isolation required by the database and embedding workers. Production assets MUST include required WASM files. |
| LN-WEB-007 | One tab MUST own each vault database while secondary tabs delegate through typed RPC and expose a `DB Proxy` status marker. |
| LN-WEB-008 | Owner shutdown or stale heartbeats MUST allow one proxy to promote without losing committed metadata or search state. Session disposal MUST release workers, locks, channels, and pending requests. |
| LN-WEB-009 | The PWA service worker MUST retain prompt-based updates and verified plugin-asset caching without precaching downloaded embedding models. |
| LN-WEB-010 | Root scripts MUST expose web development, build, preview, and two-tab acceptance lanes through the workspace package. |

## Implemented host boundary

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
