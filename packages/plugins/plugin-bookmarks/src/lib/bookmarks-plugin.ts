import {
  basename,
  Notice,
  Plugin,
  type App,
  type PluginManifest,
} from "@lapis-notes/api";
import AddBookmarkDialog from "./add-bookmark-dialog.svelte";
import { bookmarkableTarget, isAllowedBookmarkUrl } from "./activate-bookmark";
import {
  BookmarksStore,
  createPluginBookmarksPersistence,
  createVaultRenameBinding,
} from "./bookmarks-store";
import { BookmarksView } from "./bookmarks-view";
import {
  BOOKMARKS_PLUGIN_ID,
  BookmarksViewType,
} from "./bookmarks-view-type";
import { listBookmarkGroups } from "./bookmarks-schema";
import {
  dialogPortalPropsForApp,
  mountDialog,
} from "./mount-dialog";
import PickBookmarkGroup from "./pick-bookmark-group.svelte";

const BOOKMARKS_MANIFEST: PluginManifest = {
  id: BOOKMARKS_PLUGIN_ID,
  name: "Bookmarks",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description: "Bookmark files, folders, searches, and groups",
  author: "Lapis Notes",
};

export class BookmarksPlugin extends Plugin {
  readonly store: BookmarksStore;

  constructor(app: App, manifest: PluginManifest = BOOKMARKS_MANIFEST) {
    super(app, manifest);
    this.store = new BookmarksStore(createPluginBookmarksPersistence(this));
  }

  async onload(): Promise<void> {
    await this.store.load();
    this.register(createVaultRenameBinding(this.app, this.store));
    this.registerSidebarView(
      BookmarksViewType,
      (leaf) => new BookmarksView(leaf, this),
      { side: "left", title: "Bookmarks", icon: "bookmark" },
      {
        kind: "command",
        command: {
          id: "open-bookmarks",
          name: "Open Bookmarks",
          callback: () => void this.openBookmarks(),
        },
      },
    );
    this.addCommand({
      id: "add-bookmark",
      name: "Add bookmark",
      checkCallback: (checking) => {
        const target = bookmarkableTarget(this.app);
        if (!target) return false;
        if (!checking) void this.promptAddBookmark();
        return true;
      },
    });
    this.addCommand({
      id: "bookmark-url",
      name: "Bookmark URL",
      callback: () => void this.promptBookmarkUrl(),
    });
  }

  async openBookmarks(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(BookmarksViewType)[0];
    const target =
      existing ?? this.app.workspace.ensureSideLeaf(BookmarksViewType, "left");
    if (!existing) {
      await target.setViewState({ type: BookmarksViewType, state: {} });
    }
    this.app.workspace.activateLeaf(target, {
      focusRootHost: false,
      source: "api",
      operation: "open-bookmarks",
    });
    await this.app.workspace.revealLeaf(target);
  }

  async createGroup(parentCtime: number | null = null): Promise<{ ctime: number }> {
    return this.store.addGroup("Untitled group", parentCtime);
  }

  async promptAddBookmark(): Promise<void> {
    const target = bookmarkableTarget(this.app);
    if (!target) {
      new Notice("No active file or search to bookmark.");
      return;
    }
    if (target.kind === "file") {
      await this.promptAdd({
        kind: "file",
        targetLabel: "Path",
        targetValue: target.file.path,
        titlePlaceholder: target.file.basename || basename(target.file.path),
      });
      return;
    }
    await this.promptAdd({
      kind: "search",
      targetLabel: "Query",
      targetValue: target.query,
      titlePlaceholder: target.query || "Search",
    });
  }

  async promptBookmarkUrl(): Promise<void> {
    await this.promptAdd({
      kind: "url",
      targetLabel: "URL",
      targetValue: "",
      titlePlaceholder: "Example",
      targetEditable: true,
    });
  }

  private async promptAdd(draft: {
    kind: "file" | "search" | "url";
    targetLabel: string;
    targetValue: string;
    titlePlaceholder: string;
    targetEditable?: boolean;
  }): Promise<void> {
    const confirmed = await new Promise<{
      title: string;
      targetValue: string;
    } | null>((resolve) => {
      const host = mountDialog(this.app, AddBookmarkDialog, {
        targetLabel: draft.targetLabel,
        targetValue: draft.targetValue,
        titlePlaceholder: draft.titlePlaceholder,
        targetEditable: draft.targetEditable ?? false,
        portalProps: dialogPortalPropsForApp(this.app),
        onCancel: () => {
          host.close();
          resolve(null);
        },
        onConfirm: (title, targetValue) => {
          host.close();
          resolve({ title, targetValue });
        },
      });
    });
    if (!confirmed) return;
    if (draft.kind === "url" && !isAllowedBookmarkUrl(confirmed.targetValue)) {
      new Notice("Only http and https bookmark URLs can be opened.");
      return;
    }
    const parentCtime = await this.pickGroup();
    if (parentCtime === undefined) return;
    if (draft.kind === "file") {
      await this.store.addFile(confirmed.targetValue, {
        title: confirmed.title || undefined,
        parentCtime,
      });
      return;
    }
    if (draft.kind === "search") {
      await this.store.addSearch(confirmed.targetValue, {
        title: confirmed.title || undefined,
        parentCtime,
      });
      return;
    }
    await this.store.addUrl(confirmed.targetValue, {
      title: confirmed.title || undefined,
      parentCtime,
    });
  }

  private async pickGroup(): Promise<number | null | undefined> {
    const groups = [
      { ctime: null as number | null, label: "Root", description: "Top level" },
      ...listBookmarkGroups(this.store.items).map(({ item, crumbs }) => ({
        ctime: item.ctime as number | null,
        label: item.title || crumbs.at(-1) || "Untitled group",
        description: crumbs.join(" / "),
      })),
    ];
    return new Promise((resolve) => {
      const host = mountDialog(this.app, PickBookmarkGroup, {
        groups,
        portalProps: dialogPortalPropsForApp(this.app),
        onCancel: () => {
          host.close();
          resolve(undefined);
        },
        onSelect: (ctime, createTitle) => {
          host.close();
          void (async () => {
            if (createTitle) {
              const created = await this.store.addGroup(createTitle, ctime);
              resolve(created.ctime);
              return;
            }
            resolve(ctime);
          })();
        },
      });
    });
  }
}
