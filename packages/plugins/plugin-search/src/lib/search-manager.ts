import {
  type App,
  type AppDatabaseSearchDiagnostics,
  type AppDatabaseSearchScoreBreakdown,
  type AppDatabaseSearchSnippet,
  type SearchEmbeddingProviderConfig,
  type SearchEmbeddingRuntimeStatus,
  type CachedMetadata,
  type SearchDocumentRecord,
  type SearchDocumentSourceMetadata,
  type TFile,
  debounce,
  md5,
} from "@lapis-notes/api";
import {
  DEFAULT_SEARCH_SETTINGS,
  type SearchPluginSettings,
} from "./search-settings";

const SEARCHABLE_EXTENSIONS = new Set(["md", "markdown", "canvas"]);
const REACTIVE_INDEX_DELAY_MS = 75;

function isSearchableFile(file: TFile): boolean {
  return SEARCHABLE_EXTENSIONS.has(file.extension.toLowerCase());
}

function isFileLike(value: unknown): value is TFile {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as TFile).path === "string" &&
    typeof (value as TFile).extension === "string"
  );
}

function canvasText(content: string): string {
  try {
    const canvas = JSON.parse(content) as {
      nodes?: Array<{
        type?: string;
        text?: string;
        label?: string;
        file?: string;
        url?: string;
      }>;
      edges?: Array<{ label?: string }>;
    };
    return [
      ...(canvas.nodes ?? []).flatMap((node) => [
        node.type,
        node.text,
        node.label,
        node.file,
        node.url,
      ]),
      ...(canvas.edges ?? []).map((edge) => edge.label),
    ]
      .filter((part): part is string => Boolean(part?.trim()))
      .join("\n");
  } catch {
    return content;
  }
}

function searchableContent(file: TFile, content: string): string {
  return file.extension.toLowerCase() === "canvas"
    ? canvasText(content)
    : content;
}

function sourceMetadata(
  cache: CachedMetadata,
  settings: SearchPluginSettings["chunking"],
): SearchDocumentSourceMetadata {
  return {
    rawTags: (cache.tags ?? []).map((tag) => tag.tag),
    frontmatter: cache.frontmatter ?? {},
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
  snippetLength?: number;
  caseSensitive?: boolean;
  mode?: "auto" | "lexical" | "vector" | "hybrid";
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

  constructor(
    readonly app: App,
    private readonly getSettings: () => SearchPluginSettings = () =>
      DEFAULT_SEARCH_SETTINGS,
  ) {}

  async processChange(
    file: TFile,
    content: string,
    cache: CachedMetadata,
  ): Promise<void> {
    const normalizedContent = searchableContent(file, content);
    await this.app.appDatabase.upsertSearchDocument({
      path: file.path,
      name: file.baseName,
      extension: file.extension.toLowerCase(),
      checksum: md5(normalizedContent),
      content: normalizedContent,
      tags: [],
      tagParts: [],
      tagHierarchy: [],
      sourceMetadata: sourceMetadata(cache, this.getSettings().chunking),
    });
  }

  async processDelete(file: TFile): Promise<void> {
    await this.app.appDatabase.deleteSearchDocument(file.path);
  }

  async query(params: SearchQueryParams): Promise<SearchQueryResult> {
    const settings = this.getSettings();
    const results = await this.app.appDatabase.searchDocuments(params.term, {
      snippetLength: params.snippetLength ?? settings.query.snippetLength,
      limit: settings.query.resultLimit,
      caseSensitive: params.caseSensitive ?? settings.view.matchCase,
      mode: params.mode ?? settings.view.retrievalMode,
      includeDiagnostics: true,
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
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.runRefresh(reason).finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
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
    const canvasChanged = this.app.vault.on("modify", (file) => {
      if (isFileLike(file) && file.extension.toLowerCase() === "canvas") {
        void this.processFile(file);
      }
    });
    const canvasCreated = this.app.vault.on("create", (file) => {
      if (isFileLike(file) && file.extension.toLowerCase() === "canvas") {
        void this.processFile(file);
      }
    });
    const canvasDeleted = this.app.vault.on("delete", (file) => {
      if (isFileLike(file) && file.extension.toLowerCase() === "canvas") {
        void this.processDelete(file);
      }
    });

    return () => {
      this.flushQueuedChanges.cancel();
      this.queuedChanges.clear();
      this.queuedDeletes.clear();
      this.app.metadataCache.offref(changed);
      this.app.metadataCache.offref(deleted);
      this.app.vault.offref(canvasChanged);
      this.app.vault.offref(canvasCreated);
      this.app.vault.offref(canvasDeleted);
    };
  }

  private async processFile(file: TFile): Promise<void> {
    const content = await this.app.vault.cachedRead(file);
    const cache = this.app.metadataCache.getFileCache(file) ?? {};
    await this.processChange(file, content, cache);
  }

  private async processQueuedChanges(): Promise<void> {
    const deleted = [...this.queuedDeletes.values()];
    const changed = [...this.queuedChanges.values()];
    this.queuedDeletes.clear();
    this.queuedChanges.clear();
    for (const file of deleted) await this.processDelete(file);
    for (const item of changed) {
      await this.processChange(item.file, item.content, item.cache);
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
        const files = this.app.vault.getFiles().filter(isSearchableFile);
        const paths = new Set(files.map((file) => file.path));
        const stale = (await this.app.appDatabase.listSearchDocuments()).filter(
          (document) => !paths.has(document.path),
        );
        const total = stale.length + files.length;
        this.refreshState = {
          active: true,
          processed: 0,
          total,
          reason,
          refreshedAt: this.refreshState.refreshedAt,
        };
        await this.app.appDatabase.beginSearchIndexingBatch();
        try {
          for (const document of stale) {
            progress.throwIfCancellationRequested();
            progress.report({
              current: this.refreshState.processed,
              total,
              message: document.path,
            });
            await this.app.appDatabase.deleteSearchDocument(document.path);
            this.refreshState.processed += 1;
          }
          for (const file of files) {
            progress.throwIfCancellationRequested();
            progress.report({
              current: this.refreshState.processed,
              total,
              message: file.path,
            });
            await this.processFile(file);
            this.refreshState.processed += 1;
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
