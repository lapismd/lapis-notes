import type { App, MetadataType } from "@lapis-notes/api";
import { inferMetadataPropertyType } from "@lapis-notes/api/metadata-value";
import { TimeStamp, type DType } from "peaql";
import type { BasesPropertyId } from "@lapis-notes/api";
import type { VaultRecord } from ".";
import { buildFileColumns } from "./file-fields-core";
import { getMetadataTypeInfo } from "./metadata-type-info";

export type ColumnDefinition = {
  id: BasesPropertyId;
  displayName: string;
  type: MetadataType;
  icon: string;
};

export function columnsFor(
  rows: VaultRecord[],
  properties: Record<string, { displayName: string }> = {},
  formulas: Record<string, string>,
  app?: Pick<App, "metadataTypeManager">,
) {
  const columns: ColumnDefinition[] = buildFileColumns(properties).map(
    (column) => ({
      id: column.id as BasesPropertyId,
      displayName: column.displayName,
      icon: column.icon,
      type: column.type,
    }),
  );

  const metadata: Record<string, number> = {};
  const observedMetadataTypes: Partial<Record<string, MetadataType>> = {};
  rows.forEach((row) => {
    if (row.cache && row.cache.frontmatter) {
      Object.entries(row.cache.frontmatter).forEach(([key, value]) => {
        metadata[key] ||= 0;
        metadata[key] += 1;
        observedMetadataTypes[key] ??= inferMetadataTypeFromValue(
          key,
          value,
          app,
        );
      });
    }
  });

  for (const key of Object.keys(formulas)) {
    const id = ("formula." + key) as BasesPropertyId;
    columns.push({
      id,
      displayName: properties[id]?.displayName || key,
      icon: "lucide-square-function",
      type: "text",
    });
  }

  Object.entries(properties).forEach(([id, property]) => {
    if (!id.startsWith("note.")) {
      return;
    }

    if (columns.some((column) => column.id === id)) {
      return;
    }

    const key = id.slice("note.".length);
    const name = key.replaceAll(/[^a-zA-Z0-9-_]/g, " ");
    const { type, icon } = getMetadataTypeInfo(key, "unknown", app);
    columns.push({
      id: id as BasesPropertyId,
      displayName: property.displayName || name,
      icon,
      type,
    });
  });

  Object.keys(metadata)
    .sort((a, b) => metadata[b] - metadata[a])
    .forEach((key) => {
      const name = key.replaceAll(/[^a-zA-Z0-9-_]/g, " ");
      const { type, icon } = getMetadataTypeInfo(
        key,
        observedMetadataTypes[key] ?? "unknown",
        app,
      );
      columns.push({
        id: key,
        displayName: properties[key]?.displayName || name,
        icon,
        type,
      });
    });
  return columns.reduce<Record<string, ColumnDefinition>>((acc, value) => {
    acc[value.id] = value;
    return acc;
  }, {});
}

export function frontMatterTypesForColumns(
  columns: Record<string, ColumnDefinition>,
): Record<string, DType> {
  const types: Record<string, DType> = {};

  for (const [id, column] of Object.entries(columns)) {
    if (id === "file" || id.startsWith("file.") || id.startsWith("formula.")) {
      continue;
    }

    const noteId = id.startsWith("note.") ? id : `note.${id}`;
    types[noteId] ??= metadataType(column.type);
  }

  return types;
}

export function metadataType(type: MetadataType): DType {
  switch (type) {
    case "text":
      return String;
    case "checkbox":
      return Boolean;
    case "number":
      return Number;
    case "date":
    case "datetime":
      return TimeStamp;
    case "tags":
    case "multitext":
    case "aliases":
      return [String];
    case "array":
      return [Object];
    case "object":
      return Object;
    default:
      return Object;
  }
}

function inferMetadataTypeFromValue(
  key: string,
  value: unknown,
  app?: Pick<App, "metadataTypeManager">,
): MetadataType {
  return (
    app?.metadataTypeManager?.determinePropertyType?.(key, value) ??
    inferMetadataPropertyType(key, value)
  );
}
