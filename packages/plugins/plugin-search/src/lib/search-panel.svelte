<script lang="ts">
  import "./search-panel.css";
  import {
    canCollectSearchQueryTerms,
    collectSearchQueryTerms,
    createVaultSearchFilterSyntax,
    parseSearchQueryAst,
    searchQueryLanguageSupport,
    Notice,
    type App,
    type EditorPosition,
    type TFile,
    TextFileView,
    WorkspaceLeaf,
  } from "@lapis-notes/api";
  import { SearchFilterBar } from "@lapismd/design-core/filter";
  import {
    FilterCommandPicker,
    type FilterCommandOption,
  } from "@lapismd/design-core/forms/filter-command-picker";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import Copy from "@lucide/svelte/icons/copy";
  import FileText from "@lucide/svelte/icons/file-text";
  import Hash from "@lucide/svelte/icons/hash";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import { onMount, untrack } from "svelte";
  import HighlightedText from "./highlighted-text.svelte";
  import {
    expandSearchMatchContext,
    sliceSearchMatchContext,
    type SearchMatchContextDirection,
  } from "./search-match-context";
  import type { SearchManager, SearchRuntimeStatus } from "./search-manager";
  import {
    SEARCH_VIEW_SORT_OPTIONS,
    type SearchPluginSettings,
    type SearchPluginSettingsPatch,
    type SearchResultFacet,
    type SearchRetrievalMode,
    resolveSearchRetrievalModeForQuery,
    resolveSearchSnippetLength,
  } from "./search-settings";
  import { formatSearchViewSortLabel, sortSearchResults } from "./search-sort";
  import {
    searchResultFromHit,
    type SearchMatch,
    type SearchResult,
  } from "./search-result-model";
  import { SearchViewType } from "./search-view-type";

  type SearchPanelPlugin = {
    searchManager: SearchManager;
    getSettings(): SearchPluginSettings;
    updateSettings(patch: SearchPluginSettingsPatch): Promise<void>;
    refreshIndex(reason?: string): Promise<SearchRuntimeStatus>;
  };

  const RESULT_FACET_OPTIONS = [
    { value: "all", label: "All" },
    { value: "markdown", label: "Markdown" },
    { value: "canvas", label: "Canvas" },
  ] satisfies FilterCommandOption[];

  const RETRIEVAL_MODE_OPTIONS = [
    { value: "auto", label: "Auto" },
    { value: "lexical", label: "Lexical" },
    { value: "vector", label: "Vector" },
    { value: "hybrid", label: "Hybrid" },
  ] satisfies FilterCommandOption[];

  let {
    app,
    initialQuery = "",
  }: {
    app: App;
    initialQuery?: string;
  } = $props();

  const plugin = untrack(() => {
    const registered = app.plugins.plugins.get("search") as
      | SearchPanelPlugin
      | undefined;
    if (!registered) throw new Error("Search plugin is not registered");
    return registered;
  });

  let query = $state("");
  let settings = $state(untrack(() => plugin.getSettings()));
  let results = $state<SearchResult[]>([]);
  let resultCount = $state(0);
  let resultOpenState = $state<Record<string, boolean>>({});
  let contextLoading = $state<Record<string, boolean>>({});
  let resultIdentity = "";
  let searching = $state(false);
  let indexing = $state(false);
  let filtersExpanded = $state(false);
  let metadataTags = $state<string[]>([]);
  let metadataFacetError = $state<string | null>(null);
  let metadataFacetGeneration = 0;
  let searchRevision = 0;
  const databaseRefreshDelayMs = 75;

  const parsedQuery = $derived(parseSearchQueryAst(query));
  const diagnostic = $derived(
    query.trim() ? (parsedQuery.diagnostics[0]?.message ?? null) : null,
  );
  const structuredQuery = $derived(
    Boolean(
      query.trim() &&
        parsedQuery.diagnostics.length === 0 &&
        !canCollectSearchQueryTerms(parsedQuery),
    ),
  );
  const searchRequestKey = $derived(
    JSON.stringify([
      query,
      settings.view.matchCase,
      settings.view.showMoreContext,
      settings.view.semanticSearchInStructuredQueries,
      settings.view.retrievalMode,
    ]),
  );
  const explanation = $derived.by(() => {
    if (!query.trim() || !settings.view.explainSearchTerms) return null;
    const terms = (
      canCollectSearchQueryTerms(parsedQuery)
        ? collectSearchQueryTerms(parsedQuery)
        : query.trim().split(/\s+/u).filter(Boolean)
    )
      .slice(0, 8)
      .join(", ");
    return terms
      ? `Matching filenames, paths, tags, metadata, and content for: ${terms}.`
      : "Matching filenames, paths, tags, metadata, and content.";
  });
  const filteredResults = $derived.by(() => {
    const facet = settings.view.resultFacet;
    const matching = results.filter((result) => {
      if (facet === "all") return true;
      if (facet === "canvas") return result.file.extension === "canvas";
      return ["md", "markdown"].includes(result.file.extension);
    });
    return sortSearchResults(matching, settings.view.sortMode);
  });
  const filterSyntax = $derived.by(() => {
    const files = app.vault.getFiles();
    const paths = [
      ...new Set(files.map((file) => file.parent?.path).filter(Boolean)),
    ]
      .sort()
      .slice(0, 100) as string[];
    const names = files
      .map((file) => file.name)
      .sort()
      .slice(0, 100);
    return createVaultSearchFilterSyntax({
      fileNames: names,
      paths,
      tags: metadataTags,
    });
  });

  async function refreshMetadataFacets(): Promise<void> {
    const generation = ++metadataFacetGeneration;
    metadataFacetError = null;
    try {
      const rows = await app.metadataCache.queryFacets({
        kind: "tag",
        limit: 100,
      });
      if (generation !== metadataFacetGeneration) return;
      metadataTags = rows
        .flatMap((row) =>
          typeof row.value === "string"
            ? [`#${row.value.replace(/^#/u, "")}`]
            : [],
        )
        .sort();
    } catch (error) {
      if (generation !== metadataFacetGeneration) return;
      metadataFacetError =
        error instanceof Error ? error.message : String(error);
    }
  }

  export function setSearchQuery(next: string): void {
    query = next;
  }

  function retrievalModeForQuery(): SearchRetrievalMode {
    return resolveSearchRetrievalModeForQuery(
      settings.view.retrievalMode,
      structuredQuery,
      settings.view.semanticSearchInStructuredQueries,
    );
  }

  function snippetLength(): number {
    return resolveSearchSnippetLength(
      settings.query.snippetLength,
      settings.view.showMoreContext,
    );
  }

  function refreshOpenState(items: SearchResult[], identity: string): void {
    if (identity === resultIdentity) return;
    resultIdentity = identity;
    const defaultOpen = !settings.view.collapseResults;
    resultOpenState = Object.fromEntries(
      items.map((item) => [item.file.path, defaultOpen]),
    );
  }

  function setResultOpen(path: string, open: boolean): void {
    resultOpenState = { ...resultOpenState, [path]: open };
  }

  async function rememberSearch(value: string): Promise<void> {
    const term = value.trim();
    if (!term) return;
    const recentSearches = [
      term,
      ...settings.view.recentSearches.filter((item) => item !== term),
    ].slice(0, 10);
    if (
      recentSearches.length === settings.view.recentSearches.length &&
      recentSearches.every(
        (item, index) => item === settings.view.recentSearches[index],
      )
    ) {
      return;
    }
    await patchSettings({ view: { recentSearches } });
  }

  async function patchSettings(
    patch: SearchPluginSettingsPatch,
  ): Promise<void> {
    await plugin.updateSettings(patch);
    settings = plugin.getSettings();
    if (patch.view?.collapseResults !== undefined) {
      const defaultOpen = !settings.view.collapseResults;
      resultOpenState = Object.fromEntries(
        results.map((result) => [result.file.path, defaultOpen]),
      );
    }
  }

  async function executeSearch(term: string, revision: number): Promise<void> {
    if (!term.trim() || diagnostic) {
      results = [];
      resultCount = 0;
      searching = false;
      refreshOpenState([], term.trim());
      return;
    }
    searching = true;
    try {
      const response = await plugin.searchManager.query({
        term,
        caseSensitive: settings.view.matchCase,
        snippetLength: snippetLength(),
        mode: retrievalModeForQuery(),
      });
      if (revision !== searchRevision) return;
      const nextResults = response.hits
        .map((hit) => searchResultFromHit(app, hit))
        .filter((result): result is SearchResult => result !== null);
      resultCount = response.count;
      const identity = `${term}\u0000${nextResults
        .map(
          (result) =>
            `${result.file.path}:${result.hit.document.checksum}:${result.matches.length}`,
        )
        .join("\u0000")}`;
      if (identity !== resultIdentity) results = nextResults;
      refreshOpenState(nextResults, identity);
      void rememberSearch(term);
    } finally {
      if (revision === searchRevision) searching = false;
    }
  }

  $effect(() => {
    const requestKey = searchRequestKey;
    const term = query;
    const revision = ++searchRevision;
    const timer = window.setTimeout(() => {
      if (requestKey !== searchRequestKey) return;
      void executeSearch(term, revision);
    }, 250);
    return () => window.clearTimeout(timer);
  });

  async function refreshIndex(): Promise<void> {
    if (indexing) return;
    indexing = true;
    try {
      await plugin.refreshIndex("search-panel");
      const revision = ++searchRevision;
      await executeSearch(query, revision);
    } finally {
      indexing = false;
    }
  }

  async function copySearchResults(): Promise<void> {
    const lines = filteredResults.flatMap((result) => [
      result.file.path,
      ...result.matches.map((match) => `  ${match.key}: ${match.text}`),
    ]);
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      new Notice("Search results copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      new Notice(
        copied ? "Search results copied" : "Unable to copy search results",
      );
    }
  }

  function mainLeaf(): WorkspaceLeaf {
    const selected = app.workspace.rootSplit.iterateAllTabs((tabs) => {
      const child = tabs.children[tabs.selectedIndex] ?? tabs.children[0];
      return child instanceof WorkspaceLeaf ? child : child?.getSelectedLeaf();
    });
    return selected?.view.getViewType() === SearchViewType
      ? app.workspace.getLeaf("tab")
      : (selected ?? app.workspace.getLeaf("tab"));
  }

  async function openResult(
    result: SearchResult,
    pos?: EditorPosition,
  ): Promise<void> {
    const leaf = mainLeaf();
    await leaf.openFile(result.file);
    app.workspace.activeLeaf = leaf;
    app.workspace.revealLeaf(leaf);
    if (pos && leaf.view instanceof TextFileView)
      leaf.view.editor.setCursor(pos);
  }

  async function expandMatchContext(
    result: SearchResult,
    match: SearchMatch,
    direction: SearchMatchContextDirection,
  ): Promise<void> {
    if (!match.context) return;
    const loadingKey = `${result.file.path}\u0000${match.id}`;
    if (contextLoading[loadingKey]) return;
    contextLoading = { ...contextLoading, [loadingKey]: true };
    try {
      const indexedSource = result.hit.document.content;
      let source = indexedSource;
      try {
        const currentSource = await app.vault.cachedRead(result.file);
        const expectedSlice = indexedSource.slice(
          match.context.start,
          match.context.end,
        );
        if (
          currentSource.slice(match.context.start, match.context.end) ===
          expectedSlice
        ) {
          source = currentSource;
        }
      } catch {
        // The indexed source remains a valid fallback for the visible result.
      }

      const expanded = expandSearchMatchContext(
        source,
        match.context,
        direction,
      );
      const sliced = sliceSearchMatchContext(source, expanded);
      results = results.map((currentResult) =>
        currentResult.hit !== result.hit
          ? currentResult
          : {
              ...currentResult,
              matches: currentResult.matches.map((currentMatch) =>
                currentMatch.id === match.id
                  ? {
                      ...currentMatch,
                      ...sliced,
                      context: {
                        ...expanded,
                        sourceLength: source.length,
                      },
                    }
                  : currentMatch,
              ),
            },
      );
    } finally {
      contextLoading = { ...contextLoading, [loadingKey]: false };
    }
  }

  onMount(() => {
    query = initialQuery;
    void refreshMetadataFacets();
    let databaseRefreshTimer: number | undefined;
    const databaseChanged = app.appDatabase.subscribeToChanges((change) => {
      if (!change.reset && !change.domains.includes("search")) return;
      window.clearTimeout(databaseRefreshTimer);
      databaseRefreshTimer = window.setTimeout(() => {
        const revision = ++searchRevision;
        void executeSearch(query, revision);
      }, databaseRefreshDelayMs);
    });
    const changed = app.metadataCache.on("index-changed", (change) => {
      if (change.reset || change.domains.includes("metadata")) {
        void refreshMetadataFacets();
      }
    });
    const loaded = app.metadataCache.on(
      "loaded",
      () => void refreshMetadataFacets(),
    );
    return () => {
      searchRevision += 1;
      metadataFacetGeneration += 1;
      window.clearTimeout(databaseRefreshTimer);
      databaseChanged();
      app.metadataCache.offref(changed);
      app.metadataCache.offref(loaded);
    };
  });
</script>

<div
  class="search-panel"
  data-testid="search-panel"
  data-ui-component="search-panel"
>
  <div class="search-panel__chrome" data-ui-part="chrome">
    <div class="search-panel__query-row">
      <SearchFilterBar
        value={query}
        inputMode="filter-query"
        {filterSyntax}
        editorExtensions={[searchQueryLanguageSupport()]}
        error={diagnostic}
        showFilterToggle
        bind:filtersExpanded
        ariaLabel="Search vault"
        placeholder="Search all files…"
        onValueChange={(value) => (query = value)}
        onClearSearch={() => {
          query = "";
        }}
      >
        {#snippet actions()}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh search index"
            disabled={indexing}
            onclick={refreshIndex}
          >
            <RefreshCw aria-hidden="true" />
          </Button>
        {/snippet}
        {#snippet filters()}
          <div class="search-panel__filters">
            <FilterCommandPicker
              label="File type"
              ariaLabel="Filter by file type"
              options={RESULT_FACET_OPTIONS}
              value={settings.view.resultFacet}
              onChange={(value) =>
                patchSettings({
                  view: { resultFacet: value as SearchResultFacet },
                })}
            />
            <FilterCommandPicker
              label="Retrieval"
              ariaLabel="Filter by retrieval mode"
              options={RETRIEVAL_MODE_OPTIONS}
              value={settings.view.retrievalMode}
              onChange={(value) =>
                patchSettings({
                  view: { retrievalMode: value as SearchRetrievalMode },
                })}
            />
            <section
              class="search-panel__settings"
              aria-label="Search view settings"
            >
              <label>
                <span>Match case</span>
                <Switch
                  size="sm"
                  bind:checked={
                    () => settings.view.matchCase,
                    (checked) =>
                      void patchSettings({ view: { matchCase: checked } })
                  }
                />
              </label>
              <label>
                <span>Collapse results</span>
                <Switch
                  size="sm"
                  bind:checked={
                    () => settings.view.collapseResults,
                    (checked) =>
                      void patchSettings({ view: { collapseResults: checked } })
                  }
                />
              </label>
              <label>
                <span>Show more context</span>
                <Switch
                  size="sm"
                  bind:checked={
                    () => settings.view.showMoreContext,
                    (checked) =>
                      void patchSettings({ view: { showMoreContext: checked } })
                  }
                />
              </label>
              <label>
                <span>Explain search terms</span>
                <Switch
                  size="sm"
                  bind:checked={
                    () => settings.view.explainSearchTerms,
                    (checked) =>
                      void patchSettings({
                        view: { explainSearchTerms: checked },
                      })
                  }
                />
              </label>
              <label class="search-panel__structured-semantic">
                <span>
                  <strong>Semantic search in structured queries</strong>
                  <small
                    >Allow semantic candidates alongside filters, OR, and
                    negation.</small
                  >
                </span>
                <Switch
                  size="sm"
                  aria-label="Semantic search in structured queries"
                  bind:checked={
                    () => settings.view.semanticSearchInStructuredQueries,
                    (checked) =>
                      void patchSettings({
                        view: { semanticSearchInStructuredQueries: checked },
                      })
                  }
                />
              </label>
            </section>
          </div>
        {/snippet}
      </SearchFilterBar>
    </div>
    {#if metadataFacetError}
      <p class="search-panel__empty" role="alert">
        Unable to load metadata facets: {metadataFacetError}
      </p>
    {/if}

    <div class="search-panel__summary">
      <Button
        variant="ghost"
        size="sm"
        class="search-panel__summary-control"
        aria-label="Copy search results"
        disabled={!filteredResults.length}
        onclick={copySearchResults}
      >
        <Copy aria-hidden="true" />
        {searching
          ? "Searching…"
          : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
      </Button>
      <Popover.Root>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="sm"
              class="search-panel__summary-control search-panel__sort"
            >
              <span>{formatSearchViewSortLabel(settings.view.sortMode)}</span>
              <ChevronsUpDown aria-hidden="true" />
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content align="end" class="search-panel__sort-popover">
          {#each SEARCH_VIEW_SORT_OPTIONS as option (option.value)}
            <Button
              variant={option.value === settings.view.sortMode
                ? "secondary"
                : "ghost"}
              class="search-panel__sort-option"
              onclick={() =>
                void patchSettings({ view: { sortMode: option.value } })}
              >{option.label}</Button
            >
          {/each}
        </Popover.Content>
      </Popover.Root>
    </div>

    {#if explanation}
      <p class="search-panel__explanation">{explanation}</p>
    {/if}
  </div>

  <ScrollArea class="search-panel__scroll-area">
    <Sidebar.Content class="search-panel__results" data-ui-part="content">
      {#if !query.trim()}
        <p class="search-panel__empty">Type to search.</p>
      {:else if !searching && !diagnostic && filteredResults.length === 0}
        <p class="search-panel__empty">No matches found.</p>
      {:else}
        <div class="search-panel__tree-inset">
          <Sidebar.Menu
            role="tree"
            aria-label="Search results"
            class="search-panel__tree"
          >
            {#each filteredResults as result (result.file.path)}
              {@const open =
                resultOpenState[result.file.path] ??
                !settings.view.collapseResults}
              <Sidebar.MenuItem role="none" class="search-panel__tree-item">
                <Collapsible.Root
                  {open}
                  onOpenChange={(next) => setResultOpen(result.file.path, next)}
                  class="search-panel__result"
                >
                  <Collapsible.Trigger
                    class="search-panel__file"
                    role="treeitem"
                    aria-level={1}
                    aria-selected="false"
                    aria-expanded={open}
                    aria-label={`${result.file.path}, ${result.matches.length} matches`}
                  >
                    <ChevronRight
                      class="search-panel__disclosure"
                      aria-hidden="true"
                    />
                    {#if result.file.extension === "canvas"}
                      <Hash
                        class="search-panel__file-icon"
                        aria-hidden="true"
                      />
                    {:else}
                      <FileText
                        class="search-panel__file-icon"
                        aria-hidden="true"
                      />
                    {/if}
                    <span class="search-panel__file-label">
                      <HighlightedText
                        text={result.file.basename}
                        ranges={result.title?.ranges ?? []}
                      />
                    </span>
                    <Sidebar.MenuBadge class="search-panel__count-badge">
                      {result.matches.length}
                    </Sidebar.MenuBadge>
                  </Collapsible.Trigger>
                  <Collapsible.Content class="search-panel__match-list">
                    <div class="search-panel__match-header">
                      <span
                        class="search-panel__match-path"
                        title={result.file.path}
                      >
                        {result.file.path}
                      </span>
                      <Badge variant="outline" class="search-panel__mode-badge">
                        {result.hit.retrievalMode}
                      </Badge>
                    </div>
                    <Sidebar.MenuSub role="group">
                      {#each result.matches as match, index (`${result.file.path}:${index}`)}
                        <Sidebar.MenuSubItem role="none">
                          {@const loadingKey = `${result.file.path}\u0000${match.id}`}
                          <div
                            class="search-panel__match-shell"
                            role="treeitem"
                            tabindex="0"
                            aria-level="2"
                            aria-selected="false"
                            data-context-before={Boolean(match.context?.start)}
                            data-context-after={Boolean(
                              match.context &&
                                match.context.end < match.context.sourceLength,
                            )}
                            onclick={() => openResult(result, match.pos)}
                            onkeydown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ")
                                return;
                              event.preventDefault();
                              void openResult(result, match.pos);
                            }}
                          >
                            {#if match.context?.start}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                class="search-panel__context-control search-panel__context-control--before"
                                aria-label="Show more context before this match"
                                disabled={contextLoading[loadingKey]}
                                onclick={(event) => {
                                  event.stopPropagation();
                                  void expandMatchContext(
                                    result,
                                    match,
                                    "before",
                                  );
                                }}
                              >
                                <ChevronUp aria-hidden="true" />
                              </Button>
                            {/if}
                            <div class="search-panel__match">
                              <span class="search-panel__match-text">
                                <HighlightedText
                                  text={match.text}
                                  ranges={match.ranges}
                                />
                              </span>
                              <span class="search-panel__match-meta">
                                <Badge
                                  variant="outline"
                                  class="search-panel__match-key"
                                >
                                  {match.key}
                                </Badge>
                              </span>
                            </div>
                            {#if match.context && match.context.end < match.context.sourceLength}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                class="search-panel__context-control search-panel__context-control--after"
                                aria-label="Show more context after this match"
                                disabled={contextLoading[loadingKey]}
                                onclick={(event) => {
                                  event.stopPropagation();
                                  void expandMatchContext(
                                    result,
                                    match,
                                    "after",
                                  );
                                }}
                              >
                                <ChevronDown aria-hidden="true" />
                              </Button>
                            {/if}
                          </div>
                        </Sidebar.MenuSubItem>
                      {/each}
                    </Sidebar.MenuSub>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </div>
      {/if}
    </Sidebar.Content>
  </ScrollArea>
</div>
