# Plugin Model

Lapis distinguishes ownership and distribution without changing runtime plugin
identities or creating a second lifecycle. Statically shipped plugins use the
core manager even when their source is maintained in a separate repository.
First-party plugin surfaces compose Design Core public parts for shared chrome;
AI composer drawer chips use the public `attachment-chip` contract instead of
plugin-local paint.

## Requirements

| ID          | Requirement                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-PLUG-001 | Bundled plugins MUST use package directories named `plugin-*`, remain maintained inside Lapis, and report `distribution: "bundled"`.                                                                        |
| LN-PLUG-002 | First-party external plugins MUST use repositories named `lapis-plugin-*`, version independently, and report `distribution: "first-party-external"` with official provenance.                               |
| LN-PLUG-003 | Statically shipped bundled and first-party external plugins MUST use the core lifecycle and `.obsidian/core-plugins.json`; they MUST NOT enter the vault-installed community configuration.                 |
| LN-PLUG-004 | Core plugin registrations and list entries MUST expose distribution metadata, defaulting omitted registrations to `bundled`.                                                                                |
| LN-PLUG-005 | Array-form core configuration MUST remain readable as disabled IDs. Object-form configuration MUST preserve explicit `disabled` and `enabled` IDs.                                                          |
| LN-PLUG-006 | Markdown, Search, History, Markdown Lint, File Explorer, Bases, AI, Notifications, and Roles MUST default enabled and remain user-disableable. Problems and other declared infrastructure MAY remain required.           |
| LN-PLUG-007 | Disabling a plugin with open owned views MUST replace those leaves with persisted missing-view placeholders. Re-enabling it MUST restore the leaves without changing active selection or plugin-owned data. Restored imperative plugin views MUST receive a host-filling compatibility root without depending on application-global utility CSS. |
| LN-PLUG-008 | Core settings MUST subscribe to lifecycle changes and failures through the Design Core managed-plugin source contract, with Included and First-party groups.                                                |
| LN-PLUG-009 | Default Search or Explorer leaves MUST NOT be created while their owning plugin is disabled.                                                                                                                |
| LN-PLUG-010 | Community installation, registry, signature, update, and community enablement behavior MUST remain outside the static distribution model.                                                                   |
| LN-PLUG-011 | A package or repository rename MUST preserve runtime IDs, commands, view types, filenames, and plugin-data paths unless a separate migration requirement explicitly changes them.                           |
| LN-PLUG-012 | Core settings MUST list each runtime plugin ID exactly once, including when a statically registered plugin also exposes indexed manifest contributions.                                                       |
| LN-PLUG-013 | `Plugin.registerSearchDocumentProvider` MUST namespace provider IDs and dispose registrations with the owning plugin lifecycle. It MUST NOT grant providers direct generated-index ownership. |
| LN-PLUG-014 | Plugin ribbon and status contributions MUST appear only while their owner is enabled, and their commands MUST reuse existing compatible leaves. |
| LN-PLUG-015 | History-enabled navigation into a plugin-owned file view MUST preserve the initiating leaf state before constructing the target view. Back MUST NOT restore an empty plugin view or retain the previous file-view root. |
| LN-PLUG-016 | Every first-party `Plugin.registerView` and `Plugin.registerSidebarView` registration MUST declare `ViewAccess` metadata as exactly one of `command`, `file`, `internal`, or `alias`; omitted metadata remains supported only for third-party compatibility. |
| LN-PLUG-017 | A `ViewAccess.command` registration MUST contribute one concise `Open …` command through its owning plugin, while `file`, `internal`, and `alias` registrations MUST NOT add a duplicate palette opener. |
| LN-PLUG-018 | Non-file views MAY contribute header breadcrumbs through `View.getBreadcrumbs()` and `View.getBreadcrumbFilePath()`. `getChrome` MUST prepend those crumbs, append parent-path segments of the returned path, and keep `titleEditable` only for FileView. |
| LN-PLUG-019 | `Plugin.registerAgentTool` MUST register a transport-neutral tool under the owning plugin ID, reject invalid or duplicate active names, and dispose it with the plugin lifecycle. Community renderer registration MUST remain inert for agents until the user enables that owner in AI settings. |
| LN-CV-010 | Desktop and web hosts MUST register runtime plugin `roles` as `first-party-external`, optional, and enabled by default before metadata and layout restoration. Package changes MUST preserve its runtime view, command, file, and plugin-data identities. |
| LN-ROLE-016 | Desktop and web MUST restore persisted `role`, `roles`, and `cv` leaves when Roles is enabled without forcing Roles into a default layout. Disabled leaves MUST remain persisted missing-view placeholders and recover after re-enable. |

Application tool registration follows existing plugin contribution lifecycle:
the helper supplies immutable runtime owner metadata, the App registry rejects
conflicting names, and unload disposes the exact registration.
Invocation resolves that exact registration both before and after a pending
approval, so unloading or replacing a plugin while the card is open cannot
grant or invoke a stale callback.
Developer diagnostics may register the bundled factories directly against a
volatile registry, but production plugins continue to own registration and
automatic disposal through `Plugin.registerAgentTool`.
This callback registry is separate from AI's external
`McpServerContribution` registry; plugins cannot claim the reserved
`lapis-tools` MCP server name through that process-backed integration surface.
AI snapshots the exact active registration IDs for a new binding, and later
plugin unload or replacement makes those snapshotted callbacks unavailable
instead of transferring authority to a newly registered callback.
Bundled domain plugins register their tools through that same lifecycle helper
and capture their own services rather than receiving execution services in the
host-created invocation context.
Markdown registers its three note callbacks during plugin load, so ordinary
plugin unload disposes them before any stale binding can invoke their captured
Vault.

## Distribution and provenance

`distribution` describes where source is owned and released. `provenance`
describes trust. A linked first-party package therefore uses core persistence
with official provenance; an official vault-installed bundle remains on the
installed-plugin path. Those states are not interchangeable.

## Persistence and recovery

The core configuration continues to accept the legacy array and the object
form. Missing-view placeholders retain the original view type and serialized
state so restart and later enablement use the existing workspace recovery path.
Plugin configuration and data remain keyed by runtime plugin ID.
Bundled plugins that own user-facing configuration register Design Core
settings sections under `core-plugins` in addition to any legacy
`PluginSettingTab` compatibility surface.
Plugin instances retain their constructor-supplied App. Managed disable and
restore therefore operate on the owning workspace even while a compatibility
lease exposes a different App for an older consumer.
Markdown reuses one `MiraFileAdapter` for that same App so preview effects do
not churn when views reconfigure.
The Storybook command-panel registry maps each `ViewAccess.command` identifier
back to its source declaration and canonical panel story. This is verification
metadata only and does not become a runtime plugin registration surface.
Command-backed openers reuse an exact compatible leaf when one exists. A
conversation opener may claim an unbound main-area AI leaf before creating a
new tab, and it never replaces the dedicated history leaf.
