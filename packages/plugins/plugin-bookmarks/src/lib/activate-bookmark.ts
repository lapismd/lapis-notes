import {
  Notice,
  TextFileView,
  resolveSubpath,
  type App,
  type TFile,
} from "@lapis-notes/api";
import {
  isFileBookmark,
  isFolderBookmark,
  isGraphBookmark,
  isGroupBookmark,
  isSearchBookmark,
  isUrlBookmark,
  type BookmarkItem,
} from "./bookmarks-schema";

const FILE_EXPLORER_REVEAL_PATH_COMMAND = "lapis-file-explorer:reveal-path";
const SEARCH_OPEN_COMMAND = "search:open-search";
const GRAPH_VIEW_TYPE = "graph";

export function isAllowedBookmarkUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function activateBookmark(
  app: App,
  item: BookmarkItem,
  openUrl: (url: string) => void = defaultOpenUrl,
): Promise<void> {
  if (isFileBookmark(item)) {
    await activateFileBookmark(app, item.path, item.subpath);
    return;
  }
  if (isFolderBookmark(item)) {
    if (!app.vault.getAbstractFileByPath(item.path)) {
      new Notice(`Unable to find folder: ${item.path || "unknown"}`);
      return;
    }
    await app.commands.executeCommand(FILE_EXPLORER_REVEAL_PATH_COMMAND, item.path);
    return;
  }
  if (isSearchBookmark(item)) {
    await app.commands.executeCommand(SEARCH_OPEN_COMMAND, item.query);
    return;
  }
  if (isUrlBookmark(item)) {
    if (!isAllowedBookmarkUrl(item.url)) {
      new Notice("Only http and https bookmark URLs can be opened.");
      return;
    }
    openUrl(item.url);
    return;
  }
  if (isGraphBookmark(item)) {
    await activateGraphBookmark(app);
    return;
  }
  if (isGroupBookmark(item)) return;
  new Notice(`Unsupported bookmark type: ${item.type}`);
}

async function activateFileBookmark(
  app: App,
  path: string,
  subpath?: string,
): Promise<void> {
  const file = app.vault.getFileByPath(path);
  if (!file) {
    new Notice(`Unable to find file: ${path || "unknown"}`);
    return;
  }
  await app.openFile(file);
  if (!subpath) return;
  const cache = app.metadataCache.getFileCache(file);
  if (!cache) return;
  const resolved = resolveSubpath(cache, subpath);
  if (!resolved) return;
  const view = app.workspace.activeLeaf?.view;
  if (!(view instanceof TextFileView)) return;
  view.editor.setCursor({
    line: resolved.start.line,
    ch: resolved.start.col,
  });
}

async function activateGraphBookmark(app: App): Promise<void> {
  const existing = app.workspace.getLeavesOfType(GRAPH_VIEW_TYPE)[0];
  if (existing) {
    app.workspace.activateLeaf(existing, {
      focusRootHost: false,
      source: "api",
      operation: "open-graph-bookmark",
    });
    await app.workspace.revealLeaf(existing);
    return;
  }
  const leaf = app.workspace.getLeaf();
  await leaf.setViewState({ type: GRAPH_VIEW_TYPE, state: {} });
  if (leaf.view.getViewType() === GRAPH_VIEW_TYPE) {
    app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: "open-graph-bookmark",
    });
    await app.workspace.revealLeaf(leaf);
    return;
  }
  leaf.detach();
  new Notice("Graph is not available.");
}

function defaultOpenUrl(url: string): void {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function bookmarkableTarget(app: App):
  | { kind: "file"; file: TFile }
  | { kind: "search"; query: string }
  | null {
  const file = app.workspace.getActiveFile();
  if (file) return { kind: "file", file };
  const leaf = app.workspace.activeLeaf;
  if (leaf?.view.getViewType() === "search") {
    const query =
      typeof leaf.view.getState().query === "string"
        ? String(leaf.view.getState().query)
        : "";
    return { kind: "search", query };
  }
  return null;
}
