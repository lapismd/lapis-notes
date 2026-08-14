import type { App, MetadataType } from "@lapis-notes/api";
import { TimeStamp, type DType } from "peaql";
import type { VaultRecord } from ".";
import { getMetadataTypeInfo } from "./metadata-type-info";

export type SortDirection = "ASC" | "DESC";

export type ColumnMeta = {
  displayName: string;
  icon: string;
  type: MetadataType;
  frontmatter?: boolean;
};

export type ColumnDef = {
  id: string;
  meta: ColumnMeta;
  colSpan?: number | null | undefined;
  size?: number;
};

export function columnsFor(
  rows: VaultRecord[],
  properties: Record<string, { displayName: string }> = {},
  formulas: Record<string, string>,
  app?: Pick<App, "metadataTypeManager">,
) {
  const columns: ColumnDef[] = [
    {
      id: "file",
      meta: {
        displayName: properties["file"]?.displayName || "file",
        icon: "lucide-file",
        type: "file",
      },
    },
    {
      id: "file.name",
      meta: {
        displayName: properties["file.name"]?.displayName || "file name",
        icon: "lucide-text",
        type: "text",
      },
    },
    {
      id: "file.basename",
      meta: {
        displayName:
          properties["file.basename"]?.displayName || "file base name",
        icon: "lucide-text",
        type: "text",
      },
    },
    {
      id: "file.folder",
      meta: {
        displayName: properties["file.folder"]?.displayName || "folder",
        icon: "lucide-text",
        type: "text",
      },
    },
    {
      id: "file.fullname",
      meta: {
        displayName:
          properties["file.fullname"]?.displayName || "file full name",
        icon: "lucide-text",
        type: "text",
      },
    },
    {
      id: "file.path",
      meta: {
        displayName: properties["file.path"]?.displayName || "file path",
        icon: "lucide-text",
        type: "text",
      },
    },
    {
      id: "file.ext",
      meta: {
        displayName: properties["file.ext"]?.displayName || "file extension",
        icon: "lucide-text",
        type: "text",
      },
    },
    {
      id: "file.ctime",
      meta: {
        displayName: properties["file.ctime"]?.displayName || "created time",
        icon: "lucide-clock",
        type: "datetime",
      },
    },
    {
      id: "file.mtime",
      meta: {
        displayName: properties["file.mtime"]?.displayName || "modified time",
        icon: "lucide-clock",
        type: "datetime",
      },
    },
    {
      id: "file.size",
      meta: {
        displayName: properties["file.size"]?.displayName || "file size",
        icon: "lucide-binary",
        type: "number",
      },
    },
  ];

  const metadata: Record<string, number> = {};
  rows.forEach((row) => {
    if (row.cache && row.cache.frontmatter) {
      Object.keys(row.cache.frontmatter).forEach((key) => {
        metadata[key] ||= 0;
        metadata[key] += 1;
      });
    }
  });

  for (const key of Object.keys(formulas)) {
    const id = key.match(/^[a-zA-Z0-9_]+$/)
      ? "formula." + key
      : `formula["${key.replaceAll('"', '"')}"]`;
    columns.push({
      id,
      meta: {
        displayName: properties[id]?.displayName || key,
        icon: "lucide-square-function",
        type: "text",
      },
    });
  }

  const frontmatter: Record<string, DType> = {};

  Object.keys(metadata)
    .sort((a, b) => metadata[b] - metadata[a])
    .forEach((key) => {
      const name = key.replaceAll(/[^a-zA-Z0-9]/g, " ");
      const { type, icon } = getMetadataTypeInfo(key, "unknown", app);
      frontmatter[key] = metadataType(type);
      columns.push({
        id: key,
        meta: {
          frontmatter: true,
          displayName: properties[key]?.displayName || name,
          icon,
          type,
        },
      });
    });

  return { columns, frontmatter };
}

function metadataType(type: MetadataType): DType {
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
