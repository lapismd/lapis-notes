# ED verification

<!-- prettier-ignore -->
| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-ED-001 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-001) | Implemented | public `MemoryVaultAdapter`; binary, metadata, filesystem, collision tests |
| LN-ED-002 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-002) | Implemented | public `SourceTextFileView`; lifecycle, data, extension, search, and Storybook axe coverage |
| LN-ED-003 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-003) | Implemented | production Source Editor owns text/JSON across the real-App demo and both production hosts; Markdown remains owned by `@lapis-notes/markdown` |
| LN-ED-004 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-004) | Implemented | source-only without markdown plugin; Mira modes when `@lapis-notes/markdown` enabled |
| LN-ED-005 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-005) | Implemented | atomic batch/preservation tests and loop-free controller persistence |
| LN-ED-006 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-006) | Implemented | live controller registry mirroring, pattern updates, and disposal |
| LN-ED-007 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-007) | Implemented | API-vault Design Core Explorer adapter, mutation play, and persisted show-hidden files |
| LN-ED-008 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-008) | Implemented | Create note, Go to file on the blank-until-query Files tab, and design-core Close landing actions |
| LN-ED-009 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-009) | Implemented | real startup tasks, required-plugin failure, teardown, retry, and block-toolbar portal cleanup acceptance |
| LN-ED-010 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-010) | Implemented | same-file transaction sync, single debounce write, and independent-file play |
| LN-ED-011 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-011) | Implemented | eight focused scenarios from one seed inherit the shared isolated 700px padding-free shell Docs viewport and render their canonical descriptions |
| LN-ED-012 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-012) | Implemented | native CSS and design-core composition; no-Tailwind gate |
| LN-ED-013 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-013) | Implemented | Mira base shell for source editor; rich Mira via markdown plugin |
| LN-ED-014 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-014) | Implemented | editable inline title CSS/tokens and rename through fileManager |
| LN-ED-015 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-015) | Implemented | getChrome breadcrumbs/history plus Explorer reveal-path command |
| LN-ED-016 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-016) | Implemented | demo seed enables showInlineTitle and showTabTitleBar |
| LN-ED-017 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-017) | Implemented | tab title bar in-place rename through getChrome onTitleCommit |
| LN-ED-018 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-018) | Implemented | data-language hosts; mono default; md/text sans; Markdown inline folding, frontmatter source typography, disclosure, and embedded-preview geometry |
| LN-ED-019 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-019) | In progress | Shared app-profile test proves the four-plugin order excluding parked Community; Lapis Storybook profile integration remains pending. |
| LN-ED-020 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-020) | Implemented | focused stories cover all Markdown panels plus Markdown mode and Mira-setting integration |
| LN-ED-021 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-021) | Implemented | nested six-surface panel groups use minimal document context according to panel scope |
| LN-ED-022 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-022) | Implemented | API editor ScrollArea fills its view; Backlinks, Outgoing top/stacked contexts, and a linked Roles Markdown leaf assert one usable outer long-document scroll range |
| LN-ED-023 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-023) | Implemented | Backlinks/Outgoing Hover Card acceptance asserts public FileEmbed/Mira surfaces, real split constraint, collision/viewport bounds, owner-document placement, topmost hit testing, and interactive pointer handoff |
| LN-ED-024 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-024) | Implemented | Outgoing Links middle-top-tabs acceptance asserts Mira internal-link owner-document placement, viewport-capped geometry, split crossing, and topmost adjacent-pane paint |
| LN-ED-025 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-025) | Implemented | Outgoing Links middle-top-tabs edits and persists both ordinary-link and panel FileEmbed previews while retaining cross-pane overlay geometry |
| LN-ED-026 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-026) | Implemented | ordinary and panel preview acceptance asserts headerless padded chrome, no synthetic panel embed guide, sticky open action, and two-pixel editing border |
| LN-ED-027 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-027) | Implemented | ordinary and panel preview editors assert inherited Obsidian/Lapis focus paint, unpadded nested frontmatter geometry, and panel CodeMirror-owned vertical overflow |
| LN-ED-028 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-028) | Implemented | All Properties runs in six surfaces without a visible Markdown leaf |
| LN-ED-029 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-029) | Implemented | All Properties Autodocs exposes only its real app input |
| LN-ED-030 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-030) | Implemented | movable-panel fixtures assert design-core placement and resolved view paint |
| LN-ED-031 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-031) | Implemented | Outline acceptance covers mixed-depth leaves, branches, guides, alignment, and trailing geometry |
| LN-ED-032 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-032) | Implemented | Tags acceptance covers hash, disclosure, depth, muted paint, parent alignment, and count geometry |
| LN-ED-033 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-033) | Implemented | File Properties acceptance resizes the real split, restores it, and asserts narrow stacking without overflow |
| LN-ED-034 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-034) | Implemented | legacy dual-panel comparison fixture is not a catalog authority |
| LN-ED-035 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-035) | Implemented | Markdown Authoring story and pointer acceptance exercise the complete Mira stack and optional surfaces |
| LN-ED-036 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-036) | Implemented | Ready acceptance asserts the landing empty state uses page paint and matches its owning body ViewHost |
| LN-ED-037 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-037) | Implemented | design-core Explorer consumes resolved view paint; source and consumer stories assert root and toolbar follow their owning surface |
| LN-ED-038 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-038) | Implemented | API workspace tests and Markdown Authoring acceptance verify compatibility view actions in design-core title-bar chrome |
| LN-ED-039 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-039) | Implemented | API workspace tests verify pane-menu translation, metadata, nested provider menus, and callbacks |
| LN-ED-040 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-040) | Implemented | API workspace tests verify translated view contributions precede generic split, move, and close actions |
| LN-ED-041 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-041) | Implemented | Markdown Authoring acceptance verifies borderless Reading paint, View-first ordering, toolbar toggling, and persisted toolbar settings |
| LN-ED-042 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-042) | Implemented | Editor Settings acceptance verifies separate Markdown and Features sections plus dotted-key persistence without a group object. Design Core 0.4.0 acceptance waits for persisted divider enablement, reveals the virtualized divider through the public editor API, and waits for all four language options to be visible. |
| LN-ED-043 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-043) | Implemented | runnable demo registers Markdownlint and exercises open-note gutter, Problems, navigation, fix, and clearing acceptance |
| LN-ED-044 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-044) | Implemented | Storybook and Deno desktop consume the same built public File Explorer package boundary and Markdown-owned Tags view; release checks reject non-semver publishable manifests |
| LN-ED-045 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-045) | Implemented | real Search plugin panel demo boot and index refresh |
| LN-ED-046 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-046) | Implemented | Ready story closes the final sidebar, verifies stable 700px editor width, and restores the shell state |
| LN-ED-047 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-047) | Implemented | Ready story proves single-click reuse/current replacement, double-click reuse-or-create, and Command-click forced creation |
| LN-ED-048 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-048) | Implemented | WorkspaceShell unit and Editor Settings acceptance verify the false default, live renderer mapping, and persisted toggle |
| LN-ED-049 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-049) | Implemented | one canonical descriptor list supplies the Editor schema and rendered fields; Storybook verifies every description |
| LN-ED-050 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-050) | Implemented | API unit and package checks cover registered extension composition and the source-shell fallback |
| LN-ED-051 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-051) | Implemented | API editor tests cover external persistence, pending-change flush, and unchanged file identity |
| LN-ED-052 | [editor-demo](../editor-demo/core-contract-01.md#ln-ed-052) | Implemented | API declarations expose a generic Markdown return target consumed through serialized leaf state |
| LN-ED-053 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-053) | Implemented | editor persistence, extensions, telemetry, and command scopes retain the owning App |
| LN-ED-054 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-054) | Implemented | Explorer command registration preserves its runtime ID while exposing `Explorer: Open Explorer` |
| LN-ED-055 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-055) | Implemented | Explorer placement plays open the Notes context menu and assert native copy/open/reveal extras are absent on the in-memory vault |
| LN-ED-056 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-056) | Implemented | editor demo Ready play opens Welcome.md, asserts Word Count status segments, and opens reading time on click |
| LN-ED-057 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-057) | Implemented | loft-boarding Markdownlint story opens the seeded note, reveals Problems, and asserts unique code-and-range diagnostics without a visual baseline |
| LN-ED-058 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-058) | Implemented | Editor Settings play opens Markdown Lint, asserts seeded MD013 and default globs, and persists a searched disabled-rule change; native adapter tests consume the same vault rule map |
| LN-ED-059 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-059) | Implemented | Spell Check story opens the misspelled note, reveals Problems, asserts Add/Ignore titles, and applies a bare Harper suggestion without a visual baseline |
| LN-ED-060 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-060) | Implemented | editor demo Ready play opens the Spell Check status item and asserts dialect choices plus a checking toggle |
| LN-ED-061 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-061) | Implemented | Markdown Frontmatter acceptance asserts the real API editor scrollbar remains above adjacent workspace resize handles |
| LN-ED-062 | [editor-demo](../editor-demo/core-contract-02.md#ln-ed-062) | Implemented | production Source Editor package tests plus the governed YAML Source story find `config.yaml` through the Files palette and verify YAML/YML associations, the YAML editor association, and the real `data-language="yaml"` CodeMirror host |
