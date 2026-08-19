import { basename } from "@lapis-notes/api";

export const KNOWN_BOOKMARK_TYPES = [
  "file",
  "folder",
  "group",
  "search",
  "url",
  "graph",
] as const;

export type KnownBookmarkType = (typeof KNOWN_BOOKMARK_TYPES)[number];

export interface FileBookmarkItem {
  type: "file";
  ctime: number;
  path: string;
  title?: string;
  subpath?: string;
}

export interface FolderBookmarkItem {
  type: "folder";
  ctime: number;
  path: string;
  title?: string;
}

export interface GroupBookmarkItem {
  type: "group";
  ctime: number;
  title?: string;
  items: BookmarkItem[];
}

export interface SearchBookmarkItem {
  type: "search";
  ctime: number;
  query: string;
  title?: string;
}

export interface UrlBookmarkItem {
  type: "url";
  ctime: number;
  url: string;
  title?: string;
}

export interface GraphBookmarkItem {
  type: "graph";
  ctime: number;
  title?: string;
}

export interface UnknownBookmarkItem {
  type: string;
  ctime: number;
  title?: string;
  [key: string]: unknown;
}

export type BookmarkItem =
  | FileBookmarkItem
  | FolderBookmarkItem
  | GroupBookmarkItem
  | SearchBookmarkItem
  | UrlBookmarkItem
  | GraphBookmarkItem
  | UnknownBookmarkItem;

export interface BookmarksDocument {
  items: BookmarkItem[];
}

export type BookmarkIconName =
  | "file"
  | "folder"
  | "search"
  | "external-link"
  | "git-fork";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readCtime(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Date.now();
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function isKnownBookmarkType(type: string): type is KnownBookmarkType {
  return (KNOWN_BOOKMARK_TYPES as readonly string[]).includes(type);
}

export function isFileBookmark(item: BookmarkItem): item is FileBookmarkItem {
  return item.type === "file";
}

export function isFolderBookmark(
  item: BookmarkItem,
): item is FolderBookmarkItem {
  return item.type === "folder";
}

export function isGroupBookmark(item: BookmarkItem): item is GroupBookmarkItem {
  return item.type === "group";
}

export function isSearchBookmark(
  item: BookmarkItem,
): item is SearchBookmarkItem {
  return item.type === "search";
}

export function isUrlBookmark(item: BookmarkItem): item is UrlBookmarkItem {
  return item.type === "url";
}

export function isGraphBookmark(item: BookmarkItem): item is GraphBookmarkItem {
  return item.type === "graph";
}

export function parseBookmarkItem(value: unknown): BookmarkItem {
  if (!isRecord(value)) {
    return { type: "unknown", ctime: Date.now() };
  }
  const type = typeof value.type === "string" ? value.type : "unknown";
  const ctime = readCtime(value.ctime);
  const title = readOptionalString(value.title);
  const extras = { ...value };

  if (type === "file") {
    return {
      ...extras,
      type: "file",
      ctime,
      path: typeof value.path === "string" ? value.path : "",
      ...(title ? { title } : {}),
      ...(typeof value.subpath === "string" ? { subpath: value.subpath } : {}),
    };
  }
  if (type === "folder") {
    return {
      ...extras,
      type: "folder",
      ctime,
      path: typeof value.path === "string" ? value.path : "",
      ...(title ? { title } : {}),
    };
  }
  if (type === "group") {
    return {
      ...extras,
      type: "group",
      ctime,
      items: parseBookmarkItems(value.items),
      ...(title ? { title } : {}),
    };
  }
  if (type === "search") {
    return {
      ...extras,
      type: "search",
      ctime,
      query: typeof value.query === "string" ? value.query : "",
      ...(title ? { title } : {}),
    };
  }
  if (type === "url") {
    return {
      ...extras,
      type: "url",
      ctime,
      url: typeof value.url === "string" ? value.url : "",
      ...(title ? { title } : {}),
    };
  }
  if (type === "graph") {
    return {
      ...extras,
      type: "graph",
      ctime,
      ...(title ? { title } : {}),
    };
  }
  return {
    ...extras,
    type,
    ctime,
    ...(title ? { title } : {}),
  };
}

export function parseBookmarkItems(value: unknown): BookmarkItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => parseBookmarkItem(item));
}

export function cloneBookmarkItems(items: BookmarkItem[]): BookmarkItem[] {
  return parseBookmarkItems(items);
}

export function parseBookmarksDocument(value: unknown): BookmarksDocument {
  if (!isRecord(value)) return { items: [] };
  return { items: parseBookmarkItems(value.items) };
}

export function serializeBookmarksDocument(
  document: BookmarksDocument,
): Record<string, unknown> {
  return { items: document.items };
}

export function bookmarkLabel(item: BookmarkItem): string {
  if (item.title) {
    return isFileBookmark(item) && item.subpath
      ? `${item.title} ${item.subpath}`
      : item.title;
  }
  if (isFileBookmark(item)) {
    const name = basename(item.path) || item.path || "Untitled";
    return item.subpath ? `${name} ${item.subpath}` : name;
  }
  if (isFolderBookmark(item)) {
    return basename(item.path) || item.path || "Untitled folder";
  }
  if (isGroupBookmark(item)) return item.title || "Untitled group";
  if (isSearchBookmark(item)) return item.query || "Search";
  if (isUrlBookmark(item)) return item.url || "URL";
  if (isGraphBookmark(item)) return "Graph";
  return item.type;
}

export function bookmarkIcon(item: BookmarkItem): BookmarkIconName | null {
  if (item.type === "group") return null;
  if (item.type === "file") return "file";
  if (item.type === "folder") return "folder";
  if (item.type === "search") return "search";
  if (item.type === "url") return "external-link";
  if (item.type === "graph") return "git-fork";
  return "file";
}

export function bookmarkSearchText(item: BookmarkItem): string {
  const parts = [item.title ?? "", item.type];
  if ("path" in item && typeof item.path === "string") parts.push(item.path);
  if ("subpath" in item && typeof item.subpath === "string") {
    parts.push(item.subpath);
  }
  if ("query" in item && typeof item.query === "string") parts.push(item.query);
  if ("url" in item && typeof item.url === "string") parts.push(item.url);
  return parts.join(" ").toLocaleLowerCase();
}

export function nextBookmarkCtime(items: BookmarkItem[], now = Date.now()): number {
  const used = new Set<number>();
  walkBookmarkItems(items, (item) => {
    used.add(item.ctime);
  });
  let ctime = now;
  while (used.has(ctime)) ctime += 1;
  return ctime;
}

export function walkBookmarkItems(
  items: BookmarkItem[],
  visit: (item: BookmarkItem, parent: GroupBookmarkItem | null) => void,
  parent: GroupBookmarkItem | null = null,
): void {
  for (const item of items) {
    visit(item, parent);
    if (isGroupBookmark(item)) {
      walkBookmarkItems(item.items, visit, item);
    }
  }
}

export function listBookmarkGroups(
  items: BookmarkItem[],
  ancestors: string[] = [],
): Array<{ item: GroupBookmarkItem; crumbs: string[] }> {
  const groups: Array<{ item: GroupBookmarkItem; crumbs: string[] }> = [];
  for (const item of items) {
    if (!isGroupBookmark(item)) continue;
    const crumbs = [...ancestors, bookmarkLabel(item)];
    groups.push({ item, crumbs });
    groups.push(...listBookmarkGroups(item.items, crumbs));
  }
  return groups;
}

export function findBookmarkItem(
  items: BookmarkItem[],
  ctime: number,
): BookmarkItem | null {
  for (const item of items) {
    if (item.ctime === ctime) return item;
    if (isGroupBookmark(item)) {
      const nested = findBookmarkItem(item.items, ctime);
      if (nested) return nested;
    }
  }
  return null;
}

export function isDescendantGroup(
  items: BookmarkItem[],
  ancestorCtime: number,
  candidateCtime: number,
): boolean {
  const ancestor = findBookmarkItem(items, ancestorCtime);
  if (!ancestor || !isGroupBookmark(ancestor)) return false;
  return findBookmarkItem(ancestor.items, candidateCtime) !== null;
}

export function removeBookmarkItem(
  items: BookmarkItem[],
  ctime: number,
): BookmarkItem | null {
  const index = items.findIndex((item) => item.ctime === ctime);
  if (index >= 0) {
    return items.splice(index, 1)[0] ?? null;
  }
  for (const item of items) {
    if (isGroupBookmark(item)) {
      const removed = removeBookmarkItem(item.items, ctime);
      if (removed) return removed;
    }
  }
  return null;
}

export function insertBookmarkItem(
  items: BookmarkItem[],
  item: BookmarkItem,
  parentCtime: number | null,
  index: number,
): boolean {
  if (parentCtime === null) {
    items.splice(Math.max(0, Math.min(index, items.length)), 0, item);
    return true;
  }
  const parent = findBookmarkItem(items, parentCtime);
  if (!parent || !isGroupBookmark(parent)) return false;
  parent.items.splice(
    Math.max(0, Math.min(index, parent.items.length)),
    0,
    item,
  );
  return true;
}

export function rewriteBookmarkPaths(
  items: BookmarkItem[],
  fromPath: string,
  toPath: string,
): boolean {
  let changed = false;
  walkBookmarkItems(items, (item) => {
    if (
      (isFileBookmark(item) || isFolderBookmark(item)) &&
      item.path === fromPath
    ) {
      item.path = toPath;
      changed = true;
    }
  });
  return changed;
}
