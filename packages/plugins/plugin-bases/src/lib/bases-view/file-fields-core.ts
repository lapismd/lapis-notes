import type { MetadataType } from "@lapis-notes/api";

export type FileColumnDefinition = {
  id: string;
  displayName: string;
  icon: string;
  type: MetadataType;
};

export type FileMetadataCache =
  | {
      frontmatter?: Record<string, unknown>;
      links?: Array<{ link: string }>;
      embeds?: Array<{ link: string }>;
      tags?: Array<{ tag: string }>;
    }
  | null
  | undefined;

export function buildFileColumns(
  properties: Record<string, { displayName: string }> = {},
): FileColumnDefinition[] {
  return [
    {
      id: "file",
      displayName: properties["file"]?.displayName || "file",
      icon: "lucide-file",
      type: "file",
    },
    {
      id: "file.name",
      displayName: properties["file.name"]?.displayName || "file name",
      icon: "lucide-text",
      type: "text",
    },
    {
      id: "file.file",
      displayName: properties["file.file"]?.displayName || "file reference",
      icon: "lucide-file",
      type: "file",
    },
    {
      id: "file.ext",
      displayName: properties["file.ext"]?.displayName || "file extension",
      icon: "lucide-text",
      type: "text",
    },
    {
      id: "file.basename",
      displayName: properties["file.basename"]?.displayName || "file base name",
      icon: "lucide-text",
      type: "text",
    },
    {
      id: "file.folder",
      displayName: properties["file.folder"]?.displayName || "folder",
      icon: "lucide-text",
      type: "text",
    },
    {
      id: "file.fullname",
      displayName: properties["file.fullname"]?.displayName || "file full name",
      icon: "lucide-text",
      type: "text",
    },
    {
      id: "file.path",
      displayName: properties["file.path"]?.displayName || "file path",
      icon: "lucide-text",
      type: "text",
    },
    {
      id: "file.ctime",
      displayName: properties["file.ctime"]?.displayName || "created time",
      icon: "lucide-clock",
      type: "datetime",
    },
    {
      id: "file.mtime",
      displayName: properties["file.mtime"]?.displayName || "modified time",
      icon: "lucide-clock",
      type: "datetime",
    },
    {
      id: "file.size",
      displayName: properties["file.size"]?.displayName || "file size",
      icon: "lucide-binary",
      type: "number",
    },
    {
      id: "file.tags",
      displayName: properties["file.tags"]?.displayName || "file tags",
      icon: "lucide-tags",
      type: "tags",
    },
    {
      id: "file.links",
      displayName: properties["file.links"]?.displayName || "file links",
      icon: "lucide-link",
      type: "multitext",
    },
    {
      id: "file.embeds",
      displayName: properties["file.embeds"]?.displayName || "file embeds",
      icon: "lucide-image",
      type: "multitext",
    },
    {
      id: "file.backlinks",
      displayName:
        properties["file.backlinks"]?.displayName || "file backlinks",
      icon: "lucide-waypoints",
      type: "multitext",
    },
    {
      id: "file.properties",
      displayName:
        properties["file.properties"]?.displayName || "file properties",
      icon: "lucide-braces",
      type: "unknown",
    },
  ];
}

export function deriveFileMetadata(
  entryPath: string,
  cache: FileMetadataCache,
  backlinkInput: string[] | Record<string, Record<string, number>> = [],
) {
  const backlinks = Array.isArray(backlinkInput)
    ? backlinkInput
    : Object.entries(backlinkInput)
        .filter(([sourcePath, targets]) =>
          sourcePath !== entryPath && Boolean(targets[entryPath]),
        )
        .map(([sourcePath]) => sourcePath);
  return {
    tags: (cache?.tags || []).map((it) => it.tag),
    links: (cache?.links || []).map((it) => it.link),
    embeds: (cache?.embeds || []).map((it) => it.link),
    backlinks: backlinks.filter((sourcePath) => sourcePath !== entryPath),
    properties: { ...(cache?.frontmatter || {}) },
  };
}
