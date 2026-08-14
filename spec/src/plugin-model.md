# Plugin Model

Lapis distinguishes ownership and distribution without changing runtime plugin
identities or creating a second lifecycle. Statically shipped plugins use the
core manager even when their source is maintained in a separate repository.

## Requirements

| ID          | Requirement                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-PLUG-001 | Bundled plugins MUST use package directories named `plugin-*`, remain maintained inside Lapis, and report `distribution: "bundled"`.                                                                        |
| LN-PLUG-002 | First-party external plugins MUST use repositories named `lapis-plugin-*`, version independently, and report `distribution: "first-party-external"` with official provenance.                               |
| LN-PLUG-003 | Statically shipped bundled and first-party external plugins MUST use the core lifecycle and `.obsidian/core-plugins.json`; they MUST NOT enter the vault-installed community configuration.                 |
| LN-PLUG-004 | Core plugin registrations and list entries MUST expose distribution metadata, defaulting omitted registrations to `bundled`.                                                                                |
| LN-PLUG-005 | Array-form core configuration MUST remain readable as disabled IDs. Object-form configuration MUST preserve explicit `disabled` and `enabled` IDs.                                                          |
| LN-PLUG-006 | Markdown, Search, Markdown Lint, File Explorer, Bases, Notifications, and Roles MUST default enabled and remain user-disableable. Problems and other declared infrastructure MAY remain required.           |
| LN-PLUG-007 | Disabling a plugin with open owned views MUST replace those leaves with persisted missing-view placeholders. Re-enabling it MUST restore the leaves without changing active selection or plugin-owned data. |
| LN-PLUG-008 | Core settings MUST subscribe to lifecycle changes and failures through the Design Core managed-plugin source contract, with Included and First-party groups.                                                |
| LN-PLUG-009 | Default Search or Explorer leaves MUST NOT be created while their owning plugin is disabled.                                                                                                                |
| LN-PLUG-010 | Community installation, registry, signature, update, and community enablement behavior MUST remain outside the static distribution model.                                                                   |
| LN-PLUG-011 | A package or repository rename MUST preserve runtime IDs, commands, view types, filenames, and plugin-data paths unless a separate migration requirement explicitly changes them.                           |
| LN-PLUG-012 | Core settings MUST list each runtime plugin ID exactly once, including when a statically registered plugin also exposes indexed manifest contributions.                                                       |
| LN-PLUG-013 | `Plugin.registerSearchDocumentProvider` MUST namespace provider IDs and dispose registrations with the owning plugin lifecycle. It MUST NOT grant providers direct generated-index ownership. |

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
