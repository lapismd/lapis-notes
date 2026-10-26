# Plugin Model / Editor contributions

## LN-PLUG-006 — Lapis Notes default profile: contain exactly Source Editor, Markdown, File Explorer

<a id="ln-plug-006"></a>

**Requirement.** The Lapis Notes default profile MUST contain exactly Source Editor, Markdown, File Explorer, and Search in that order. All four MUST default enabled and remain user-disableable. Extracted npm plugin constructors MUST resolve the same API peer instance used by the profile. Required host-owned views such as Problems MUST NOT become missing-view placeholders while their host registration remains.

The [approved registry consumer snapshot](../packages/releases-and-exports.md#approved-registry-consumer-snapshot--2026-10-14)
refreshes the extracted profile packages through public npm ranges. Profile
acceptance retains the four-plugin order, optional enablement, and shared API
identity. Slides remains an installed plugin rather than a profile entry.

Markdown Problems acceptance verifies the refreshed providers through their
App-owned diagnostics and current connected gutter markers. Marker glyph and
alignment assertions resolve the same DOM snapshot under
[LN-WS-038](../workspace-shell/panels/problems/core-contract.md#ln-ws-038).
The Problems badge reflects all active diagnostic providers under LN-WS-046;
the two required Markdownlint codes remain independently verified.
Contributed Problems fixes use the owning API editor's save queue for open
resources before diagnostics refresh (LN-WS-034). Plugin providers do not add a
second writer to that path.

The separately selected native backup service distinguishes explicit persisted selection from observer disposal under LN-WEB-073, while retaining existing settings and default-profile ownership.

The separately selected native Repository profile reuses the public restore
controller and review dialog under LN-WEB-072. Its same-client adapter supplies
native guarded restore without installing the optional legacy HistoryPlugin,
changing the four-plugin default, or creating another plugin-owned writer.

## LN-PLUG-007 — Disabling a plugin with open owned views: replace those leaves with persisted missing-view placeholders

<a id="ln-plug-007"></a>

**Requirement.** Disabling a plugin with open owned views MUST replace those leaves with persisted missing-view placeholders. Re-enabling it MUST restore the leaves without changing active selection or plugin-owned data. Restored imperative plugin views MUST receive a host-filling compatibility root without depending on application-global utility CSS. Collapse, remount, and file-open projection MUST keep the same leaf id and live `getState()`.

## LN-PLUG-012 — Core settings: list each runtime plugin ID exactly once

<a id="ln-plug-012"></a>

**Requirement.** Core settings MUST list each runtime plugin ID exactly once, including when a statically registered plugin also exposes indexed manifest contributions.

## LN-PLUG-013 — Plugin.registerSearchDocumentProvider: namespace provider IDs and dispose registrations

<a id="ln-plug-013"></a>

**Requirement.** `Plugin.registerSearchDocumentProvider` MUST namespace provider IDs and dispose registrations with the owning plugin lifecycle. It MUST NOT grant providers direct generated-index ownership.

`Plugin.registerMarkdownEmbedder` appends one declinable full-file Markdown embedder and removes that registration when the plugin unloads.

## LN-PLUG-015 — History-enabled navigation into a plugin-owned file view: preserve the initiating leaf state before constructing

<a id="ln-plug-015"></a>

**Requirement.** History-enabled navigation into a plugin-owned file view MUST preserve the initiating leaf state before constructing the target view. Back MUST NOT restore an empty plugin view or retain the previous file-view root.

## LN-PLUG-018 — Non-file views: contribute header breadcrumbs through View.getBreadcrumbs() and View.getBreadcrumbFilePath()

<a id="ln-plug-018"></a>

**Requirement.** Non-file views MAY contribute header breadcrumbs through `View.getBreadcrumbs()` and `View.getBreadcrumbFilePath()`. `getChrome` MUST prepend those crumbs, append parent-path segments of the returned path, and keep `titleEditable` only for FileView.

## LN-PLUG-021 — LoadPlugins({ onProgress }): call onProgress immediately before each enablePlugin

<a id="ln-plug-021"></a>

**Requirement.** `loadPlugins({ onProgress })` MUST call `onProgress` immediately before each `enablePlugin` with `id`, `name`, `index`, and `total` for the current activation order.

## LN-PLUG-022 — Plugin.registerAgentSkillRoot and registerAgentSkillDirectory: register file-backed skill sources under the owning

<a id="ln-plug-022"></a>

**Requirement.** `Plugin.registerAgentSkillRoot` and `registerAgentSkillDirectory` MUST register file-backed skill sources under the owning plugin, keep paths inside the extension root, and dispose them on unload. Optional `registerAgentSkill` MUST share the same descriptor model. Unloaded sources MUST NOT enter later snapshots.

## LN-PLUG-025 — Plugin.registerIndexProjection: register a namespaced projection with field schema

<a id="ln-plug-025"></a>

**Requirement.** `Plugin.registerIndexProjection` MUST register a namespaced projection with field schema and a `project` function, MUST NOT write YAML, and MUST dispose with the plugin.

## LN-PLUG-026 — RegisterIndexProjection: return a handle with query, get,

<a id="ln-plug-026"></a>

**Requirement.** `registerIndexProjection` MUST return a handle with `query`, `get`, and `queryRelated`. Registration MUST backfill from the core file index in bounded batches.

## LN-PLUG-030 — Search provider startup order

<a id="ln-plug-030"></a>

**Requirement.** Search plugin load MUST register its providers and change listeners before scheduling one startup reconciliation after `MetadataCache.load()` resolves. Provider registrations during configured plugin loading MUST be absorbed into that reconciliation, and layout readiness MUST NOT schedule a competing reconciliation. Plugin unload MUST drain owned incremental checkpoint work before disposal.

## LN-PLUG-032 — First-party plugins that need only selected indexed: use the API projection and path-only query

<a id="ln-plug-032"></a>

**Requirement.** First-party plugins that need only selected indexed metadata domains or Search membership MUST use the API projection and path-only query contracts. They MUST NOT enumerate complete Search documents or issue per-file metadata lookups to reconstruct an indexed page.

## LN-PLUG-035 — Plugin: use API-owned structured-query syntax and AppDatabase path-only

<a id="ln-plug-035"></a>

**Requirement.** A plugin MAY use API-owned structured-query syntax and AppDatabase path-only Search to evaluate its own ordered presentation rules. It MUST keep value discovery, rule persistence, precedence, and diagnostics plugin-owned, react to Search-domain revisions, and MUST NOT import another plugin's manager, panel, settings, or autocomplete catalog.

## LN-PLUG-037 — First-party plugin that exposes a retryable generated: publish current build failures through an owner-scoped

<a id="ln-plug-037"></a>

**Requirement.** A first-party plugin that exposes a retryable generated view MUST publish current build failures through an owner-scoped diagnostic collection when the failure requires user visibility. Resource-specific failures use an opaque resource; workspace failures use `null`. Recovery and plugin disposal MUST clear those diagnostics without opening Problems.

## LN-PLUG-044 — Workspace README presentation: injected through the App renderer contract. @lapis-notes/workspace

<a id="ln-plug-044"></a>

**Requirement.** Workspace README presentation MUST be injected through the App renderer contract. `@lapis-notes/workspace` MUST NOT depend directly on `@lapis-notes/markdown` or any extracted plugin implementation.

## LN-PLUG-101 — Plugins details: open inside the owning view with breadcrumbs

<a id="ln-plug-101"></a>

**Requirement.** Plugins details MUST open inside the owning view with breadcrumbs, metadata, linked author, verified media, overview, changelog, and releases. Back navigation MUST restore the originating homepage or filtered directory and its scroll position.

## LN-PLUG-107 — Requested releases: fail closed when unavailable

<a id="ln-plug-107"></a>

**Requirement.** Plugin details MUST display the requested verified release version from an indexed own entry. An unknown requested version, including an inherited object property name, MUST show an unavailable state with no install action; it MUST NOT silently select the latest release. Returning to the latest release MUST require an explicit user action.

## LN-PLUG-108 — Selected release installation: retain the requested version

<a id="ln-plug-108"></a>

**Requirement.** Plugin installation from details MUST retain the selected verified version, including when a newer update is available. An update MUST NOT substitute a different recovery target for that selection. Historical installation MUST use the existing confirmation and verification flow. Bundled plugins MUST remain non-installable through registry actions.
