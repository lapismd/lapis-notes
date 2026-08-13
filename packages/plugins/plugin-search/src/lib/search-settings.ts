import type { SearchEmbeddingProviderConfig } from "@lapis-notes/api";

export type SearchEmbeddingProviderSetting = "disabled" | "transformers-js";
export type SearchViewSortMode =
  | "filename-asc"
  | "filename-desc"
  | "modified-desc"
  | "modified-asc"
  | "created-desc"
  | "created-asc";
export type SearchResultFacet = "all" | "markdown" | "canvas";
export type SearchRetrievalMode = "auto" | "lexical" | "vector" | "hybrid";

export function resolveSearchRetrievalModeForQuery(
  requested: SearchRetrievalMode,
  structured: boolean,
  allowSemanticStructuredQueries: boolean,
): SearchRetrievalMode {
  return structured && !allowSemanticStructuredQueries ? "lexical" : requested;
}

export function resolveSearchSnippetLength(
  configuredLength: number,
  showMoreContext: boolean,
): number {
  return showMoreContext ? Math.max(configuredLength, 280) : configuredLength;
}

export const SEARCH_EMBEDDING_MODEL_OPTIONS = [
  "Xenova/all-MiniLM-L6-v2",
  "onnx-community/bge-small-en-v1.5-ONNX",
  "nomic-ai/nomic-embed-text-v1.5",
  "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
] as const;
export const CUSTOM_SEARCH_EMBEDDING_MODEL_OPTION = "custom";

export interface SearchPluginSettings {
  chunking: {
    targetChars: number;
    breakpointWindowChars: number;
    breakpointDecay: number;
  };
  query: {
    resultLimit: number;
    snippetLength: number;
  };
  embeddings: {
    provider: SearchEmbeddingProviderSetting;
    modelId: string;
    allowRemoteModels: boolean;
    localModelPath: string;
  };
  view: {
    sortMode: SearchViewSortMode;
    collapseResults: boolean;
    showMoreContext: boolean;
    explainSearchTerms: boolean;
    semanticSearchInStructuredQueries: boolean;
    matchCase: boolean;
    recentSearches: string[];
    resultFacet: SearchResultFacet;
    retrievalMode: SearchRetrievalMode;
  };
}

export type SearchPluginSettingsPatch = {
  chunking?: Partial<SearchPluginSettings["chunking"]>;
  query?: Partial<SearchPluginSettings["query"]>;
  embeddings?: Partial<SearchPluginSettings["embeddings"]>;
  view?: Partial<SearchPluginSettings["view"]>;
};

export const SEARCH_VIEW_SORT_OPTIONS: ReadonlyArray<{
  value: SearchViewSortMode;
  label: string;
}> = [
  { value: "filename-asc", label: "Filename (A to Z)" },
  { value: "filename-desc", label: "Filename (Z to A)" },
  { value: "modified-desc", label: "Modified (new to old)" },
  { value: "modified-asc", label: "Modified (old to new)" },
  { value: "created-desc", label: "Created (new to old)" },
  { value: "created-asc", label: "Created (old to new)" },
];

export const DEFAULT_SEARCH_SETTINGS: SearchPluginSettings = {
  chunking: {
    targetChars: 1200,
    breakpointWindowChars: 320,
    breakpointDecay: 0.7,
  },
  query: {
    resultLimit: 100,
    snippetLength: 160,
  },
  embeddings: {
    provider: "disabled",
    modelId: "Xenova/all-MiniLM-L6-v2",
    allowRemoteModels: true,
    localModelPath: "",
  },
  view: {
    sortMode: "filename-asc",
    collapseResults: true,
    showMoreContext: false,
    explainSearchTerms: false,
    semanticSearchInStructuredQueries: false,
    matchCase: false,
    recentSearches: [],
    resultFacet: "all",
    retrievalMode: "auto",
  },
};

function boundedRecentSearches(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 10);
}

export function isPresetSearchEmbeddingModelId(modelId: string): boolean {
  return SEARCH_EMBEDDING_MODEL_OPTIONS.includes(
    modelId.trim() as (typeof SEARCH_EMBEDDING_MODEL_OPTIONS)[number],
  );
}

export function getSearchEmbeddingModelOptionValue(modelId: string): string {
  return isPresetSearchEmbeddingModelId(modelId)
    ? modelId.trim()
    : CUSTOM_SEARCH_EMBEDDING_MODEL_OPTION;
}

export function getSearchEmbeddingCustomOptionLabel(modelId: string): string {
  const trimmed = modelId.trim();
  return !trimmed || isPresetSearchEmbeddingModelId(trimmed)
    ? "Custom"
    : `Custom (${trimmed})`;
}

export function mergeSearchSettings(
  stored: SearchPluginSettingsPatch | null | undefined,
): SearchPluginSettings {
  return {
    chunking: { ...DEFAULT_SEARCH_SETTINGS.chunking, ...stored?.chunking },
    query: { ...DEFAULT_SEARCH_SETTINGS.query, ...stored?.query },
    embeddings: {
      ...DEFAULT_SEARCH_SETTINGS.embeddings,
      ...stored?.embeddings,
    },
    view: {
      ...DEFAULT_SEARCH_SETTINGS.view,
      ...stored?.view,
      recentSearches: boundedRecentSearches(stored?.view?.recentSearches),
    },
  };
}

export function patchSearchSettings(
  current: SearchPluginSettings,
  patch: SearchPluginSettingsPatch,
): SearchPluginSettings {
  return mergeSearchSettings({
    chunking: { ...current.chunking, ...patch.chunking },
    query: { ...current.query, ...patch.query },
    embeddings: { ...current.embeddings, ...patch.embeddings },
    view: { ...current.view, ...patch.view },
  });
}

export function resolveSearchEmbeddingProviderConfig(
  settings: SearchPluginSettings,
): SearchEmbeddingProviderConfig | null {
  if (settings.embeddings.provider === "disabled") return null;
  return {
    kind: "transformers-js",
    modelId:
      settings.embeddings.modelId.trim() ||
      DEFAULT_SEARCH_SETTINGS.embeddings.modelId,
    allowRemoteModels: settings.embeddings.allowRemoteModels,
    localModelPath: settings.embeddings.localModelPath.trim() || undefined,
  };
}
