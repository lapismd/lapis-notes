<script lang="ts">
  import "./search-panel.css";
  import {
    parseSearchQueryAst,
    searchQueryLanguageSupport,
    type App,
    type EditorPosition,
    type TFile,
    TextFileView,
    WorkspaceLeaf,
  } from "@lapis-notes/api";
  import {
    SearchFilterBar,
    type SearchFilterSyntax,
  } from "@lapismd/design-core/filter";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import FileText from "@lucide/svelte/icons/file-text";
  import Hash from "@lucide/svelte/icons/hash";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import { onMount, untrack } from "svelte";
  import HighlightedText from "./highlighted-text.svelte";
  import type {
    SearchManager,
    SearchQueryHit,
  } from "./search-manager";
  import {
    SEARCH_VIEW_SORT_OPTIONS,
    type SearchPluginSettings,
    type SearchPluginSettingsPatch,
    type SearchResultFacet,
  } from "./search-settings";
  import { sortSearchResults } from "./search-sort";

  type SearchPanelPlugin = {
    searchManager: SearchManager;
    getSettings(): SearchPluginSettings;
    updateSettings(patch: SearchPluginSettingsPatch): Promise<void>;
    refreshIndex(reason?: string): Promise<void>;
  };

  type SearchRange = { start: number; end: number };
  type SearchMatch = {
    key: string;
    text: string;
    ranges: SearchRange[];
    pos?: EditorPosition;
  };
  type SearchResult = {
    file: TFile;
    title: { text: string; ranges: SearchRange[] } | null;
    matches: SearchMatch[];
    hit: SearchQueryHit;
  };

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
  let searching = $state(false);
  let indexing = $state(false);
  let filtersExpanded = $state(false);
  let metadataRevision = $state(0);
  let searchRevision = 0;

  const diagnostic = $derived.by(() => {
    if (!query.trim()) return null;
    return parseSearchQueryAst(query).diagnostics[0]?.message ?? null;
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

  const filterSyntax = $derived.by<SearchFilterSyntax>(() => {
    metadataRevision;
    const files = app.vault.getFiles();
    const paths = [...new Set(files.map((file) => file.parent?.path).filter(Boolean))]
      .sort()
      .slice(0, 100) as string[];
    const names = files.map((file) => file.name).sort().slice(0, 100);
    const tags = new Set<string>();
    for (const [, cache] of app.metadataCache.getAllItems()) {
      for (const tag of cache.tags ?? []) tags.add(tag.tag);
      const frontmatterTags = cache.frontmatter?.tags;
      const values = Array.isArray(frontmatterTags)
        ? frontmatterTags
        : typeof frontmatterTags === "string"
          ? frontmatterTags.split(/[\s,]+/u)
          : [];
      for (const tag of values) {
        const normalized = String(tag).trim();
        if (normalized) tags.add(normalized.startsWith("#") ? normalized : `#${normalized}`);
      }
    }
    return {
      title: "Vault search syntax",
      description:
        "Combine text with file, path, tag, content, line, section, and bracket-property filters.",
      fields: [
        { name: "file", description: "File name", operators: [":"], values: names },
        { name: "path", description: "Folder or path", operators: [":"], values: paths },
        {
          name: "tag",
          description: "Markdown or frontmatter tag",
          operators: [":"],
          values: [...tags].sort().slice(0, 100),
        },
        { name: "content", description: "Note content", operators: [":"] },
        { name: "line", description: "Terms on one line", operators: [":"] },
        { name: "section", description: "Terms in one section", operators: [":"] },
      ],
      examples: [
        { query: "tag:#project", description: "Notes with a project tag" },
        { query: 'path:"Notes" OR file:Welcome', description: "Path or file filters" },
        { query: '["status"]:ready', description: "Exact frontmatter property" },
      ],
      notes: ["Use OR for alternatives and -term to exclude a term."],
    };
  });

  export function setSearchQuery(next: string): void {
    query = next;
  }

  function offsetPosition(content: string, offset: number): EditorPosition {
    const before = content.slice(0, Math.max(0, offset));
    const lines = before.split("\n");
    return {
      line: lines.length - 1,
      ch: lines.length ? (lines[lines.length - 1]?.length ?? 0) : 0,
    };
  }

  function resultFromHit(hit: SearchQueryHit): SearchResult | null {
    const file = app.vault.getFileByPath(hit.id);
    if (!file) return null;
    const title = hit.snippets.find((snippet) => snippet.field === "name");
    return {
      file,
      title: title ? { text: title.text, ranges: title.ranges } : null,
      matches: hit.snippets
        .filter((snippet) => snippet.field !== "name")
        .map((snippet) => ({
          key: snippet.field === "tags" ? "tag" : snippet.field,
          text: snippet.text,
          ranges: snippet.ranges,
          ...(snippet.field === "content" && snippet.ranges.length
            ? {
                pos: offsetPosition(
                  hit.document.content,
                  snippet.offset + snippet.ranges[0]!.start,
                ),
              }
            : {}),
        })),
      hit,
    };
  }

  async function rememberSearch(value: string): Promise<void> {
    const term = value.trim();
    if (!term) return;
    const recentSearches = [
      term,
      ...settings.view.recentSearches.filter((item) => item !== term),
    ].slice(0, 10);
    await patchSettings({ view: { recentSearches } });
  }

  async function patchSettings(patch: SearchPluginSettingsPatch): Promise<void> {
    await plugin.updateSettings(patch);
    settings = plugin.getSettings();
  }

  async function executeSearch(term: string, revision: number): Promise<void> {
    if (!term.trim() || diagnostic) {
      results = [];
      searching = false;
      return;
    }
    searching = true;
    try {
      const response = await plugin.searchManager.query({
        term,
        caseSensitive: settings.view.matchCase,
        snippetLength: settings.query.snippetLength,
      });
      if (revision !== searchRevision) return;
      results = response.hits
        .map(resultFromHit)
        .filter((result): result is SearchResult => result !== null);
      void rememberSearch(term);
    } finally {
      if (revision === searchRevision) searching = false;
    }
  }

  $effect(() => {
    const term = query;
    settings.view.matchCase;
    const revision = ++searchRevision;
    const timer = window.setTimeout(() => {
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

  function setFacet(facet: SearchResultFacet): void {
    void patchSettings({ view: { resultFacet: facet } });
  }

  function mainLeaf(): WorkspaceLeaf {
    return (
      app.workspace.rootSplit.iterateAllTabs((tabs) => {
        const child = tabs.children[tabs.selectedIndex] ?? tabs.children[0];
        return child instanceof WorkspaceLeaf ? child : child?.getSelectedLeaf();
      }) ?? app.workspace.getLeaf("tab")
    );
  }

  async function openResult(result: SearchResult, pos?: EditorPosition): Promise<void> {
    const leaf = mainLeaf();
    await leaf.openFile(result.file);
    app.workspace.activeLeaf = leaf;
    app.workspace.revealLeaf(leaf);
    if (pos && leaf.view instanceof TextFileView) leaf.view.editor.setCursor(pos);
  }

  onMount(() => {
    query = initialQuery;
    const changed = app.metadataCache.on("changed", () => (metadataRevision += 1));
    const deleted = app.metadataCache.on("deleted", () => (metadataRevision += 1));
    const loaded = app.metadataCache.on("loaded", () => (metadataRevision += 1));
    return () => {
      searchRevision += 1;
      app.metadataCache.offref(changed);
      app.metadataCache.offref(deleted);
      app.metadataCache.offref(loaded);
    };
  });
</script>

<div class="search-panel" data-testid="search-panel" data-ui-component="search-panel">
  <div class="search-panel__chrome" data-ui-part="chrome">
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
        <div class="search-panel__facets" aria-label="Search result facets">
          {#each [
            ["all", "All"],
            ["markdown", "Markdown"],
            ["canvas", "Canvas"],
          ] as facet (facet[0])}
            <Button
              variant="outline"
              size="sm"
              aria-pressed={settings.view.resultFacet === facet[0]}
              data-active={settings.view.resultFacet === facet[0]}
              onclick={() => setFacet(facet[0] as SearchResultFacet)}
            >{facet[1]}</Button>
          {/each}
          <label class="search-panel__match-case">
            <input
              type="checkbox"
              checked={settings.view.matchCase}
              onchange={(event) =>
                void patchSettings({
                  view: {
                    matchCase: (event.currentTarget as HTMLInputElement).checked,
                  },
                })}
            />
            Match case
          </label>
        </div>
      {/snippet}
    </SearchFilterBar>

    <div class="search-panel__summary">
      <output aria-live="polite">
        {searching ? "Searching…" : `${filteredResults.length} result${filteredResults.length === 1 ? "" : "s"}`}
      </output>
      <label>
        <span class="search-panel__sr-only">Sort search results</span>
        <select
          aria-label="Sort search results"
          value={settings.view.sortMode}
          onchange={(event) =>
            void patchSettings({
              view: {
                sortMode: (event.currentTarget as HTMLSelectElement)
                  .value as SearchPluginSettings["view"]["sortMode"],
              },
            })}
        >
          {#each SEARCH_VIEW_SORT_OPTIONS as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>
    </div>
  </div>

  <ScrollArea class="search-panel__scroll-area">
    <div class="search-panel__results" data-ui-part="content">
      {#if !query.trim() && settings.view.recentSearches.length}
        <section class="search-panel__recent" aria-labelledby="recent-searches-title">
          <h2 id="recent-searches-title">Recent searches</h2>
          {#each settings.view.recentSearches as recent (recent)}
            <button type="button" onclick={() => (query = recent)}>{recent}</button>
          {/each}
        </section>
      {:else if query.trim() && !searching && !diagnostic && filteredResults.length === 0}
        <p class="search-panel__empty">No results found.</p>
      {:else}
        {#each filteredResults as result (result.file.path)}
          <section class="search-panel__result" data-search-result={result.file.path}>
            <button
              type="button"
              class="search-panel__file"
              aria-label={`Open ${result.file.path}`}
              onclick={() => openResult(result)}
            >
              {#if result.file.extension === "canvas"}
                <Hash aria-hidden="true" />
              {:else}
                <FileText aria-hidden="true" />
              {/if}
              <span>
                <strong>
                  {#if result.title}
                    <HighlightedText text={result.title.text} ranges={result.title.ranges} />
                  {:else}
                    {result.file.name}
                  {/if}
                </strong>
                <small>{result.file.path}</small>
              </span>
            </button>
            {#each result.matches as match, index (`${result.file.path}:${index}`)}
              <button
                type="button"
                class="search-panel__match"
                onclick={() => openResult(result, match.pos)}
              >
                <span>{match.key}</span>
                <HighlightedText text={match.text} ranges={match.ranges} />
              </button>
            {/each}
          </section>
        {/each}
      {/if}
    </div>
  </ScrollArea>
</div>
