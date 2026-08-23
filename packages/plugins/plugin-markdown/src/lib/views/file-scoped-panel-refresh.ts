import type { App, HeadingCache } from "@lapis-notes/api";
import { resolvePanelTargetFile } from "./panel-target-file";

/** Sorted headings for a vault path from the live metadata cache. */
export async function readSortedHeadings(
  app: App,
  path: string | null | undefined,
): Promise<HeadingCache[]> {
  if (!path) return [];
  const cache = await app.metadataCache.getFileCacheAsync(path);
  return [...(cache?.headings ?? [])].sort(
    (left, right) => left.position.start.offset - right.position.start.offset,
  );
}

function followedPath(app: App): string | null {
  return resolvePanelTargetFile(app)?.path ?? null;
}

/**
 * Refresh a file-scoped Markdown panel now and when metadata or the followed
 * path changes, including a cache that finished loading before mount.
 */
export function subscribeFileScopedPanelRefresh(
  app: App,
  refresh: () => void | Promise<void>,
  options: { includeAnyMetadataPath?: boolean } = {},
): () => void {
  let lastPath = followedPath(app);

  const notify = () => {
    lastPath = followedPath(app);
    void refresh();
  };
  const notifyIfPathChanged = () => {
    const nextPath = followedPath(app);
    if (nextPath === lastPath) return;
    lastPath = nextPath;
    void refresh();
  };

  const metadataChanged = app.metadataCache.on("index-changed", (change) => {
    if (
      change.reset ||
      (change.domains.includes("metadata") &&
        (options.includeAnyMetadataPath ||
          !lastPath ||
          change.paths.includes(lastPath)))
    ) {
      notify();
    }
  });
  const metadataLoaded = app.metadataCache.on("loaded", notify);
  const fileOpened = app.workspace.on("file-open", notifyIfPathChanged);
  const activeLeafChanged = app.workspace.on(
    "active-leaf-change",
    notifyIfPathChanged,
  );
  void refresh();
  return () => {
    app.metadataCache.offref(metadataChanged);
    app.metadataCache.offref(metadataLoaded);
    app.workspace.offref(fileOpened);
    app.workspace.offref(activeLeafChanged);
  };
}

export function trackMetadataCacheRevision(app: App): void {
  void app.metadataCache.initialized;
}
