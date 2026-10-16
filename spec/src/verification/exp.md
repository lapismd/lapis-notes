# EXP verification

<!-- prettier-ignore -->
| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-EXP-001 | [explorer-plugin](../plugins/explorer/index.md#ln-exp-001) | Implemented | file-explorer unit tests add From system root and As Lapis URL only for NativeDesktopVaultAdapter plus `file-system-actions`; Explorer placement plays assert those extras are absent on the memory vault |
| LN-EXP-002 | [explorer-plugin](../plugins/explorer/index.md#ln-exp-002) | Implemented | the same native menu tests add Open in default app and OS-labeled reveal; Storybook file-row context menus omit those items without the desktop capability |
| LN-EXP-003 | [explorer-plugin](../plugins/explorer/index.md#ln-exp-003) | Implemented | listEntries keeps dotted vault names; visibility helper, schema, settings, command, and toolbar persist `workspace.fileExplorer.showHiddenFiles` and reveal `.env` / `.lapis` |
| LN-EXP-004 | [explorer-plugin](../plugins/explorer/index.md#ln-exp-004) | Implemented | provider tests cover visible recent and lexical fallback caps, All-view provider cap, typed path queries, and hidden-file filtering; real loaded-plugin Storybook acceptance proves API actions and file starters both populate All |
| LN-EXP-005 | [explorer-plugin](../plugins/explorer/index.md#ln-exp-005) | Implemented | FileExplorerView exposes selectedPath and notifies file-explorer:selection-change |
| LN-EXP-006 | [explorer-plugin](../plugins/explorer/index.md#ln-exp-006) | Implemented | file-explorer subscription test refreshes on vault load, create, delete, and rename, then stops all refs |
| LN-EXP-007 | [explorer-plugin, editor-demo](../plugins/explorer/index.md#ln-exp-007) | Implemented | Explorer schema and Settings expose the flat extension list; unit tests cover YAML/YML defaults, normalized custom extensions, explicit exclusion, hidden `metadata.yaml`, and the governed YAML Source story opens `config.yaml` through Go to file |
| LN-EXP-008 | [explorer-plugin](../plugins/explorer/index.md#ln-exp-008) | In progress | 38 affected API cases, 28 Explorer cases and public checks/builds pass; [deletion evidence](../../records/2026-10-16-managed-file-deletion.md). Cold Tauri and full session qualification remain pending. |
| LN-EXP-009 | [plugins-explorer](../plugins/explorer/index.md#ln-exp-009) | In progress | Seven exact and 31 complete Explorer cases, strict public check/build and source gates pass; [action feedback evidence](../../records/2026-10-16-native-system-trash-and-actions.md). Native UI and end-of-M7 lanes remain pending. |
