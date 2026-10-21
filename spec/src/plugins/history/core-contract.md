# History Plugin / History and comparison

Retained Mobile shell acceptance uses the published Design Core tab-dock name
`Open <count> tabs` while retaining the existing plugin and collapsed-sidebar
assertions.

## LN-HIST-001 — Sibling lapis-plugins repository: ship @lapis-notes/history at packages/history for static composition

<a id="ln-hist-001"></a>

**Requirement.** The sibling `lapis-plugins` repository MUST ship `@lapis-notes/history` at `packages/history` for static composition or registry installation. It MUST NOT reuse AI conversation-history view types or commands.

## LN-HIST-002 — History: capture vault create, modify, rename, delete,

<a id="ln-hist-002"></a>

**Requirement.** History MUST capture vault create, modify, rename, delete, and restore events into `AppDatabase` file-history tables only. It MUST NOT write snapshots into the vault, `.lapis/`, or `.lapis/`.

## LN-HIST-003 — Tracking: skip internal .lapis paths, glob excludes, binaries

<a id="ln-hist-003"></a>

**Requirement.** Tracking MUST skip internal `.lapis` paths, glob excludes, binaries, oversized files, and read failures. Defaults MUST be 256 KiB, 50 revisions, a 10s modify merge window, and the documented exclude globs. Empty include-glob and extension allowlists MUST track remaining UTF-8 text.

### Acceptance details

Tracking policy verifies:

- Default caps are 256 KiB, 50 revisions per file, a 10s modify merge window, and a short create/modify debounce.
- Default exclude globs are `.lapis/**`, `.lapis/**`, `**/.git/**`, and `**/.jj/**`.
- An empty include-glob list accepts remaining paths after excludes.
- An empty tracked-extension allowlist accepts remaining UTF-8 text; a small binary deny list is skipped.
- A modify inside the merge window replaces the latest same-path modify instead of appending.

## LN-HIST-004 — Plugin: register the history view through ViewAccess.command

<a id="ln-hist-004"></a>

**Requirement.** The plugin MUST register the `history` view through `ViewAccess.command` with `open-file-history` / `Open file history`. The opener MUST reveal an existing instance wherever it was moved or create, activate, and reveal the default right sidebar.

## LN-HIST-005 — Internal history-comparison view

<a id="ln-hist-005"></a>

**Requirement.** The plugin MUST register `history-compare` through `ViewAccess.internal` and reuse one main-area tab. Previous or selected-pair compares MUST use Design Core FileDiff. Live-file compare MUST use one-way MergeEditor. Restore and apply MUST write through the vault API, record a restore revision, and suppress the next matching-hash modify.

### Acceptance details

Compare and restore verify:

- FileDiff receives earlier and later snapshot texts ordered by `createdAt` and may use unified or split view from one toolbar toggle whose icon follows the current selection.
- MergeEditor one-way places the selected revision on the left and the live file on the right.
- Apply persists `onResolvedChange.content` only after an explicit user action.
- Whole-file restore writes through `vault.modify` or `vault.create` and records a `restore` event.
- Compare chrome keeps only its bottom border, places File Change Stats on the trailing edge of the revision row, and flushes embedded FileDiff and MergeEditor top, start, and end borders and radius.
- Wrap text is a pressed toggle that sets Design Core `wrap` and wraps long compare lines.
- Embedded FileDiff and MergeEditor MUST fill the compare body through Design Core ScrollArea so unwrapped horizontal scrollbars sit just above the workspace footer.

## LN-HIST-006 — Storybook: demonstrate the real History panel in all

<a id="ln-hist-006"></a>

**Requirement.** Storybook MUST demonstrate the real History panel in all six governed placements and a compare story covering FileDiff, MergeEditor, select-for-compare, restore, and History-leaf preservation. Docs source MUST use public `@lapis-notes/history` imports. New visuals MUST stay `visual-pending`.

## LN-HIST-007 — Deno desktop, web, editor-demo, and audited Storybook: register History as enabledByDefault: true and load

<a id="ln-hist-007"></a>

**Requirement.** Deno desktop, web, editor-demo, and audited Storybook hosts MUST register History as `enabledByDefault: true` and load it before metadata and layout restoration.

## LN-HIST-008 — Timeline context menu: offer Select for compare and Compare

<a id="ln-hist-008"></a>

**Requirement.** The timeline context menu MUST offer Select for compare and Compare with selected. The anchored revision MUST show a compare icon until cleared or the focused file changes. Compare with selected MUST stay disabled until a different revision is anchored and MUST open FileDiff of that pair.

## LN-HIST-009 — History-compare header: show a leading History breadcrumb plus parent-path

<a id="ln-hist-009"></a>

**Requirement.** The history-compare header MUST show a leading History breadcrumb plus parent-path segments of the compared file. The header title MUST be the filename and MUST NOT be editable. Selecting History MUST open or reveal the History panel for that file.

## LN-HIST-010 — Desktop and mobile History shells

<a id="ln-hist-010"></a>

**Requirement.** Storybook MUST provide `Plugins/History/Shell` Desktop and Mobile stories that boot a real App with Explorer on the left, a multi-section Welcome note plus its stored-pair compare in the main area, and History plus Search retained on the collapsed right. Docs source MUST use public `@lapis-notes/history` imports. New visuals MUST stay `visual-pending`.

## LN-HIST-011 — History: register a Design Core settings section titled

<a id="ln-hist-011"></a>

**Requirement.** History MUST register a Design Core settings section titled History under core-plugins. The section MUST expose exclude globs, include globs, tracked extensions, retention, size cap, merge window, and debounce. Values MUST persist through plugin data and apply to capture.

### Acceptance details

Settings registration verifies:

- `onload` registers a Design Core section titled History in the
  `core-plugins` navigation group, not only a legacy `PluginSettingTab`.
- Exclude globs, include globs, and tracked extensions are editable string
  lists. Defaults keep the documented excludes and empty include/extension
  allowlists.
- Retention, size cap, merge window, and debounce remain editable capture
  caps. Changing a field persists through plugin `saveData` and updates
  tracking.
- `Plugins/History/Shell` Desktop opens Settings, selects History, and
  proves exclude/include lists plus persisted plugin data.
