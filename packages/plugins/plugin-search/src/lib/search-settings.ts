export type SearchViewSortMode =
  | "filename-asc"
  | "filename-desc"
  | "modified-desc"
  | "modified-asc";

export type SearchResultFacet = "all" | "markdown" | "canvas";

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
  view: {
    sortMode: SearchViewSortMode;
    matchCase: boolean;
    recentSearches: string[];
    resultFacet: SearchResultFacet;
  };
}

export type SearchPluginSettingsPatch = {
  chunking?: Partial<SearchPluginSettings["chunking"]>;
  query?: Partial<SearchPluginSettings["query"]>;
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
];

export const DEFAULT_SEARCH_SETTINGS: SearchPluginSettings = {
  chunking: {
    targetChars: 1200,
    breakpointWindowChars: 320,
    breakpointDecay: 0.7,
  },
  query: {
    resultLimit: 100,
    snippetLength: 180,
  },
  view: {
    sortMode: "filename-asc",
    matchCase: false,
    recentSearches: [],
    resultFacet: "all",
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

export function mergeSearchSettings(
  stored: SearchPluginSettingsPatch | null | undefined,
): SearchPluginSettings {
  return {
    chunking: {
      ...DEFAULT_SEARCH_SETTINGS.chunking,
      ...stored?.chunking,
    },
    query: {
      ...DEFAULT_SEARCH_SETTINGS.query,
      ...stored?.query,
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
    view: { ...current.view, ...patch.view },
  });
}
