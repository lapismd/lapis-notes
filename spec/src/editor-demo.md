# Lapis Editor Demo

## Requirements

| ID        | Requirement                                                                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-ED-001 | `@lapis-notes/api` MUST export a complete non-persistent `MemoryVaultAdapter` for deterministic tests, Storybook demos, and consumers that explicitly choose volatile storage.                                                        |
| LN-ED-002 | `@lapis-notes/api` MUST export a concrete source-text file view which mounts the existing accessibly named CodeMirror editor without defining Markdown rendering policy.                                                              |
| LN-ED-003 | The editor demo MUST register source views for text (`txt`, `text`) and JSON (`json`, `data`) through the Storybook source-editor plugin; Markdown associations MUST be owned by `@lapis-notes/markdown` when that plugin is enabled. |
| LN-ED-004 | While only the source-editor demo plugin is enabled, Markdown MUST remain source-only. When `@lapis-notes/markdown` is enabled it MUST own Markdown with Mira `source`, `live-preview`, and `preview` modes.                          |

| LN-ED-005 | The API-owned design-core settings controller MUST load and save through API configuration atomically, preserve unrelated configuration, and avoid controller/configuration feedback loops. |
| LN-ED-006 | API editor-view contributions MUST be mirrored into the API-owned design-core registry so editor-association settings use live registered views. |
| LN-ED-007 | The demo MUST adapt design-core Explorer to the API vault for listing, active-file selection, create, open, rename, move, delete, and persisted auto-reveal while excluding hidden configuration/trash trees. |
| LN-ED-008 | The empty landing view MUST expose functional Create note and Go to file actions; Close MUST use the design-core leaf action. Recent-file tracking is excluded. |
| LN-ED-009 | Startup MUST report real vault, configuration, required-plugin, and layout tasks, present required-plugin failure, and provide deterministic retry teardown. |
| LN-ED-010 | Two CodeMirror views for the same file MUST synchronize transactions immediately and persist one debounced target-file update; different files MUST remain independent. |
| LN-ED-011 | Storybook MUST provide one runnable demo plus focused source-editor, Explorer, settings, loading, failure, and opening-vault scenarios from one canonical in-memory seed. |
| LN-ED-012 | New or touched component paint MUST use design-core composition, native CSS, public `--ui-*` tokens, and semantic `data-ui-*` hosts without Tailwind utility strings. |
| LN-ED-013 | The default source editor shell MUST compose `@lapismd/mira` base CodeMirror extensions with the Obsidian theme through the linked package's built public exports, without a Storybook or Vite source alias. Source-editor Markdown language packs remain source-only. Rich Mira surfaces MUST be provided only by `@lapis-notes/markdown` when that plugin is enabled. |
| LN-ED-019 | The editor demo MUST register core plugins in order: required source-editor, then `@lapis-notes/markdown` (`enabledByDefault: true`, exclusive markdown associations), then Tags (`enabledByDefault: true`). |
| LN-ED-020 | Storybook MUST provide focused `Workspace/Panels/Markdown/*` stories for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags, plus editor-demo integration coverage for Markdown modes and Markdown/Mira settings. All Properties MUST additionally demonstrate the real panel without a visible Markdown leaf in middle top tabs, stacked tabs, both sidebars, a grouped bottom panel, and a sidebar group. Its Autodocs component contract MUST expose only the real `app: App` input, never the Storybook-only panel kind or layout selectors. These movable-panel fixtures MUST inherit design-core's resolved Workspace view paint, assert the stable destination host and `WorkspaceViewHost`, and remain free of panel-owned placement selectors or runtime leaf-parent inspection. |
| LN-ED-021 | Every focused Markdown panel MUST use a nested `Workspace/Panels/Markdown/<Panel>` group with the same six movable surfaces as All Properties. Vault-wide panels omit the Markdown document; file-scoped panels retain exactly one minimal active Markdown leaf. A focused File Properties interaction MUST resize its owning workspace split through the real controller below Mira's 250px breakpoint, restore that layout in all outcomes, and assert full-row stacking, label-aligned values, and no horizontal viewport overflow. It MUST NOT constrain the component root or editor content directly. The legacy dual-panel comparison fixture MUST NOT remain catalog authority. |
| LN-ED-022 | The API editor's design-core `ScrollArea` root MUST fill and remain bounded by its owning `WorkspaceViewHost`, leaving its viewport as the sole vertical scroll owner when a source or Markdown document is taller than its pane. The nested CodeMirror scroller MUST expand with its content without painting another vertical scrollbar. Focused Storybook acceptance MUST prove full-height ownership, one usable long-document scroll range, and a changed scroll position in both top-tab and stacked-tab workspace placements. |
| LN-ED-023 | Focused Backlinks and Outgoing Links acceptance MUST open the Design Core Hover Card and verify that it resolves to the panel-specific 26rem default width, contains the public app-bound `FileEmbed` and an embedded Markdown surface rather than duplicated private preview copy or a synthetic guided `internal-embed` wrapper. The complete mention row MUST be the native clickable/focusable trigger. Acceptance MUST resize the real owning split so the preview crosses a pane boundary, then prove owner-document body placement, viewport containment, collision adaptation without a fixed side, and topmost hit testing over the adjacent editor. It MUST move the pointer from the mention into the preview beyond the 300ms close delay and prove that the embedded content remains open and interactive. |
| LN-ED-024 | Focused Outgoing Links middle-top-tabs acceptance MUST also hover the ordinary internal note link rendered inside `Welcome.md`. Mira's portable preview content MUST be mounted under the trigger document body, retain its 28rem viewport-capped size and embedded Markdown content, cross the workspace split without clipping, and remain the topmost hit target where it overlaps the adjacent Outgoing Links pane. |
| LN-ED-025 | Focused Outgoing Links middle-top-tabs acceptance MUST edit and persist both the ordinary `Welcome.md` internal-link preview and a panel-result `FileEmbed` preview. Each card MUST remain portaled, viewport-contained, topmost, and interactive across the constrained workspace split before and after its rendered content switches to toolbar-free live-preview CodeMirror. Escape MUST flush the latest buffer before returning to preview and closing the card. While editing, hover departure and focus movement MUST leave the card pinned; an outside pointer interaction MUST use the same persistence-safe exit before closing. |
| LN-ED-026 | Focused Outgoing Links acceptance MUST verify the shared minimal note-preview presentation: resolved ordinary and panel cards omit visible filename/path chrome, rendered Markdown retains disclosure-safe all-round padding, and editing adds a two-pixel focus-ring border. The panel card MUST omit the outer embed guide and expose only an accessible open-note action in a sticky top-right row that remains clear of scrolled content. |
| LN-ED-027 | Focused Outgoing Links middle-top-tabs acceptance MUST verify that ordinary Mira and panel `FileEmbed` live-edit surfaces both resolve an effective `obsidian` theme whose focus color matches design-core's Lapis workspace focus token. The nested frontmatter widget in each CodeMirror editor MUST retain zero inline padding so preview-only card inset does not move metadata away from the editor content column. The panel editor MUST be constrained by the preview viewport and expose real vertical overflow through its CodeMirror scroller, with no outer preview scrollbar. |
| LN-ED-014 | The source editor inline title MUST paint as a filename-sized editable title using native CSS and public editor tokens when `appearence.interface.showInlineTitle` is enabled, and MUST rename the open file through `fileManager.renameFile`. |
| LN-ED-015 | For file leaves, the API view bridge `getChrome` MUST contribute parent-path breadcrumbs and leaf history into the design-core tab title bar; breadcrumb selection MUST reveal the path in Explorer. |
| LN-ED-017 | For file leaves, the tab title bar final segment MUST be renameable in place through `getChrome` `titleEditable` / `onTitleCommit` → `fileManager.renameFile`, without hiding breadcrumbs. |
| LN-ED-016 | The editor demo canonical seed MUST enable `appearence.interface.showInlineTitle` and `appearence.interface.showTabTitleBar` so focused scenarios exercise the inline title and tab title bar without requiring Settings navigation. |
| LN-ED-018 | Source editors MUST expose `data-language` on the CodeMirror host, default the editor face to Mira monospace (`--mira-font-mono` / `--font-mono`), and override to the sans face for Markdown and plain text only. Non-Markdown languages use the configured CodeMirror fold gutter when fold settings are on; Markdown uses Mira's inline fold controls without the duplicate gutter. Focused Markdown acceptance MUST prove rendered frontmatter disclosure, source reveal, Source Code Pro YAML lines, and zero nested-preview note-column padding. |

## Ownership

Reusable storage, source-view, configuration, and registry behavior belongs to
`@lapis-notes/api`. Generic startup presentation belongs to design-core. The
Lapis source-editor and Explorer plugins remain Storybook-local intake fixtures.
`@lapis-notes/markdown` is the authorized plugin package (see
`markdown-plugin.md`). Tags remains a Storybook-local workspace-origin intake
beside markdown. `@lapis-notes/workspace` remains the thin shell host and does
not absorb the Tags plugin.

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
CodeMirror extensions with Obsidian theme tokens. File leaves contribute tab
title bar breadcrumbs, history, and in-place header rename through `getChrome`,
and the demo seed enables inline title and tab title bar visibility. Visual
baselines remain pending human review. Design-core resolves Workspace view paint
from the destination surface; Markdown and Storybook-local Tags panels consume
the resulting public view tokens so a moved view adopts its new paint without a
component remount or panel-owned placement logic.
