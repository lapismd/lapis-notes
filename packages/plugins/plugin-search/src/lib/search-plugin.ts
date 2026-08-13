import {
  type App,
  Notice,
  Plugin,
  TextFileView,
  type PluginManifest,
} from "@lapis-notes/api";
import { SearchManager, type SearchRuntimeStatus } from "./search-manager";
import {
  mergeSearchSettings,
  patchSearchSettings,
  resolveSearchEmbeddingProviderConfig,
  type SearchPluginSettings,
  type SearchPluginSettingsPatch,
} from "./search-settings";
import { SearchSettingsTab } from "./search-settings-tab";
import { SearchView, SearchViewType } from "./search-view";

const SEARCH_MANIFEST: PluginManifest = {
  id: "search",
  name: "Search",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description: "Search files, metadata, tags, and note content.",
  author: "Lapis Notes",
};

export class SearchPlugin extends Plugin {
  private settings: SearchPluginSettings;
  private startupRefreshStarted = false;
  readonly searchManager: SearchManager;

  constructor(app: App, pluginManifest: PluginManifest = SEARCH_MANIFEST) {
    super(app, pluginManifest);
    this.settings = mergeSearchSettings(null);
    this.searchManager = new SearchManager(app, () => this.settings);
  }

  getSettings(): SearchPluginSettings {
    return {
      chunking: { ...this.settings.chunking },
      query: { ...this.settings.query },
      embeddings: { ...this.settings.embeddings },
      view: {
        ...this.settings.view,
        recentSearches: [...this.settings.view.recentSearches],
      },
    };
  }

  async updateSettings(patch: SearchPluginSettingsPatch): Promise<void> {
    const previousProvider = resolveSearchEmbeddingProviderConfig(this.settings);
    this.settings = patchSearchSettings(this.settings, patch);
    await this.saveData(this.settings);
    const nextProvider = resolveSearchEmbeddingProviderConfig(this.settings);
    if (JSON.stringify(previousProvider) !== JSON.stringify(nextProvider)) {
      await this.app.appDatabase.configureSearchEmbeddingProvider(nextProvider);
    }
  }

  getSearchStatus(): Promise<SearchRuntimeStatus> {
    return this.searchManager.getStatus();
  }

  rebuildSemanticSearch(): Promise<SearchRuntimeStatus> {
    return this.searchManager.refreshFromVault("manual-semantic-rebuild");
  }

  async onload(): Promise<void> {
    this.settings = mergeSearchSettings(await this.loadData());
    await this.app.appDatabase.configureSearchEmbeddingProvider(
      resolveSearchEmbeddingProviderConfig(this.settings),
    );
    this.addSettingTab(new SearchSettingsTab(this.app, this));
    this.register(this.searchManager.trackChanges());
    this.registerSidebarView(
      SearchViewType,
      (leaf) => new SearchView(leaf),
      { side: "left", title: "Search", icon: "search" },
    );

    this.registerEvent(
      this.app.metadataCache.on("loaded", () => {
        void this.startupRefresh();
      }),
    );
    this.app.workspace.onLayoutReady(() => {
      void this.startupRefresh();
    });

    this.addCommand({
      id: "search-all-files",
      name: "Search all files",
      callback: () => void this.openSearchInLeftSidebar(),
    });
    this.addCommand({
      id: "rebuild-semantic-search",
      name: "Rebuild semantic search embeddings",
      callback: async () => {
        const status = await this.rebuildSemanticSearch();
        new Notice(
          `Semantic search refreshed (${status.readyChunkCount}/${status.chunkCount} ready)`,
        );
      },
    });
    this.addCommand({
      id: "search-selected-text",
      name: "Search selected text",
      callback: () => {
        const view = this.app.workspace.activeLeaf?.view;
        const query =
          view instanceof TextFileView ? view.editor.getSelection().trim() : "";
        void this.openSearchInLeftSidebar(query);
      },
    });
    this.addCommand({
      id: "open-search-left-sidebar",
      name: "Open search in left sidebar",
      callback: (query?: string) => void this.openSearchInLeftSidebar(query),
    });
    this.addCommand({
      id: "rebuild-search-index",
      name: "Rebuild search index",
      callback: async () => {
        await this.app.appDatabase.rebuildSearchIndex();
        await this.refreshIndex("rebuild");
        new Notice("Search index rebuilt");
      },
    });
    this.addCommand({
      id: "refresh-search-index",
      name: "Refresh search index",
      callback: () => void this.refreshIndex("command"),
    });
  }

  refreshIndex(reason = "manual"): Promise<SearchRuntimeStatus> {
    return this.searchManager.refreshFromVault(reason);
  }

  private async startupRefresh(): Promise<void> {
    if (this.startupRefreshStarted) return;
    this.startupRefreshStarted = true;
    try {
      await this.refreshIndex("startup");
    } catch (error) {
      this.startupRefreshStarted = false;
      new Notice(
        `Search index refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async openSearchInLeftSidebar(query = ""): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(SearchViewType)[0];
    if (existing) {
      await existing.setViewState({ type: SearchViewType, state: { query } });
      this.app.workspace.revealLeaf(existing);
      return;
    }

    const leaf = this.app.workspace.getLeftLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: SearchViewType, state: { query } });
    this.app.workspace.revealLeaf(leaf);
  }
}
