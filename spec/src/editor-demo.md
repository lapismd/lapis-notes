# Lapis Editor Demo

## Requirements

| ID        | Requirement                                                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-ED-001 | `@lapis-notes/api` MUST export a complete non-persistent `MemoryVaultAdapter` for deterministic tests, Storybook demos, and consumers that explicitly choose volatile storage.                                |
| LN-ED-002 | `@lapis-notes/api` MUST export a concrete source-text file view which mounts the existing accessibly named CodeMirror editor without defining Markdown rendering policy.                                      |
| LN-ED-003 | The editor demo MUST register source views for Markdown (`md`, `markdown`), text (`txt`, `text`), and JSON (`json`, `data`) through the real API plugin, view, extension, and editor-view registries.         |
| LN-ED-004 | Markdown in this slice MUST remain source-only; reading mode, live preview, rendered Markdown parity, embeds, metadata, and link semantics are excluded.                                                      |
| LN-ED-005 | The API-owned design-core settings controller MUST load and save through API configuration atomically, preserve unrelated configuration, and avoid controller/configuration feedback loops.                   |
| LN-ED-006 | API editor-view contributions MUST be mirrored into the API-owned design-core registry so editor-association settings use live registered views.                                                              |
| LN-ED-007 | The demo MUST adapt design-core Explorer to the API vault for listing, active-file selection, create, open, rename, move, delete, and persisted auto-reveal while excluding hidden configuration/trash trees. |
| LN-ED-008 | The empty landing view MUST expose functional Create note and Go to file actions; Close MUST use the design-core leaf action. Recent-file tracking is excluded.                                               |
| LN-ED-009 | Startup MUST report real vault, configuration, required-plugin, and layout tasks, present required-plugin failure, and provide deterministic retry teardown.                                                  |
| LN-ED-010 | Two CodeMirror views for the same file MUST synchronize transactions immediately and persist one debounced target-file update; different files MUST remain independent.                                       |
| LN-ED-011 | Storybook MUST provide one runnable demo plus focused source-editor, Explorer, settings, loading, failure, and opening-vault scenarios from one canonical in-memory seed.                                     |
| LN-ED-012 | New or touched component paint MUST use design-core composition, native CSS, public `--ui-*` tokens, and semantic `data-ui-*` hosts without Tailwind utility strings.                                         |
| LN-ED-013 | The default source editor shell MUST compose `@lapismd/mira` base CodeMirror extensions with the Obsidian theme as the default editor appearance; Markdown language packs remain source-only syntax highlighting and MUST NOT enable Mira live-preview, toolbars, or rich Markdown surfaces in this slice. |

## Ownership

Reusable storage, source-view, configuration, and registry behavior belongs to
`@lapis-notes/api`. Generic startup presentation belongs to design-core. The
Lapis source-editor and Explorer plugins remain Storybook-local intake fixtures
until a production host/plugin package is separately specified and recorded in
`MIGRATION.md`. `@lapis-notes/workspace` remains the thin shell host.

## Demo lifecycle

The fixture registers required core plugin types before configuration loading,
then loads the vault, configuration, required plugins, and workspace layout in
that order. The shell is mounted only after success. Retry disposes the partial
app and creates a fresh app from the canonical seed.

The in-memory adapter is deliberately volatile: data survives normal actions
and controller restarts within one story instance but resets on remount.

## Implementation status

The API foundation and Storybook intake are implemented: public volatile
storage, the source-only text view, atomic configuration batches, controller
configuration reconciliation, exact editor-registry mirroring, required
source-editor and Explorer plugins, the staged startup runner, canonical seed,
and focused acceptance scenarios. The source editor shell consumes Mira base
CodeMirror extensions with Obsidian theme tokens. Visual baselines remain
pending human review.
