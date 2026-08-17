import { afterEach, describe, expect, it, vi } from "vitest";
import {
  METADATA_CACHE_BACKUP_PATH,
  MetadataCache,
  iterateCacheRefs,
  iterateRefs,
  parseFrontMatterTags,
  resolveSubpath,
  type CachedMetadata,
  type Loc,
  type Pos,
} from "../cache.svelte";
import {
  APP_DATABASE_SCHEMA_VERSION,
  MemoryAppDatabase,
  MemoryKeyValueStore,
  setDefaultVaultStateStore,
} from "../storage";
import { TFile } from "../storage/fs";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

function loc(line: number): Loc {
  return { line, col: 0, offset: line };
}

function pos(start: number, end: number = start + 1): Pos {
  return { start: loc(start), end: loc(end) };
}

afterEach(() => {
  setDefaultVaultStateStore(null);
  vi.useRealTimers();
});

function createMetadataCache(paths: string[]): MetadataCache {
  setDefaultVaultStateStore(new MemoryKeyValueStore());
  const files = new Map(
    paths.map((path) => [
      path,
      new TFile(path, { ctime: 0, mtime: 0, size: 1 }, null),
    ]),
  );

  return new MetadataCache({
    appDatabase: {
      saveMetadataSnapshot: vi.fn(async () => {}),
    },
    vault: {
      adapter: {
        getVaultId: () => "vault-under-test",
        getName: () => "fake-adapter",
      },
      getFileByPath: (path: string) => files.get(path) ?? null,
      getFiles: () => [...files.values()],
      getMarkdownFiles: () =>
        [...files.values()].filter((file) =>
          /\.(md|markdown)$/i.test(file.path),
        ),
      on: vi.fn(),
      off: vi.fn(),
    },
  } as any);
}

function createProgressNotifications() {
  return {
    withProgress: async (_options: unknown, task: (progress: any) => any) =>
      task({
        report: vi.fn(),
        throwIfCancellationRequested: vi.fn(),
      }),
  };
}

function createLoadCache(
  options: {
    adapter?: InMemoryDataAdapter;
    database?: MemoryAppDatabase;
    files?: TFile[];
  } = {},
) {
  setDefaultVaultStateStore(new MemoryKeyValueStore());
  const adapter = options.adapter ?? new InMemoryDataAdapter();
  const database =
    options.database ?? new MemoryAppDatabase("vault-under-test");
  const files = options.files ?? [];
  const filesByPath = new Map(files.map((file) => [file.path, file]));
  const cache = new MetadataCache({
    appDatabase: database,
    notifications: createProgressNotifications(),
    metadataTypeManager: { types: {} },
    vault: {
      adapter: Object.assign(adapter, {
        getVaultId: () => "vault-under-test",
        getName: () => "fake-adapter",
      }),
      read: (file: TFile) => adapter.read(file.path),
      getFileByPath: (path: string) => filesByPath.get(path) ?? null,
      getFiles: () => [...filesByPath.values()],
      getMarkdownFiles: () =>
        [...filesByPath.values()].filter((file) =>
          /\.(md|markdown)$/i.test(file.path),
        ),
      on: vi.fn(),
      off: vi.fn(),
    },
  } as any);
  (cache as any).legacyStorage = {
    getMany: vi.fn(async () => [null, null, null, null]),
  };
  return { adapter, cache, database };
}

function createSnapshot(): {
  snapshot: ReturnType<MetadataCache["toJSON"]>;
  file: TFile;
} {
  const file = new TFile("Notes/A.md", { ctime: 1, mtime: 2, size: 3 }, null);
  return {
    file,
    snapshot: {
      fileCache: {
        "Notes/A.md": { mtime: 2, size: 3, hash: "hash-a" },
      },
      metadataCache: {
        "hash-a": {
          links: [
            {
              link: "B",
              original: "[[B]]",
              position: pos(1),
            },
          ],
          tags: [{ tag: "#project", position: pos(2) }],
          frontmatter: { status: "active" },
        },
      },
      resolvedLinks: { "Notes/A.md": { "Notes/B.md": 1 } },
      unresolvedLinks: {},
    },
  };
}

describe("metadata reference helpers", () => {
  it("iterates references and stops when requested", () => {
    const refs = [
      { link: "a", original: "[[a]]" },
      { link: "b", original: "[[b]]" },
    ];
    const seen: string[] = [];

    const stopped = iterateRefs(refs, (ref) => {
      seen.push(ref.link);
      return ref.link === "a";
    });

    expect(stopped).toBe(true);
    expect(seen).toEqual(["a"]);
  });

  it("iterates cache links and embeds", () => {
    const cache: CachedMetadata = {
      links: [{ link: "a", original: "[[a]]", position: pos(1) }],
      embeds: [{ link: "b", original: "![[b]]", position: pos(2) }],
    };
    const seen: string[] = [];

    iterateCacheRefs(cache, (ref) => {
      seen.push(ref.link);
    });

    expect(seen).toEqual(["a", "b"]);
  });

  it("resolves heading, block, and footnote subpaths", () => {
    const cache: CachedMetadata = {
      headings: [
        { heading: "Daily Note", level: 1, position: pos(1) },
        { heading: "Next", level: 2, position: pos(5) },
      ],
      blocks: {
        abc: { id: "abc", position: pos(7) },
      },
      footnotes: [{ id: "note", position: pos(9) }],
    };

    expect(resolveSubpath(cache, "#Daily Note")).toMatchObject({
      type: "heading",
      start: loc(1),
      end: loc(5),
    });
    expect(resolveSubpath(cache, "#^abc")).toMatchObject({
      type: "block",
      start: loc(7),
    });
    expect(resolveSubpath(cache, "#[note]")).toMatchObject({
      type: "footnote",
      start: loc(9),
    });
  });
});

describe("frontmatter tag parsing", () => {
  it("collects bare and prefixed tags from tag arrays and strings", () => {
    expect(
      parseFrontMatterTags({
        tags: ["work", "#project/nested", "not valid tag"],
        tag: "inbox, #waiting; next",
      }),
    ).toEqual(["#work", "#project/nested", "#inbox", "#waiting", "#next"]);
  });
});

describe("MetadataCache.load", () => {
  it("applies an app-database snapshot and does not rebuild", async () => {
    const { file, snapshot } = createSnapshot();
    const database = new MemoryAppDatabase("vault-under-test");
    await database.open();
    await database.saveMetadataSnapshot(snapshot);
    const { cache } = createLoadCache({ database, files: [file] });
    const rebuild = vi.spyOn(cache, "rebuild");
    const loaded = vi.fn();
    cache.on("loaded", loaded);

    await cache.load();

    expect(cache.fileCache).toEqual(snapshot.fileCache);
    expect(cache.resolvedLinks).toEqual(snapshot.resolvedLinks);
    expect(rebuild).not.toHaveBeenCalled();
    expect(loaded).toHaveBeenCalledTimes(1);
  });

  it("restores from a portable backup and hydrates the app database", async () => {
    const { file, snapshot } = createSnapshot();
    const adapter = new InMemoryDataAdapter();
    await adapter.mkdir("Notes");
    await adapter.write("Notes/A.md", "content");
    await adapter.mkdir(".lapis");
    await adapter.mkdir(".lapis/cache");
    await adapter.write(
      METADATA_CACHE_BACKUP_PATH,
      JSON.stringify({
        kind: "lapis.metadata-cache.snapshot",
        schemaVersion: 1,
        appDatabaseSchemaVersion: APP_DATABASE_SCHEMA_VERSION,
        createdAt: 1,
        updatedAt: 2,
        sourceVaultId: "copied-vault",
        snapshot,
      }),
    );
    const database = new MemoryAppDatabase("vault-under-test");
    const { cache } = createLoadCache({ adapter, database, files: [file] });
    const loaded = vi.fn();
    cache.on("loaded", loaded);

    await cache.load();

    expect(cache.fileCache).toEqual(snapshot.fileCache);
    await expect(database.loadMetadataSnapshot()).resolves.toEqual(snapshot);
    expect(loaded).toHaveBeenCalledTimes(1);
  });

  it("ignores invalid portable backups and rebuilds when no state exists", async () => {
    const adapter = new InMemoryDataAdapter();
    await adapter.mkdir(".lapis");
    await adapter.mkdir(".lapis/cache");
    await adapter.write(METADATA_CACHE_BACKUP_PATH, "{");
    const { cache } = createLoadCache({ adapter });
    const rebuild = vi.spyOn(cache, "rebuild");

    await cache.load();

    expect(rebuild).toHaveBeenCalledTimes(1);
  });

  it("falls back when app database metadata snapshot loading times out", async () => {
    vi.stubGlobal("indexedDB", {
      open: vi.fn(() => {
        const request: Record<string, any> = {
          result: {
            createObjectStore: vi.fn(),
          },
        };

        queueMicrotask(() => {
          request.onupgradeneeded?.();
          request.onsuccess?.();
        });

        return request;
      }),
    });

    const open = vi.fn(async () => {});
    const loadMetadataSnapshot = vi.fn(async () => {
      throw new Error(
        "Remote app database request timed out: loadMetadataSnapshot",
      );
    });
    const saveMetadataSnapshot = vi.fn(async () => {});

    const cache = new MetadataCache({
      appDatabase: {
        open,
        loadMetadataSnapshot,
        saveMetadataSnapshot,
      },
      notifications: createProgressNotifications(),
      vault: {
        adapter: {
          getVaultId: () => "vault-under-test",
          getName: () => "fake-adapter",
          exists: vi.fn(async () => false),
        },
        getFiles: vi.fn(() => []),
        on: vi.fn(),
      },
    } as any);

    (cache as any).legacyStorage = {
      getMany: vi.fn(async () => [null, null, null, null]),
    };

    const loaded = vi.fn();
    cache.on("loaded", loaded);

    await expect(cache.load()).resolves.toBeUndefined();

    expect(open).toHaveBeenCalledTimes(1);
    expect(loadMetadataSnapshot).toHaveBeenCalledTimes(1);
    expect(saveMetadataSnapshot).toHaveBeenCalledTimes(1);
    expect(loaded).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});

describe("MetadataCache lifecycle", () => {
  it("cancels a pending snapshot when disposed without persistence", async () => {
    vi.useFakeTimers();
    const cache = createMetadataCache([]);
    const saveMetadataSnapshot = vi.mocked(
      cache.app.appDatabase.saveMetadataSnapshot,
    );

    cache.scheduleSnapshotSave();
    await cache.dispose({ persist: false });
    await vi.runAllTimersAsync();

    expect(saveMetadataSnapshot).not.toHaveBeenCalled();
  });

  it("persists exactly once while disposing a pending snapshot", async () => {
    vi.useFakeTimers();
    const { file, snapshot } = createSnapshot();
    const { cache, database } = createLoadCache({ files: [file] });
    await database.saveMetadataSnapshot(snapshot);
    await cache.load();
    const saveMetadataSnapshot = vi.spyOn(database, "saveMetadataSnapshot");

    cache.scheduleSnapshotSave();
    await cache.dispose();
    await vi.runAllTimersAsync();

    expect(saveMetadataSnapshot).toHaveBeenCalledTimes(1);
  });

  it("does not persist an empty cache when disposed before load finishes", async () => {
    const { file, snapshot } = createSnapshot();
    const { cache, database } = createLoadCache({ files: [file] });
    await database.saveMetadataSnapshot(snapshot);
    let releaseOpen: (() => void) | undefined;
    const openStarted = new Promise<void>((resolve) => {
      vi.spyOn(database, "open").mockImplementation(
        () =>
          new Promise((openResolve) => {
            resolve();
            releaseOpen = () => openResolve();
          }),
      );
    });
    const saveMetadataSnapshot = vi.spyOn(database, "saveMetadataSnapshot");

    const load = cache.load();
    await openStarted;
    const disposing = cache.dispose();
    releaseOpen?.();
    await disposing;
    await load;

    expect(saveMetadataSnapshot).not.toHaveBeenCalled();
    await expect(database.loadMetadataSnapshot()).resolves.toEqual(snapshot);
  });
});

describe("MetadataCache link helpers", () => {
  it("collects direct reference paths from links and embeds", () => {
    const cache = createMetadataCache([
      "Notes/Index.md",
      "Notes/Target.md",
      "Assets/Figure.png",
    ]);

    cache.fileCache["Notes/Index.md"] = {
      hash: "index-hash",
      mtime: 0,
      size: 1,
    };
    cache.metadataCache["index-hash"] = {
      links: [{ link: "Target", original: "[[Target]]", position: pos(1) }],
      embeds: [
        {
          link: "../Assets/Figure.png",
          original: "![[../Assets/Figure.png]]",
          position: pos(2),
        },
      ],
    };

    expect(cache.getDirectReferencePaths("Notes/Index.md")).toEqual([
      "Notes/Target.md",
      "Assets/Figure.png",
    ]);
  });

  it("finds direct referencing source paths", () => {
    const cache = createMetadataCache([
      "Notes/Index.md",
      "Notes/Target.md",
      "Assets/Figure.png",
    ]);

    cache.fileCache["Notes/Index.md"] = {
      hash: "index-hash",
      mtime: 0,
      size: 1,
    };
    cache.metadataCache["index-hash"] = {
      links: [{ link: "Target", original: "[[Target]]", position: pos(1) }],
      embeds: [
        {
          link: "../Assets/Figure.png",
          original: "![[../Assets/Figure.png]]",
          position: pos(2),
        },
      ],
    };

    expect(cache.getDirectReferencingPaths("Notes/Target.md")).toEqual([
      "Notes/Index.md",
    ]);
    expect(cache.getDirectReferencingPaths("Assets/Figure.png")).toEqual([
      "Notes/Index.md",
    ]);
  });

  it("detects direct path-change impact in both directions", () => {
    const cache = createMetadataCache([
      "Notes/Index.md",
      "Notes/Target.md",
      "Assets/Figure.png",
      "Notes/Unrelated.md",
    ]);

    cache.fileCache["Notes/Index.md"] = {
      hash: "index-hash",
      mtime: 0,
      size: 1,
    };
    cache.metadataCache["index-hash"] = {
      links: [{ link: "Target", original: "[[Target]]", position: pos(1) }],
      embeds: [
        {
          link: "../Assets/Figure.png",
          original: "![[../Assets/Figure.png]]",
          position: pos(2),
        },
      ],
    };

    expect(
      cache.isDirectlyAffectedByPathChange("Notes/Index.md", "Notes/Index.md"),
    ).toBe(true);
    expect(
      cache.isDirectlyAffectedByPathChange("Notes/Index.md", "Notes/Target.md"),
    ).toBe(true);
    expect(
      cache.isDirectlyAffectedByPathChange("Notes/Target.md", "Notes/Index.md"),
    ).toBe(true);
    expect(
      cache.isDirectlyAffectedByPathChange(
        "Notes/Index.md",
        "Assets/Figure.png",
      ),
    ).toBe(true);
    expect(
      cache.isDirectlyAffectedByPathChange(
        "Notes/Index.md",
        "Notes/Unrelated.md",
      ),
    ).toBe(false);
  });

  it("resolves relative links from the source note path", () => {
    const cache = createMetadataCache(["Projects/Foo.md", "Areas/Foo.md"]);

    expect(cache.getFirstLinkpathDest("Foo", "Projects/Index.md")?.path).toBe(
      "Projects/Foo.md",
    );
    expect(
      cache.getFirstLinkpathDest("../Areas/Foo", "Projects/Index.md")?.path,
    ).toBe("Areas/Foo.md");
  });

  it("resolves bare non-markdown filenames without the full path", () => {
    const cache = createMetadataCache([
      "Assets/ISO20022 Mapping Guide.pdf",
      "Notes/Index.md",
    ]);

    expect(
      cache.getFirstLinkpathDest("ISO20022 Mapping Guide.pdf", "Notes/Index.md")
        ?.path,
    ).toBe("Assets/ISO20022 Mapping Guide.pdf");
  });

  it("resolves non-markdown suffix paths without the full vault path", () => {
    const cache = createMetadataCache([
      "A/Work/Guide.pdf",
      "B/Work/Guide.pdf",
      "C/Personal/Guide.pdf",
    ]);

    expect(
      cache.getFirstLinkpathDest("Personal/Guide.pdf", "Index.md")?.path,
    ).toBe("C/Personal/Guide.pdf");
  });

  it("formats link text using the shared path helper", () => {
    const cache = createMetadataCache(["Projects/Foo.md", "Archive/Foo.md"]);
    const file = cache.app.vault.getFileByPath("Projects/Foo.md");

    expect(file).toBeTruthy();
    expect(cache.fileToLinktext(file!, "Index.md", true)).toBe("Projects/Foo");
    expect(cache.fileToLinktext(file!, "Index.md", false)).toBe(
      "Projects/Foo.md",
    );
  });

  it("formats non-markdown link text using the shared path helper", () => {
    const cache = createMetadataCache([
      "Assets/Guide.pdf",
      "Archive/Guide.pdf",
    ]);
    const file = cache.app.vault.getFileByPath("Assets/Guide.pdf");

    expect(file).toBeTruthy();
    expect(cache.fileToLinktext(file!, "Index.md", true)).toBe(
      "Assets/Guide.pdf",
    );
    expect(cache.fileToLinktext(file!, "Index.md", false)).toBe(
      "Assets/Guide.pdf",
    );
  });
});
