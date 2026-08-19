import { View, type App, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import BookmarksPanel from "./bookmarks-panel.svelte";
import type { BookmarksStore } from "./bookmarks-store";
import { BookmarksViewType } from "./bookmarks-view-type";

export interface BookmarksViewHost {
  store: BookmarksStore;
  promptAddBookmark(): Promise<void>;
  createGroup(parentCtime: number | null): Promise<{ ctime: number }>;
}

export class BookmarksView extends View {
  #component: Record<string, unknown> | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly host: BookmarksViewHost,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return BookmarksViewType;
  }

  getDisplayText(): string {
    return "Bookmarks";
  }

  getIcon(): string {
    return "bookmark";
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.#component = mount(BookmarksPanel, {
      target: this.containerEl,
      props: {
        app: this.app as App,
        store: this.host.store,
        onBookmarkActive: () => void this.host.promptAddBookmark(),
        onNewGroup: (parentCtime) => this.host.createGroup(parentCtime),
      },
    }) as Record<string, unknown>;
  }

  onunload(): void {
    if (this.#component) void unmount(this.#component);
    this.#component = null;
  }
}
