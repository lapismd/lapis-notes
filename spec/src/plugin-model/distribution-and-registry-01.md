# Plugin Model / Distribution and registry / Part 1

Interaction acceptance waits for media and confirmation dialogs to become
visible before checking their content. DOM discovery alone does not establish
visibility during the existing opening animation; dismissal retains the pointer
and focus-restoration checks.

Web installed-plugin acceptance runs through the Web package's pinned Playwright
SDK CLI. Selecting that runner changes no plugin registration, installation,
signature policy or product assertion.

## LN-PLUG-110 — Signed archive delivery endpoint

<a id="ln-plug-110"></a>

**Requirement.** The verified installer MUST prefer a selected release's signed
`bundle.downloadUrl` when present, resolving it against the catalog detail URL.
Endpoint delivery MUST retain the selected version, declared archive hash and
size, embedded signatures, runtime validation, and normal installation policy.

## LN-PLUG-111 — Archive origin fallback

<a id="ln-plug-111"></a>

**Requirement.** The installer MAY retry the same release's signed `bundle.url` when a signed delivery endpoint cannot transport the archive. Cancellation, an endpoint revocation response, and archive integrity or signature failures MUST NOT trigger origin fallback. Catalogs without a delivery endpoint MUST continue to use their signed archive origin.

## LN-PLUG-002 — Standalone first-party plugins: use repositories named lapis-plugin-\*, version independently,

<a id="ln-plug-002"></a>

**Requirement.** Standalone first-party plugins MUST use repositories named `lapis-plugin-*`, version independently, and report `distribution: "first-party-external"` with official provenance. Tasks, Docs, Terminal, and CV Roles MUST remain standalone rather than moving into `lapis-plugins`.

## LN-PLUG-003 — Statically shipped profile plugins: use the static lifecycle and .lapis/core-plugins.json; vault-installed

<a id="ln-plug-003"></a>

**Requirement.** Statically shipped profile plugins MUST use the static lifecycle and `.lapis/core-plugins.json`; vault-installed registry or manual plugins MUST use the verified community-plugin persistence and loader.

## LN-PLUG-004 — Core plugin registrations and list entries: expose distribution metadata, defaulting omitted registrations

<a id="ln-plug-004"></a>

**Requirement.** Core plugin registrations and list entries MUST expose distribution metadata, defaulting omitted registrations to `bundled`.

## LN-PLUG-008 — Core and Community plugin settings: subscribe to lifecycle changes and failures

<a id="ln-plug-008"></a>

**Requirement.** Core and Community plugin settings MUST subscribe to lifecycle changes and failures through the Design Core managed-plugin source contract while preserving the legacy row order, toggles, Options links, restart actions, trust controls, and diagnostic disclosures.

The Core page and its search entries include registered App Shell sources as
well as Lapis static plugins. Source-qualified keys route lifecycle actions to
the owning manager; App Shell controls retain their guarded persistence and
cannot disappear when the host registers the public plugin Settings pages.

## LN-PLUG-010 — Community installation, registry, signature, update, and enablement: use the verified installed-plugin distribution contract

<a id="ln-plug-010"></a>

**Requirement.** Community installation, registry, signature, update, and enablement MUST use the verified installed-plugin distribution contract and MUST remain separate from the static application profile.

## LN-PLUG-019 — Plugin.registerAgentTool: register a transport-neutral tool under the owning

<a id="ln-plug-019"></a>

**Requirement.** `Plugin.registerAgentTool` MUST register a transport-neutral tool under the owning plugin ID, reject invalid or duplicate active names, and dispose it with the plugin lifecycle. Community renderer registration MUST remain inert for agents until the user enables that tool in AI settings.

## LN-PLUG-027 — App: expose an API-owned daily-document provider registry, resolution

<a id="ln-plug-027"></a>

**Requirement.** `App` MUST expose an API-owned daily-document provider registry, resolution MUST fail closed when no provider or equal-priority providers exist, and provider registration MUST be disposable without granting plugins ownership of host folder, filename, or front-matter policy.

## LN-PLUG-029 — Lapis plugin manifest: declare database metadata access. Community and official

<a id="ln-plug-029"></a>

**Requirement.** A Lapis plugin manifest MAY declare database metadata access. Community and official code plugins without that declaration MUST acquire a synchronous metadata compatibility lease before enable and release it after unload.

## LN-PLUG-039 — Applications: compose statically shipped plugins through a readonly

<a id="ln-plug-039"></a>

**Requirement.** Applications MUST compose statically shipped plugins through a readonly `PluginProfile` and `PluginManager.registerStaticPlugins(profile)`. `StaticPluginRegistration` MUST retain the existing required, default-enablement, distribution, and lifecycle-owned styles fields. Deprecated `CorePluginRegistration` and `registerCorePlugins()` aliases MUST preserve source compatibility without creating a second lifecycle.

## LN-PLUG-040 — Lapis Notes: register app-owned custom settings pages named Plugin

<a id="ln-plug-040"></a>

**Requirement.** Lapis Notes MUST register app-owned custom settings pages named `Plugin registry`, `Core plugins`, and `Community plugins`. Their information architecture, labels, DOM and action order, state transitions, empty/loading/error states, and responsive behavior MUST match the legacy plugin-management family; styling MAY translate only to public `--ui-*` tokens and semantic `data-ui-*` hooks.

## LN-PLUG-041 — Plugin registry Settings: preserve Installed, Browse, Updates and Sources tabs

<a id="ln-plug-041"></a>

**Requirement.** Plugin registry Settings MUST preserve Installed, Browse, Updates and Sources tabs; refresh, search, row actions and a manual `.lapis-plugin` picker with validation and progress. Browse and Updates details MUST open in the shared Plugins workspace view.

## LN-PLUG-042 — Installed plugin rows: show provenance, version, size, enabled, revoked,

<a id="ln-plug-042"></a>

**Requirement.** Installed plugin rows MUST show provenance, version, size, enabled, revoked, and restart-required state and preserve update, disable, and uninstall-confirmation actions. A statically included profile plugin MUST appear already installed in Browse and MUST have its Install action disabled without requiring a vault install record.

## LN-PLUG-043 — Both hosts: load configured installed plugins after static profile

<a id="ln-plug-043"></a>

**Requirement.** Both hosts MUST load configured installed plugins after static profile registration so registry and manual installs survive restart. Desktop Safe Mode, Workspace Trust, archive signature and hash verification, revocation handling, and duplicate-ID protection MUST remain enforced.

## LN-PLUG-046 — Lapis Notes Storybook: cover every plugin-management tab plus empty, installed

<a id="ln-plug-046"></a>

**Requirement.** Lapis Notes Storybook MUST cover every plugin-management tab plus empty, installed, manual, update, revoked, failure, progress, details, README, trust, toggle, and confirmation states with interaction and accessibility checks. Fixed-viewport legacy/current review MUST remain visual-pending until explicit parity approval. Visual comparison and missing baselines MUST NOT gate deployment, publication, or registry cutover.

## LN-PLUG-047 — Community plugins settings: render Workspace Trust as one compact state-aware

<a id="ln-plug-047"></a>

**Requirement.** Community plugins settings MUST render Workspace Trust as one compact state-aware card. Trusted state MUST show a shield/check icon, `Workspace trusted`, a `Trusted` badge, concise enabled-capabilities copy, and only a `Revoke` action. Untrusted state MUST use warning treatment with a shield/warning icon, `Workspace not trusted`, a `Not trusted` badge, disabled-capabilities copy, and only a prominent `Trust workspace` action. Actions MUST retain the existing trust-service behavior.

## LN-PLUG-048 — When no community plugins or diagnostics exist: show a centred empty state

<a id="ln-plug-048"></a>

**Requirement.** When no community plugins or diagnostics exist, Community plugins settings MUST show a centred empty state with a puzzle illustration, `No community plugins found`, the legacy guidance copy, and one prominent `Browse plugins` action that opens the registry Browse tab.

## LN-PLUG-049 — Installed Plugins header actions

<a id="ln-plug-049"></a>

**Requirement.** The Community plugins `Installed Plugins` header MUST retain its explanatory copy and expose one compact outlined `Reload plugins` action with a refresh icon. Activating it MUST retain the existing application reload behavior.

## LN-PLUG-050 — Empty Plugin registry Installed tab: use the shared centred empty-state treatment

<a id="ln-plug-050"></a>

**Requirement.** An empty Plugin registry Installed tab MUST use the shared centred empty-state treatment with a package illustration, `No plugins installed`, the existing installed-plugin copy, and one `Browse plugins` action that selects the Browse tab.

## LN-PLUG-051 — Empty Plugin registry Updates tab: use the shared centred empty-state treatment

<a id="ln-plug-051"></a>

**Requirement.** An empty Plugin registry Updates tab MUST use the shared centred empty-state treatment with a success illustration, `You’re up to date`, the existing no-updates copy, and one `Check for updates` action that retains registry refresh behavior.

## LN-PLUG-052 — Plugin registry tabs: divide the available tab-list width equally, retain

<a id="ln-plug-052"></a>

**Requirement.** Plugin registry tabs MUST divide the available tab-list width equally, retain uppercase labels and the shared bottom divider, and mark only the selected tab with the Lapis accent underline. Tab selection semantics and keyboard behavior MUST remain Design Core-owned.

## LN-PLUG-053 — Signed registry V1 metadata: parse optional typed status, author URL, latest

<a id="ln-plug-053"></a>

**Requirement.** Signed registry V1 metadata MUST parse optional typed status, author URL, latest release summary, owner URL, license, normalized links, highlights, contributions, and Overview or Changelog references while retaining legacy README aliases. Old entries and unknown future fields MUST remain valid.

## LN-PLUG-054 — FetchVerifiedPluginMarkdown: fetch bounded UTF-8 Markdown, verify its declared

<a id="ln-plug-054"></a>

**Requirement.** `fetchVerifiedPluginMarkdown` MUST fetch bounded UTF-8 Markdown, verify its declared byte size and SHA-256 before returning it, cache only by immutable reference identity, and report existing metadata or integrity error codes. It MUST NOT add a required distribution-manager method.

## LN-PLUG-055 — Installed, Browse, Updates, and Sources: use one compact responsive registry-row system

<a id="ln-plug-055"></a>

**Requirement.** Installed, Browse, Updates, and Sources MUST use one compact responsive registry-row system with tab-specific Design Core search that expands to reveal supported filters and sorting, plus active-filter count, matching-result count, and Reset. Actions and status reasons MUST stay inside their owning row without adding ratings, source editing, or Update All.

## LN-PLUG-056 — Registry details: expose verified Overview, Changelog, and Releases inside

<a id="ln-plug-056"></a>

**Requirement.** Registry details MUST expose verified Overview, Changelog, and Releases inside the Plugins workspace view. Settings Browse and Updates entry activation MUST navigate to the selected plugin and close Settings. Metadata, compatibility, Retry and actionable content diagnostics MUST remain usable when verified Markdown fails.

## LN-PLUG-057 — Plugin registry presentation: distinguish initial load, background refresh, empty registry

<a id="ln-plug-057"></a>

**Requirement.** Plugin registry presentation MUST distinguish initial load, background refresh, empty registry, filtered no-results, no updates, source problems, and registry failure. Refresh, filters, selection, list scroll, manual-install progress, update, enablement, uninstall, trust, restart, revocation, and confirmation behavior MUST retain existing App-owned handlers.

## LN-PLUG-058 — Registry rows, provenance badges, expandable search, tabs: use public Design Core controls and --ui-\*

<a id="ln-plug-058"></a>

**Requirement.** Registry rows, provenance badges, expandable search, tabs, details, and content states MUST use public Design Core controls and `--ui-*` tokens with visible focus, keyboard activation, ARIA tab semantics, accessible icons, reduced motion, and light/dark contrast. Official and Community provenance MUST remain visually distinct without relying on colour alone. Changed stories MUST remain `visual-pending`; visual comparison MUST stay non-blocking.

## LN-PLUG-059 — Registry tab search: retain the Design Core Ledger Search composition

<a id="ln-plug-059"></a>

**Requirement.** Registry tab search MUST retain the Design Core Ledger Search composition: the search pill and clear action, expandable filters, and searchable `FilterCommandPicker` controls backed by Command View styling. Search and filter controls MUST share the available row when space permits and wrap to separate rows when constrained.

## LN-PLUG-060 — Registry detail navigation: reuse and activate the registered Plugins leaf

<a id="ln-plug-060"></a>

**Requirement.** Registry detail navigation MUST reuse and activate the registered Plugins leaf wherever it was moved, creating one in the main area when absent. Settings MUST NOT open a separate plugin detail dialog. Narrow details MUST use the responsive Plugins view and its breadcrumbs.

## LN-PLUG-061 — Verified structured Changelog: render inside the Plugins detail view without

<a id="ln-plug-061"></a>

**Requirement.** A verified structured Changelog MUST render inside the Plugins detail view without bypassing content integrity verification. Both structured release notes and legacy verified Markdown MUST remain supported.

## LN-PLUG-063 — Browse, Installed, and Updates: share one registry-row geometry. The title

<a id="ln-plug-063"></a>

**Requirement.** Browse, Installed, and Updates MUST share one registry-row geometry. The title and each chip MUST participate individually in one vertically centred wrapping identity flow and stay beside each other when space permits. The relevant version MUST remain pinned top-right while description and metadata retain consistent positions. Neutral and platform chips MUST remain visible, and enablement MUST NOT be duplicated when an installed row exposes a switch.

## LN-PLUG-064 — Installed and Updates row update actions: use an icon-only Design Core button

<a id="ln-plug-064"></a>

**Requirement.** Installed and Updates row update actions MUST use an icon-only Design Core button with a Shadcn tooltip and an action-specific accessible name. Installed row enablement MUST use the Design Core switch with matching hover/focus tooltip copy while invoking the existing App plugin enable/disable lifecycle and preserving busy/disabled behavior.

## LN-PLUG-065 — Uninstall confirmation: use a compact, viewport-bounded destructive Alert Dialog

<a id="ln-plug-065"></a>

**Requirement.** Uninstall confirmation MUST use a compact, viewport-bounded destructive Alert Dialog that identifies the target with the same plugin row presentation, resolved name, version, provenance, description, and available status metadata. Cancel and destructive confirmation MUST preserve the existing uninstall lifecycle and clear the selected target when dismissed. Both actions MUST have explicit token-backed default, hover, visible-focus, disabled, and reduced-motion treatments.

Consumer acceptance waits for the mounted confirmation to become visible before
checking its contents or choosing Disable instead. The prepared entrance
animation remains enabled.

## LN-PLUG-066 — Installed-plugin enablement switch: expose the next lifecycle action

<a id="ln-plug-066"></a>

**Requirement.** An installed-plugin enablement switch MUST expose the next lifecycle action through its accessible name and tooltip: enabled plugins say `Disable`, while disabled plugins say `Enable`. The wording MUST follow state changes while retaining the existing App lifecycle and busy-state behavior.

## LN-PLUG-067 — Registry Browse: offer Uninstall for vault-installed plugins and open

<a id="ln-plug-067"></a>

**Requirement.** Registry Browse MUST offer Uninstall for vault-installed plugins and open the shared confirmation dialog. Static profile plugins MUST show a non-removable Bundled state. Plugins details MUST distinguish installed and bundled entries from available Install and Update actions.

## LN-PLUG-068 — Uninstall dialog: offer a Disable instead switch for enabled

<a id="ln-plug-068"></a>

**Requirement.** The uninstall dialog MUST offer a `Disable instead` switch for enabled plugins. Selecting it MUST change the confirmed action to the existing disable lifecycle, retain installed files, avoid uninstall, and reset the choice whenever the dialog closes or targets another plugin.

## LN-PLUG-069 — API: validate the registry's optional download-statistics summary, accept

<a id="ln-plug-069"></a>

**Requirement.** The API MUST validate the registry's optional download-statistics summary, accept only approximate redirect-request metrics no more than five UTC days behind, and hide missing, malformed, future, or stale data without failing catalog refresh. The distribution-manager accessor MUST remain optional for structural compatibility.

## LN-PLUG-073 — Failed plugin install or update progress: persist an App-owned error notification containing

<a id="ln-plug-073"></a>

**Requirement.** Failed plugin install or update progress MUST persist an App-owned error notification containing the actionable failure message. A transient status item or compatibility-global toast alone MUST NOT be the only failure disclosure.

## LN-PLUG-075 — Registry installation busy states

<a id="ln-plug-075"></a>

**Requirement.** Plugin registry install actions MUST expose a per-plugin busy state in the owning row and detail action, then show an Installed state after refresh or an Install failed state with the actionable error reason. The row action MUST NOT rely on the application status bar or a transient compatibility notification to communicate progress or completion.

## LN-PLUG-076 — Public workspace-host import validation

<a id="ln-plug-076"></a>

**Requirement.** Verified ESM plugin runtime validation MUST accept the public `@lapis-notes/api/workspace-host` subpath declared by the generated host-module catalogue. The Web host MUST map that accepted subpath to a build-owned entry that reuses the host module graph; History MUST NOT fail only after bundle download.

## LN-PLUG-078 — Public App API: provide a plugin-bound Nostr signer facade backed

<a id="ln-plug-078"></a>

**Requirement.** The public App API MUST provide a plugin-bound Nostr signer facade backed by an injected host broker. The facade MUST preserve the requested event template, identify every operation with the requesting plugin ID, expose no private key material, and remain unavailable unless the host supplies secure account custody and consent policy.

## LN-PLUG-079 — Plugin distribution: support ordered HTTP and Nostr catalog adapters

<a id="ln-plug-079"></a>

**Requirement.** Plugin distribution MUST support ordered HTTP and Nostr catalog adapters through one manager. Refresh MUST merge enabled-source entries deterministically, retain owning source for detail/install/update, expose per-source health and install readiness, and keep partial-quorum Nostr browseable but non-installable. Source enablement MUST persist independently per source in the vault. A Nostr adapter MUST return verified payloads through the normal installer and ignore non-HTTPS legacy `readmeUrl` fields before host-schema validation.

## LN-PLUG-080 — Manual .lapis-plugin installation: recognize the portable Nostr container, use

<a id="ln-plug-080"></a>

**Requirement.** Manual `.lapis-plugin` installation MUST recognize the portable Nostr container, use the configured Nostr adapter verifier, and preserve legacy root-signed bundle support during migration. An offline Nostr installation MUST persist its authenticated inner-payload digest and a revocation-refresh warning. The manager MUST retain that warning unless an install-ready live source revalidates the same immutable release event and digest.

## LN-PLUG-081 — When Nostr registry discovery is re-enabled, App: append one enabled built-in Nostr source

<a id="ln-plug-081"></a>

**Requirement.** When Nostr registry discovery is re-enabled, App Profile MUST append one enabled built-in Nostr source for valid relay, curator, quorum, and optional Blossom settings. HTTPS sources MUST remain enabled unless preferences disable them. Absent configuration MUST retain HTTP-only operation; incomplete keys, invalid pubkeys, and impossible quorums MUST fail closed. While discovery is deferred, the concrete binding and its tests MUST remain outside active profile sources.

## LN-PLUG-092 — Registry catalogs: normalize verified V1 HTTP and Nostr projections

<a id="ln-plug-092"></a>

**Requirement.** Registry catalogs MUST normalize verified V1 HTTP and Nostr projections into the shared API-owned V2 model. HTTP metadata signatures MUST verify the original object before normalization. V2 detail views MUST show description, highlights, verified themed media, documentation links and structured per-release changelogs without fetching legacy Markdown content.

## LN-PLUG-096 — Registry details: present screenshots in a horizontal carousel

<a id="ln-plug-096"></a>

**Requirement.** Registry details MUST present screenshots in a horizontal carousel with previous/next controls and distinct banner, overview, and logo placements. Each image MUST remain within its click target; the carousel MUST scroll within the detail width rather than overflow or stack screenshots vertically.

## LN-PLUG-097 — Registry media viewers: fit enlarged images within the viewport

<a id="ln-plug-097"></a>

**Requirement.** Registry media viewers MUST fit enlarged images within the viewport and support previous/next, keyboard image navigation, and Light/Dark/Split selection through shared controls. Closing the viewer MUST restore focus to its connected opener; reopening MUST select the requested image and initial theme.

Consumer acceptance waits for visible dialog state after opening and reopening
the viewer before asserting its image-status text. DOM insertion alone does not
mean the prepared entrance animation has painted the viewer.

## LN-PLUG-098 — App-owned Plugins view registration

<a id="ln-plug-098"></a>

**Requirement.** The default Notes hosts MUST register one app-owned `plugins` workspace view before layout restoration, with a left-ribbon Plugins action and `app:open-plugins` command. Both openers MUST reveal an existing moved instance or create a main-area tab and return it to the registry homepage. Registration MUST be disposable and receive its owning App explicitly.

## LN-PLUG-099 — Plugins homepage: show featured, newly released, recently updated, available

<a id="ln-plug-099"></a>

**Requirement.** The Plugins homepage MUST show featured, newly released, recently updated, available update, and high-level category sections using the Community registry presentation. Categories MUST open the directory with the selected category; the Plugins link MUST open the complete catalog. The parked Community runtime and discussion features MUST NOT be dependencies.

## LN-PLUG-100 — Plugins directory: provide category, status, platform, official, installation,

<a id="ln-plug-100"></a>

**Requirement.** The Plugins directory MUST provide category, status, platform, official, installation, and available-update filters, search, sorting, result count, removable filters, and grid/list presentation. Layout MUST respond to its owning pane width.

## LN-PLUG-102 — Plugins and registry settings: share App-scoped catalog, installed/update state, and verified

<a id="ln-plug-102"></a>

**Requirement.** Plugins and registry settings MUST share App-scoped catalog, installed/update state, and verified action handlers. Details MUST expose install/update progress, success, and actionable retry errors while preserving bundled, incompatible, revoked, and unavailable-source states. Existing settings management MUST remain available.

## LN-PLUG-105 — Verified plugin images: reserve their declared dimensions and show

<a id="ln-plug-105"></a>

**Requirement.** Verified plugin images MUST reserve their declared dimensions and show a Design Core skeleton until browser decoding completes. Failed fetches, verification or decoding MUST show an empty image state, retaining caller-provided icon fallbacks. Gallery and lightbox navigation MUST preserve the requested selection during programmed scrolling.

## LN-PLUG-093 — New installs: prefer HTTP entries over duplicate Nostr entries

<a id="ln-plug-093"></a>

**Requirement.** New installs MUST prefer HTTP entries over duplicate Nostr entries; explicit registry selection MUST resolve that source, with caches isolated by source identity and URL. Installed plugins MUST retain their source for updates and revocations. Disabled or unavailable sources MUST NOT trigger source switching or clear known revocations. The built-in official V1 URL MAY migrate to V2 with unchanged identity and pinned keys.

## LN-PLUG-094 — Desktop development: remain HTTP-only unless Nostr is explicitly configured

<a id="ln-plug-094"></a>

**Requirement.** Desktop development MUST remain HTTP-only unless Nostr is explicitly configured or local fixture use is opted into. Incidental fixture files MUST NOT enable the relay registry.

Notebook declares the public Design Core ToggleGroup density control in its shared dependency manifest. The host catalog and generated import map expose that exact public module; undeclared and private imports remain rejected.

Notebook canvas qualification preserves fail-closed declared module auditing, the shared renderer, and the existing verification/signature boundary. UI approval permits full local qualification, not publication or registry dispatch.
