import { describe, expect, it } from "vitest";
import { filterBookmarkItems } from "./bookmarks-filter";
import { isGroupBookmark, parseBookmarksDocument } from "./bookmarks-schema";

describe("filterBookmarkItems", () => {
  const items = parseBookmarksDocument({
    items: [
      {
        type: "group",
        ctime: 1,
        title: "Other",
        items: [
          { type: "file", ctime: 2, path: "Untitled.base", title: "Untitled" },
          { type: "search", ctime: 3, query: "neovim" },
        ],
      },
      { type: "url", ctime: 4, url: "https://example.com", title: "Example" },
    ],
  }).items;

  it("keeps ancestor groups of matches", () => {
    const filtered = filterBookmarkItems(items, "neo");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toMatchObject({ type: "group", title: "Other" });
    if (filtered[0] && isGroupBookmark(filtered[0])) {
      expect(filtered[0].items).toHaveLength(1);
      expect(filtered[0].items[0]).toMatchObject({ type: "search" });
    }
  });

  it("matches urls and titles", () => {
    expect(filterBookmarkItems(items, "example")).toHaveLength(1);
    expect(filterBookmarkItems(items, "missing")).toHaveLength(0);
  });
});
