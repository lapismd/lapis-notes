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
  IndexProjectionRegistry,
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
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
    indexProjections: new IndexProjectionRegistry(),
    vault: {
      adapter: {
        getVaultId: () => "vault-under-test",
        getName: () => "fake-adapter",
      },
      getFileByPath: (path: string) => files.get(path) ?? null,
      getFiles: () => [...files.values()],
      iterateFiles: function* () {
        yield* files.values();
      },
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
  const reports: Array<Record<string, unknown> & { inFlight: boolean }> = [];
  let inFlight = false;
  return {
    reports,
    withProgress: async (_options: unknown, task: (progress: any) => any) => {
      inFlight = true;
      try {
        return await task({
          report: (value: Record<string, unknown> = {}) => {
            reports.push({ ...value, inFlight });
          },
          throwIfCancellationRequested: vi.fn(),
        });
      } finally {
        inFlight = false;
      }
    },
  };
}

function createLoadCache(
  options: {
    adapter?: InMemoryDataAdapter;
    database?: MemoryAppDatabase;
    files?: TFile[];
    notifications?: ReturnType<typeof createProgressNotifications>;
  } = {},
) {
  setDefaultVaultStateStore(new MemoryKeyValueStore());
  const adapter = options.adapter ?? new InMemoryDataAdapter();
  const database =
    options.database ?? new MemoryAppDatabase("vault-under-test");
  const files = options.files ?? [];
  const filesByPath = new Map(files.map((file) => [file.path, file]));
  const notifications = options.notifications ?? createProgressNotifications();
  const cache = new MetadataCache({
    appDatabase: database,
    indexProjections: new IndexProjectionRegistry(),
    notifications,
    metadataTypeManager: {
      types: {},
      determinePropertyType: () => undefined,
    },
    vault: {
      adapter: Object.assign(adapter, {
        getVaultId: () => "vault-under-test",
        getName: () => "fake-adapter",
      }),
      read: (file: TFile) => adapter.read(file.path),
      getFileByPath: (path: string) => filesByPath.get(path) ?? null,
      getFiles: () => [...filesByPath.values()],
      iterateFiles: function* () {
        yield* filesByPath.values();
      },
      getMarkdownFiles: () =>
        [...filesByPath.values()].filter((file) =>
          /\.(md|markdown)$/i.test(file.path),
        ),
      on: vi.fn(),
      off: vi.fn(),
    },
  } as any);
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

async function seedIndexedMetadata(
  database: MemoryAppDatabase,
  file: TFile,
  metadata: CachedMetadata,
  parserVersion = "metadata-cache-v2:md:1",
) {
  await database.upsertIndexedFile({
    file: {
      path: file.path,
      normalizedPath: file.path,
      extension: file.extension,
      mtime: file.stat.mtime,
      size: file.stat.size,
      hash: `hash:${file.path}`,
      indexed: true,
    },
    metadata: {
      path: file.path,
      hash: `hash:${file.path}`,
      parserVersion,
      metadata,
    },
    links: [],
    tags: [],
    properties: [],
  });
}

describe("MetadataCache.load", () => {
  it("publishes loaded from a queryable database without hydrating metadata", async () => {
    const { file } = createSnapshot();
    const adapter = new InMemoryDataAdapter();
    const database = new MemoryAppDatabase("vault-under-test");
    await database.open();
    await seedIndexedMetadata(database, file, {
      frontmatter: { status: "active" },
    });
    const { cache } = createLoadCache({ adapter, database, files: [file] });
    cache.addProcessor("md", { read: async () => ({}), write: () => "" });
    const bodyRead = vi.spyOn(adapter, "read");
    const snapshotLoad = vi.spyOn(database, "loadMetadataSnapshot");
    const eagerVaultEnumeration = vi
      .spyOn(cache.app.vault, "getFiles")
      .mockImplementation(() => {
        throw new Error("warm reconciliation must use the bounded iterator");
      });
    const loadedState: number[] = [];
    cache.on("loaded", () =>
      loadedState.push(Object.keys(cache.fileCache).length),
    );

    await cache.load();

    expect(loadedState).toEqual([0]);
    expect(snapshotLoad).not.toHaveBeenCalled();
    expect(bodyRead).not.toHaveBeenCalled();
    expect(eagerVaultEnumeration).not.toHaveBeenCalled();
    expect(cache.initialized).toBe(true);
    await expect(cache.getFileCacheAsync(file)).resolves.toMatchObject({
      frontmatter: { status: "active" },
    });
  });

  it("leaves the legacy portable cache artifact untouched", async () => {
    const adapter = new InMemoryDataAdapter();
    await adapter.mkdir(".lapis");
    await adapter.mkdir(".lapis/cache");
    await adapter.write(METADATA_CACHE_BACKUP_PATH, "legacy-cache-artifact");
    const { cache, database } = createLoadCache({ adapter });
    const snapshotLoad = vi.spyOn(database, "loadMetadataSnapshot");

    await cache.load();

    expect(await adapter.read(METADATA_CACHE_BACKUP_PATH)).toBe(
      "legacy-cache-artifact",
    );
    expect(snapshotLoad).not.toHaveBeenCalled();
  });

  it("emits loaded before parsing new files in background reconciliation", async () => {
    const file = new TFile(
      "Notes/New.md",
      { ctime: 1, mtime: 2, size: 6 },
      null,
    );
    const adapter = new InMemoryDataAdapter();
    await adapter.mkdir("Notes");
    await adapter.write(file.path, "# New\n");
    const { cache } = createLoadCache({ adapter, files: [file] });
    const order: string[] = [];
    cache.addProcessor("md", {
      read: async () => {
        order.push("parsed");
        return {
          frontmatter: { tags: ["frontmatter", "project/nested"] },
          headings: [],
        };
      },
      write: () => "",
    });
    cache.on("loaded", () => order.push("loaded"));

    await cache.load();

    expect(order).toEqual(["loaded", "parsed"]);
    await expect(cache.queryFacets({ kind: "tag" })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "frontmatter", count: 1 }),
        expect.objectContaining({ value: "project/nested", count: 1 }),
      ]),
    );
  });

  it("reparses parser-signature-stale files even when stat is unchanged", async () => {
    const file = new TFile(
      "Notes/Stale.md",
      { ctime: 1, mtime: 2, size: 8 },
      null,
    );
    const adapter = new InMemoryDataAdapter();
    await adapter.mkdir("Notes");
    await adapter.write(file.path, "# Stale\n");
    const database = new MemoryAppDatabase("vault-under-test");
    await database.open();
    await seedIndexedMetadata(database, file, {}, "metadata-cache-v1");
    const { cache } = createLoadCache({ adapter, database, files: [file] });
    const parse = vi.fn(async () => ({ headings: [] }));
    cache.addProcessor("md", { read: parse, write: () => "" });

    await cache.load();

    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("caps asynchronously loaded metadata at 512 hot entries", async () => {
    const database = new MemoryAppDatabase("vault-under-test");
    await database.open();
    for (let index = 0; index < 513; index += 1) {
      const file = new TFile(
        `Notes/${String(index).padStart(3, "0")}.md`,
        {
          ctime: 1,
          mtime: 2,
          size: 3,
        },
        null,
      );
      await seedIndexedMetadata(database, file, { frontmatter: { index } });
    }
    const { cache } = createLoadCache({ database });

    for (let index = 0; index < 513; index += 1) {
      await cache.getFileCacheAsync(
        `Notes/${String(index).padStart(3, "0")}.md`,
      );
    }

    expect(Object.keys(cache.fileCache)).toHaveLength(512);
    expect(cache.getCache("Notes/000.md")).toBeNull();
    expect(cache.getCache("Notes/512.md")).toMatchObject({
      frontmatter: { index: 512 },
    });
  });
});

describe("MetadataCache lifecycle", () => {
  it("does not maintain compatibility snapshots without a lease", async () => {
    vi.useFakeTimers();
    const cache = createMetadataCache([]);
    const saveMetadataSnapshot = vi.mocked(
      cache.app.appDatabase.saveMetadataSnapshot,
    );

    cache.scheduleSnapshotSave();
    await vi.runAllTimersAsync();

    expect(saveMetadataSnapshot).not.toHaveBeenCalled();
  });

  it("materializes a deprecated snapshot only for an explicit lease", async () => {
    const { file } = createSnapshot();
    const untouched = new TFile(
      "Notes/Untouched.md",
      {
        ctime: 1,
        mtime: 2,
        size: 3,
      },
      null,
    );
    const database = new MemoryAppDatabase("vault-under-test");
    await database.open();
    await seedIndexedMetadata(database, file, {
      frontmatter: { status: "active" },
    });
    await seedIndexedMetadata(database, untouched, {
      frontmatter: { status: "cold" },
    });
    const { cache } = createLoadCache({ database, files: [file, untouched] });
    const saveMetadataSnapshot = vi.spyOn(database, "saveMetadataSnapshot");

    const firstLease = await cache.acquireMetadataSnapshotLease();
    const secondLease = await cache.acquireMetadataSnapshotLease();
    expect(cache.getCache(file.path)).toMatchObject({
      frontmatter: { status: "active" },
    });
    await cache.flushSnapshotSave();
    firstLease.release();
    expect(cache.fileCache[untouched.path]).toBeDefined();
    secondLease.release();

    expect(saveMetadataSnapshot).toHaveBeenCalledTimes(1);
    expect(cache.fileCache[untouched.path]).toBeUndefined();
    expect(cache.getCache(file.path)).toMatchObject({
      frontmatter: { status: "active" },
    });
  });

  it("does not persist an empty cache when disposed before database open finishes", async () => {
    const { cache, database } = createLoadCache();
    let releaseOpen: (() => void) | undefined;
    const openStarted = new Promise<void>((resolve) => {
      vi.spyOn(database, "open").mockImplementation(
        () =>
          new Promise((openResolve) => {
            resolve();
            releaseOpen = openResolve;
          }),
      );
    });
    const saveMetadataSnapshot = vi.spyOn(database, "saveMetadataSnapshot");

    const load = cache.load();
    await openStarted;
    const disposing = cache.dispose();
    releaseOpen?.();
    await Promise.all([disposing, load]);

    expect(saveMetadataSnapshot).not.toHaveBeenCalled();
  });

  it("keeps paged vault reconciliation under the load progress handle", async () => {
    const file = new TFile("Notes/A.md", { ctime: 1, mtime: 2, size: 3 }, null);
    const extra = new TFile(
      "Notes/B.md",
      { ctime: 1, mtime: 2, size: 8 },
      null,
    );
    const adapter = new InMemoryDataAdapter();
    await adapter.mkdir("Notes");
    await adapter.write(extra.path, "# Extra\n");
    const database = new MemoryAppDatabase("vault-under-test");
    await database.open();
    await seedIndexedMetadata(database, file, {});
    const notifications = createProgressNotifications();
    const { cache } = createLoadCache({
      adapter,
      database,
      files: [file, extra],
      notifications,
    });
    cache.addProcessor("md", {
      read: async () => ({ headings: [] }),
      write: () => "",
    });

    await cache.load();

    expect(
      notifications.reports.some(
        (report) => report.message === extra.path && report.inFlight,
      ),
    ).toBe(true);
    expect(notifications.reports.at(-1)?.inFlight).toBe(true);
  });

  it("stops reconciliation without committing a read that finishes after disposal", async () => {
    const file = new TFile(
      "Notes/Slow.md",
      { ctime: 1, mtime: 2, size: 7 },
      null,
    );
    const adapter = new InMemoryDataAdapter();
    await adapter.mkdir("Notes");
    await adapter.write(file.path, "# Slow\n");
    const { cache, database } = createLoadCache({ adapter, files: [file] });
    const body = deferred<string>();
    const readStarted = deferred<void>();
    vi.spyOn(cache.app.vault, "read").mockImplementation(async () => {
      readStarted.resolve();
      return body.promise;
    });
    cache.addProcessor("md", { read: async () => ({}), write: () => "" });

    const loading = cache.load();
    await readStarted.promise;
    const disposing = cache.dispose();
    body.resolve("# Slow\n");
    await Promise.all([loading, disposing]);

    await expect(database.getIndexedFile(file.path)).resolves.toBeUndefined();
  });
});

describe("MetadataCache query watches", () => {
  it("suppresses stale query results after a newer revision refresh", async () => {
    const { cache, database } = createLoadCache();
    const first = deferred<{ rows: []; nextCursor?: string }>();
    const second = deferred<{ rows: []; nextCursor?: string }>();
    const query = vi
      .spyOn(database, "queryIndexedMetadataPage")
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const seen: Array<string | undefined> = [];

    const watch = cache.watchQuery({}, (page) => seen.push(page.nextCursor));
    await vi.waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    cache.trigger("index-changed", {
      revision: 2,
      domains: ["metadata"],
      paths: ["Notes/A.md"],
      committedAt: 2,
    });
    await vi.waitFor(() => expect(query).toHaveBeenCalledTimes(2));
    second.resolve({ rows: [], nextCursor: "newer" });
    await vi.waitFor(() => expect(seen).toEqual(["newer"]));
    first.resolve({ rows: [], nextCursor: "stale" });
    await Promise.resolve();

    expect(seen).toEqual(["newer"]);
    expect(watch.current?.nextCursor).toBe("newer");
    watch.dispose();
  });

  it("surfaces current query failures through the watch error callback", async () => {
    const { cache, database } = createLoadCache();
    const failure = new Error("query unavailable");
    vi.spyOn(database, "queryIndexedMetadataPage").mockRejectedValue(failure);
    const onError = vi.fn();

    const watch = cache.watchQuery({}, vi.fn(), onError);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(failure));

    watch.dispose();
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
