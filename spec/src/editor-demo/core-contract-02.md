# Lapis Editor Demo / Editor scenarios / Part 2

## LN-ED-053 — API editors and command scopes: retain their owning App for persistence, workspace

<a id="ln-ed-053"></a>

**Requirement.** API editors and command scopes MUST retain their owning App for persistence, workspace events, extensions, telemetry, and hotkey dispatch. An explicit or inherited owner MUST win when the compatibility alias references another App.

## LN-ED-054 — Reusable Explorer sidebar: declare its canonical ViewAccess.command opener, preserve

<a id="ln-ed-054"></a>

**Requirement.** The reusable Explorer sidebar MUST declare its canonical `ViewAccess.command` opener, preserve the `lapis-file-explorer` runtime identity, and use the concise `Explorer` display prefix in the command palette.

## LN-ED-055 — Storybook Explorer placement plays: open a file-row context menu on

<a id="ln-ed-055"></a>

**Requirement.** Storybook Explorer placement plays MUST open a file-row context menu on the in-memory vault and assert that native copy, open, and reveal extras are absent.

## LN-ED-056 — Editor demo play: assert the Word Count status item

<a id="ln-ed-056"></a>

**Requirement.** The editor demo play MUST assert the Word Count status item for the seeded Welcome note, show reading time on click, and MUST NOT use compatibility status DOM.

## LN-ED-057 — Editor demo: seed a long-form loft-boarding Markdown note

<a id="ln-ed-057"></a>

**Requirement.** The editor demo MUST seed a long-form loft-boarding Markdown note and open it in a focused Markdownlint story that reveals Problems. Published diagnostics MUST stay unique by code and range. The story MUST keep literal `visual-pending` metadata and MUST NOT create a baseline.

## LN-ED-058 — Editor Settings story: open the Markdown Lint section, show

<a id="ln-ed-058"></a>

**Requirement.** The Editor Settings story MUST open the Markdown Lint section, show the seeded MD013 disable and default file globs, and persist a setting change to `.obsidian/app.json`. The same vault setting MUST govern the plugin's worker and native desktop adapters.

## LN-ED-059 — Editor demo: seed a misspelled note and open it

<a id="ln-ed-059"></a>

**Requirement.** The editor demo MUST seed a misspelled note and open it in a focused Spell Check story that reveals Problems. Acceptance MUST assert a gutter mark, the severity-slot Quick fix, a bare suggestion, Add to dictionary, and Ignore word. The story MUST keep literal `visual-pending` metadata and MUST NOT create a baseline.

## LN-ED-060 — Editor demo Ready play: open the Spell Check status item

<a id="ln-ed-060"></a>

**Requirement.** The editor demo Ready play MUST open the Spell Check status item and show dialect choices plus a checking toggle. It MUST NOT use compatibility status DOM.

## LN-ED-061 — Source and Live Preview editors: keep the complete Design Core scrollbar interaction

<a id="ln-ed-061"></a>

**Requirement.** Source and Live Preview editors MUST keep the complete Design Core scrollbar interaction rail above adjacent workspace resize handles. Focused acceptance MUST assert that priority on the real API editor surface.

## LN-ED-062 — Editor demo: seed and open a YAML file

<a id="ln-ed-062"></a>

**Requirement.** The editor demo MUST seed and open a YAML file from the Files command-palette provider through the production Source Editor, expose YAML as an editor association, and verify the `yaml` CodeMirror language host for both `.yaml` and `.yml` associations.

## LN-ED-014 — Source editor inline title: paint as a filename-sized editable title using

<a id="ln-ed-014"></a>

**Requirement.** The source editor inline title MUST paint as a filename-sized editable title using native CSS and public editor tokens when `appearence.interface.showInlineTitle` is enabled, and MUST rename the open file through `fileManager.renameFile`.

## LN-ED-015 — File-view breadcrumbs and history

<a id="ln-ed-015"></a>

**Requirement.** For file leaves, the API view bridge `getChrome` MUST contribute parent-path breadcrumbs and leaf history into the design-core tab title bar; breadcrumb selection MUST reveal the path in Explorer.

## LN-ED-017 — For file leaves, the tab title bar: renameable in place through getChrome titleEditable /

<a id="ln-ed-017"></a>

**Requirement.** For file leaves, the tab title bar final segment MUST be renameable in place through `getChrome` `titleEditable` / `onTitleCommit` → `fileManager.renameFile`, without hiding breadcrumbs.

## LN-ED-016 — Editor demo canonical seed: enable appearence.interface.showInlineTitle and appearence.interface.showTabTitleBar so focused scenarios

<a id="ln-ed-016"></a>

**Requirement.** The editor demo canonical seed MUST enable `appearence.interface.showInlineTitle` and `appearence.interface.showTabTitleBar` so focused scenarios exercise the inline title and tab title bar without requiring Settings navigation.

## LN-ED-018 — Source editors: expose data-language on the CodeMirror host, default

<a id="ln-ed-018"></a>

**Requirement.** Source editors MUST expose `data-language` on the CodeMirror host, default the editor face to Mira monospace (`--mira-font-mono` / `--font-mono`), and override to the sans face for Markdown and plain text only. Non-Markdown languages use the configured CodeMirror fold gutter when fold settings are on; Markdown uses Mira's inline fold controls without the duplicate gutter. Focused Markdown acceptance MUST prove rendered frontmatter disclosure, source reveal, Source Code Pro YAML lines, and zero nested-preview note-column padding.
