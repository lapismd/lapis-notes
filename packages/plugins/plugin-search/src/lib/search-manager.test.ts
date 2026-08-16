import {
  type App,
  type CachedMetadata,
  type SearchDocumentProvider,
  SearchDocumentProviderRegistry,
  type TFile,
} from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import {
  CANVAS_SEARCH_DOCUMENT_PROVIDER,
  MARKDOWN_SEARCH_DOCUMENT_PROVIDER,
} from "./built-in-search-document-providers";
import { SearchManager } from "./search-manager";
import { DEFAULT_SEARCH_SETTINGS } from "./search-settings";

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
      metadataCache: { getFileCache: () => ({}) },
      notifications: {
        withProgress: async (_options: unknown, run: (progress: unknown) => unknown) =>
          run({
            throwIfCancellationRequested() {},
            report() {},
          }),
      },
      logger: { warn: vi.fn() },
      appDatabase: {
        kind: "memory",
        listSearchDocuments: vi.fn(async () => [...documents.values()]),
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
    await manager.refreshFromVault("provider-removed");

    expect(documents.has(cv.path)).toBe(false);
    expect(documents.has("ai-conversation/root/id")).toBe(true);
    expect(deleteSearchDocument).toHaveBeenCalledWith(cv.path);
  });

  it("passes bounded query settings to the API database", async () => {
    const searchDocuments = vi.fn(async () => []);
    const app = {
      appDatabase: { searchDocuments },
    } as unknown as App;
    const manager = new SearchManager(app, () => ({
      ...DEFAULT_SEARCH_SETTINGS,
      query: { resultLimit: 25, snippetLength: 90 },
      view: { ...DEFAULT_SEARCH_SETTINGS.view, matchCase: true },
    }));

    await expect(
      manager.query({ term: "tag:#project", mode: "lexical" }),
    ).resolves.toEqual({
      count: 0,
      hits: [],
    });
    expect(searchDocuments).toHaveBeenCalledWith("tag:#project", {
      snippetLength: 90,
      limit: 25,
      caseSensitive: true,
      mode: "lexical",
      includeDiagnostics: true,
    });
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
});
