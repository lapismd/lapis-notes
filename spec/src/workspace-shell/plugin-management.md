# Workspace Shell / Plugin management

App links and persisted Plugins routes retain a selected release version
([LN-PLUG-103](../plugin-model/app-ownership.md#ln-plug-103)). The view resolves
that version from verified detail metadata's indexed own entries, shows an unavailable state for a
missing version, and passes the selected release through the existing install
flow ([LN-PLUG-107](../plugin-model/editor-contributions.md#ln-plug-107),
[LN-PLUG-108](../plugin-model/editor-contributions.md#ln-plug-108)).
Successful app-link navigation dismisses owning Settings under
[LN-PLUG-109](../plugin-model/app-ownership.md#ln-plug-109).

## LN-WS-007 — Shell: render design-core's default desktop and mobile chrome

<a id="ln-ws-007"></a>

**Requirement.** The shell MUST render design-core's default desktop and mobile chrome. It MUST NOT call the Lapis plugin loader, register an application `PluginProfile`, or install Lapis/community plugins. The design-core notifications presentation is the only required static shell plugin. F-Mode MAY be present as an optional static plugin.

## LN-WS-018 — Editor-view registry projection

<a id="ln-ws-018"></a>

**Requirement.** API editor-view registrations MUST project into the design-core controller registry so shell Editor Associations options match API path resolution and plugin teardown.

## LN-WS-086 — Workspace: expose the reusable plugin-management settings pages

<a id="ln-ws-086"></a>

**Requirement.** Workspace MUST expose the reusable plugin-management settings pages and App registration helper without selecting an application profile or importing Markdown. The host application MUST register the pages, and README rendering MUST use the App injection contract.

## LN-WS-087 — Plugin-management custom settings pages: preserve the Design Core settings shell at

<a id="ln-ws-087"></a>

**Requirement.** Plugin-management custom settings pages MUST preserve the Design Core settings shell at wide and narrow widths. Their registry toolbar MUST use the shared expandable search and command-option controls. Selecting Browse or Updates details MUST navigate to the App-owned Plugins view without changing registry action ownership.

## LN-WS-088 — Plugin registry rows and details: expose App-owned next-action enablement labels and removable

<a id="ln-ws-088"></a>

**Requirement.** Plugin registry rows and details MUST expose App-owned next-action enablement labels and removable installed-plugin actions while keeping bundled profile plugins non-removable. The shared confirmation MUST support disabling without removing the installed vault artifact.

## LN-WS-089 — Plugin registry presentation: consume optional API-owned download statistics across populated

<a id="ln-ws-089"></a>

**Requirement.** Plugin registry presentation MUST consume optional API-owned download statistics across populated tabs and details, and Browse MUST sort by the 30-day value through its existing expandable Design Core toolbar. Statistics availability MUST NOT change registry actions or error state.

## LN-WS-092 — Plugin registry Sources: render every App-configured source, identify Nostr transport

<a id="ln-ws-092"></a>

**Requirement.** Plugin registry Sources MUST render every App-configured source, identify Nostr transport and relay count, distinguish browse-only from install-quorum-ready state, retain retry for enabled degraded sources, and expose a source enablement switch that calls the App-owned distribution manager. The page MUST NOT own relay verification, curator trust, source persistence, or installation policy.

## LN-WS-093 — Manual plugin installation: accept a portable Nostr .lapis-plugin

<a id="ln-ws-093"></a>

**Requirement.** Manual plugin installation MUST accept a portable Nostr `.lapis-plugin` through the existing file action, retain its verified source provenance, and surface a persistent revocation-refresh warning until an online relay-quorum verification succeeds. Workspace presentation MUST NOT independently verify or reinterpret its Nostr proof.
