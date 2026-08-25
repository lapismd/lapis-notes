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
const SEARCH_RECONCILE_CHECKPOINT_KEY = "search.reconcile-checkpoint.v1";
const SEARCH_RECONCILE_CHECKPOINT_VERSION = 1;
const FINGERPRINT_MASK = (1n << 128n) - 1n;

type SearchReconcileCheckpoint = {
  version: number;
  fingerprint: string;
  completedAt: number;
};

class StreamingManifestFingerprint {
  private count = 0;
  private sum = 0n;
  private xor = 0n;

  add(value: string): void {
    const digest = BigInt(`0x${md5(value)}`);
    this.count += 1;
    this.sum = (this.sum + digest) & FINGERPRINT_MASK;
    this.xor ^= digest;
  }

  finish(scope: string): string {
    return `${scope}:${this.count}:${this.sum.toString(16).padStart(32, "0")}:${this.xor.toString(16).padStart(32, "0")}`;
  }
}

function isSearchReconcileCheckpoint(
  value: unknown,
): value is SearchReconcileCheckpoint {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const checkpoint = value as Record<string, unknown>;
  return (
    checkpoint.version === SEARCH_RECONCILE_CHECKPOINT_VERSION &&
    typeof checkpoint.fingerprint === "string" &&
    typeof checkpoint.completedAt === "number" &&
    Number.isFinite(checkpoint.completedAt)
  );
}

function yieldToBackground(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function telemetryRefreshReason(reason: string): string {
  if (reason.startsWith("startup")) return "startup";
  if (reason.includes("provider")) return "provider";
  if (reason.includes("settings")) return "settings";
  if (reason.includes("manual") || reason.includes("rebuild")) return "manual";
  return "other";
}

function isCancellationError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === "AbortError") ||
    (error instanceof Error && /cancel/iu.test(error.message))
  );
}

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
    void this.drainQueuedChanges();
  }, REACTIVE_INDEX_DELAY_MS);
  private readonly ownedSourceProviderIds = new Set<string>();
  private changeTrackingReady = false;
  private sourceGeneration = 0;
  private reconcileCheckpointReady = false;
  private reconcileCheckpointDirty = false;
  private reconcileCheckpointGeneration = 0;
  private activeIncrementalOperations = 0;
  private reconcileCheckpointWrite: Promise<void> | null = null;
  private queuedProcessing: Promise<void> = Promise.resolve();
  private readonly pendingIncrementalOperations = new Set<Promise<unknown>>();
  private disposed = false;

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
    const execute = async () => {
      const settings = this.getSettings();
      const requestedMode = params.mode ?? settings.view.retrievalMode;
      const limit = params.limit ?? settings.query.resultLimit;
      const results = await this.app.appDatabase.searchDocuments(params.term, {
        snippetLength: params.snippetLength ?? settings.query.snippetLength,
        limit,
        ...(params.pathPrefix ? { pathPrefix: params.pathPrefix } : {}),
        caseSensitive: params.caseSensitive ?? settings.view.matchCase,
        mode: requestedMode,
        includeDiagnostics: true,
        ...(params.sourceProviderIds?.length
          ? { sourceProviderIds: [...params.sourceProviderIds] }
          : {}),
      });
      return {
        requestedMode,
        limit,
        result: {
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
        } satisfies SearchQueryResult,
      };
    };
    if (!this.app.telemetry) return (await execute()).result;
    return this.app.telemetry.measureAsync(
      "search.query",
      async (span) => {
        const { requestedMode, limit, result } = await execute();
        const appliedModes = new Set(
          result.hits.map((hit) => hit.retrievalMode),
        );
        span.setAttribute("search.retrieval.requested", requestedMode);
        span.setAttribute(
          "search.retrieval.applied",
          appliedModes.size === 1 ? [...appliedModes][0] : "mixed",
        );
        span.setAttribute("search.result.limit", limit);
        span.setAttribute("search.result.count", result.count);
        span.setAttribute("search.path_prefix", Boolean(params.pathPrefix));
        span.setAttribute(
          "search.source_provider.count",
          params.sourceProviderIds?.length ?? 0,
        );
        span.setAttribute("search.reconcile.active", this.refreshState.active);
        return result;
      },
      {
        attributes: {
          "search.case_sensitive":
            params.caseSensitive ?? this.getSettings().view.matchCase,
        },
      },
    );
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

  async reconcileStartup(): Promise<SearchRuntimeStatus> {
    const execute = async (setCheckpoint?: (value: string) => void) => {
      const initialGeneration = this.sourceGeneration;
      let status: SearchRuntimeStatus;
      try {
        const fingerprint = this.currentReconcileFingerprint();
        const checkpoint = await this.readReconcileCheckpoint();
        if (
          isSearchReconcileCheckpoint(checkpoint) &&
          checkpoint.fingerprint === fingerprint &&
          initialGeneration === this.sourceGeneration
        ) {
          this.reconcileCheckpointReady = true;
          this.reconcileCheckpointDirty = false;
          setCheckpoint?.("hit");
          status = await this.getStatus();
          this.app.telemetry?.recordEvent("search.reconcile.complete", {
            checkpoint: "hit",
            "files.total": 0,
            "files.processed": 0,
            "results.count": status.documentCount,
          });
        } else {
          setCheckpoint?.("miss");
          status = await this.refreshFromVault("startup");
        }
      } finally {
        this.changeTrackingReady = true;
      }

      if (initialGeneration !== this.sourceGeneration) {
        status = await this.refreshFromVault("startup-drift");
      }
      return status;
    };
    if (!this.app.telemetry) return execute();
    return this.app.telemetry.measureAsync("search.startup_reconcile", (span) =>
      execute((checkpoint) =>
        span.setAttribute("search.checkpoint", checkpoint),
      ),
    );
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
        if (!this.app.searchDocumentProviders.resolve(file)) return;
        this.recordSourceMutation();
        if (!this.changeTrackingReady) return;
        this.queuedDeletes.delete(file.path);
        this.queuedChanges.set(file.path, { file, content, cache });
        this.flushQueuedChanges();
      },
    );
    const deleted = this.app.metadataCache.on("deleted", (file) => {
      if (!this.app.searchDocumentProviders.resolve(file)) return;
      this.recordSourceMutation();
      if (!this.changeTrackingReady) return;
      this.queuedChanges.delete(file.path);
      this.queuedDeletes.set(file.path, file);
      this.flushQueuedChanges();
    });
    const vaultChanged = this.app.vault.on("modify", (file) => {
      if (
        isFileLike(file) &&
        !this.usesMetadataPipeline(file) &&
        this.app.searchDocumentProviders.resolve(file)
      ) {
        this.recordSourceMutation();
        if (this.changeTrackingReady) {
          this.trackIncrementalOperation(this.processFileSafely(file));
        }
      }
    });
    const vaultCreated = this.app.vault.on("create", (file) => {
      if (
        isFileLike(file) &&
        !this.usesMetadataPipeline(file) &&
        this.app.searchDocumentProviders.resolve(file)
      ) {
        this.recordSourceMutation();
        if (this.changeTrackingReady) {
          this.trackIncrementalOperation(this.processFileSafely(file));
        }
      }
    });
    const vaultDeleted = this.app.vault.on("delete", (file) => {
      if (
        isFileLike(file) &&
        !this.usesMetadataPipeline(file) &&
        this.app.searchDocumentProviders.resolve(file)
      ) {
        this.recordSourceMutation();
        if (this.changeTrackingReady) {
          this.trackIncrementalOperation(this.processDelete(file));
        }
      }
    });
    const vaultRenamed = this.app.vault.on("rename", (file, oldPath) => {
      const oldFile = isFileLike(file) ? this.fileAtPath(file, oldPath) : null;
      const currentProvider = isFileLike(file)
        ? this.app.searchDocumentProviders.resolve(file)
        : null;
      const previousProvider = oldFile
        ? this.app.searchDocumentProviders.resolve(oldFile)
        : null;
      if (!currentProvider && !previousProvider) return;
      this.recordSourceMutation();
      if (!this.changeTrackingReady) return;
      this.trackIncrementalOperation(
        Promise.all([
          this.processDelete(oldPath),
          currentProvider && isFileLike(file)
            ? this.processFileSafely(file)
            : Promise.resolve(),
        ]).then(() => undefined),
      );
    });

    return () => {
      this.flushQueuedChanges.cancel();
      this.app.metadataCache.offref(changed);
      this.app.metadataCache.offref(deleted);
      this.app.vault.offref(vaultChanged);
      this.app.vault.offref(vaultCreated);
      this.app.vault.offref(vaultDeleted);
      this.app.vault.offref(vaultRenamed);
    };
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.flushQueuedChanges.cancel();
    if (this.queuedChanges.size || this.queuedDeletes.size) {
      await this.drainQueuedChanges();
    }
    await Promise.allSettled([
      ...this.pendingIncrementalOperations,
      this.queuedProcessing,
      ...(this.refreshPromise ? [this.refreshPromise] : []),
    ]);
    await this.persistReconcileCheckpoint();
    this.disposed = true;
    this.queuedChanges.clear();
    this.queuedDeletes.clear();
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

  private currentReconcileFingerprint(): string {
    const fingerprint = new StreamingManifestFingerprint();
    const providers = this.app.searchDocumentProviders
      .getAll()
      .sort((left, right) => left.id.localeCompare(right.id));
    for (const provider of providers) {
      fingerprint.add(
        [
          "provider",
          provider.id,
          provider.version ?? "1",
          provider.priority ?? 0,
          this.projectionSignature(provider.id, provider.version ?? "1"),
        ].join("\u0000"),
      );
    }

    const files =
      typeof this.app.vault.iterateFiles === "function"
        ? this.app.vault.iterateFiles()
        : this.app.vault.getFiles();
    for (const file of files) {
      const provider = this.app.searchDocumentProviders.resolve(file);
      if (!provider) continue;
      const providerVersion = provider.version ?? "1";
      fingerprint.add(
        [
          "file",
          file.path,
          file.stat.mtime,
          file.stat.size,
          provider.id,
          providerVersion,
          this.projectionSignature(provider.id, providerVersion),
        ].join("\u0000"),
      );
    }
    return fingerprint.finish("search-index-v1");
  }

  private readReconcileCheckpoint(): Promise<unknown> {
    return typeof this.app.appDatabase.getMeta === "function"
      ? this.app.appDatabase.getMeta(SEARCH_RECONCILE_CHECKPOINT_KEY)
      : Promise.resolve(undefined);
  }

  private markReconcileCheckpointDirty(): void {
    this.reconcileCheckpointDirty = true;
    this.reconcileCheckpointGeneration += 1;
  }

  private recordSourceMutation(): void {
    this.sourceGeneration += 1;
    this.markReconcileCheckpointDirty();
  }

  private async invalidateReconcileCheckpoint(): Promise<void> {
    this.reconcileCheckpointReady = false;
    this.markReconcileCheckpointDirty();
    if (typeof this.app.appDatabase.setMeta !== "function") return;
    await this.app.appDatabase.setMeta(SEARCH_RECONCILE_CHECKPOINT_KEY, {
      version: SEARCH_RECONCILE_CHECKPOINT_VERSION,
      fingerprint: "",
      completedAt: 0,
    } satisfies SearchReconcileCheckpoint);
  }

  private async persistReconcileCheckpoint(): Promise<void> {
    if (this.reconcileCheckpointWrite) {
      await this.reconcileCheckpointWrite;
      return;
    }
    if (
      this.disposed ||
      !this.reconcileCheckpointReady ||
      !this.reconcileCheckpointDirty ||
      this.activeIncrementalOperations > 0 ||
      this.refreshState.active ||
      typeof this.app.appDatabase.setMeta !== "function"
    ) {
      return;
    }

    this.reconcileCheckpointWrite = (async () => {
      while (
        !this.disposed &&
        this.reconcileCheckpointReady &&
        this.reconcileCheckpointDirty &&
        this.activeIncrementalOperations === 0 &&
        !this.refreshState.active
      ) {
        const generation = this.reconcileCheckpointGeneration;
        const fingerprint = this.currentReconcileFingerprint();
        try {
          await this.app.appDatabase.setMeta(SEARCH_RECONCILE_CHECKPOINT_KEY, {
            version: SEARCH_RECONCILE_CHECKPOINT_VERSION,
            fingerprint,
            completedAt: Date.now(),
          } satisfies SearchReconcileCheckpoint);
        } catch (error) {
          this.reconcileCheckpointReady = false;
          this.app.logger.warn(
            "Failed to persist Search reconciliation checkpoint",
            error instanceof Error ? error : new Error(String(error)),
          );
          return;
        }
        if (generation === this.reconcileCheckpointGeneration) {
          this.reconcileCheckpointDirty = false;
        }
      }
    })();
    try {
      await this.reconcileCheckpointWrite;
    } finally {
      this.reconcileCheckpointWrite = null;
    }
  }

  private trackIncrementalOperation(operation: Promise<unknown>): void {
    this.activeIncrementalOperations += 1;
    const tracked = operation
      .catch((error) => {
        this.reconcileCheckpointReady = false;
        this.app.logger.warn(
          "Search incremental indexing failed",
          error instanceof Error ? error : new Error(String(error)),
        );
      })
      .finally(() => {
        this.activeIncrementalOperations = Math.max(
          0,
          this.activeIncrementalOperations - 1,
        );
        this.pendingIncrementalOperations.delete(tracked);
        void this.persistReconcileCheckpoint();
      });
    this.pendingIncrementalOperations.add(tracked);
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
    Awaited<
      ReturnType<App["appDatabase"]["listIndexedFileManifest"]>
    >["rows"][number]
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

  private fileAtPath(file: TFile, path: string): TFile {
    const name = path.split("/").at(-1) ?? path;
    const extension = name.includes(".") ? (name.split(".").at(-1) ?? "") : "";
    return {
      ...file,
      path,
      name,
      baseName: extension ? name.slice(0, -(extension.length + 1)) : name,
      extension,
    } as TFile;
  }

  private async processFileSafely(file: TFile): Promise<boolean> {
    try {
      await this.processFile(file);
      return true;
    } catch (error) {
      await this.handleProviderFailure(file, error);
      return false;
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

  private drainQueuedChanges(): Promise<void> {
    const operation = this.queuedProcessing.then(() =>
      this.processQueuedChanges(),
    );
    this.queuedProcessing = operation.catch(() => undefined);
    this.trackIncrementalOperation(operation);
    return operation;
  }

  private async runRefresh(reason: string): Promise<SearchRuntimeStatus> {
    let changed = 0;
    let deleted = 0;
    let providerFailures = 0;
    let batches = 0;
    const reasonCategory = telemetryRefreshReason(reason);
    const execute = async () => {
      await this.invalidateReconcileCheckpoint();
      const refreshGeneration = this.sourceGeneration;
      const status = await this.app.notifications.withProgress(
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
                  await this.app.appDatabase.deleteSearchDocument(
                    searchRow.path,
                  );
                  deleted += 1;
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
              const indexedSearch =
                searchRow?.path === file.path ? searchRow : undefined;
              const indexedMetadata =
                metadataRow?.path === file.path ? metadataRow : undefined;
              const provider = this.app.searchDocumentProviders.resolve(file);
              if (!provider) {
                // A persisted Search row whose path is still a vault file is a
                // stale vault projection when no provider currently claims it.
                if (indexedSearch) {
                  await this.app.appDatabase.deleteSearchDocument(file.path);
                  deleted += 1;
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
                  if (await this.processFileSafely(file)) changed += 1;
                  else providerFailures += 1;
                }
              }
              if (searchRow?.path === file.path) {
                searchRow = (await searchIterator.next()).value;
              }
              if (metadataRow?.path === file.path) {
                metadataRow = (await metadataIterator.next()).value;
              }
              this.refreshState.processed += 1;
              if (this.refreshState.processed % 25 === 0) {
                batches += 1;
                await yieldToBackground();
              }
            }
            let trailingRows = 0;
            while (searchRow) {
              progress.throwIfCancellationRequested();
              if (ownedSearchRow(searchRow)) {
                await this.app.appDatabase.deleteSearchDocument(searchRow.path);
                deleted += 1;
              }
              searchRow = (await searchIterator.next()).value;
              trailingRows += 1;
              if (trailingRows % 25 === 0) {
                batches += 1;
                await yieldToBackground();
              }
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
          this.reconcileCheckpointReady = true;
          this.markReconcileCheckpointDirty();
          if (refreshGeneration === this.sourceGeneration) {
            await this.persistReconcileCheckpoint();
          }
          return this.getStatus();
        },
      );
      this.app.telemetry?.recordEvent("search.reconcile.complete", {
        checkpoint: "miss",
        reason: reasonCategory,
        "files.total": this.refreshState.total,
        "files.processed": this.refreshState.processed,
        "files.changed": changed,
        "files.deleted": deleted,
        "providers.failed": providerFailures,
        "results.count": status.documentCount,
      });
      return status;
    };

    if (!this.app.telemetry) return execute();
    return this.app.telemetry.measureAsync(
      "search.reconcile",
      async (span) => {
        try {
          return await execute();
        } catch (error) {
          const cancelled = isCancellationError(error);
          this.app.telemetry.recordEvent(
            cancelled
              ? "search.reconcile.cancelled"
              : "search.reconcile.failed",
            {
              status: cancelled ? "cancelled" : "failed",
              reason: reasonCategory,
              "files.total": this.refreshState.total,
              "files.processed": this.refreshState.processed,
            },
          );
          throw error;
        } finally {
          span.setAttribute("search.reconcile.reason", reasonCategory);
          span.setAttribute("search.files.total", this.refreshState.total);
          span.setAttribute(
            "search.files.processed",
            this.refreshState.processed,
          );
          span.setAttribute("search.files.changed", changed);
          span.setAttribute("search.files.deleted", deleted);
          span.setAttribute("search.providers.failed", providerFailures);
          span.setAttribute("search.batch.count", batches);
        }
      },
      { attributes: { "search.reconcile.reason": reasonCategory } },
    );
  }
}
