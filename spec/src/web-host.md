# Web Host

The web host is a browser/PWA consumer ported from
`/Users/stevejuma/code/lapis-notes/packages/web` at commit `8ec68e18`.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-WEB-001 | Private `@lapis-notes/web` version `2026.6.3` MUST retain the legacy PWA identity, manifest, icons, update prompt, window-controls overlay, and `web+lapis` protocol handler. |
| LN-WEB-002 | The web host MUST own its launcher, profile selection, session lifecycle, PWA registration, and plugin boot while `@lapis-notes/workspace` remains shell-only. |
| LN-WEB-003 | The launcher MUST create OPFS vaults, open File System Access folders, restore valid saved profiles, and remain recoverable after cancellation or denied permission. |
| LN-WEB-004 | The web session MUST load File Explorer, Markdown, Markdownlint, and Search before metadata and layout restoration, then mount the shared `WorkspaceShell`. |
| LN-WEB-005 | LightningFS, demo vault seeding, notebooks, community-plugin activation, and the legacy full-app bootstrap MUST NOT be retained. |
| LN-WEB-006 | Development, preview, and production responses MUST provide cross-origin isolation required by the database and embedding workers. Production assets MUST include required WASM files. |
| LN-WEB-007 | One tab MUST own each vault database while secondary tabs delegate through typed RPC and expose a `DB Proxy` status marker. |
| LN-WEB-008 | Owner shutdown or stale heartbeats MUST allow one proxy to promote without losing committed metadata or search state. Session disposal MUST release workers, locks, channels, and pending requests. |
| LN-WEB-009 | The PWA service worker MUST retain prompt-based updates and verified plugin-asset caching without precaching downloaded embedding models. |
| LN-WEB-010 | Root scripts MUST expose web development, build, preview, and two-tab acceptance lanes through the workspace package. |
