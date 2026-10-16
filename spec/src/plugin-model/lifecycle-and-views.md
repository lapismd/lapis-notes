# Plugin Model / Lifecycle and views

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
