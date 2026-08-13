import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEARCH_SETTINGS,
  getSearchEmbeddingModelOptionValue,
  mergeSearchSettings,
  patchSearchSettings,
  resolveSearchRetrievalModeForQuery,
  resolveSearchEmbeddingProviderConfig,
  resolveSearchSnippetLength,
} from "./search-settings";

describe("search settings", () => {
  it("merges stored values without mutating the defaults", () => {
    const settings = mergeSearchSettings({
      chunking: { targetChars: 800 },
      view: {
        ...DEFAULT_SEARCH_SETTINGS.view,
        matchCase: true,
        recentSearches: [" status:ready ", "", "status:ready", "tag:#work"],
      },
    });

    expect(settings.chunking.targetChars).toBe(800);
    expect(settings.chunking.breakpointWindowChars).toBe(
      DEFAULT_SEARCH_SETTINGS.chunking.breakpointWindowChars,
    );
    expect(settings.view.matchCase).toBe(true);
    expect(settings.view.collapseResults).toBe(true);
    expect(settings.view.retrievalMode).toBe("auto");
    expect(settings.view.recentSearches).toEqual(["status:ready", "tag:#work"]);
    expect(DEFAULT_SEARCH_SETTINGS.view.recentSearches).toEqual([]);
  });

  it("keeps semantic search disabled until Transformers.js is selected", () => {
    expect(resolveSearchEmbeddingProviderConfig(DEFAULT_SEARCH_SETTINGS)).toBeNull();

    const enabled = patchSearchSettings(DEFAULT_SEARCH_SETTINGS, {
      embeddings: {
        provider: "transformers-js",
        modelId: "Xenova/all-MiniLM-L6-v2",
        allowRemoteModels: false,
      },
    });
    expect(resolveSearchEmbeddingProviderConfig(enabled)).toEqual({
      kind: "transformers-js",
      modelId: "Xenova/all-MiniLM-L6-v2",
      allowRemoteModels: false,
      localModelPath: undefined,
    });
    expect(getSearchEmbeddingModelOptionValue("org/custom-model")).toBe(
      "custom",
    );
  });

  it("patches all legacy view toggles without dropping retrieval settings", () => {
    const settings = patchSearchSettings(DEFAULT_SEARCH_SETTINGS, {
      view: {
        collapseResults: false,
        showMoreContext: true,
        explainSearchTerms: true,
        semanticSearchInStructuredQueries: true,
        matchCase: true,
        retrievalMode: "hybrid",
      },
    });

    expect(settings.view).toMatchObject({
      collapseResults: false,
      showMoreContext: true,
      explainSearchTerms: true,
      semanticSearchInStructuredQueries: true,
      matchCase: true,
      retrievalMode: "hybrid",
      resultFacet: "all",
    });
  });

  it("keeps recent searches unique and bounded", () => {
    const recentSearches = Array.from({ length: 14 }, (_, index) => `query-${index}`);
    const settings = patchSearchSettings(DEFAULT_SEARCH_SETTINGS, {
      view: { recentSearches },
    });

    expect(settings.view.recentSearches).toEqual(recentSearches.slice(0, 10));
    expect(settings.query).toEqual(DEFAULT_SEARCH_SETTINGS.query);
  });

  it("keeps structured queries lexical until semantic retrieval is enabled", () => {
    expect(resolveSearchRetrievalModeForQuery("hybrid", true, false)).toBe(
      "lexical",
    );
    expect(resolveSearchRetrievalModeForQuery("hybrid", true, true)).toBe(
      "hybrid",
    );
    expect(resolveSearchRetrievalModeForQuery("vector", false, false)).toBe(
      "vector",
    );
  });

  it("requests the longer legacy snippet size when more context is enabled", () => {
    expect(resolveSearchSnippetLength(160, false)).toBe(160);
    expect(resolveSearchSnippetLength(160, true)).toBe(280);
    expect(resolveSearchSnippetLength(320, true)).toBe(320);
  });
});
