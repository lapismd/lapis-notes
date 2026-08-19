import type { App } from "@lapis-notes/api";
import {
  findBookmarkItem,
  insertBookmarkItem,
  isDescendantGroup,
  isGroupBookmark,
  nextBookmarkCtime,
  parseBookmarksDocument,
  removeBookmarkItem,
  rewriteBookmarkPaths,
  serializeBookmarksDocument,
  type BookmarkItem,
  type BookmarksDocument,
  type FileBookmarkItem,
  type FolderBookmarkItem,
  type GroupBookmarkItem,
  type SearchBookmarkItem,
  type UrlBookmarkItem,
} from "./bookmarks-schema";

export interface BookmarksPersistence {
  load(): Promise<unknown>;
  save(data: unknown): Promise<void>;
}

export class BookmarksStore {
  #document: BookmarksDocument = { items: [] };
  #listeners = new Set<() => void>();

  constructor(private readonly persistence: BookmarksPersistence) {}

  get items(): BookmarkItem[] {
    return this.#document.items;
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  async load(): Promise<void> {
    this.#document = parseBookmarksDocument(await this.persistence.load());
    this.notify();
  }

  async addItem(
    item: BookmarkItem,
    parentCtime: number | null = null,
  ): Promise<BookmarkItem> {
    const created: BookmarkItem = {
      ...item,
      ctime: item.ctime ?? nextBookmarkCtime(this.#document.items),
    };
    if (isGroupBookmark(created) && !Array.isArray(created.items)) {
      created.items = [];
    }
    const parent = parentCtime
      ? findBookmarkItem(this.#document.items, parentCtime)
      : null;
    insertBookmarkItem(
      this.#document.items,
      created,
      parentCtime,
      parentCtime === null
        ? this.#document.items.length
        : parent && isGroupBookmark(parent)
          ? parent.items.length
          : 0,
    );
    await this.persist();
    return created;
  }

  async addFile(
    path: string,
    options: { title?: string; subpath?: string; parentCtime?: number | null } = {},
  ): Promise<FileBookmarkItem> {
    const item: FileBookmarkItem = {
      type: "file",
      ctime: nextBookmarkCtime(this.#document.items),
      path,
      ...(options.title ? { title: options.title } : {}),
      ...(options.subpath ? { subpath: options.subpath } : {}),
    };
    return (await this.addItem(item, options.parentCtime ?? null)) as FileBookmarkItem;
  }

  async addFolder(
    path: string,
    options: { title?: string; parentCtime?: number | null } = {},
  ): Promise<FolderBookmarkItem> {
    const item: FolderBookmarkItem = {
      type: "folder",
      ctime: nextBookmarkCtime(this.#document.items),
      path,
      ...(options.title ? { title: options.title } : {}),
    };
    return (await this.addItem(item, options.parentCtime ?? null)) as FolderBookmarkItem;
  }

  async addGroup(
    title = "Untitled group",
    parentCtime: number | null = null,
  ): Promise<GroupBookmarkItem> {
    const item: GroupBookmarkItem = {
      type: "group",
      ctime: nextBookmarkCtime(this.#document.items),
      title,
      items: [],
    };
    return (await this.addItem(item, parentCtime)) as GroupBookmarkItem;
  }

  async addSearch(
    query: string,
    options: { title?: string; parentCtime?: number | null } = {},
  ): Promise<SearchBookmarkItem> {
    const item: SearchBookmarkItem = {
      type: "search",
      ctime: nextBookmarkCtime(this.#document.items),
      query,
      ...(options.title ? { title: options.title } : {}),
    };
    return (await this.addItem(item, options.parentCtime ?? null)) as SearchBookmarkItem;
  }

  async addUrl(
    url: string,
    options: { title?: string; parentCtime?: number | null } = {},
  ): Promise<UrlBookmarkItem> {
    const item: UrlBookmarkItem = {
      type: "url",
      ctime: nextBookmarkCtime(this.#document.items),
      url,
      ...(options.title ? { title: options.title } : {}),
    };
    return (await this.addItem(item, options.parentCtime ?? null)) as UrlBookmarkItem;
  }

  async renameItem(ctime: number, title: string): Promise<void> {
    const item = findBookmarkItem(this.#document.items, ctime);
    if (!item) return;
    const next = title.trim();
    if (next) item.title = next;
    else delete item.title;
    await this.persist();
  }

  async removeItem(ctime: number): Promise<void> {
    removeBookmarkItem(this.#document.items, ctime);
    await this.persist();
  }

  async moveItem(
    ctime: number,
    parentCtime: number | null,
    index: number,
  ): Promise<boolean> {
    if (parentCtime === ctime) return false;
    if (
      parentCtime !== null &&
      isDescendantGroup(this.#document.items, ctime, parentCtime)
    ) {
      return false;
    }
    const removed = removeBookmarkItem(this.#document.items, ctime);
    if (!removed) return false;
    const inserted = insertBookmarkItem(
      this.#document.items,
      removed,
      parentCtime,
      index,
    );
    if (!inserted) {
      insertBookmarkItem(this.#document.items, removed, null, this.#document.items.length);
      return false;
    }
    await this.persist();
    return true;
  }

  async rewritePaths(fromPath: string, toPath: string): Promise<void> {
    if (!rewriteBookmarkPaths(this.#document.items, fromPath, toPath)) return;
    await this.persist();
  }

  private notify(): void {
    for (const listener of this.#listeners) listener();
  }

  private async persist(): Promise<void> {
    this.notify();
    await this.persistence.save(serializeBookmarksDocument(this.#document));
  }
}

export function createPluginBookmarksPersistence(app: {
  loadData(): Promise<unknown>;
  saveData(data: unknown): Promise<void>;
}): BookmarksPersistence {
  return {
    load: () => app.loadData(),
    save: (data) => app.saveData(data),
  };
}

export function createVaultRenameBinding(
  app: App,
  store: BookmarksStore,
): () => void {
  const ref = app.vault.on("rename", (file, oldPath) => {
    void store.rewritePaths(oldPath, file.path);
  });
  return () => app.vault.offref(ref);
}
