export { SearchManager } from "./search-manager";
export type {
  SearchQueryHit,
  SearchQueryParams,
  SearchQueryResult,
} from "./search-manager";
export { SearchPanel } from "./public-components";
export { SearchPlugin } from "./search-plugin";
export { createNotesSearchTool } from "./notes-search-tool";
export {
  DEFAULT_SEARCH_SETTINGS,
  SEARCH_VIEW_SORT_OPTIONS,
  SEARCH_EMBEDDING_MODEL_OPTIONS,
  mergeSearchSettings,
  patchSearchSettings,
  resolveSearchEmbeddingProviderConfig,
} from "./search-settings";
export type {
  SearchPluginSettings,
  SearchPluginSettingsPatch,
  SearchResultFacet,
  SearchRetrievalMode,
  SearchViewSortMode,
} from "./search-settings";
export { SearchView, SearchViewType } from "./search-view";
