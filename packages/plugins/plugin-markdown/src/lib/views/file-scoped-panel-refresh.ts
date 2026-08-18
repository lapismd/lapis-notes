import type { App, HeadingCache } from "@lapis-notes/api";

/** Sorted headings for a vault path from the live metadata cache. */
export function readSortedHeadings(
  app: App,
  path: string | null | undefined,
): HeadingCache[] {
  if (!path) return [];
  return [...(app.metadataCache.getCache(path)?.headings ?? [])].sort(
    (left, right) => left.position.start.offset - right.position.start.offset,
  );
}

/**
 * Refresh a file-scoped Markdown panel now and when metadata or the followed
 * file changes, including a cache that finished loading before mount.
 */
export function subscribeFileScopedPanelRefresh(
  app: App,
  refresh: () => void,
): () => void {
  const metadataChanged = app.metadataCache.on("changed", refresh);
  const metadataDeleted = app.metadataCache.on("deleted", refresh);
  const metadataLoaded = app.metadataCache.on("loaded", refresh);
  const fileOpened = app.workspace.on("file-open", refresh);
  const activeLeafChanged = app.workspace.on("active-leaf-change", refresh);
  refresh();
  return () => {
    app.metadataCache.offref(metadataChanged);
    app.metadataCache.offref(metadataDeleted);
    app.metadataCache.offref(metadataLoaded);
    app.workspace.offref(fileOpened);
    app.workspace.offref(activeLeafChanged);
  };
}

export function trackMetadataCacheRevision(app: App): void {
  void app.metadataCache.fileCache;
  void app.metadataCache.metadataCache;
}
