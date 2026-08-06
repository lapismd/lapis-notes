import {
  dropIndicatorClasses as dropIndicatorClassesBase,
  isRowDragSource as isRowDragSourceBase,
  parseTableDragData,
  resolveTableDragTargetIndex,
  tableColDragType,
  tableRowDragType,
  type TableDragData,
  type TableDragSource,
} from "@lapis-notes/ui/table-dnd/utils";

export const SETTINGS_TABLE_ROW_TYPE = tableRowDragType("settings");
export const SETTINGS_TABLE_COL_TYPE = tableColDragType("settings");

export type SettingsTableDragSource = TableDragSource;
export type SettingsTableDragData = TableDragData;

export { parseTableDragData, resolveTableDragTargetIndex };

export function dropIndicatorClasses(
  dragSource: SettingsTableDragSource | null,
  dragOverIndex: number | null,
  rowIndex: number,
): string {
  return dropIndicatorClassesBase(
    dragSource,
    dragOverIndex,
    rowIndex,
    0,
    SETTINGS_TABLE_ROW_TYPE,
    SETTINGS_TABLE_COL_TYPE,
  );
}

export function isRowDragSource(
  dragSource: SettingsTableDragSource | null,
  rowIndex: number,
): boolean {
  return isRowDragSourceBase(dragSource, rowIndex, SETTINGS_TABLE_ROW_TYPE);
}
