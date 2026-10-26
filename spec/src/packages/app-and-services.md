# Packages / App and services

The private application profile owns the native-turn observer and optional AI
plugin under LN-CORE-004/006/007/008. It uses the existing public Agent screens
and built public exports. Temporary verified local archives admit unpublished
Agent UI during migration; tracked dependency declarations keep normal ranges
and publication remains separate. Its built native-chat entry is shared by
Desktop and Rust-hosted Web, without another transcript writer or engine.
The profile also owns retained workspace routing: History stays visible while
its rows open exact main-area conversations. Native metadata is a read-only
projection; draft creation and view selection never submit prompts.

The private Rust-hosted chooser adapter consumes generated native protocol types
and the existing public App/Vault interfaces. Managed-vault mutation authority
and catalogue persistence stay in the Rust host; no public npm export, browser
path selector or alternate file writer is introduced.

The private `lapis-notes-native` executable and Node supervisor implement
LN-SRV-021–023 without adding public npm exports or an App singleton. The host
supplies trusted caller scopes; history remains independent of AI and indexes.
Public package ranges and the existing vault/AppDatabase APIs are unchanged.

The retained public SearchManager is the API envelope oracle for the staged
[native Markdown Search source](../architecture/rust-indexing-lifetime.md).
Qualification MUST import the public Search package and transform its CSS
without source aliases. Native metadata and projection cache identities retain
their explicitly documented parser boundary; no AppDatabase interface changes.

LN-SRCH-051 saved-version content identities and checkpoint references are additive presentation types. They preserve provider-owned navigation and introduce no database, Vault or repository authority.

The API exports the result-provider types and registry under LN-SRCH-051. Each App owns its registry; this additive service does not change LN-PKG-001 or existing AppDatabase and Vault interfaces.

The API-owned SyncHostService queues observed file changes behind initial
identity reconciliation (LN-DB-047), retaining durable sequence checks while
preventing its own startup and event writers from competing.

The Design Core dependency refresh consumes released `0.4.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

Sync security may use a host-owned store independent of the application index
(LN-ARCH-114). The native repository retains wrapped envelopes in a dedicated
versioned database with atomic conditional metadata writes (LN-ARCH-115).
`SyncHostServiceOptions.securityProvider` selects endpoint custody per plugin;
`SyncHostSecurityProvider` creates runtime-scoped capabilities and revokes them.
The public host controller's `dispose()` drains this custody after invalidation
(LN-ARCH-117/LN-ARCH-118).
Desktop composes this provider for `sync` with native profile admission, JSON
security RPC and dedicated wrapped-key storage (LN-DENO-079 through LN-DENO-081).

## LN-PKG-001 — @lapis-notes/api: remain the shared runtime kernel: app container

<a id="ln-pkg-001"></a>

**Requirement.** `@lapis-notes/api` MUST remain the shared runtime kernel: app container, vault/storage contracts, workspace model, plugins, commands, settings, metadata, and editor abstractions.

## LN-PKG-007 — @lapis-notes/workspace: expose the design-core shell around an application-supplied

<a id="ln-pkg-007"></a>

**Requirement.** `@lapis-notes/workspace` MUST expose the design-core shell around an application-supplied `App` without providing a production in-memory backend or invoking the Lapis plugin loader. It MAY map flat app configuration into generic Design Core shell presentation inputs.

## LN-PKG-008 — @lapis-notes/api: configure the owned design-core controller with overridable

<a id="ln-pkg-008"></a>

**Requirement.** `@lapis-notes/api` MUST configure the owned design-core controller with overridable plain Lapis application metadata and the notifications presentation as the minimal required static shell plugin. F-Mode MAY be an additional optional static plugin. This MUST remain separate from api plugin loading and distribution. AppShell configuration, including scrollbar visibility, MUST use the API configuration bridge, while plugin enablement persistence MUST resolve the App vault when load and save run.

## LN-PKG-017 — @lapis-notes/markdown: publicly export app-only Svelte components for All

<a id="ln-pkg-017"></a>

**Requirement.** `@lapis-notes/markdown` MUST publicly export app-only Svelte components for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags as documented by their owning panel pages. The public Outline and Tags surfaces MUST preserve their governed tree geometry without requiring consumer styling, and `@lapis-notes/workspace` MUST remain shell-only.

## LN-PKG-045 — @lapis-notes/api: export provider-neutral app-database descriptors, capabilities, factories,

<a id="ln-pkg-045"></a>

**Requirement.** `@lapis-notes/api` MUST export provider-neutral app-database descriptors, capabilities, factories, and session integration while retaining explicit database injection for tests and Storybook.

## LN-PKG-047 — Production app-database persistence: use pinned Turso native or WASM packages

<a id="ln-pkg-047"></a>

**Requirement.** Production app-database persistence MUST use pinned Turso native or WASM packages. The WASM importer MUST use a host-bundler-compatible package entry. SQLite, sqlite-vec, and IndexedDB app-database implementations MUST NOT remain as importers or fallbacks.

## LN-PKG-057 — @lapis-notes/api: expose reactive status-item changes and project visible

<a id="ln-pkg-057"></a>

**Requirement.** `@lapis-notes/api` MUST expose reactive status-item changes and project visible left, center and right items plus compatibility ribbon actions into the active public workspace shell, preserving custom mount lifecycle.

## LN-PKG-061 — @lapis-notes/api WorkspaceLeaf.openFile: snapshot history before target-view construction so eager

<a id="ln-pkg-061"></a>

**Requirement.** `@lapis-notes/api` `WorkspaceLeaf.openFile` MUST snapshot history before target-view construction so eager compatibility views cannot replace the initiating state recorded for Back. Restoring a plain `View` MUST remove the shared file-view content root before mounting it.

## LN-PKG-070 — @lapis-notes/api: expose an App context, ownership resolver,

<a id="ln-pkg-070"></a>

**Requirement.** `@lapis-notes/api` MUST expose an App context, ownership resolver, and disposable compatibility lease. Explicit or workspace-owned App references MUST win over the compatibility alias, and releasing an older lease MUST NOT clear a newer host's alias.

## LN-PKG-072 — Configuration writes after initial loading

<a id="ln-pkg-072"></a>

**Requirement.** Configuration schema defaults MUST NOT write `.lapis/app.json` before the initial persisted configuration load completes. Initial loading MUST preserve persisted and unknown keys while adding registered defaults, and later schema registration MUST persist newly introduced defaults through the normal serialized writer.

## LN-PKG-025 — @lapis-notes/markdown: export the real AllProperties Svelte component

<a id="ln-pkg-025"></a>

**Requirement.** `@lapis-notes/markdown` MUST export the real `AllProperties` Svelte component with only `app: App` as its input so Storybook documents the package interface rather than its placement harness.

## LN-PKG-028 — Lapis embed wrappers: bind Mira's portable rendering contract

<a id="ln-pkg-028"></a>

**Requirement.** Lapis embed wrappers MUST bind Mira's portable rendering contract to an explicit `app: App` without copying Mira's renderer or requiring consumer-owned source aliases.

## LN-PKG-030 — Ordinary document-link previews: remain owned by Mira's built package

<a id="ln-pkg-030"></a>

**Requirement.** Ordinary document-link previews MUST remain owned by Mira's built package and receive only Lapis's `MiraFileAdapter`. One App MUST reuse one adapter instance. The Markdown package MUST NOT add a consumer portal or clipping workaround.

## LN-PKG-032 — @lapis-notes/api: own the ordered adapter from compatibility ItemView.actions

<a id="ln-pkg-032"></a>

**Requirement.** `@lapis-notes/api` MUST own the ordered adapter from compatibility `ItemView.actions` and `View.onPaneMenu` contributions to design-core workspace chrome. `@lapis-notes/workspace` remains a rendering host and MUST NOT add plugin-specific actions.

## LN-PKG-097 — Rebuild Vault Cache command

<a id="ln-pkg-097"></a>

**Requirement.** `App` MUST register palette command `app:rebuild-vault-cache`. That command MUST call `metadataCache.rebuild()`.

## LN-PKG-098 — Rebuild Generated State command

<a id="ln-pkg-098"></a>

**Requirement.** `App` MUST register palette command `app:rebuild-generated-state`. That command MUST await `metadataCache.rebuild()`, then execute `search:rebuild-search-index` when that command is registered, otherwise `appDatabase.rebuildSearchIndex()`.

## LN-PKG-132 — Private @lapis-notes/app-profile: own the shared Web and Deno static

<a id="ln-pkg-132"></a>

**Requirement.** Private `@lapis-notes/app-profile` MUST own the shared Web and Deno static plugin profile and app-owned plugin-management registration. Host packages MUST consume that one profile instead of duplicating registration arrays or importing extracted plugins directly.

## LN-PKG-148 — @lapis-notes/api: advertise a transport-neutral nostr-signer native capability but

<a id="ln-pkg-148"></a>

**Requirement.** `@lapis-notes/api` MAY advertise a transport-neutral `nostr-signer` native capability but MUST NOT implement OS credential storage or Nostr cryptography. The private Deno desktop host MUST own its keychain, NIP-46, native signing service, renderer broker, and direct `nostr-tools` runtime dependency.

This native-signer boundary concerns the `nostr-signer` capability. Separately,
the purpose-scoped Sync security contract follows LN-ARCH-092/LN-ARCH-093 and
LN-ARCH-111 through LN-ARCH-113. Trusted hosts use the headless
`@lapis-notes/api/sync-security-host` entrypoint and retain protected storage and
lifecycle ownership. Protocol plugins receive scoped capabilities; explicit
pairing delivery does not open a relay, and installed epoch metadata contains no
key bytes.

## LN-PKG-080 — @lapis-notes/api: own transport-neutral app-tool contracts, lifecycle, and Vault-backed

<a id="ln-pkg-080"></a>

**Requirement.** `@lapis-notes/api` MUST own transport-neutral app-tool contracts, lifecycle, and Vault-backed file-tool wrappers. Search MUST own `notes_search` and Markdown MUST own `notes_list`. AI MUST own snapshots and policy. `@lapismd/ai-host` plus Deno desktop MUST own live MCP transport without becoming durable tool, note-content, or conversation authorities.

Under LN-CORE-003/004/006, an explicitly owned `VaultSession.backgroundIndexing`
port selects the existing native metadata owner. The retained MetadataCache
remains the query/cache/event facade; absence preserves standalone browser
processing. Declaration and passive status controls follow the
[native indexing contract](../architecture/rust-indexing-lifetime.md).

`App.backgroundIndexing` exposes that existing session as a shared declaration
and observation facade. MetadataCache remains its sole passive teardown
boundary; consumers MUST NOT construct a second indexing controller.

The explicit Rust hosted metadata profile supplies that port on its existing
admitted client before App startup (LN-WEB-066). Metadata compatibility reads
retain copied Vault facade values and database/Vault event ordering under
LN-DB-064, without adding renderer parsing or publication.

Native Search App replacement reconciles the current App-owned plugin registry
before metadata startup completes. An omitted or disabled Search declaration
explicitly drains the retained native selection; passive detach keeps it alive.
Enabled Search may declare after metadata-loaded without losing its owner.

LN-WEB-068 verifies this boundary through the retained hosted Search UI. The
admitted native client supplies metadata and Search while the plugin owns its
query and recovered settings. Source qualification, the selected hosted profile
and default cutover remain distinct recorded gates.

## Admitted native Task port

`@lapis-notes/api/native-tasks` exports generated commands, typed retained outcomes and an App-owned observer under [CORE013–015](../architecture/rust-task-host-port.md#ln-core-013). `VaultSession.nativeTasks` takes precedence over the explicit App option. The public host-module registry includes that entry for installed Tasks plugins; final plugin startup awaits declaration reconciliation.
