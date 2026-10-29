# Plugin Model / Lifecycle and views

The selected native-chat profile retains the optional `ai` identity, commands
and view types through the public Plugin lifecycle. One feature-owned session
coordinates read-only views; closing a view detaches observation. Hosts prepare
detach versus explicit disable/close before unload, and the native owner retains
accepted work and its writer. The shared default profile remains unchanged.
The hosted server mounts that workspace through `@lapis-notes/web/session`, which
keeps the shared application profile inside Notes.
The History opener defaults to an ungrouped right sidebar and reveals moved
instances. Its selections preserve the History view and reuse only a matching
main-area conversation and scope. A new scoped draft does not replace another
open chat. Restored leaves retain scope and saved conversation identity.

Hosted archive of the displayed vault awaits the existing workspace/plugin
disposal and final file writes before retiring the native owner. The retained
chooser supplies this host lifecycle policy; plugins keep their owned App and
normal cleanup contracts. Installed-plugin delivery remains its own migration
gate.

LN-DB-065 reconciles retained native Search through the replacement App's owning
plugin registry. An enabled Search plugin may declare its providers only after
metadata readiness; absence, disabled state or failed activation instead drains
the retained native selection. Passive plugin/App disposal keeps its existing
observation-only lifetime and never creates a renderer writer.

For Rust-hosted LN-WEB-068, Search declaration, registered rebuild controls and
explicit disable use the admitted metadata/Search client. Recovered plugin
configuration rehydrates the mounted Search controls without acquiring a native
writer or replacing the existing UI; source admission remains a separate gate.

LN-WS-101 allows an explicit layout-only close policy for views with no file
writers and externally retained staged state. Existing plugin views keep full
application writer protection unless they opt in; whole-host shutdown remains
guarded. Registration, permissions and file-writer lifetimes are unchanged.
The shared file-conflict review (LN-WS-102) is a host-owned internal view
registered by the Workspace binding, not a plugin contribution; it uses the
same explicit layout-only close policy, and its diagnostics collection follows
the binding's reference-counted disposal.

LN-WS-005/062 in-flight replay retains newer plugin-owned view state and
activation. Stale prepared candidates are retired before opening; ordinary
registration, plugin activation, load/unload and saved-state contracts remain
unchanged. The same generic revision guard applies to every view type.

LN-WS-005/063 reveal foreground file tabs through the original owned workspace.
Plugin view construction, file state, activation policy and disposal stay owned
by their existing registrations; no plugin or service is enabled by revealing.

Workspace diagnostic-resource registrations belong to their owning App and
return disposal callbacks. Desktop conflict review composes its own view; the
shared API retains ordinary vault-file navigation for unhandled resources.

The deferred host attachment in LN-WS-006/064 preserves plugin-owned view
creation, load and unload. Closing a host cancels its pending attachment; it
does not construct a replacement view, reactivate a plugin or admit a service.

## LN-PLUG-121 — Required native service admission

<a id="ln-plug-121"></a>

**Requirement.** Plugin manifests MAY declare required native services. Loading MUST reject malformed declarations, unsupported services and supported services that are currently unavailable before code evaluation. Diagnostics MUST distinguish unsupported services from disabled supported services. Admission MUST NOT enable a service automatically or grant additional native permissions.

## LN-PLUG-119 — External plugin uninstall

<a id="ln-plug-119"></a>

**Requirement.** External plugin uninstall MUST await owned runtime cleanup before removing code. Successful removal MUST retire its runtime registration, indexed contributions and diagnostics. Failed cleanup MUST preserve installed bytes and metadata for explicit recovery. Static application owners MUST remain unaffected by removal of obsolete installed copies.

## LN-PLUG-120 — Installation restart confirmation

<a id="ln-plug-120"></a>

**Requirement.** A fresh application owner MUST clear an installation's pending-restart marker only after the installed version's runtime loads successfully. Failed or mismatched loads MUST retain the marker. The previous owner awaiting reload MUST NOT reactivate its stale module or clear that marker.

## LN-PLUG-116 — Static plugin identity protection

<a id="ln-plug-116"></a>

**Requirement.** Registered static plugin identities MUST reject external installation, replacement and direct loading before code evaluation or vault modification. Removing an obsolete installed copy MUST preserve its data by default and MUST NOT disable the static instance or alter core preferences.

Direct rejection precedes external contribution indexing, including dormant
manifest-only system owners, so their original registrations remain intact.

## LN-PLUG-117 — Plugin replacement lifetime

<a id="ln-plug-117"></a>

**Requirement.** Replacing a loaded plugin MUST await its owned teardown before publishing new code. A runtime requiring reload MUST remain inactive until a new application owner starts, without changing its saved enabled choice. Failed publication MUST restore the previous recoverable runtime and installed files.

Hosts may conservatively require reload for every loaded module replacement.
Verification and staging finish before retirement; retained data is read after
teardown so the plugin's final save wins over archive defaults. Cancellation
before publication rolls the retired runtime back without publishing code.
Installed metadata participates in publication: a failed record write restores
the previous code and record before runtime rollback. Once both are committed,
backup cleanup cannot reactivate the old runtime.
Rollback also retains any reload restriction that existed before the attempt.

## LN-PLUG-118 — Plugin replacement data

<a id="ln-plug-118"></a>

**Requirement.** Signed plugin replacement MUST preserve existing plugin-owned `data.json` bytes, including when the release contains defaults. Verification and staging failures MUST leave existing installed code, metadata and data intact.

## LN-PLUG-115 — Portable asset fingerprints

<a id="ln-plug-115"></a>

**Requirement.** Installed-plugin asset fingerprints MUST use normalized supported paths sorted by ascending UTF-16 code units, together with each declared size and SHA-256. The fingerprint MUST be independent of locale and input order so native and browser hosts derive the same installation identity.

## LN-PLUG-114 — Explicit Tauri runtime selection

<a id="ln-plug-114"></a>

**Requirement.** Tauri vault sessions MUST select `tauri-desktop` explicitly and load only portable workspace ESM entries through the supplied asset server. They MUST reject unsupported Node, Electron-only, native-service and CommonJS/fallback entries before evaluation. An available legacy plugin-assets bridge MUST NOT change that selection. Unsupported entries MUST retain installed state and actionable diagnostics.

## LN-PLUG-113 — Host-owned plugin restrictions

<a id="ln-plug-113"></a>

**Requirement.** An App MAY supply plugin-ID restrictions using existing compatibility reasons. Registry discovery, install/update and external activation MUST apply the same host policy even when an older manifest advertises compatibility. Rejection MUST precede module evaluation and MUST preserve installed records, enabled preferences, saved plugin data and layout. Restrictions MUST remain App-owned; the API MUST NOT hard-code application plugin IDs.

LN-EXP-009 keeps native Explorer action feedback attached to its originating
App, including failed OS operations and unavailable clipboard support. Native
system trash remains an optional adapter capability under LN-PKG-184.

LN-PKG-183 and LN-WS-097 use existing FileView and workspace event owners for
watch reconciliation. Dirty and retired writers keep their original view and
explicit conflict-recovery owner; watcher callbacks cannot retarget them.

The LN-PKG-175 recovery banner presents host-owned Safe Mode state. Entering
optional-plugin recovery does not persist new core enablement choices; normal
plugin and workspace teardown remain owned by the host.

Conditional text persistence uses the optional public vault port in
[LN-PKG-167](../packages/vault-and-storage.md#ln-pkg-167). Plugins and hosts retain
their owning document baselines and recovery UI; adding this storage port alone
does not provide editor conflict protection.

Hosts finish note and layout persistence before unloading plugin-owned views.
[LN-WS-095](../workspace-shell/layout-and-persistence.md#ln-ws-095) supplies the
awaitable workspace boundary; plugins retain their existing view-state and
teardown contracts. A rejected flush lets the host retain its live views.

On conditional-capable hosts, plugin enablement and compatibility-file writers
use the App-owned retained state boundary under LN-PKG-174. Core choices are
admitted immediately; their flush is awaitable. Disk recovery restores the
owning runtime choice without recursively saving the recovery projection.

Server browser qualification retains the verified registry fixture and normal
plugin lifecycle assertions. Its one initial navigation retry for an observed
Chromium module transport abort does not replay plugin installation or later
editing, sharing and restart operations; see LN-PKG-161.
The file-backed recovery diagnostic survives successful acceptance without
replaying those plugin lifecycle operations.

The common `Plugin.disable()` boundary awaits host security revocation even
when plugin unload fails. Runtime hooks accept synchronous or asynchronous
cleanup; a cleanup failure propagates through the existing plugin failure state
(LN-ARCH-118).

## LN-PLUG-001 — Extracted first-party plugins: use package directories named by plugin slug

<a id="ln-plug-001"></a>

**Requirement.** Extracted first-party plugins MUST use package directories named by plugin slug in the sibling `lapis-plugins` monorepo, retain their `@lapis-notes/*` package names and runtime IDs, version independently, and report official provenance.

## LN-PLUG-005 — Array-form core configuration: remain readable as disabled IDs. Object-form configuration

<a id="ln-plug-005"></a>

**Requirement.** Array-form core configuration MUST remain readable as disabled IDs. Object-form configuration MUST preserve explicit `disabled` and `enabled` IDs.

## LN-PLUG-009 — Default leaves wait for plugin startup

<a id="ln-plug-009"></a>

**Requirement.** Default Search, Explorer, or Bookmarks leaves MUST NOT be created while their owning plugin is disabled. A registered `bookmarks` view MUST restore an existing bookmarks leaf instead of leaving a missing-view placeholder.

## LN-PLUG-028 — Plugin and host-owned view registrations: remain attached to live WorkspaceLeaf instances

<a id="ln-plug-028"></a>

**Requirement.** Plugin and host-owned view registrations MUST remain attached to live `WorkspaceLeaf` instances when a pane-menu split duplicates their view. Split panes MUST NOT create a design-only tab, wrong-direction pane, or unprojected API leaf that bypasses the plugin view lifecycle.

## LN-PLUG-036 — Plugin-owned presentation-settings migration: versioned, idempotent, and limited to fields whose

<a id="ln-plug-036"></a>

**Requirement.** A plugin-owned presentation-settings migration MUST be versioned, idempotent, and limited to fields whose semantics changed. It MAY remove superseded rule labels or activation flags when the canonical rule shape becomes always-active, but MUST preserve ids, queries, colours, order, and unrelated settings and MUST NOT read another application's configuration as a migration source.

## LN-PLUG-038 — Plugin-owned AI conversation operations

<a id="ln-plug-038"></a>

**Requirement.** AI agent changes MUST remain plugin-owned conversation operations. The plugin MUST persist portable switch/configuration evidence only after the receiving session accepts its first prompt, MUST resume prior bindings by verified transcript cursor when possible, and MUST fall back to a replacement binding with bounded typed transcript projection when native resume or configuration is unavailable. Runtime adapters MUST remain provider-neutral above their transport boundary.

## LN-PLUG-045 — Design Core custom settings-page search: accept page-owned dynamic entries and a reveal

<a id="ln-plug-045"></a>

**Requirement.** Design Core custom settings-page search MUST accept page-owned dynamic entries and a reveal callback. Selecting a plugin search result MUST open the owning custom page and expand or reveal the matching row without Design Core importing application plugin state.

## LN-PLUG-077 — Renderer ESM plugin host: prefer a module default export and otherwise

<a id="ln-plug-077"></a>

**Requirement.** The renderer ESM plugin host MUST prefer a module default export and otherwise resolve a named class that extends the shared `Plugin` base. Supporting exports such as constants, views, and settings helpers MUST NOT be mistaken for the plugin constructor when a valid named plugin class exists.

## LN-PLUG-104 — Plugins body navigation: remain outside its content Scroll Area. Directory

<a id="ln-plug-104"></a>

**Requirement.** Plugins body navigation MUST remain outside its content Scroll Area. Directory toggle, breadcrumbs, view and sort controls and detail Back/sidebar breadcrumbs MUST stay visible while content scrolls. Landing MUST retain its fixed native view header.

## LN-PLUG-090 — Plugin.registerSettingsSection: register one lifecycle-owned declarative settings definition backed

<a id="ln-plug-090"></a>

**Requirement.** `Plugin.registerSettingsSection` MUST register one lifecycle-owned declarative settings definition backed by a controlled source. It MUST preserve workspace ownership, trust checks, source disposal, and configuration-snapshot separation without exposing Design Core controller internals.

The Workspace bridge under
[LN-PKG-174](../packages/configuration-and-lifecycle.md#ln-pkg-174) preserves
this separation: a source-controlled field absent from the persistence snapshot
does not create a second configuration write through its change event. The
plugin's controlled source retains its own persistence ownership; admission of
shared configuration does not qualify separate plugin-enablement or
compatibility-file writers.

## LN-PLUG-091 — DeclarativePluginSettingTab: render a plugin-provided settings definition

<a id="ln-plug-091"></a>

**Requirement.** `DeclarativePluginSettingTab` MUST render a plugin-provided settings definition through the same field renderer used by Workspace Settings. A plugin MAY own the adapter class, but both surfaces MUST share one definition and source without duplicate persistence or custom mounting.

## LN-ROLE-016 — Desktop and web: restore persisted role, roles, and cv leaves

<a id="ln-role-016"></a>

**Requirement.** Desktop and web MUST restore persisted `role`, `roles`, and `cv` leaves when Roles is enabled without forcing Roles into a default layout. Disabled leaves MUST remain persisted missing-view placeholders and recover after re-enable.

Explorer deletion now follows the shared FileManager guard under LN-ARCH-145
and LN-EXP-008. The existing App owns writer protection, native IO failure and
retry; the view continues to use its existing action and notice presentation.

LN-WS-096 projects notices from the explicit App into the existing shared
notification UI and removes that subscription on host disposal. Explorer passes
its owned App to Notice; native error handling keeps the existing presentation.

LN-PKG-178 and LN-PKG-179 add opt-in exclusive creation and source-owned new-file
intent. Existing low-level overwrite behavior and unsupported legacy hosts stay
explicit; Deno host source remains frozen. Admission spans creation projection.

Explorer activation now supplies the existing external-file import callback using its owned App. Input reading and FileManager creation remain admitted through completion, and existing notices report failures. The plugin keeps its identity, view registration and presentation; no separate import screen or host filesystem port is introduced.

A plugin-created ItemView must survive an older queued controller projection.
The API owns this ordering; plugins continue using their existing view creation,
activation and reveal contracts without timers or consumer retry wrappers.

## LN-PLUG-112 — Legacy plugin data adoption

<a id="ln-plug-112"></a>

**Requirement.** Registering a plugin MUST preserve an existing compatibility data file until `loadData()` adopts it into canonical configuration. An explicit canonical data removal MUST still remove the compatibility mirror.

`addStatusBarItem()` returns a plugin-owned element in the shared status registry.
Plugin teardown removes its contribution. Custom controls own their styles and
resources; the shell mount disposer handles detachment (LN-WS-054).

The LN-WS-005 reveal repair preserves this lifecycle and disabled-view policy.
It retains the existing leaf and does not activate plugins, recreate views or
introduce a second layout authority.
