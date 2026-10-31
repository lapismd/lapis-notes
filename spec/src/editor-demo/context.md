# Lapis Editor Demo / Context

Notes selects published Bits UI `2.20.2` with the approved composed lifecycle
patch documented in [package integration](../packages/core-contract.md).
Dependency-originated Svelte diagnostics remain fatal, including diagnostics
retained after story teardown when component cleanup catches the exception.

The editor demo consumes released Design Core and Mira through portable npm
ranges and the committed lockfile. API and Workspace acceptance exercises their
public App and workspace contracts; package integration owns the current cohort
and its separate source, registry and consumer evidence.

The demo shares the qualified Svelte renderer graph under LN-PKG-149. Provider
readiness refreshes already-open editor diagnostics through LN-WS-094 without
changing document content or persistence.

The demo resolves its Design Core presentation through the same portable npm
range and committed lockfile as the production hosts.

The real-App demo consumes the application-owned Notes profile, so API-registered
Markdown contributions and the full-file provider exercise the same lifecycle
and public package boundary as production hosts. The provider establishes the
effective Mira `obsidian` theme before it mounts preview or live-edit content.

Public `MarkdownEmbed` applies the enabled Markdown plugin's App Mira
extensions so string previews, including AI chat, match editor settings.
Markdown metadata extraction now preserves nested YAML maps used by later
task projections.
The real Editor Settings and Markdown Frontmatter scenarios also verify the
flat frontmatter and inline-outline defaults defined by LN-MD-108 and LN-MD-109.
Markdown Reading Outline keeps the inline outline centered in the visible
Reading pane and clear of body content as required by LN-MD-110.
The Markdown Frontmatter scenario also exercises vault-backed value completion
through the real Live Preview surface, including a suggestion supplied by a
different seeded note and a dropdown portalled outside the property row.
Editor-demo interaction probes wait for CodeMirror measurement after expanding
block widgets and explicitly flush queued editor persistence before asserting
the one-write contract. Teardown disposes only runtimes that actually started.

The real demo loads the production Markdown plugin, so panel commands come
from the same declarative registry as production. Story fixtures MUST NOT add
parallel commands to compensate for a missing plugin registration.
The real-agent seed is a separate ignored developer fixture. Its added search
and patch-target notes do not enter or modify the editor demo's canonical
in-memory seed, governed Storybook scenarios, or visual baselines.
Editor, embedded-editor, Scope, command, autocomplete, and persistence paths
receive their App from the owning view or explicit constructor state. Focused
multi-App evidence keeps a conflicting compatibility alias installed while the
owner still receives events, extensions, telemetry, hotkeys, and writes.

## Ownership

- Reusable storage, source-view, configuration, and registry behavior belongs to `@lapis-notes/api`.

- Generic startup presentation belongs to design-core.

- The Lapis source-editor remains a Storybook-local intake fixture.

- File Explorer is owned by `@lapis-notes/file-explorer`.

- Its `selectedPath` and `file-explorer:selection-change` event remain the public selection surface for other plugins.

- `@lapis-notes/markdown` owns document behavior and reuses one `MiraFileAdapter` per App so ordinary-link previews and File Properties wikilink pills survive workspace split resize.

- The enabled `@lapis-notes/markdown-lint` plugin contributes diagnostics only and exposes seeded rule and glob Settings.

- `@lapis-notes/spellcheck` contributes Harper diagnostics after non-blocking warmup, Settings, and a Lucide status item that refreshes from configuration rather than `layout-change`.

- Markdown owns the Tags view.

- Shared panel presentation is specified under `workspace-shell/panels.md`.

- The Markdown Problems scenario also verifies that Design Core renders the live diagnostic total in the owning leaf badge without changing its stored title or duplicating the total inside the panel.

- The Markdownlint loft-boarding scenario seeds a long-form note so list-style and indent messages can be inspected without publishing the same code and range twice, and without the MD013 line-length warnings vscode-markdownlint disables by default.

- Tree listings show those vscode-style rule-path messages and copy a problem or group as JSON.

- Desktop parity comes from the same plugin-owned provider and vault rule map, not an additional host provider with default rules.

- `@lapis-notes/workspace` remains the thin shell host.

## Demo lifecycle

The fixture registers required core plugin types before configuration loading,
then loads the vault, configuration, required plugins, and workspace layout in
that order. The shell is mounted only after success. Retry disposes the partial
app and creates a fresh app from the canonical seed.

The in-memory adapter is deliberately volatile: data survives normal actions
and controller restarts within one story instance but resets on remount.

## Implementation status

- The API foundation and Storybook intake are implemented: public volatile storage, the source-only text view, atomic configuration batches, controller configuration reconciliation, exact editor-registry mirroring, required source-editor and Explorer plugins, the staged startup runner, canonical seed, and focused acceptance scenarios.

- The editor demo registers Spell Check after Markdownlint; a Harper setup failure appears as a workspace-wide Problems row and does not fail plugin enablement (LN-SPL-008).

- The source editor shell consumes Mira base CodeMirror extensions with Obsidian theme tokens.

- File leaves contribute tab title bar breadcrumbs, history, and in-place header rename through `getChrome`, and the demo seed enables inline title and tab title bar visibility.

- Visual baselines remain pending human review.

- Design-core resolves Workspace view paint from the destination surface; Markdown-owned Tags and the reusable Explorer consume the resulting public view tokens so a moved view adopts its new paint without a component remount or component-owned placement logic.

- The landing view identifies its empty state as page content and therefore matches the white body view in the default theme.

- Compatibility view actions and pane-menu contributions flow through `WorkspaceViewChrome`, so Markdown mode controls use the same title-bar and menu surfaces as other design-core views.

- The public `ExplorerPanel` export is exercised through the registered Explorer view in the shared command-panel harness; the editor demo remains the source of its real in-memory vault and mutation controller rather than a duplicate panel fixture.

- Markdown `notes_list` and API file tools reuse the same Vault contract but remain outside editor surface state: list and read calls do not open a leaf, and approved `edit` / `write` / `apply_patch` writes go through Vault without routing through the demo editor controller.

- Their MCP descriptions steer agents to those vault tools instead of host-cwd shell commands (LN-AI-108).

- Markdown metadata parse runs in a worker.

- The Workspace/Shell NotificationCenter play starts Lapis metadata `withProgress` and asserts the notifications status item is busy with that title.

- File-scoped Markdown panels in the demo follow the same late `loaded` and path-changing `file-open` refresh as production hosts.

- Same-path leaf events do not rewrite panel state.

- The Markdown metadata worker import stays extensionless in packaged output used by Vite hosts.

- Linked Backlinks and Outgoing Links obtain bounded source paths from indexed incoming or outgoing link queries and hydrate only those per-file metadata rows.

- The shared panel demo seeds core metadata and Search projections before marking the shell ready.

- Governed metadata panels therefore prove persisted initial paint, live modify or rename invalidation, and visible query failure/recovery against the same AppDatabase contract used by production.
