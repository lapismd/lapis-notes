# HIST verification

<!-- prettier-ignore -->
| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-HIST-001 | [history-plugin](../plugins/history/core-contract.md#ln-hist-001) | Implemented | enabled-by-default `@lapis-notes/history` package path and distinct view/command ids from AI History |
| LN-HIST-002 | [history-plugin](../plugins/history/core-contract.md#ln-hist-002) | Implemented | vault-event capture writes only through AppDatabase file-history methods |
| LN-HIST-003 | [history-plugin](../plugins/history/core-contract.md#ln-hist-003) | Implemented | 256 KiB / 50-revision caps, 10s merge window, default `.lapis` `.lapis` `.git` `.jj` excludes, empty include-glob and extension allowlists |
| LN-HIST-004 | [history-plugin](../plugins/history/core-contract.md#ln-hist-004) | Implemented | `history` ViewAccess.command opener reveals or creates the default right-sidebar leaf |
| LN-HIST-005 | [history-plugin](../plugins/history/core-contract.md#ln-hist-005) | Implemented | reused `history-compare` tab; FileDiff for previous/selected pairs; MergeEditor one-way for live file; flushed compare frame; filled ScrollArea; wrap toggle; vault restore/apply |
| LN-HIST-006 | [history-plugin](../plugins/history/core-contract.md#ln-hist-006) | Implemented | six History placements plus compare story with public Show Code; visuals remain `visual-pending` |
| LN-HIST-007 | [history-plugin](../plugins/history/core-contract.md#ln-hist-007) | Implemented | Deno desktop, web, editor-demo, and audited Storybook hosts register History enabled by default before layout restore |
| LN-HIST-008 | [history-plugin](../plugins/history/core-contract.md#ln-hist-008) | Implemented | timeline Select for compare / Compare with selected, compare-icon anchor, and FileDiff of the selected pair |
| LN-HIST-009 | [history-plugin](../plugins/history/core-contract.md#ln-hist-009) | Implemented | compare header History-plus-path breadcrumbs; History crumb opens or reveals the History panel; filename title is not editable |
| LN-HIST-010 | [history-plugin](../plugins/history/core-contract.md#ln-hist-010) | Implemented | Plugins/History/Shell Desktop and Mobile boot Explorer-left, multi-section Welcome compare, History plus collapsed Search; public Show Code; visuals remain `visual-pending` |
| LN-HIST-011 | [history-plugin](../plugins/history/core-contract.md#ln-hist-011) | Implemented | Design Core History settings section under core-plugins exposes exclude/include globs, tracked extensions, and capture caps; plugin data persistence; History Shell Settings acceptance |
