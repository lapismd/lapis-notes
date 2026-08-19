import {
  bookmarkSearchText,
  isGroupBookmark,
  type BookmarkItem,
  type GroupBookmarkItem,
} from "./bookmarks-schema";

export function filterBookmarkItems(
  items: BookmarkItem[],
  query: string,
): BookmarkItem[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return items;
  const next: BookmarkItem[] = [];
  for (const item of items) {
    if (isGroupBookmark(item)) {
      const children = filterBookmarkItems(item.items, query);
      if (children.length > 0 || bookmarkSearchText(item).includes(needle)) {
        next.push({ ...item, items: children } satisfies GroupBookmarkItem);
      }
      continue;
    }
    if (bookmarkSearchText(item).includes(needle)) next.push(item);
  }
  return next;
}
