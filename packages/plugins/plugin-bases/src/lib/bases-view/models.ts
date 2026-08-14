import type { MetadataType } from "@lapis-notes/api";
import type { Column } from "@tanstack/table-core";
import { toSQL } from "./filter-parser";
import type { BasesPropertyId } from "@lapis-notes/api";
import type { ColumnDefinition } from "./columns";

export type SortColumn = {
  property: BasesPropertyId;
  direction: "ASC" | "DESC";
};

export type FilterLine = {
  column: string;
  op: string;
  value: string | Array<string>;
  custom?: string | null;
};

export type Filters =
  | { and: Array<Filters | FilterLine | string> }
  | { or: Array<Filters | FilterLine | string> }
  | { not: Array<Filters | FilterLine | string> };

export function filterGroupType(filter: Filters): "and" | "or" | "not" | "" {
  if (!filter) return "";
  if ("or" in filter) return "or";
  if ("not" in filter) return "not";
  if ("and" in filter) return "and";
  return "";
}

export function filterGroupValues(
  filter: Filters,
): Array<Filters | FilterLine | string> {
  if (!filter) return [];
  if ("and" in filter) return filter.and;
  if ("or" in filter) return filter.or;
  if ("not" in filter) return filter.not;
  return [];
}

export function filterCount(filter: Filters): number {
  let count = 0;
  for (const predicate of filterGroupValues(filter)) {
    if (typeof predicate === "string" && predicate.length) {
      count += 1;
    } else if (isFilterLine(predicate)) {
      count += 1;
    } else if (isFilterGroup(predicate)) {
      count += filterCount(predicate);
    }
  }
  return count;
}

export const filterLabels: Partial<
  Record<MetadataType, Array<{ label: string; value: string; type: string }>>
> = {
  datetime: [
    { label: "on", value: "=", type: "datetime" },
    { label: "not on", value: "!=", type: "datetime" },
    { label: "before", value: "<", type: "datetime" },
    { label: "on or before", value: "<=", type: "datetime" },
    { label: "after", value: ">", type: "datetime" },
    { label: "on or after", value: ">=", type: "datetime" },
    { label: "is empty", value: "isEmpty", type: "none" },
    { label: "is not empty", value: "!isEmpty", type: "none" },
  ],
  checkbox: [
    { label: "is", value: "=", type: "checkbox" },
    { label: "is not", value: "!=", type: "checkbox" },
  ],
  number: [
    { label: "=", value: "=", type: "number" },
    { label: "≠", value: "!=", type: "number" },
    { label: "<", value: "<", type: "number" },
    { label: "≤", value: "<=", type: "number" },
    { label: ">", value: ">", type: "number" },
    { label: "≥", value: ">=", type: "number" },
    { label: "is empty", value: "isEmpty", type: "none" },
    { label: "is not empty", value: "!isEmpty", type: "none" },
  ],
  text: [
    { label: "is", value: "=", type: "text" },
    { label: "is not", value: "!=", type: "text" },
    { label: "starts with", value: "startsWith", type: "text" },
    { label: "ends with", value: "endsWith", type: "text" },
    { label: "is empty", value: "isEmpty", type: "none" },
    { label: "contains", value: "contains", type: "text" },
    { label: "contains any of", value: "containsAnyOf", type: "multitext" },
    { label: "contains all of", value: "containsAllOf", type: "multitext" },
    { label: "does not start with", value: "!startsWith", type: "text" },
    { label: "does not end with", value: "!endsWith", type: "text" },
    { label: "is not empty", value: "!isEmpty", type: "none" },
    { label: "does not contain", value: "!contains", type: "text" },
    {
      label: "does not contain any of",
      value: "!containsAnyOf",
      type: "multitext",
    },
    {
      label: "does not contain all of",
      value: "!containsAllOf",
      type: "multitext",
    },
  ],
  file: [
    { label: "links to", value: "hasLink", type: "file" },
    { label: "in folder", value: "inFolder", type: "folder" },
    { label: "has tag", value: "hasTag", type: "tags" },
    { label: "has property", value: "hasProperty", type: "properties" },
    { label: "does not link to", value: "!hasLink", type: "file" },
    { label: "is not in folder", value: "!inFolder", type: "folder" },
    { label: "does not have tag", value: "!hasTag", type: "tags" },
    {
      label: "does not have property",
      value: "!hasProperty",
      type: "properties",
    },
  ],
  unknown: [
    { label: "is", value: "=", type: "any" },
    { label: "is not", value: "!=", type: "any" },
    { label: "is truthy", value: "isTruthy", type: "none" },
    { label: "is not truthy", value: "!isTruthy", type: "none" },
    { label: "is empty", value: "isEmpty", type: "none" },
    { label: "is not empty", value: "!isEmpty", type: "none" },
  ],
};

export function filterTypeFor(
  column: ColumnDefinition | null | undefined,
): Array<{ label: string; value: string; type: string }> {
  const type = column?.type ?? "unknown";
  return filterLabels[type] ?? filterLabels["unknown"] ?? [];
}

export function filterLineFor(
  column: ColumnDefinition | null | undefined,
  value: string = "",
): FilterLine {
  const filterTypes = filterTypeFor(column);
  return {
    column: column?.id || "",
    op: filterTypes[0].value || "",
    value,
  };
}

export function isFilterGroup(obj: unknown): obj is Filters {
  if (typeof obj !== "object" || obj === null) return false;
  const keys = Object.keys(obj);
  return keys.length === 1 && ["and", "or", "not"].includes(keys[0]);
}

export function isFilterLine(obj: unknown): obj is FilterLine {
  if (typeof obj !== "object" || obj === null || obj === undefined)
    return false;
  return "column" in obj && "op" in obj;
}

export interface BasesViewBase {
  name: string;
  order: Array<string>;
  sort: Array<SortColumn>;
  groupBy?: SortColumn;
  summaries?: Record<string, string>;
  limit: number | null;
  filter: Filters;
  type: string;
  [key: string]: unknown;
}

export interface BasesView<T extends keyof BasesViewMap = keyof BasesViewMap>
  extends BasesViewBase {
  type: T;
}

export interface BasesViewMap {
  table: TableView;
  cards: CardsView;
  list: ListView;
  map: MapView;
}

export type BasesViewType = keyof BasesViewMap;

export interface TableView extends BasesView<"table"> {
  columnSize: Record<string, number>;
  layout: "table" | "cards";
  rowHeight?: "short" | "medium" | "tall" | "extra";
  cardSize?: number;
  image?: string;
  imageFit?: "contain" | "cover";
  imageAspectRatio: number;
}

export interface ListView extends BasesView<"list"> {}

export interface CardsView extends BasesView<"cards"> {
  cardSize?: number;
  image?: string;
  imageFit?: "contain" | "cover";
  imageAspectRatio: number;
}

export interface MapView extends BasesView<"map"> {}

export interface CustomBasesView extends BasesViewBase {
  type: string;
}

export type AnyBasesView = BasesViewMap[keyof BasesViewMap] | CustomBasesView;

export type BasesDocument = {
  filters: Filters;
  properties?: Record<string, { displayName: string }>;
  formulas?: Record<string, string>;
  summaries?: Record<string, string>;
  activeView: string;
  views: Array<AnyBasesView>;
};
