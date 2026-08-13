import type { App, CachedMetadata, TFile } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
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

describe("SearchManager", () => {
  it("indexes Markdown with metadata through the API database contract", async () => {
    const upsertSearchDocument = vi.fn(async () => undefined);
    const app = {
      appDatabase: { upsertSearchDocument },
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
