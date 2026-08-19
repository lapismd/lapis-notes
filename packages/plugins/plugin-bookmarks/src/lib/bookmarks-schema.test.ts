import { describe, expect, it } from "vitest";
import {
  bookmarkIcon,
  bookmarkLabel,
  cloneBookmarkItems,
  isDescendantGroup,
  parseBookmarksDocument,
  removeBookmarkItem,
  rewriteBookmarkPaths,
  serializeBookmarksDocument,
} from "./bookmarks-schema";

const sample = {
  items: [
    {
      type: "group",
      ctime: 1,
      items: [
        {
          type: "file",
          ctime: 2,
          path: "Untitled.base",
          title: "Untitled",
        },
        {
          type: "group",
          ctime: 3,
          items: [],
          title: "Untitled group",
        },
      ],
      title: "Other",
    },
    {
      type: "file",
      ctime: 4,
      path: "jobs/review.md",
    },
    {
      type: "search",
      ctime: 5,
      query: "neovim",
    },
    {
      type: "url",
      ctime: 6,
      url: "https://example.com",
      title: "Example",
    },
    {
      type: "graph",
      ctime: 7,
      color: "accent",
    },
    {
      type: "mystery",
      ctime: 8,
      extra: true,
    },
  ],
};

describe("bookmarks schema", () => {
  it("round-trips known types and unknown keys", () => {
    const parsed = parseBookmarksDocument(sample);
    expect(parsed.items).toHaveLength(6);
    expect(bookmarkLabel(parsed.items[1]!)).toBe("review.md");
    expect(bookmarkLabel(parsed.items[2]!)).toBe("neovim");
    expect(bookmarkIcon(parsed.items[3]!)).toBe("external-link");
    expect(bookmarkIcon(parsed.items[4]!)).toBe("git-fork");
    expect(bookmarkLabel(parsed.items[4]!)).toBe("Graph");
    const serialized = serializeBookmarksDocument(parsed);
    expect(serialized).toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ type: "graph", color: "accent" }),
        expect.objectContaining({ type: "mystery", extra: true }),
      ]),
    });
  });

  it("labels file subpaths and groups", () => {
    const file = parseBookmarksDocument({
      items: [{ type: "file", ctime: 1, path: "note.md", subpath: "#Heading" }],
    }).items[0]!;
    expect(bookmarkLabel(file)).toBe("note.md #Heading");
    expect(bookmarkIcon(file)).toBe("file");
    const group = parseBookmarksDocument({
      items: [{ type: "group", ctime: 2, items: [], title: "Other" }],
    }).items[0]!;
    expect(bookmarkIcon(group)).toBeNull();
  });

  it("removes, rewrites paths, and blocks descendant drops", () => {
    const parsed = parseBookmarksDocument(sample);
    expect(isDescendantGroup(parsed.items, 1, 3)).toBe(true);
    expect(rewriteBookmarkPaths(parsed.items, "jobs/review.md", "jobs/done.md")).toBe(
      true,
    );
    expect(removeBookmarkItem(parsed.items, 4)?.type).toBe("file");
    expect(parsed.items.some((item) => item.ctime === 4)).toBe(false);
  });

  it("clones the tree so panel consumers can react to the same store array", () => {
    const parsed = parseBookmarksDocument(sample);
    const cloned = cloneBookmarkItems(parsed.items);
    expect(cloned).not.toBe(parsed.items);
    expect(cloned).toEqual(parsed.items);
    expect(cloned[0]).not.toBe(parsed.items[0]);
  });
});
