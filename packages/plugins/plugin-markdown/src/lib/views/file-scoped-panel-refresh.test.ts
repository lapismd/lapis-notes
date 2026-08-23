import type {
  App,
  CachedMetadata,
  HeadingCache,
  TFile,
} from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import {
  readSortedHeadings,
  subscribeFileScopedPanelRefresh,
} from "./file-scoped-panel-refresh";

function heading(text: string, offset: number): HeadingCache {
  return {
    heading: text,
    level: 1,
    position: {
      start: { line: 0, col: 0, offset },
      end: { line: 0, col: text.length, offset: offset + text.length },
    },
  };
}

function createCacheApp(initial: Record<string, CachedMetadata> = {}) {
  const fileCache: Record<
    string,
    { hash: string; mtime: number; size: number }
  > = {};
  const metadataCache: Record<string, CachedMetadata> = {};
  for (const [path, cache] of Object.entries(initial)) {
    fileCache[path] = { hash: path, mtime: 1, size: 1 };
    metadataCache[path] = cache;
  }
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const on = (event: string, handler: (...args: unknown[]) => void) => {
    const bucket = listeners.get(event) ?? new Set();
    bucket.add(handler);
    listeners.set(event, bucket);
    return handler;
  };
  const offref = (handler: (...args: unknown[]) => void) => {
    for (const bucket of listeners.values()) bucket.delete(handler);
  };
  const trigger = (event: string, ...args: unknown[]) => {
    for (const handler of listeners.get(event) ?? []) handler(...args);
  };
  let activeFile: TFile | null = null;
  return {
    app: {
      metadataCache: {
        fileCache,
        metadataCache,
        initialized: Object.keys(metadataCache).length > 0,
        getCache: (path: string) =>
          metadataCache[fileCache[path]?.hash] ?? null,
        getFileCacheAsync: async (path: string) =>
          metadataCache[fileCache[path]?.hash] ?? null,
        on,
        offref,
        trigger,
      },
      workspace: {
        on,
        offref,
        trigger,
        getActiveFile: () => activeFile,
        iterateRootLeaves: () => undefined,
      },
    } as unknown as App,
    fileCache,
    metadataCache,
    trigger,
    setActiveFile(file: TFile | null) {
      activeFile = file;
    },
  };
}

describe("readSortedHeadings", () => {
  it("returns empty headings before the cache has the file", async () => {
    const { app } = createCacheApp();
    await expect(readSortedHeadings(app, "Notes/Note.md")).resolves.toEqual([]);
  });

  it("reads sorted headings after a late cache apply", async () => {
    const { app, fileCache, metadataCache } = createCacheApp();
    await expect(readSortedHeadings(app, "Notes/Note.md")).resolves.toEqual([]);

    fileCache["Notes/Note.md"] = { hash: "note", mtime: 1, size: 1 };
    metadataCache.note = {
      headings: [heading("Second", 20), heading("First", 4)],
    };

    await expect(
      readSortedHeadings(app, "Notes/Note.md").then((items) =>
        items.map((item) => item.heading),
      ),
    ).resolves.toEqual(["First", "Second"]);
  });
});

describe("subscribeFileScopedPanelRefresh", () => {
  it("refreshes immediately when the cache is already loaded", () => {
    const { app } = createCacheApp({
      "Notes/Note.md": { headings: [heading("Ready", 0)] },
    });
    const refresh = vi.fn();

    const stop = subscribeFileScopedPanelRefresh(app, refresh);

    expect(refresh).toHaveBeenCalledTimes(1);
    stop();
  });

  it("refreshes on loaded after mount and on a new followed path", () => {
    const { app, trigger, setActiveFile } = createCacheApp();
    const refresh = vi.fn();
    const stop = subscribeFileScopedPanelRefresh(app, refresh);
    refresh.mockClear();

    trigger("loaded");
    expect(refresh).toHaveBeenCalledTimes(1);

    const note = { path: "Notes/Note.md" } as TFile;
    setActiveFile(note);
    trigger("file-open", note);
    expect(refresh).toHaveBeenCalledTimes(2);

    trigger("layout-change", { source: "api" });
    expect(refresh).toHaveBeenCalledTimes(2);

    stop();
  });

  it("ignores leaf events that repeat the same followed path", () => {
    const { app, trigger, setActiveFile } = createCacheApp();
    const note = { path: "Notes/Note.md" } as TFile;
    setActiveFile(note);
    const refresh = vi.fn();
    const stop = subscribeFileScopedPanelRefresh(app, refresh);
    refresh.mockClear();

    trigger("file-open", note);
    trigger("active-leaf-change");
    expect(refresh).not.toHaveBeenCalled();

    trigger("index-changed", {
      revision: 1,
      domains: ["metadata"],
      paths: [note.path],
    });
    expect(refresh).toHaveBeenCalledTimes(1);

    setActiveFile({ path: "Notes/Other.md" } as TFile);
    trigger("active-leaf-change");
    expect(refresh).toHaveBeenCalledTimes(2);

    stop();
  });

  it("can refresh backlinks when another note's metadata changes", () => {
    const { app, trigger, setActiveFile } = createCacheApp();
    setActiveFile({ path: "Notes/Target.md" } as TFile);
    const refresh = vi.fn();
    const stop = subscribeFileScopedPanelRefresh(app, refresh, {
      includeAnyMetadataPath: true,
    });
    refresh.mockClear();

    trigger("index-changed", {
      revision: 1,
      domains: ["metadata"],
      paths: ["Notes/Source.md"],
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    stop();
  });
});
