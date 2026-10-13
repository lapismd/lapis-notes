# History Plugin / Context

`@lapis-notes/history` owns vault file-revision capture, the movable History
panel, and the main-area compare tab. Persistence remains the existing
`AppDatabase` file-history contract. This plugin is not AI conversation
history.
The governed real-App shell loads the public Source Editor before Markdown;
History does not carry a Storybook-only editor fixture.
History panel acceptance waits for its registered view and owned database
projection, then asserts the active compare surface without relying on a
duplicate hidden panel instance.

## Runtime flow

```text
vault create / modify / rename / delete
        ↓
HistoryPlugin tracking + merge window
        ↓
AppDatabase.getFileHistory / storeFileHistoryRevision
        ↓
history command panel → history-compare tab
        ↓
FileDiff or MergeEditor → vault write
```

The plugin owns capture policy, settings, and presentation. It does not own
Turso drivers, workspace layout, or AI conversation files. The canonical
palette opener is `History: Open file history` (`history:open-file-history`).

- The History panel chrome is an Explorer-style icon toolbar.

- It uses the legacy compare icons (`git-compare`, `git-compare-arrows`) plus restore, and it omits an in-panel title and file path.

- Timeline markers use `git-commit-vertical`; the selected revision fills that marker.

- The panel consumes `--ui-workspace-view-*` so ungrouped sidebars keep panel paint.

- Compare FileDiff and MergeEditor keep Design Core typography: chrome inherits the view font, and code uses `--ui-diff-mono` bound to `--studio-font-mono`.

- The compare chrome lists the selected revision on its own row with File Change Stats on the trailing edge, then an Explorer-style icon toolbar.

- It omits the file path and close control, keeps the chrome bottom border, and flushes Diff card radius.

- The compare tab header shows `History` plus parent-path segments and the filename title; History opens or reveals the History panel.

- `Plugins/History/Shell` is the full-app Desktop and Mobile catalog family.

- Live-file compare enables MergeEditor scroll sync.

- FileDiff and MergeEditor fill the compare body through Design Core ScrollArea so unwrapped horizontal scrollbars sit just above the workspace footer.

- Unified and split FileDiff share one toolbar toggle whose icon follows the current view.

- Wrap text is a pressed toggle that wraps long FileDiff and MergeEditor lines.

- The plugin registers a Design Core History settings section for exclude/include globs, tracked extensions, and capture caps.
