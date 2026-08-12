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
| LN-ED-009 | Startup MUST report real vault, configuration, required-plugin, and layout tasks and present required-plugin failure. Retry and story teardown MUST synchronously destroy retained editors before asynchronous runtime disposal so HMR cannot retain editor-owned portals. |
| LN-ED-010 | Two CodeMirror views for the same file MUST synchronize transactions immediately and persist one debounced target-file update; different files MUST remain independent. |
| LN-ED-011 | Storybook MUST provide one runnable demo plus focused source-editor, Explorer, settings, loading, failure, and opening-vault scenarios from one canonical in-memory seed. Every full-shell Autodocs story in this family MUST use the shared LN-WS-013 isolated 700px padding-free shell viewport, and the authored MDX MUST identify every scenario and render its canonical story description before its canvas. |
| LN-ED-012 | New or touched component paint MUST use design-core composition, native CSS, public `--ui-*` tokens, and semantic `data-ui-*` hosts without Tailwind utility strings. |
| LN-ED-013 | The default source editor shell MUST compose `@lapismd/mira` base CodeMirror extensions with the Obsidian theme through the linked package's built public exports, without a Storybook or Vite source alias. Source-editor Markdown language packs remain source-only. Rich Mira surfaces MUST be provided only by `@lapis-notes/markdown` when that plugin is enabled. |
| LN-ED-019 | The editor demo MUST register core plugins in order: required source-editor, then `@lapis-notes/markdown` (`enabledByDefault: true`, exclusive markdown associations), then Tags (`enabledByDefault: true`). |
| LN-ED-020 | Storybook MUST provide focused panel stories for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags, plus editor-demo integration coverage for Markdown modes and Markdown/Mira settings. |
| LN-ED-021 | Every focused Markdown panel MUST use a nested `Workspace/Panels/Markdown/<Panel>` group with the six movable surfaces defined by All Properties. Vault-wide panels omit the document; file-scoped panels retain one minimal active Markdown leaf. |
| LN-ED-022 | The API editor's design-core `ScrollArea` root MUST fill and remain bounded by its owning `WorkspaceViewHost`, leaving its viewport as the sole vertical scroll owner when a source or Markdown document is taller than its pane. The nested CodeMirror scroller MUST expand with its content without painting another vertical scrollbar. Focused Storybook acceptance MUST prove full-height ownership, one usable long-document scroll range, and a changed scroll position in both top-tab and stacked-tab workspace placements. |
| LN-ED-023 | Focused Backlinks and Outgoing Links acceptance MUST verify constrained Design Core Hover Card behavior through the real mention trigger. |
| LN-ED-024 | Focused Outgoing Links middle-top-tabs acceptance MUST also hover the ordinary internal note link rendered inside `Welcome.md`. Mira's portable preview content MUST be mounted under the trigger document body, retain its 28rem viewport-capped size and embedded Markdown content, cross the workspace split without clipping, and remain the topmost hit target where it overlaps the adjacent Outgoing Links pane. |
| LN-ED-025 | Focused Outgoing Links middle-top-tabs acceptance MUST verify editable ordinary-link and panel-result previews through one persistence-safe scenario. |
| LN-ED-026 | Focused Outgoing Links acceptance MUST verify the shared minimal note-preview presentation: resolved ordinary and panel cards omit visible filename/path chrome, rendered Markdown retains disclosure-safe all-round padding, and editing adds a two-pixel focus-ring border. The panel card MUST omit the outer embed guide and expose only an accessible open-note action in a sticky top-right row that remains clear of scrolled content. |
| LN-ED-027 | Focused Outgoing Links middle-top-tabs acceptance MUST verify theme and scrolling parity across ordinary Mira and panel `FileEmbed` live-edit surfaces. |
| LN-ED-028 | All Properties MUST demonstrate its real panel without a visible Markdown leaf in middle top tabs, stacked tabs, both sidebars, a grouped bottom panel, and a sidebar group. |
| LN-ED-029 | All Properties Autodocs MUST expose only `app: App` and MUST NOT expose Storybook-only panel kind or layout inputs. |
| LN-ED-030 | Movable-panel fixtures MUST inherit design-core's resolved workspace-view paint, assert their destination and `WorkspaceViewHost`, and remain free of panel-owned placement detection. |
| LN-ED-031 | Outline placement acceptance MUST cover expandable and leaf siblings across multiple levels, chevron-aligned guides, unpadded leaves, parent-aligned leaf labels, visible indentation, and a shared trailing row edge. |
| LN-ED-032 | Tags placement acceptance MUST cover parent-aligned child-hash trailing edges, disclosure glyphs, depth alignment, muted hash paint, and the shared count edge. |
| LN-ED-033 | File Properties acceptance MUST resize the owning split below Mira's 250px breakpoint, restore it in all outcomes, and verify full-row stacking, label-aligned values, and no horizontal overflow. It MUST NOT constrain the component root or editor content directly. |
| LN-ED-034 | The legacy dual-panel comparison fixture MUST NOT remain a Storybook authority. |
| LN-ED-035 | The editor demo MUST include a focused Markdown Authoring story using the real in-memory app. Acceptance MUST cover selection formatting, slash insertion, block handles and pointer reordering, Live Preview heading controls, table editing, completion, smart paste, image attachment, truthful toolbar defaults, and opt-in Doodle Dividers. |
| LN-ED-036 | The editor demo landing view MUST identify `WorkspaceEmpty` as page content so its paint matches the owning body view and remains white in the default theme. |
| LN-ED-037 | The Explorer root and toolbar MUST consume design-core's resolved workspace-view foreground and background tokens. Direct sidebars use panel paint; body, bottom, grouped, floating, mobile, and standalone placements use workspace paint without component-owned placement logic. |
| LN-ED-038 | The API workspace bridge MUST project each compatibility view action into design-core `WorkspaceViewChrome`, preserving its stable identity, label, icon, disabled state, event, and callback. |
| LN-ED-039 | The API workspace bridge MUST translate compatibility `onPaneMenu` contributions into the shared design-core pane menu, preserving sections, separators, nested menus, labels, icons, checked and disabled states, and callbacks. |
| LN-ED-040 | The API workspace bridge MUST place translated compatibility pane-menu contributions before design-core's generic pane actions while preserving their internal section order. |
| LN-ED-041 | Focused Markdown Authoring acceptance MUST prove borderless Reading paint, View-first menu order, toolbar toggling, and persisted toolbar-driven editor settings. |
| LN-ED-042 | The real Editor Settings story MUST show separate Markdown and Features sections, toggle a representative feature, and verify its existing dotted key in `.obsidian/app.json`. It MUST verify that no `markdown.mira.features` group object is persisted. |
| LN-ED-043 | The runnable editor demo MUST register Markdownlint after Markdown and open the generic Problems view in the bottom dock for focused acceptance. Only currently open Markdown notes MUST contribute provider diagnostics. |

| LN-ED-014 | The source editor inline title MUST paint as a filename-sized editable title using native CSS and public editor tokens when `appearence.interface.showInlineTitle` is enabled, and MUST rename the open file through `fileManager.renameFile`. |
| LN-ED-015 | For file leaves, the API view bridge `getChrome` MUST contribute parent-path breadcrumbs and leaf history into the design-core tab title bar; breadcrumb selection MUST reveal the path in Explorer. |
| LN-ED-017 | For file leaves, the tab title bar final segment MUST be renameable in place through `getChrome` `titleEditable` / `onTitleCommit` → `fileManager.renameFile`, without hiding breadcrumbs. |
| LN-ED-016 | The editor demo canonical seed MUST enable `appearence.interface.showInlineTitle` and `appearence.interface.showTabTitleBar` so focused scenarios exercise the inline title and tab title bar without requiring Settings navigation. |
| LN-ED-018 | Source editors MUST expose `data-language` on the CodeMirror host, default the editor face to Mira monospace (`--mira-font-mono` / `--font-mono`), and override to the sans face for Markdown and plain text only. Non-Markdown languages use the configured CodeMirror fold gutter when fold settings are on; Markdown uses Mira's inline fold controls without the duplicate gutter. Focused Markdown acceptance MUST prove rendered frontmatter disclosure, source reveal, Source Code Pro YAML lines, and zero nested-preview note-column padding. |

### LN-ED-023 acceptance details

The constrained preview scenario verifies:

- The card uses the panel-specific 26rem width and contains the public app-bound `FileEmbed` and embedded Markdown surface, not duplicated preview markup or a synthetic guided wrapper.
- The complete mention row remains the native clickable and focusable trigger.
- Resizing the owning split proves owner-document placement, viewport containment, collision adaptation, and topmost hit testing across the adjacent editor.
- Pointer handoff into the preview beyond the 300ms close delay keeps its embedded content open and interactive.

### LN-ED-025 acceptance details

The editable-preview scenario verifies:

- Both the ordinary `Welcome.md` internal-link preview and a panel-result `FileEmbed` preview can edit and persist content.
- Each card remains portaled, viewport-contained, topmost, and interactive before and after entering toolbar-free live-preview CodeMirror.
- Escape flushes the latest buffer before returning to preview and closing the card.
- Hover departure and focus movement keep editing pinned, while outside pointer dismissal uses the persistence-safe exit.

### LN-ED-027 acceptance details

The live-edit parity scenario verifies:

- Both preview families resolve an effective `obsidian` theme whose focus color matches design-core's Lapis workspace focus token.
- Nested frontmatter widgets retain zero inline padding so preview-only inset does not move metadata away from the editor content column.
- The panel editor exposes vertical overflow through CodeMirror inside the preview viewport without an outer preview scrollbar.

## Ownership

Reusable storage, source-view, configuration, and registry behavior belongs to
`@lapis-notes/api`. Generic startup presentation belongs to design-core. The
Lapis source-editor and Explorer plugins remain Storybook-local intake fixtures.
`@lapis-notes/markdown` owns document behavior and the enabled
`@lapis-notes/markdown-lint` plugin contributes diagnostics only. Tags remains
a Storybook-local workspace-origin intake beside Markdown. Shared panel
presentation is specified under `workspace-shell/panels.md`;
`@lapis-notes/workspace` remains the thin shell host.

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
from the destination surface; Markdown, Storybook-local Tags, and Explorer
consume the resulting public view tokens so a moved view adopts its new paint
without a component remount or component-owned placement logic. The landing
view identifies its empty state as page content and therefore matches the white
body view in the default theme. Compatibility view actions and pane-menu
contributions flow through `WorkspaceViewChrome`, so Markdown mode controls use
the same title-bar and menu surfaces as other design-core views.
