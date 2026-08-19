import { describe, expect, it } from "vitest";
import { BookmarksStore, type BookmarksPersistence } from "./bookmarks-store";

function memoryPersistence(initial: unknown = { items: [] }): BookmarksPersistence {
  let stored = initial;
  return {
    async load() {
      return stored;
    },
    async save(data) {
      stored = data;
    },
  };
}

describe("BookmarksStore", () => {
  it("adds, moves, and persists items", async () => {
    const persistence = memoryPersistence();
    const store = new BookmarksStore(persistence);
    await store.load();
    const group = await store.addGroup("Other");
    const file = await store.addFile("review.md", { parentCtime: group.ctime });
    expect(store.items[0]).toMatchObject({ type: "group", title: "Other" });
    await store.moveItem(file.ctime, null, 0);
    expect(store.items[0]).toMatchObject({ type: "file", path: "review.md" });
    expect(store.items[1]).toMatchObject({ type: "group", title: "Other" });
    const reloaded = new BookmarksStore(persistence);
    await reloaded.load();
    expect(reloaded.items[0]).toMatchObject({ type: "file", path: "review.md" });
  });

  it("rewrites file and folder paths", async () => {
    const store = new BookmarksStore(memoryPersistence());
    await store.load();
    const file = await store.addFile("jobs/review.md");
    const folder = await store.addFolder("jobs");
    await store.rewritePaths("jobs/review.md", "archive/review.md");
    await store.rewritePaths("jobs", "archive");
    expect(file.path).toBe("archive/review.md");
    expect(folder.path).toBe("archive");
  });
});
