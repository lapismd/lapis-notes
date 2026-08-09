# Markdown Plugin

## Requirements

| ID         | Requirement                                                                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-MD-001  | The repo MAY ship `@lapis-notes/markdown` at `packages/plugins/plugin-markdown` as the sole authorized plugin package until hosts/notebook/language-service are separately specified.                          |
| LN-MD-002  | `@lapis-notes/markdown` MUST register through the existing api `Plugin` surface (`registerView`, `registerEditorView`, `registerExtensions`, `registerEditorExtension`, commands, settings schema).         |
| LN-MD-003  | The Plugin triad (`plugin.ts`, `plugin-manager.ts`, `lapis-extension.ts`) MUST remain the authority; markdown MUST NOT introduce parallel loader, override-stack, or settings-framework APIs.               |
| LN-MD-004  | Markdown document rendering MUST be provided by linked Mira packages (`@lapismd/mira` / `@lapismd/mira-editor` and authorized Mira plugins) through their built public exports, without consumer-owned source aliases. Full-repo local `richEditor` / `MarkdownPreview` stacks MUST NOT be retained. |
| LN-MD-005  | When the markdown plugin is enabled it MUST own view type `markdown` with modes `source`, `live-preview`, and `preview`, View menu mode toggles, and leaf-state mode persistence from full-repo behavior. |
| LN-MD-006  | Lapis Path A (`EditorConfig` + `configuration` `"updated"`) and Path B (`registerEditorExtension` + `workspace.updateOptions` + `editor.updateExtensions`) MUST remain the extension reload authority.   |
| LN-MD-007  | Existing editor/workspace events (`"editor-updated"`, Editor `"change"`, `"file-change"` listeners, `"active-leaf-change"`, `"editor-menu"`, `"file-open"`) MUST remain wired; Mira MUST NOT replace them. |
| LN-MD-008  | The plugin MUST register side panels All Properties, File Properties, Outline, Backlinks, and Outgoing Links using the same view types and commands as full-repo `plugin-markdown`.                        |
| LN-MD-009  | Markdown settings MUST expose Mira feature and Mira plugin toggles (mermaid, AI) under a Markdown settings section via existing `configuration.schema` + settings-section APIs.                            |
| LN-MD-010  | Living parity vs full-repo MUST be tracked in `packages/plugins/plugin-markdown/PARITY.md` and linked from `MIGRATION.md`.                                                                                 |
| LN-MD-011  | Storybook MUST provide focused `Workspace/Panels/Markdown/*` stories for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags (Tags from workspace Tags intake, not folded into markdown). |
| LN-MD-012  | The editor demo MUST register the source-editor plugin first, then `@lapis-notes/markdown` (`enabledByDefault: true`, `priority: "exclusive"` for markdown associations), then Tags.                       |
| LN-MD-013  | The markdown `MetadataProcessor.write` contract MUST serialize the frontmatter object passed by `MetadataCache.writeFrontmatter` (the FM map itself), not a nested `{ frontmatter }` wrapper.              |
| LN-MD-014  | When enabled, the markdown plugin MUST register Lapis property type widgets (`unknown`, `text`, `number`, `checkbox`, `tags`, `aliases`, `multitext`, `date`, `datetime`, `array`, `object`) via existing `Plugin.registerTypeWidget`. |
| LN-MD-015  | Storybook / demo host boots that load markdown MUST call `metadataTypeManager.trackChanges()` (or an equivalent `watchMetadata` helper) after plugins load and dispose the watcher on teardown.             |
| LN-MD-016  | All Properties MUST provide sort menu, toggleable search, type icons from registered widgets, and property context actions (rename / change type / delete), using `@lapis-notes/ui/sidebar-custom` menu primitives (NestedProvider + Content/Menu/MenuButton) inside `MarkdownSidebarPanel` so default sidebar styling applies — without remounting `Sidebar.Root` in the leaf. |
| LN-MD-017  | File Properties MUST edit active-file frontmatter through registered type widgets and `updateFrontmatterProperty` / `processFrontMatter` (not a parallel save path).                                      |
| LN-MD-018  | Workspace markdown / Tags side panels MUST use shared `MarkdownSidebarPanel`: one `ScrollArea` with sticky in-viewport chrome (toolbar + optional `@lapis-notes/ui/search` with white control fill), panel-action hover tokens for toolbar icons (not ghost `--muted`), and shell layout tokens (`--markdown-sidebar-*`, `--header-height`). The default shell paint MUST be `--ui-workspace-background` (white in the light Lapis theme) for body, bottom-panel, and grouped-sidebar placement. Only an ungrouped top-level panel under design-core's stable `left-sidebar` or `right-sidebar` `data-workspace-surface` host may override that default with `--ui-workspace-panel`; the stable `workspace-sidebar-group` host resets its descendants to the default. Panels MUST NOT inspect or cache the runtime leaf parent to choose paint, so moving a leaf adopts its destination styling immediately. View `getIcon()` MUST return Lucide short names for `WorkspaceIcon` (All Properties: `archive`). Menu-style lists MAY wrap `sidebar-custom` NestedProvider without `Sidebar.Root`; simple lists use shell `__list` / `__row` helpers. |
| LN-MD-019  | File Properties MUST render Mira `FrontmatterEditor` driven by a Lapis `FrontmatterController` + `FrontmatterPropertyManager` adapter over `app.metadataTypeManager` (types, registered widgets, suggestions, rename/setType). The panel MUST NOT mount a parallel local property form as the editable authority. |
| LN-MD-020  | The All Properties Storybook spike MUST render the real `all-properties` view through the persisted workspace shell in each supported movable-panel surface: middle top tabs, stacked tabs, left sidebar, right sidebar, a grouped bottom panel, and a sidebar group. Each scenario MUST contain exactly one All Properties view, omit a visible Markdown document leaf, retain seeded metadata, and verify the panel's sort/search controls. |

## Ownership

Reusable Plugin/Editor contracts remain in `@lapis-notes/api`. Document markdown
rendering policy for enabled markdown lives in `@lapis-notes/markdown` and is
implemented by Mira. Side panels remain metadata UI intaken from full-repo.
Tags remain a separate workspace-origin plugin/fixture.

## Sidebar panel recipe

Canonical leaf chrome lives in `MarkdownSidebarPanel` (see
`packages/plugins/plugin-markdown/PARITY.md`). Do not fork sticky
search/toolbar geometry per view.

Surface by placement is CSS-only (required):

- Default (`body`, `bottom-panel`, `workspace-sidebar-group`, or no desktop
  surface ancestor) →
  `--ui-workspace-background`
- Top-level `[data-workspace-surface="left-sidebar"]` panel →
  `--ui-workspace-panel`
- Top-level `[data-workspace-surface="right-sidebar"]` panel →
  `--ui-workspace-panel`

Keep surface identity on the design-core destination host and view-host
backgrounds transparent. Do not inspect the workspace parent graph or pass a
placement boolean into the panel; CSS ancestry must update paint after a move.

View icons: return Lucide short names from `getIcon()` (All Properties =
`archive`). See PARITY.md icon table.
