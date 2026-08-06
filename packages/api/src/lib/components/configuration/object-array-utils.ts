import type { ObjectType, SchemaType } from "../../configuration.svelte";
import { fuzzySearch } from "@lapis-notes/ui";
import type { ObjectMapOption } from "./object-map-types";

function schemaOrder(schema: SchemaType): number {
  return "order" in schema && typeof schema.order === "number"
    ? schema.order
    : Number.MAX_SAFE_INTEGER;
}

export function compareSchemaEntriesByOrder(
  a: [string, SchemaType],
  b: [string, SchemaType],
): number {
  const orderA = schemaOrder(a[1]);
  const orderB = schemaOrder(b[1]);
  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return a[0].localeCompare(b[0]);
}

export function sortedObjectProperties(
  objectSchema: ObjectType,
): Array<[string, SchemaType]> {
  return Object.entries(objectSchema.properties ?? {}).sort(
    compareSchemaEntriesByOrder,
  );
}

export function columnLabel(key: string, field: SchemaType): string {
  return "title" in field && typeof field.title === "string"
    ? field.title
    : key;
}

export function createDefaultCellValue(
  fieldSchema: SchemaType,
  columnOptions?: ObjectMapOption[],
): unknown {
  if ("default" in fieldSchema && fieldSchema.default !== undefined) {
    return structuredClone(fieldSchema.default);
  }

  if (fieldSchema.type === "string") {
    if ("enum" in fieldSchema && fieldSchema.enum.length > 0) {
      return fieldSchema.enum[0];
    }
    if (columnOptions && columnOptions.length > 0) {
      return columnOptions[0].value;
    }
    return "";
  }

  if (fieldSchema.type === "boolean") {
    return false;
  }

  if (fieldSchema.type === "number" || fieldSchema.type === "integer") {
    return 0;
  }

  return undefined;
}

export function createDefaultRow(
  objectSchema: ObjectType,
  columnOptions: Record<string, ObjectMapOption[]> = {},
): Record<string, unknown> {
  if (
    objectSchema.default &&
    typeof objectSchema.default === "object" &&
    !Array.isArray(objectSchema.default)
  ) {
    return structuredClone(objectSchema.default);
  }

  const row: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(objectSchema.properties ?? {})) {
    row[key] = createDefaultCellValue(field, columnOptions[key]);
  }
  return row;
}

export function moveArrayItem<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function isOptionsSourceComboboxField(field: SchemaType): boolean {
  return (
    field.type === "string" &&
    "optionsSource" in field &&
    typeof field.optionsSource === "string" &&
    field.optionsSource.length > 0 &&
    field.allowUnknownOptions === true
  );
}

export function filterComboboxOptions(
  options: ObjectMapOption[],
  currentValue: unknown,
  filterQuery: string,
  limit = 50,
): ObjectMapOption[] {
  const merged = buildSelectOptionsForValue(options, currentValue, true);
  const normalizedQuery = filterQuery.trim();
  if (!normalizedQuery) {
    return merged.slice(0, limit);
  }

  return fuzzySearch(
    merged.map((option) => ({
      ...option,
      searchText: `${option.label} ${option.value}`,
    })),
    normalizedQuery,
    { keys: ["searchText"] },
  )
    .map((result) => result.item)
    .slice(0, limit);
}

export function buildSelectOptionsForValue(
  baseOptions: ObjectMapOption[],
  currentValue: unknown,
  allowUnknownOptions = false,
): ObjectMapOption[] {
  const optionValues = new Set(baseOptions.map((item) => item.value));
  const value = String(currentValue ?? "");
  if (!value || optionValues.has(value)) {
    return baseOptions;
  }

  return [
    ...baseOptions,
    {
      value,
      label: allowUnknownOptions ? `${value} (custom)` : `${value} (missing)`,
      disabled: !allowUnknownOptions,
    },
  ];
}
