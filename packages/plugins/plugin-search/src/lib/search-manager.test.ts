import {
  type App,
  type CachedMetadata,
  type SearchDocumentProvider,
  SearchDocumentProviderRegistry,
  type TFile,
  NoopTelemetryService,
  type TelemetryAttributes,
  type TelemetryMeasurementOptions,
  type TelemetryService,
  type TelemetrySpan,
  type TelemetrySpanOptions,
  md5,
} from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import {
  CANVAS_SEARCH_DOCUMENT_PROVIDER,
  MARKDOWN_SEARCH_DOCUMENT_PROVIDER,
} from "./built-in-search-document-providers";
import { SearchManager } from "./search-manager";
import { DEFAULT_SEARCH_SETTINGS } from "./search-settings";

function createRecordingTelemetry() {
  const telemetry: TelemetryService = new NoopTelemetryService({
    enabled: true,
  });
  const spans: Array<{ name: string; attributes: TelemetryAttributes }> = [];
  const events: Array<{ name: string; attributes: TelemetryAttributes }> = [];
  telemetry.startSpan = (
    name: string,
    options: TelemetrySpanOptions = {},
  ): TelemetrySpan => {
    const record = { name, attributes: { ...options.attributes } };
    spans.push(record);
    return {
      name,
      startedAt: performance.now(),
      setAttribute: (key, value) => {
        record.attributes[key] = value;
      },
      addEvent() {},
      recordException(error) {
        record.attributes["error.type"] =
          error instanceof Error ? error.name : "Error";
      },
      end(attributes) {
        Object.assign(record.attributes, attributes);
      },
    };
  };
  telemetry.measureAsync = async <T>(
    name: string,
    callback: (span: TelemetrySpan) => Promise<T>,
    options: TelemetryMeasurementOptions = {},
  ): Promise<T> => {
    const span = telemetry.startSpan(name, options);
    try {
      return await callback(span);
    } catch (error) {
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  };
  telemetry.recordEvent = (
    name: string,
    attributes: TelemetryAttributes = {},
  ) => {
    events.push({ name, attributes: { ...attributes } });
  };
  return { telemetry, spans, events };
}

function file(path: string, extension = "md"): TFile {
  const name = path.split("/").at(-1) ?? path;
  return {
    path,
    name,
    baseName: name.replace(/\.[^.]+$/u, ""),
    extension,
    stat: { ctime: 1, mtime: 2, size: 3 },
  } as TFile;
}

function providers(
  ...entries: Array<{
    id: string;
    provider: Omit<SearchDocumentProvider, "id">;
  }>
): SearchDocumentProviderRegistry {
  const registry = new SearchDocumentProviderRegistry();
  for (const { id, provider } of entries) {
    registry.register({ ...provider, id });
  }
  return registry;
}

describe("SearchManager", () => {
  it("indexes Markdown with metadata through the API database contract", async () => {
    const upsertSearchDocument = vi.fn(async () => undefined);
    const app = {
      appDatabase: { upsertSearchDocument },
      searchDocumentProviders: providers({
        id: "search:markdown",
        provider: MARKDOWN_SEARCH_DOCUMENT_PROVIDER,
      }),
    } as unknown as App;
    const manager = new SearchManager(app);
    const cache: CachedMetadata = {
      tags: [
        {
          tag: "#project",
          position: {
            start: { line: 0, col: 0, offset: 0 },
            end: { line: 0, col: 8, offset: 8 },
          },
        },
      ],
      frontmatter: { status: "ready" },
      headings: [],
      sections: [],
    };

    await manager.processChange(file("Notes/Welcome.md"), "# Welcome", cache);

    expect(upsertSearchDocument).toHaveBeenCalledOnce();
    expect(upsertSearchDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "Notes/Welcome.md",
        sourceProviderId: "search:markdown",
        name: "Welcome",
        extension: "md",
        content: "# Welcome",
        sourceMetadata: expect.objectContaining({
          rawTags: ["#project"],
          frontmatter: { status: "ready" },
          chunking: DEFAULT_SEARCH_SETTINGS.chunking,
        }),
      }),
    );
  });

  it("extracts searchable canvas text and deletes through the database", async () => {
    const upsertSearchDocument = vi.fn(async () => undefined);
    const deleteSearchDocument = vi.fn(async () => undefined);
    const app = {
      appDatabase: { upsertSearchDocument, deleteSearchDocument },
      searchDocumentProviders: providers({
        id: "search:canvas",
        provider: CANVAS_SEARCH_DOCUMENT_PROVIDER,
      }),
    } as unknown as App;
    const manager = new SearchManager(app);
    const canvas = file("Boards/Plan.canvas", "canvas");

    await manager.processChange(
      canvas,
      JSON.stringify({
        nodes: [{ type: "text", text: "Launch plan" }],
        edges: [{ label: "depends on" }],
      }),
      {},
    );
    await manager.processDelete(canvas);

    expect(upsertSearchDocument).toHaveBeenCalledWith(
      expect.objectContaining({ content: "text\nLaunch plan\ndepends on" }),
    );
    expect(deleteSearchDocument).toHaveBeenCalledWith("Boards/Plan.canvas");
  });

  it("indexes domain-provided semantic content, metadata, and tags", async () => {
    const upsertSearchDocument = vi.fn(async () => undefined);
    const app = {
      appDatabase: { upsertSearchDocument },
      searchDocumentProviders: providers({
        id: "roles:cv",
        provider: {
          matches: (candidate) => candidate.path.endsWith(".cv.yml"),
          extract: () => ({
            content: "Ada Lovelace\nAnalytical engine",
            metadata: { name: "Ada Lovelace", kind: "cv" },
            tags: ["cv", "#engineering"],
          }),
        },
      }),
    } as unknown as App;

    await new SearchManager(app).processChange(
      file("CVs/Ada.cv.yml", "yml"),
      "cv: {}",
      {},
    );

    expect(upsertSearchDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "CVs/Ada.cv.yml",
        content: "Ada Lovelace\nAnalytical engine",
        sourceMetadata: expect.objectContaining({
          frontmatter: { name: "Ada Lovelace", kind: "cv" },
          rawTags: ["cv", "#engineering"],
        }),
      }),
    );
  });

  it("isolates provider failures and prunes documents after removal", async () => {
    const cv = file("CVs/Ada.cv.yml", "yml");
    const broken = file("CVs/Broken.cv.yml", "yml");
    const ordinaryYaml = file("Config/settings.yml", "yml");
    const documents = new Map<string, unknown>([
      [broken.path, { path: broken.path }],
      [
        "ai-conversation/root/id",
        {
          path: "ai-conversation/root/id",
          sourceProviderId: "ai-conversations",
        },
      ],
    ]);
    const registry = new SearchDocumentProviderRegistry();
    const registration = registry.register({
      id: "roles:cv",
      matches: (candidate) => candidate.path.endsWith(".cv.yml"),
      extract: ({ file: candidate }) => {
        if (candidate.path === broken.path) throw new Error("Invalid CV");
        return { content: "Ada Lovelace" };
      },
    });
    const deleteSearchDocument = vi.fn(async (path: string) => {
      documents.delete(path);
    });
    const app = {
      searchDocumentProviders: registry,
      vault: {
        getFiles: () => [cv, broken, ordinaryYaml],
        cachedRead: vi.fn(async () => "cv: {}"),
      },
      metadataCache: {
        processors: new Map(),
        getFileCacheAsync: async () => ({}),
      },
      notifications: {
        withProgress: async (
          _options: unknown,
          run: (progress: unknown) => unknown,
        ) =>
          run({
            throwIfCancellationRequested() {},
            report() {},
          }),
      },
      logger: { warn: vi.fn() },
      appDatabase: {
        kind: "memory",
        listSearchDocuments: vi.fn(async () => [...documents.values()]),
        listSearchDocumentManifest: vi.fn(async () => ({
          rows: [...documents.values()]
            .map((value) => {
              const document = value as {
                path: string;
                checksum?: string;
                sourceProviderId?: string;
                sourceMetadata?: Record<string, unknown>;
              };
              return {
                path: document.path,
                checksum: document.checksum ?? "",
                sourceProviderId: document.sourceProviderId,
                metadataHash: document.sourceMetadata?.metadataHash,
                providerVersion: document.sourceMetadata?.providerVersion,
                projectionSignature:
                  document.sourceMetadata?.projectionSignature,
                sourceMtime: document.sourceMetadata?.sourceMtime,
                sourceSize: document.sourceMetadata?.sourceSize,
              };
            })
            .sort((left, right) =>
              left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
            ),
        })),
        listIndexedFileManifest: vi.fn(async () => ({ rows: [] })),
        upsertSearchDocument: vi.fn(async (document: { path: string }) => {
          documents.set(document.path, document);
        }),
        deleteSearchDocument,
        beginSearchIndexingBatch: vi.fn(async () => undefined),
        endSearchIndexingBatch: vi.fn(async () => undefined),
        getSearchEmbeddingProvider: vi.fn(async () => null),
        getSearchEmbeddingRuntimeStatus: vi.fn(async () => null),
        getSearchIndexStats: vi.fn(async () => ({
          documentCount: documents.size,
          chunkCount: 0,
          readyChunkCount: 0,
          pendingChunkCount: 0,
          errorChunkCount: 0,
          lastError: null,
        })),
      },
    } as unknown as App;
    const manager = new SearchManager(app);

    await manager.refreshFromVault("provider-test");

    expect(documents.has(cv.path)).toBe(true);
    expect(documents.has(broken.path)).toBe(false);
    expect(documents.has(ordinaryYaml.path)).toBe(false);
    expect(documents.has("ai-conversation/root/id")).toBe(true);
    expect(app.logger.warn).toHaveBeenCalledOnce();

    registration.dispose();
    await new SearchManager(app).refreshFromVault(
      "provider-removed-after-restart",
    );

    expect(documents.has(cv.path)).toBe(false);
    expect(documents.has("ai-conversation/root/id")).toBe(true);
    expect(deleteSearchDocument).toHaveBeenCalledWith(cv.path);
  });

  it("passes bounded query settings to the API database", async () => {
    const searchDocuments = vi.fn(async () => []);
    const recording = createRecordingTelemetry();
    const app = {
      appDatabase: { searchDocuments },
      telemetry: recording.telemetry,
    } as unknown as App;
    const manager = new SearchManager(app, () => ({
      ...DEFAULT_SEARCH_SETTINGS,
      query: { resultLimit: 25, snippetLength: 90 },
      view: { ...DEFAULT_SEARCH_SETTINGS.view, matchCase: true },
    }));

    await expect(
      manager.query({
        term: "tag:#project",
        mode: "lexical",
        limit: 7,
        pathPrefix: "Projects/Alpha",
      }),
    ).resolves.toEqual({
      count: 0,
      hits: [],
    });
    expect(searchDocuments).toHaveBeenCalledWith("tag:#project", {
      snippetLength: 90,
      limit: 7,
      pathPrefix: "Projects/Alpha",
      caseSensitive: true,
      mode: "lexical",
      includeDiagnostics: true,
    });
    expect(recording.spans).toContainEqual(
      expect.objectContaining({
        name: "search.query",
        attributes: expect.objectContaining({
          "search.retrieval.requested": "lexical",
          "search.result.limit": 7,
          "search.result.count": 0,
          "search.path_prefix": true,
        }),
      }),
    );
    const serialized = JSON.stringify(recording.spans);
    expect(serialized).not.toContain("tag:#project");
    expect(serialized).not.toContain("Projects/Alpha");
  });

  it("reports provider-neutral semantic and refresh status", async () => {
    const app = {
      appDatabase: {
        kind: "turso",
        getSearchEmbeddingProvider: vi.fn(async () => ({
          kind: "transformers-js",
          modelId: "Xenova/all-MiniLM-L6-v2",
          allowRemoteModels: false,
        })),
        getSearchEmbeddingRuntimeStatus: vi.fn(async () => ({
          phase: "ready",
          modelId: "Xenova/all-MiniLM-L6-v2",
          dimensions: 384,
          error: null,
        })),
        getSearchIndexStats: vi.fn(async () => ({
          documentCount: 2,
          chunkCount: 3,
          readyChunkCount: 2,
          pendingChunkCount: 1,
          errorChunkCount: 0,
          lastError: null,
        })),
      },
    } as unknown as App;

    await expect(new SearchManager(app).getStatus()).resolves.toMatchObject({
      backendKind: "turso",
      provider: { kind: "transformers-js" },
      runtime: { phase: "ready", dimensions: 384 },
      documentCount: 2,
      readyChunkCount: 2,
      pendingChunkCount: 1,
      isRefreshing: false,
    });
  });

  it("reports each vault path while refreshing the search index", async () => {
    const welcome = file("Notes/Welcome.md");
    const report = vi.fn();
    const app = {
      searchDocumentProviders: providers({
        id: "search:markdown",
        provider: MARKDOWN_SEARCH_DOCUMENT_PROVIDER,
      }),
      vault: {
        getFiles: () => [welcome],
        cachedRead: vi.fn(async () => "# Welcome"),
      },
      metadataCache: {
        processors: new Map(),
        getFileCacheAsync: async () => ({}),
      },
      notifications: {
        withProgress: async (
          _options: unknown,
          run: (progress: {
            throwIfCancellationRequested(): void;
            report(value: unknown): void;
          }) => unknown,
        ) =>
          run({
            throwIfCancellationRequested() {},
            report,
          }),
      },
      logger: { warn: vi.fn() },
      appDatabase: {
        kind: "memory",
        listSearchDocuments: vi.fn(async () => []),
        listSearchDocumentManifest: vi.fn(async () => ({ rows: [] })),
        listIndexedFileManifest: vi.fn(async () => ({ rows: [] })),
        upsertSearchDocument: vi.fn(async () => undefined),
        deleteSearchDocument: vi.fn(async () => undefined),
        beginSearchIndexingBatch: vi.fn(async () => undefined),
        endSearchIndexingBatch: vi.fn(async () => undefined),
        getSearchEmbeddingProvider: vi.fn(async () => null),
        getSearchEmbeddingRuntimeStatus: vi.fn(async () => null),
        getSearchIndexStats: vi.fn(async () => ({
          documentCount: 1,
          chunkCount: 0,
          readyChunkCount: 0,
          pendingChunkCount: 0,
          errorChunkCount: 0,
          lastError: null,
        })),
      },
    } as unknown as App;

    await new SearchManager(app).refreshFromVault("manual-semantic-rebuild");

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        current: 0,
        total: 1,
        message: "Notes/Welcome.md",
      }),
    );
  });

  it("skips note bodies and full Search snapshots on an unchanged warm refresh", async () => {
    const welcome = file("Notes/Welcome.md");
    const vaultHandlers = new Map<string, (...args: any[]) => void>();
    const metadataHandlers = new Map<string, (...args: any[]) => void>();
    const projectionSignature = md5(
      JSON.stringify({
        providerId: "search:markdown",
        providerVersion: "1",
        chunking: DEFAULT_SEARCH_SETTINGS.chunking,
      }),
    );
    let allowBodyRead = false;
    const cachedRead = vi.fn(async () => {
      if (!allowBodyRead) {
        throw new Error("warm refresh must not read the note body");
      }
      return "# Welcome";
    });
    const getFileCacheAsync = vi.fn(async () => {
      throw new Error("warm refresh must not hydrate metadata JSON");
    });
    const listSearchDocuments = vi.fn(async () => {
      throw new Error("warm refresh must not enumerate Search documents");
    });
    const upsertSearchDocument = vi.fn(async () => undefined);
    const recording = createRecordingTelemetry();
    const meta = new Map<string, unknown>();
    const searchManifest = vi.fn(async () => ({
      rows: [
        {
          path: welcome.path,
          checksum: "search-checksum",
          sourceProviderId: "search:markdown",
          metadataHash: "metadata-hash",
          providerVersion: "1",
          projectionSignature,
          sourceMtime: welcome.stat.mtime,
          sourceSize: welcome.stat.size,
        },
      ],
    }));
    const metadataManifest = vi.fn(async () => ({
      rows: [
        {
          path: welcome.path,
          normalizedPath: welcome.path.toLowerCase(),
          extension: "md",
          mtime: welcome.stat.mtime,
          size: welcome.stat.size,
          hash: "metadata-hash",
          indexed: true,
        },
      ],
    }));
    const app = {
      searchDocumentProviders: providers({
        id: "search:markdown",
        provider: MARKDOWN_SEARCH_DOCUMENT_PROVIDER,
      }),
      vault: {
        getFiles: () => [welcome],
        cachedRead,
        on: vi.fn((event: string, callback: (...args: any[]) => void) => {
          vaultHandlers.set(event, callback);
          return { event };
        }),
        offref: vi.fn(),
      },
      metadataCache: {
        processors: new Map([["md", new Set([vi.fn()])]]),
        getFileCacheAsync,
        on: vi.fn((event: string, callback: (...args: any[]) => void) => {
          metadataHandlers.set(event, callback);
          return { event };
        }),
        offref: vi.fn(),
      },
      notifications: {
        withProgress: async (
          _options: unknown,
          run: (progress: {
            throwIfCancellationRequested(): void;
            report(value: unknown): void;
          }) => unknown,
        ) =>
          run({
            throwIfCancellationRequested() {},
            report() {},
          }),
      },
      logger: { warn: vi.fn() },
      telemetry: recording.telemetry,
      appDatabase: {
        kind: "memory",
        getMeta: vi.fn(async (key: string) => meta.get(key)),
        setMeta: vi.fn(async (key: string, value: unknown) => {
          meta.set(key, value);
        }),
        listSearchDocuments,
        listSearchDocumentManifest: searchManifest,
        listIndexedFileManifest: metadataManifest,
        upsertSearchDocument,
        deleteSearchDocument: vi.fn(async () => undefined),
        beginSearchIndexingBatch: vi.fn(async () => undefined),
        endSearchIndexingBatch: vi.fn(async () => undefined),
        getSearchEmbeddingProvider: vi.fn(async () => null),
        getSearchEmbeddingRuntimeStatus: vi.fn(async () => null),
        getSearchIndexStats: vi.fn(async () => ({
          documentCount: 1,
          chunkCount: 0,
          readyChunkCount: 0,
          pendingChunkCount: 0,
          errorChunkCount: 0,
          lastError: null,
        })),
      },
    } as unknown as App;

    await new SearchManager(app).refreshFromVault("startup-seed");

    expect(cachedRead).not.toHaveBeenCalled();
    expect(getFileCacheAsync).not.toHaveBeenCalled();
    expect(listSearchDocuments).not.toHaveBeenCalled();
    expect(upsertSearchDocument).not.toHaveBeenCalled();
    expect(meta.get("search.reconcile-checkpoint.v1")).toMatchObject({
      fingerprint: expect.stringContaining("search-index-v1"),
      completedAt: expect.any(Number),
    });

    searchManifest.mockClear();
    metadataManifest.mockClear();
    recording.spans.length = 0;
    recording.events.length = 0;
    const warmManager = new SearchManager(app);
    const stopTracking = warmManager.trackChanges();
    const warmReconciliation = warmManager.reconcileStartup();
    vaultHandlers.get("modify")?.(file(".obsidian/workspace.json", "json"));
    await warmReconciliation;
    expect(searchManifest).not.toHaveBeenCalled();
    expect(metadataManifest).not.toHaveBeenCalled();
    expect(cachedRead).not.toHaveBeenCalled();
    expect(recording.spans).toContainEqual(
      expect.objectContaining({
        name: "search.startup_reconcile",
        attributes: expect.objectContaining({
          "search.checkpoint": "hit",
        }),
      }),
    );
    expect(recording.spans).not.toContainEqual(
      expect.objectContaining({ name: "search.reconcile" }),
    );
    expect(recording.events).toContainEqual(
      expect.objectContaining({
        name: "search.reconcile.complete",
        attributes: expect.objectContaining({ checkpoint: "hit" }),
      }),
    );
    stopTracking();
    await warmManager.dispose();

    app.searchDocumentProviders.getAll()[0]!.version = "2";
    allowBodyRead = true;
    await new SearchManager(app).reconcileStartup();
    expect(searchManifest).toHaveBeenCalled();
    expect(cachedRead).toHaveBeenCalled();
  });

  it("keeps persisted queries available while reconciliation is blocked", async () => {
    let releaseManifest!: () => void;
    let markManifestStarted!: () => void;
    const manifestStarted = new Promise<void>((resolve) => {
      markManifestStarted = resolve;
    });
    const manifestRelease = new Promise<void>((resolve) => {
      releaseManifest = resolve;
    });
    const app = {
      searchDocumentProviders: providers(),
      vault: { getFiles: () => [] },
      metadataCache: { processors: new Map() },
      notifications: {
        withProgress: async (
          _options: unknown,
          run: (progress: {
            throwIfCancellationRequested(): void;
            report(value: unknown): void;
          }) => unknown,
        ) =>
          run({
            throwIfCancellationRequested() {},
            report() {},
          }),
      },
      logger: { warn: vi.fn() },
      appDatabase: {
        kind: "memory",
        getMeta: vi.fn(async () => undefined),
        setMeta: vi.fn(async () => undefined),
        listSearchDocumentManifest: vi.fn(async () => {
          markManifestStarted();
          await manifestRelease;
          return { rows: [] };
        }),
        listIndexedFileManifest: vi.fn(async () => ({ rows: [] })),
        beginSearchIndexingBatch: vi.fn(async () => undefined),
        endSearchIndexingBatch: vi.fn(async () => undefined),
        searchDocuments: vi.fn(async () => [
          {
            document: {
              path: "Notes/Persisted.md",
              sourceProviderId: "search:markdown",
              name: "Persisted",
              extension: "md",
              checksum: "persisted",
              content: "Persisted result",
              tags: [],
              tagParts: [],
              tagHierarchy: [],
            },
            score: 1,
            snippets: [],
            retrievalMode: "lexical",
            scoreBreakdown: {},
            matchedChunkIds: [],
          },
        ]),
        getSearchEmbeddingProvider: vi.fn(async () => null),
        getSearchEmbeddingRuntimeStatus: vi.fn(async () => null),
        getSearchIndexStats: vi.fn(async () => ({
          documentCount: 1,
          chunkCount: 0,
          readyChunkCount: 0,
          pendingChunkCount: 0,
          errorChunkCount: 0,
          lastError: null,
        })),
      },
    } as unknown as App;
    const manager = new SearchManager(app);
    const refreshing = manager.refreshFromVault("controlled");
    await manifestStarted;

    await expect(manager.query({ term: "Persisted" })).resolves.toMatchObject({
      count: 1,
      hits: [{ id: "Notes/Persisted.md" }],
    });

    releaseManifest();
    await refreshing;
  });

  it("reveals first-index documents while later files are still indexing", async () => {
    const first = file("Notes/First.md");
    const second = file("Notes/Second.md");
    const documents = new Map<string, any>();
    let releaseSecond!: () => void;
    let markSecondStarted!: () => void;
    const secondStarted = new Promise<void>((resolve) => {
      markSecondStarted = resolve;
    });
    const secondRelease = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });
    const app = {
      searchDocumentProviders: providers({
        id: "search:markdown",
        provider: MARKDOWN_SEARCH_DOCUMENT_PROVIDER,
      }),
      vault: {
        getFiles: () => [first, second],
        cachedRead: vi.fn(async (candidate: TFile) => {
          if (candidate.path === second.path) {
            markSecondStarted();
            await secondRelease;
          }
          return `# ${candidate.baseName}`;
        }),
      },
      metadataCache: {
        processors: new Map(),
        getFileCacheAsync: vi.fn(async () => ({})),
      },
      notifications: {
        withProgress: async (
          _options: unknown,
          run: (progress: {
            throwIfCancellationRequested(): void;
            report(value: unknown): void;
          }) => unknown,
        ) =>
          run({
            throwIfCancellationRequested() {},
            report() {},
          }),
      },
      logger: { warn: vi.fn() },
      appDatabase: {
        kind: "memory",
        getMeta: vi.fn(async () => undefined),
        setMeta: vi.fn(async () => undefined),
        listSearchDocumentManifest: vi.fn(async () => ({ rows: [] })),
        listIndexedFileManifest: vi.fn(async () => ({ rows: [] })),
        upsertSearchDocument: vi.fn(async (document: { path: string }) => {
          documents.set(document.path, document);
        }),
        deleteSearchDocument: vi.fn(async () => undefined),
        beginSearchIndexingBatch: vi.fn(async () => undefined),
        endSearchIndexingBatch: vi.fn(async () => undefined),
        searchDocuments: vi.fn(async () =>
          [...documents.values()].map((document) => ({
            document,
            score: 1,
            snippets: [],
            retrievalMode: "lexical",
            scoreBreakdown: {},
            matchedChunkIds: [],
          })),
        ),
        getSearchEmbeddingProvider: vi.fn(async () => null),
        getSearchEmbeddingRuntimeStatus: vi.fn(async () => null),
        getSearchIndexStats: vi.fn(async () => ({
          documentCount: documents.size,
          chunkCount: 0,
          readyChunkCount: 0,
          pendingChunkCount: 0,
          errorChunkCount: 0,
          lastError: null,
        })),
      },
    } as unknown as App;
    const manager = new SearchManager(app);
    const refreshing = manager.refreshFromVault("first-index");
    await secondStarted;

    await expect(manager.query({ term: "First" })).resolves.toMatchObject({
      count: 1,
      hits: [{ id: first.path }],
    });

    releaseSecond();
    await refreshing;
    expect(documents.has(second.path)).toBe(true);
  });

  it("leaves a failed checkpoint stale so startup retries reconciliation", async () => {
    const meta = new Map<string, unknown>();
    const cancelled = new Error("cancelled");
    const recording = createRecordingTelemetry();
    const listSearchDocumentManifest = vi
      .fn()
      .mockRejectedValueOnce(cancelled)
      .mockResolvedValue({ rows: [] });
    const app = {
      searchDocumentProviders: providers(),
      vault: { getFiles: () => [] },
      metadataCache: { processors: new Map() },
      notifications: {
        withProgress: async (
          _options: unknown,
          run: (progress: {
            throwIfCancellationRequested(): void;
            report(value: unknown): void;
          }) => unknown,
        ) =>
          run({
            throwIfCancellationRequested() {},
            report() {},
          }),
      },
      logger: { warn: vi.fn() },
      telemetry: recording.telemetry,
      appDatabase: {
        kind: "memory",
        getMeta: vi.fn(async (key: string) => meta.get(key)),
        setMeta: vi.fn(async (key: string, value: unknown) => {
          meta.set(key, value);
        }),
        listSearchDocumentManifest,
        listIndexedFileManifest: vi.fn(async () => ({ rows: [] })),
        beginSearchIndexingBatch: vi.fn(async () => undefined),
        endSearchIndexingBatch: vi.fn(async () => undefined),
        getSearchEmbeddingProvider: vi.fn(async () => null),
        getSearchEmbeddingRuntimeStatus: vi.fn(async () => null),
        getSearchIndexStats: vi.fn(async () => ({
          documentCount: 0,
          chunkCount: 0,
          readyChunkCount: 0,
          pendingChunkCount: 0,
          errorChunkCount: 0,
          lastError: null,
        })),
      },
    } as unknown as App;
    const manager = new SearchManager(app);

    await expect(manager.refreshFromVault("cancelled")).rejects.toBe(cancelled);
    expect(recording.events).toContainEqual(
      expect.objectContaining({
        name: "search.reconcile.cancelled",
        attributes: expect.objectContaining({ status: "cancelled" }),
      }),
    );
    expect(JSON.stringify(recording.spans)).not.toContain("cancelled");
    expect(meta.get("search.reconcile-checkpoint.v1")).toMatchObject({
      fingerprint: "",
      completedAt: 0,
    });

    await manager.reconcileStartup();

    expect(listSearchDocumentManifest).toHaveBeenCalledTimes(2);
    expect(meta.get("search.reconcile-checkpoint.v1")).toMatchObject({
      fingerprint: expect.stringContaining("search-index-v1"),
    });
  });

  it("advances the checkpoint after incremental metadata changes drain", async () => {
    const welcome = file("Notes/Live.md");
    const metadataHandlers = new Map<string, (...args: any[]) => void>();
    const vaultHandlers = new Map<string, (...args: any[]) => void>();
    const meta = new Map<string, unknown>();
    const upsertSearchDocument = vi.fn(async () => undefined);
    const app = {
      searchDocumentProviders: providers({
        id: "search:markdown",
        provider: MARKDOWN_SEARCH_DOCUMENT_PROVIDER,
      }),
      vault: {
        getFiles: () => [welcome],
        cachedRead: vi.fn(async () => "# Live"),
        on: vi.fn((event: string, callback: (...args: any[]) => void) => {
          vaultHandlers.set(event, callback);
          return { event };
        }),
        offref: vi.fn(),
      },
      metadataCache: {
        processors: new Map([["md", new Set([vi.fn()])]]),
        getFileCacheAsync: vi.fn(async () => ({})),
        on: vi.fn((event: string, callback: (...args: any[]) => void) => {
          metadataHandlers.set(event, callback);
          return { event };
        }),
        offref: vi.fn(),
      },
      notifications: {
        withProgress: async (
          _options: unknown,
          run: (progress: {
            throwIfCancellationRequested(): void;
            report(value: unknown): void;
          }) => unknown,
        ) =>
          run({
            throwIfCancellationRequested() {},
            report() {},
          }),
      },
      logger: { warn: vi.fn() },
      appDatabase: {
        kind: "memory",
        getMeta: vi.fn(async (key: string) => meta.get(key)),
        setMeta: vi.fn(async (key: string, value: unknown) => {
          meta.set(key, value);
        }),
        listSearchDocumentManifest: vi.fn(async () => ({ rows: [] })),
        listIndexedFileManifest: vi.fn(async () => ({
          rows: [
            {
              path: welcome.path,
              mtime: welcome.stat.mtime,
              size: welcome.stat.size,
              hash: md5("# Live"),
              parserSignature: "markdown-v1",
            },
          ],
        })),
        upsertSearchDocument,
        deleteSearchDocument: vi.fn(async () => undefined),
        beginSearchIndexingBatch: vi.fn(async () => undefined),
        endSearchIndexingBatch: vi.fn(async () => undefined),
        getSearchEmbeddingProvider: vi.fn(async () => null),
        getSearchEmbeddingRuntimeStatus: vi.fn(async () => null),
        getSearchIndexStats: vi.fn(async () => ({
          documentCount: 1,
          chunkCount: 0,
          readyChunkCount: 0,
          pendingChunkCount: 0,
          errorChunkCount: 0,
          lastError: null,
        })),
      },
    } as unknown as App;
    const manager = new SearchManager(app);
    const stop = manager.trackChanges();
    await manager.reconcileStartup();
    const before = meta.get("search.reconcile-checkpoint.v1") as {
      fingerprint: string;
    };
    (welcome.stat as { mtime: number; size: number }).mtime = 4;
    (welcome.stat as { mtime: number; size: number }).size = 8;

    metadataHandlers.get("changed")?.(welcome, "# Updated", {});

    await vi.waitFor(() => {
      const after = meta.get("search.reconcile-checkpoint.v1") as {
        fingerprint: string;
      };
      expect(after.fingerprint).not.toBe(before.fingerprint);
    });
    expect(upsertSearchDocument).toHaveBeenCalledTimes(2);
    stop();
    await manager.dispose();
  });
});
