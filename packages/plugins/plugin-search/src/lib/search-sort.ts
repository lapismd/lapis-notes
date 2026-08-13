import type { TFile } from "@lapis-notes/api";
import {
  SEARCH_VIEW_SORT_OPTIONS,
  type SearchViewSortMode,
} from "./search-settings";

type SortableFile = Pick<TFile, "name" | "path" | "stat">;

function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

export function formatSearchViewSortLabel(mode: SearchViewSortMode): string {
  return (
    SEARCH_VIEW_SORT_OPTIONS.find((option) => option.value === mode)?.label ??
    SEARCH_VIEW_SORT_OPTIONS[0]!.label
  );
}

export function sortSearchResults<T extends { file: SortableFile }>(
  items: T[],
  mode: SearchViewSortMode,
): T[] {
  return [...items].sort((left, right) => {
    switch (mode) {
      case "filename-desc":
        return (
          compareText(right.file.name, left.file.name) ||
          compareText(left.file.path, right.file.path)
        );
      case "modified-desc":
        return (
          right.file.stat.mtime - left.file.stat.mtime ||
          compareText(left.file.path, right.file.path)
        );
      case "modified-asc":
        return (
          left.file.stat.mtime - right.file.stat.mtime ||
          compareText(left.file.path, right.file.path)
        );
      case "created-desc":
        return (
          right.file.stat.ctime - left.file.stat.ctime ||
          compareText(left.file.path, right.file.path)
        );
      case "created-asc":
        return (
          left.file.stat.ctime - right.file.stat.ctime ||
          compareText(left.file.path, right.file.path)
        );
      case "filename-asc":
      default:
        return (
          compareText(left.file.name, right.file.name) ||
          compareText(left.file.path, right.file.path)
        );
    }
  });
}
