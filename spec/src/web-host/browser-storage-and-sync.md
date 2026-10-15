# Web Host / Browser storage and sync

## LN-WEB-003 — Launcher: create OPFS vaults, open File System Access

<a id="ln-web-003"></a>

**Requirement.** The launcher MUST create OPFS vaults, open File System Access folders, restore valid saved profiles, and remain recoverable after cancellation or denied permission.

## LN-WEB-004 — Web session: register the shared application-owned notesPluginProfile containing exactly

<a id="ln-web-004"></a>

**Requirement.** The web session MUST register the shared application-owned `notesPluginProfile` containing exactly Source Editor, Markdown, File Explorer, and Search in that order. All four MUST default enabled and remain user-disableable. The host MUST then load configured vault-installed plugins before metadata and layout restoration and mount the shared `WorkspaceShell`. Local Web development MUST prepare verified packed plugin packages before launch.

The [approved registry consumer snapshot](../packages/releases-and-exports.md#approved-registry-consumer-snapshot--2026-10-14)
updates the shared profile's published packages. Web acceptance builds their
public export graph and retains the same API singleton, profile ordering, and
configured-plugin restoration; a signed fixture does not replace npm resolution.

## LN-WEB-005 — Retirement of legacy web fixtures

<a id="ln-web-005"></a>

**Requirement.** LightningFS, demo vault seeding, notebooks, and the legacy full-app bootstrap MUST NOT be retained. Registry and manually installed plugins MUST use the verified configured-plugin loader rather than a host-owned plugin inventory.

## LN-WEB-006 — Development, preview, and production responses: provide cross-origin isolation required by the database

<a id="ln-web-006"></a>

**Requirement.** Development, preview, and production responses MUST provide cross-origin isolation required by the database and embedding workers. Production assets MUST include required WASM files.

## LN-WEB-037 — Terminal server Settings: tell the user to start lapis-terminal-host serve

<a id="ln-web-037"></a>

**Requirement.** Terminal server Settings MUST tell the user to start `lapis-terminal-host serve --workspace` on the vault, or a parent of `terminal.cwd`.

## LN-WEB-007 — One tab: own each vault database while secondary tabs

<a id="ln-web-007"></a>

**Requirement.** One tab MUST own each vault database while secondary tabs delegate through typed RPC and expose a `DB Proxy` status marker.

## LN-WEB-016 — Browser vault adapter: serialize append operations and append

<a id="ln-web-016"></a>

**Requirement.** The browser vault adapter MUST serialize append operations and append through a kept-data writable at the current file size rather than reading the complete transcript into renderer memory.

## LN-WEB-018 — Web launcher “View all” action: open an upper-viewport searchable palette of recent

<a id="ln-web-018"></a>

**Requirement.** The web launcher “View all” action MUST open an upper-viewport searchable palette of recent vaults rather than a drawer or bottom sheet. It MUST retain Design Core’s shared full-viewport modal scrim.

## LN-WEB-021 — Web session boot: render Design Core WorkspaceStartup with live vault

<a id="ln-web-021"></a>

**Requirement.** Web session boot MUST render Design Core `WorkspaceStartup` with live vault, configuration, plugin, and layout tasks. Failure MUST stay on that surface with Retry that tears down and reboots. It MUST NOT keep the Opening vault stub or return a mid-boot failure to the launcher. While the plugins task is active, the live status MUST show the current plugin name.

### Acceptance details

Web session boot verifies the shared startup surface:

- The four task ids MUST be `vault`, `configuration`, `plugins`, and `layout`.
- `WorkspaceShell` MUST stay unmounted until that sequence completes.
- Retry MUST reuse the mounted session and MUST NOT open the branded launcher.
- While plugins are active, the status message MUST name the current plugin.

## LN-WEB-022 — Default sidebar seeding

<a id="ln-web-022"></a>

**Requirement.** A web vault without `.lapis/workspace.json` MUST use the same default sidebar seed as desktop: File Explorer, Search, then Bookmarks on the left, and Outline, File Properties, then Tags on the right when those views are registered.

## LN-WEB-027 — Creating an OPFS vault: collect the name in a compact dialog

<a id="ln-web-027"></a>

**Requirement.** Creating an OPFS vault MUST collect the name in a compact dialog titled New Browser Vault. The name field MUST start empty. Create vault MUST stay disabled until the trimmed name is non-empty.

## LN-WEB-028 — Web recent rows: use a kebab trigger labeled Open actions

<a id="ln-web-028"></a>

**Requirement.** Web recent rows MUST use a kebab trigger labeled Open actions for the vault name. The menu MUST offer Copy ID, Rename, and Remove from list. Delete MUST appear only for OPFS vaults.

## LN-WEB-029 — Manage Vaults overlay: keep the ready session mounted and hidden

<a id="ln-web-029"></a>

**Requirement.** A Manage Vaults overlay MUST keep the ready session mounted and hidden without clearing the current profile. Close MUST sit immediately right of Settings, use Return to previous vault, and return without `WorkspaceStartup`. First launch MUST omit close.

### Acceptance details

Web Manage Vaults overlay verifies:

- The live session MUST stay mounted and hidden while the chooser is open.
- Close MUST sit immediately after Settings and return to that session without a second startup.
- Opening or creating a different vault MUST persist, dispose, then replace the session.
- First launch MUST omit the close control.

## LN-WEB-038 — OPFS web session: register a Browser vault Settings section

<a id="ln-web-038"></a>

**Requirement.** An OPFS web session MUST register a Browser vault Settings section with Import local folder and Export to local folder action fields, plus palette commands `app:import-local-vault` and `app:export-current-vault`. Those commands MUST hide through `checkCallback` when the adapter is not OPFS. File System Access sessions MUST NOT show the section or commands.

## LN-WEB-039 — Folder import during a session

<a id="ln-web-039"></a>

**Requirement.** In-session import MUST pick a folder, copy it into the current OPFS vault with overwrite, report determinate progress, reload the vault, and start metadata rebuild without blocking. It MUST then offer a confirm to reload the page so imported `.lapis` settings apply. Picker cancel MUST be silent. Notifications MUST use the session App and MUST NOT mention community plugins.

## LN-WEB-041 — Launcher: offer Import Vault beside Create New Vault

<a id="ln-web-041"></a>

**Requirement.** The launcher MUST offer Import Vault beside Create New Vault and Open Folder. It MUST pick a folder, collect a name in Import Browser Vault, create an OPFS profile, copy the folder, then open that session. Name MUST start as the folder name, and Import vault MUST stay disabled until the trimmed name is non-empty.

### Acceptance details

Launcher Import Vault verifies a copy into a new private OPFS vault:

- Import Vault MUST NOT replace Open Folder; the latter still mounts the picked directory as `file-system-access`.
- Copy MUST finish before `WorkspaceShell` mounts so the first session sees imported files and `.lapis` settings.
- Host boot during copy MUST stay on Design Core `WorkspaceStartup` or the existing opening gate, not the branded landing copy.
- Picker or name-dialog cancel MUST leave the chooser recoverable without a new profile.
- A failed copy after create MUST delete that new OPFS vault and stay on the chooser with an error.

## LN-WEB-043 — Launcher Import Vault: update the import WorkspaceStartup task detail

<a id="ln-web-043"></a>

**Requirement.** Launcher Import Vault MUST update the `import` WorkspaceStartup task `detail` with the current path and `N of M` counts while copying. It MUST NOT use App notifications before the session exists.

### Acceptance details

Launcher copy progress verifies the startup surface:

- The host MUST pass copy `onProgress` into `importDirectoryHandleToNewOpfsVault`.
- The active `import` task `detail` MUST use the same `N of M` path string as in-session import.
- The host MUST NOT construct App notifications before `WorkspaceShell` mounts.

## LN-WEB-049 — Web package: provide a compile-time deno-server mode that uses

<a id="ln-web-049"></a>

**Requirement.** The Web package MUST provide a compile-time `deno-server` mode that uses explicit remote vault and AppDatabase adapters while retaining the existing PWA build unchanged. It MUST NOT emulate or populate `NativeDesktopBridge`.

Server-mode browser acceptance verifies editing, shared events and persistence
after clean container shutdown and recreation. Its test-owned network namespace
remains alive across that restart under
[LN-SRV-013](../server-deno-host/core-contract.md#ln-srv-013), while the serving
process and startup module graph are recreated normally.
The server case's dedicated browser worker starts after this network is ready,
isolating initial navigation from preceding PWA acceptance cases.
Delayed Chromium network notifications may still abort initial module downloads.
That initial navigation retries once only for observed same-origin document or
script `ERR_NETWORK_CHANGED` failures and retains its original readiness
assertions. Retry evidence is written to disk and attached by path, with passing
test output retained by both Web Playwright configurations; later application, sharing
and restart steps are not replayed.

## LN-WEB-050 — Deno-server Web build: authenticate before vault selection, use only server-managed

<a id="ln-web-050"></a>

**Requirement.** The `deno-server` Web build MUST authenticate before vault selection, use only server-managed vault profiles, require the matching protocol major, and remain online-only without registering the PWA service worker.

## LN-WEB-052 — Server managed-vault chooser: use the same branded header, Design Core

<a id="ln-web-052"></a>

**Requirement.** The server managed-vault chooser MUST use the same branded header, Design Core cards, action hierarchy, and compact vault-row pattern as the Web and desktop launchers. Primary action descriptions MUST inherit the action foreground so selected and default-primary states retain contrast.

## LN-WEB-053 — Server managed-vault chooser: support ZIP upload and File System Access

<a id="ln-web-053"></a>

**Requirement.** The server managed-vault chooser MUST support ZIP upload and File System Access directory import. Directory import MUST archive relative files in the browser and use the existing authenticated ZIP boundary; browsers without directory access MUST retain ZIP import.

## LN-WEB-054 — When more than one active server vault: show a View all action that opens

<a id="ln-web-054"></a>

**Requirement.** When more than one active server vault is available, the managed-vault chooser MUST show a `View all` action that opens the shared upper-viewport Design Core Command View, filters by vault name, ID, or role, and opens the selected vault.

## LN-WEB-055 — Opening the managed-vault chooser from a live: keep that workspace session mounted but hidden

<a id="ln-web-055"></a>

**Requirement.** Opening the managed-vault chooser from a live server workspace MUST keep that workspace session mounted but hidden and inert, show a named return control, and restore the same workspace without reopening it. The return control MUST be absent when no previous vault exists.

## LN-WEB-059 — Browser sync enrollment: persist only a versioned wrapped-key envelope

<a id="ln-web-059"></a>

**Requirement.** Browser sync enrollment MUST persist only a versioned wrapped-key envelope and non-secret KDF or credential metadata. WebAuthn PRF MUST be feature detected; an offline passphrase fallback MUST use a versioned memory-hard KDF, and lock MUST remove usable in-memory key state.

## LN-WEB-060 — Untrusted browser plugin that receives enforced capabilities: execute in an opaque sandbox with restrictive

<a id="ln-web-060"></a>

**Requirement.** An untrusted browser plugin that receives enforced capabilities MUST execute in an opaque sandbox with restrictive CSP, no host-origin storage or OPFS handles, and no direct network authority. Its MessagePort protocol MUST validate schemas and bind identity outside plugin-controlled payloads.

## LN-WEB-061 — PWA host: request persistent browser storage and report

<a id="ln-web-061"></a>

**Requirement.** The PWA host SHOULD request persistent browser storage and report the result without treating it as backup. Eviction of generated metadata MUST cause a database-generation reset and full reconciliation; eviction of a wrapped key envelope MUST require recovery or pairing.

## LN-WEB-062 — Stable vault identity during sync unlock

<a id="ln-web-062"></a>

**Requirement.** Browser sync unlock MUST NOT create a new vault identity. Explicit new-vault, paired-device, and recovery enrollment MUST use the selected WebAuthn PRF or Argon2id wrapping flow, while recovery bundle passphrases remain host-owned interaction and MUST NOT enter plugin callbacks.

## LN-WEB-065 — Verified plugin assets served from Cache Storage: carry Cross-Origin-Embedder-Policy: require-corp and Cross-Origin-Resource-Policy: same-origin. Installed

<a id="ln-web-065"></a>

**Requirement.** Verified plugin assets served from Cache Storage MUST carry `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Resource-Policy: same-origin`. Installed module workers MUST start under the host isolation policy and retain verified relative worker chunks.
