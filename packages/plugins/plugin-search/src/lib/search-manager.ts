import {
  type App,
  type AppDatabaseSearchDiagnostics,
  type AppDatabaseSearchScoreBreakdown,
  type AppDatabaseSearchSnippet,
  type SearchEmbeddingProviderConfig,
  type SearchEmbeddingRuntimeStatus,
  type CachedMetadata,
  type SearchDocumentRecord,
  type SearchDocumentSource,
  type SearchDocumentSourceMetadata,
  type SearchDocumentManifestRecord,
  type TFile,
  debounce,
  md5,
} from "@lapis-notes/api";
import {
  DEFAULT_SEARCH_SETTINGS,
  type SearchPluginSettings,
} from "./search-settings";

const REACTIVE_INDEX_DELAY_MS = 75;

function isFileLike(value: unknown): value is TFile {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as TFile).path === "string" &&
    typeof (value as TFile).extension === "string"
  );
}

function sourceMetadata(
  cache: CachedMetadata,
  settings: SearchPluginSettings["chunking"],
  source: SearchDocumentSource,
  manifest: {
    metadataHash: string;
    providerVersion: string;
    projectionSignature: string;
    sourceMtime: number;
    sourceSize: number;
  },
): SearchDocumentSourceMetadata {
  return {
    ...manifest,
    rawTags: source.tags
      ? [...source.tags]
      : (cache.tags ?? []).map((tag) => tag.tag),
    frontmatter: source.metadata ?? cache.frontmatter ?? {},
    frontmatterEndOffset: cache.frontmatterPosition?.end.offset ?? 0,
    headings: (cache.headings ?? []).map((heading) => ({
      heading: heading.heading,
      level: heading.level,
      position: {
        start: { offset: heading.position.start.offset },
        end: { offset: heading.position.end.offset },
      },
    })),
    sections: (cache.sections ?? []).map((section) => ({
      type: section.type,
      position: {
        start: { offset: section.position.start.offset },
        end: { offset: section.position.end.offset },
      },
    })),
    chunking: { ...settings },
  };
}

export interface SearchQueryParams {
  term: string;
  limit?: number;
  pathPrefix?: string;
  snippetLength?: number;
  caseSensitive?: boolean;
  mode?: "auto" | "lexical" | "vector" | "hybrid";
  sourceProviderIds?: string[];
}

export interface SearchQueryHit {
  id: string;
  score: number;
  document: SearchDocumentRecord;
  snippets: AppDatabaseSearchSnippet[];
  retrievalMode: "lexical" | "vector" | "hybrid";
  scoreBreakdown: AppDatabaseSearchScoreBreakdown;
  matchedChunkIds: string[];
  diagnostics?: AppDatabaseSearchDiagnostics;
}

export interface SearchRuntimeStatus {
  backendKind: string;
  provider: SearchEmbeddingProviderConfig | null;
  runtime: SearchEmbeddingRuntimeStatus | null;
  documentCount: number;
  chunkCount: number;
  readyChunkCount: number;
  pendingChunkCount: number;
  errorChunkCount: number;
  lastError: string | null;
  isRefreshing: boolean;
  refreshReason: string | null;
  refreshProgress: { processed: number; total: number };
  refreshedAt: number | null;
}

export interface SearchQueryResult {
  count: number;
  hits: SearchQueryHit[];
}

export class SearchManager {
  private refreshPromise: Promise<SearchRuntimeStatus> | null = null;
  private queuedRefreshReason: string | null = null;
  private refreshState = {
    active: false,
    processed: 0,
    total: 0,
    reason: null as string | null,
    refreshedAt: null as number | null,
  };
  private readonly queuedChanges = new Map<
    string,
    { file: TFile; content: string; cache: CachedMetadata }
  >();
  private readonly queuedDeletes = new Map<string, TFile>();
  private readonly flushQueuedChanges = debounce(() => {
    void this.processQueuedChanges();
  }, REACTIVE_INDEX_DELAY_MS);
  private readonly ownedSourceProviderIds = new Set<string>();

  constructor(
    readonly app: App,
    private readonly getSettings: () => SearchPluginSettings = () =>
      DEFAULT_SEARCH_SETTINGS,
  ) {
    for (const provider of app.searchDocumentProviders?.getAll?.() ?? []) {
      this.ownedSourceProviderIds.add(provider.id);
    }
  }

  async processChange(
    file: TFile,
    content: string,
    cache: CachedMetadata,
  ): Promise<void> {
    const provider = this.app.searchDocumentProviders.resolve(file);
    if (!provider) {
      await this.processDelete(file);
      return;
    }
    this.ownedSourceProviderIds.add(provider.id);
    const source = await provider.extract({
      app: this.app,
      file,
      content,
      metadata: cache,
    });
    if (!source) {
      await this.processDelete(file);
      return;
    }
    if (typeof source.content !== "string") {
      throw new Error(
        `Search document provider ${provider.id} returned invalid content for ${file.path}`,
      );
    }
    const checksumSource = JSON.stringify({
      content: source.content,
      metadata: source.metadata ?? null,
      tags: source.tags ?? [],
    });
    const providerVersion = provider.version ?? "1";
    const projectionSignature = this.projectionSignature(
      provider.id,
      providerVersion,
    );
    await this.app.appDatabase.upsertSearchDocument({
      path: file.path,
      sourceProviderId: provider.id,
      name: file.baseName,
      extension: file.extension.toLowerCase(),
      checksum: md5(checksumSource),
      content: source.content,
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      sourceMetadata: sourceMetadata(
        cache,
        this.getSettings().chunking,
        source,
        {
          metadataHash: md5(content),
          providerVersion,
          projectionSignature,
          sourceMtime: file.stat.mtime,
          sourceSize: file.stat.size,
        },
      ),
    });
  }

  async processDelete(file: TFile | string): Promise<void> {
    await this.app.appDatabase.deleteSearchDocument(
      typeof file === "string" ? file : file.path,
    );
  }

  async query(params: SearchQueryParams): Promise<SearchQueryResult> {
    const settings = this.getSettings();
    const results = await this.app.appDatabase.searchDocuments(params.term, {
      snippetLength: params.snippetLength ?? settings.query.snippetLength,
      limit: params.limit ?? settings.query.resultLimit,
      ...(params.pathPrefix ? { pathPrefix: params.pathPrefix } : {}),
      caseSensitive: params.caseSensitive ?? settings.view.matchCase,
      mode: params.mode ?? settings.view.retrievalMode,
      includeDiagnostics: true,
      ...(params.sourceProviderIds?.length
        ? { sourceProviderIds: [...params.sourceProviderIds] }
        : {}),
    });
    return {
      count: results.length,
      hits: results.map((result) => ({
        id: result.document.path,
        score: result.score,
        document: result.document,
        snippets: result.snippets.map((snippet) => ({
          ...snippet,
          ranges: snippet.ranges.map((range) => ({ ...range })),
        })),
        retrievalMode: result.retrievalMode,
        scoreBreakdown: { ...result.scoreBreakdown },
        matchedChunkIds: [...result.matchedChunkIds],
        diagnostics: result.diagnostics
          ? { ...result.diagnostics }
          : undefined,
      })),
    };
  }

  async getStatus(): Promise<SearchRuntimeStatus> {
    const [provider, runtime, stats] = await Promise.all([
      this.app.appDatabase.getSearchEmbeddingProvider(),
      this.app.appDatabase.getSearchEmbeddingRuntimeStatus(),
      this.app.appDatabase.getSearchIndexStats(),
    ]);
    return {
      backendKind: this.app.appDatabase.kind,
      provider,
      runtime,
      ...stats,
      isRefreshing: this.refreshState.active,
      refreshReason: this.refreshState.reason,
      refreshProgress: {
        processed: this.refreshState.processed,
        total: this.refreshState.total,
      },
      refreshedAt: this.refreshState.refreshedAt,
    };
  }

  refreshFromVault(reason = "manual-refresh"): Promise<SearchRuntimeStatus> {
    this.queuedRefreshReason = reason;
    this.refreshPromise ??= this.runRefreshQueue().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async runRefreshQueue(): Promise<SearchRuntimeStatus> {
    let status: SearchRuntimeStatus | null = null;
    while (this.queuedRefreshReason) {
      const reason = this.queuedRefreshReason;
      this.queuedRefreshReason = null;
      status = await this.runRefresh(reason);
    }
    return status ?? this.getStatus();
  }

  trackChanges(): () => void {
    const changed = this.app.metadataCache.on(
      "changed",
      (file, content, cache) => {
        this.queuedDeletes.delete(file.path);
        this.queuedChanges.set(file.path, { file, content, cache });
        this.flushQueuedChanges();
      },
    );
    const deleted = this.app.metadataCache.on("deleted", (file) => {
      this.queuedChanges.delete(file.path);
      this.queuedDeletes.set(file.path, file);
      this.flushQueuedChanges();
    });
    const vaultChanged = this.app.vault.on("modify", (file) => {
      if (isFileLike(file) && !this.usesMetadataPipeline(file)) {
        void this.processFileSafely(file);
      }
    });
    const vaultCreated = this.app.vault.on("create", (file) => {
      if (isFileLike(file) && !this.usesMetadataPipeline(file)) {
        void this.processFileSafely(file);
      }
    });
    const vaultDeleted = this.app.vault.on("delete", (file) => {
      if (isFileLike(file) && !this.usesMetadataPipeline(file)) {
        void this.processDelete(file);
      }
    });
    const vaultRenamed = this.app.vault.on("rename", (file, oldPath) => {
      void this.processDelete(oldPath);
      if (isFileLike(file)) void this.processFileSafely(file);
    });

    return () => {
      this.flushQueuedChanges.cancel();
      this.queuedChanges.clear();
      this.queuedDeletes.clear();
      this.app.metadataCache.offref(changed);
      this.app.metadataCache.offref(deleted);
      this.app.vault.offref(vaultChanged);
      this.app.vault.offref(vaultCreated);
      this.app.vault.offref(vaultDeleted);
      this.app.vault.offref(vaultRenamed);
    };
  }

  private async processFile(file: TFile): Promise<void> {
    if (!this.app.searchDocumentProviders.resolve(file)) {
      await this.processDelete(file);
      return;
    }
    const content = await this.app.vault.cachedRead(file);
    const cache = (await this.app.metadataCache.getFileCacheAsync(file)) ?? {};
    await this.processChange(file, content, cache);
  }

  private projectionSignature(
    providerId: string,
    providerVersion: string,
  ): string {
    return md5(
      JSON.stringify({
        providerId,
        providerVersion,
        chunking: this.getSettings().chunking,
      }),
    );
  }

  private async *searchManifestRows(): AsyncGenerator<SearchDocumentManifestRecord> {
    let cursor: string | undefined;
    do {
      const page = await this.app.appDatabase.listSearchDocumentManifest({
        after: cursor,
        limit: 500,
      });
      for (const row of page.rows) yield row;
      cursor = page.nextCursor;
    } while (cursor);
  }

  private async *metadataManifestRows(): AsyncGenerator<
    Awaited<ReturnType<App["appDatabase"]["listIndexedFileManifest"]>>["rows"][number]
  > {
    let cursor: string | undefined;
    do {
      const page = await this.app.appDatabase.listIndexedFileManifest({
        after: cursor,
        limit: 500,
      });
      for (const row of page.rows) yield row;
      cursor = page.nextCursor;
    } while (cursor);
  }

  private usesMetadataPipeline(file: TFile): boolean {
    return Boolean(
      this.app.metadataCache.processors.get(file.extension.toLowerCase())?.size,
    );
  }

  private async processFileSafely(file: TFile): Promise<void> {
    try {
      await this.processFile(file);
    } catch (error) {
      await this.handleProviderFailure(file, error);
    }
  }

  private async handleProviderFailure(
    file: TFile,
    error: unknown,
  ): Promise<void> {
    this.app.logger.warn(
      `Search provider failed for ${file.path}`,
      error instanceof Error ? error : new Error(String(error)),
    );
    await this.processDelete(file);
  }

  private async processQueuedChanges(): Promise<void> {
    const deleted = [...this.queuedDeletes.values()];
    const changed = [...this.queuedChanges.values()];
    this.queuedDeletes.clear();
    this.queuedChanges.clear();
    for (const file of deleted) await this.processDelete(file);
    for (const item of changed) {
      try {
        await this.processChange(item.file, item.content, item.cache);
      } catch (error) {
        await this.handleProviderFailure(item.file, error);
      }
    }
  }

  private async runRefresh(reason: string): Promise<SearchRuntimeStatus> {
    return this.app.notifications.withProgress(
      {
        title: "Refreshing search index",
        source: "Search",
        location: "status",
        persistOnError: true,
      },
      async (progress) => {
        const files = this.app.vault
          .getFiles()
          .sort((left, right) =>
            left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
          );
        for (const provider of this.app.searchDocumentProviders.getAll()) {
          this.ownedSourceProviderIds.add(provider.id);
        }
        const total = files.length;
        this.refreshState = {
          active: true,
          processed: 0,
          total,
          reason,
          refreshedAt: this.refreshState.refreshedAt,
        };
        await this.app.appDatabase.beginSearchIndexingBatch();
        try {
          const searchIterator = this.searchManifestRows();
          const metadataIterator = this.metadataManifestRows();
          let searchRow = (await searchIterator.next()).value;
          let metadataRow = (await metadataIterator.next()).value;
          const ownedSearchRow = (row: SearchDocumentManifestRecord) =>
            !row.sourceProviderId ||
            this.ownedSourceProviderIds.has(row.sourceProviderId);

          for (const file of files) {
            progress.throwIfCancellationRequested();
            while (searchRow && searchRow.path < file.path) {
              if (ownedSearchRow(searchRow)) {
                await this.app.appDatabase.deleteSearchDocument(searchRow.path);
              }
              searchRow = (await searchIterator.next()).value;
            }
            while (metadataRow && metadataRow.path < file.path) {
              metadataRow = (await metadataIterator.next()).value;
            }
            progress.report({
              current: this.refreshState.processed,
              total,
              message: file.path,
            });
            const indexedSearch = searchRow?.path === file.path ? searchRow : undefined;
            const indexedMetadata =
              metadataRow?.path === file.path ? metadataRow : undefined;
            const provider = this.app.searchDocumentProviders.resolve(file);
            if (!provider) {
              // A persisted Search row whose path is still a vault file is a
              // stale vault projection when no provider currently claims it.
              if (indexedSearch) {
                await this.app.appDatabase.deleteSearchDocument(file.path);
              }
            } else {
              const providerVersion = provider.version ?? "1";
              const projectionSignature = this.projectionSignature(
                provider.id,
                providerVersion,
              );
              const usesMetadata = this.usesMetadataPipeline(file);
              const unchanged =
                indexedSearch?.sourceProviderId === provider.id &&
                indexedSearch.providerVersion === providerVersion &&
                indexedSearch.projectionSignature === projectionSignature &&
                indexedSearch.sourceMtime === file.stat.mtime &&
                indexedSearch.sourceSize === file.stat.size &&
                (!usesMetadata ||
                  (Boolean(indexedMetadata?.hash) &&
                    indexedSearch.metadataHash === indexedMetadata?.hash));
              if (!unchanged && (!usesMetadata || indexedMetadata)) {
                await this.processFileSafely(file);
              }
            }
            if (searchRow?.path === file.path) {
              searchRow = (await searchIterator.next()).value;
            }
            if (metadataRow?.path === file.path) {
              metadataRow = (await metadataIterator.next()).value;
            }
            this.refreshState.processed += 1;
          }
          while (searchRow) {
            progress.throwIfCancellationRequested();
            if (ownedSearchRow(searchRow)) {
              await this.app.appDatabase.deleteSearchDocument(searchRow.path);
            }
            searchRow = (await searchIterator.next()).value;
          }
          this.refreshState.refreshedAt = Date.now();
          progress.report({
            current: total,
            total,
            message:
              reason === "startup" ? "Search ready" : "Search refreshed",
          });
        } finally {
          await this.app.appDatabase.endSearchIndexingBatch();
          this.refreshState.active = false;
          this.refreshState.reason = null;
        }
        return this.getStatus();
      },
    );
  }
}
