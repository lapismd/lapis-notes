import { PromiseWorker } from "../promise-worker";
import {
  type AppDatabaseIndexedMetadataQuery,
  type AppDatabaseIndexedMetadataRow,
  MemoryAppDatabase,
  type AppDatabaseFileHistory,
  type AppDatabaseIndexedFile,
  type AppDatabaseKind,
  type AppDatabaseSearchIndexStats,
  type AppDatabaseStoreFileHistoryRevisionInput,
  type AppDatabaseStoreFileHistoryRevisionResult,
  type SearchEmbeddingRuntimeStatus,
  type SearchEmbeddingProviderConfig,
  type AppDatabaseSearchOptions,
  type AppDatabaseSearchResult,
  type AppDatabaseState,
  type MetadataCacheSnapshot,
  type SearchDocumentRecord,
} from "./app-database";
import {
  SqliteWasmAppDatabaseCore,
  type SqliteWasmAppDatabaseOptions,
} from "./sqlite-wasm-app-database-core";

export type { SqliteWasmAppDatabaseOptions } from "./sqlite-wasm-app-database-core";

function createSqliteAppDatabaseWorker(): Worker {
  return new Worker(
    new URL("./sqlite-wasm-app-database.worker.js", import.meta.url),
    { type: "module" },
  );
}

export class SqliteWasmAppDatabase extends MemoryAppDatabase {
  override readonly kind: AppDatabaseKind = "sqlite-wasm";
  private transport: PromiseWorker | null = null;
  private core: SqliteWasmAppDatabaseCore | null = null;
  private opened = false;

  constructor(
    vaultId: string,
    readonly options: SqliteWasmAppDatabaseOptions = {},
  ) {
    super(vaultId);
  }

  override async open(): Promise<void> {
    if (this.opened) return;
    const state = await this.invoke<AppDatabaseState | null>(
      "open",
      {
        vaultId: this.vaultId,
        options: this.coreOptions(),
      },
      60000,
    );
    if (state) {
      this.fromState(state);
    }
    this.opened = true;
  }

  override async migrate(): Promise<void> {
    await this.open();
  }

  override async close(): Promise<void> {
    if (!this.opened) return;
    await this.invoke("close", {}, 30000);
    this.transport?.terminate();
    this.transport = null;
    this.core = null;
    this.opened = false;
  }

  override async setMeta(key: string, value: unknown): Promise<void> {
    await this.ensureOpen();
    await this.invoke("setMeta", { key, value });
    await super.setMeta(key, value);
  }

  override async beginSearchIndexingBatch(): Promise<void> {
    await this.ensureOpen();
    await this.invoke("beginSearchIndexingBatch", {});
  }

  override async endSearchIndexingBatch(): Promise<void> {
    await this.ensureOpen();
    await this.invoke("endSearchIndexingBatch", {});
  }

  override async saveMetadataSnapshot(
    snapshot: MetadataCacheSnapshot,
  ): Promise<void> {
    await this.ensureOpen();
    await this.invoke("saveMetadataSnapshot", { snapshot });
    await super.saveMetadataSnapshot(snapshot);
  }

  override async getFileHistory(
    path: string,
  ): Promise<AppDatabaseFileHistory | null> {
    await this.ensureOpen();
    return this.invoke<AppDatabaseFileHistory | null>("getFileHistory", {
      path,
    });
  }

  override async storeFileHistoryRevision(
    input: AppDatabaseStoreFileHistoryRevisionInput,
  ): Promise<AppDatabaseStoreFileHistoryRevisionResult> {
    await this.ensureOpen();
    const result = await this.invoke<AppDatabaseStoreFileHistoryRevisionResult>(
      "storeFileHistoryRevision",
      { input },
    );
    if (result.stored) {
      await super.storeFileHistoryRevision(input);
    }
    return result;
  }

  override async upsertIndexedFile(
    record: AppDatabaseIndexedFile,
  ): Promise<void> {
    await this.ensureOpen();
    await this.invoke("upsertIndexedFile", { record });
    await super.upsertIndexedFile(record);
  }

  override async deleteIndexedFile(path: string): Promise<void> {
    await this.ensureOpen();
    await this.invoke("deleteIndexedFile", { path });
    await super.deleteIndexedFile(path);
  }

  override async renameIndexedFile(
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    await this.ensureOpen();
    await this.invoke("renameIndexedFile", { oldPath, newPath });
    await super.renameIndexedFile(oldPath, newPath);
  }

  override async queryIndexedMetadata(
    query: AppDatabaseIndexedMetadataQuery = {},
  ): Promise<AppDatabaseIndexedMetadataRow[]> {
    await this.ensureOpen();
    return this.invoke<AppDatabaseIndexedMetadataRow[]>(
      "queryIndexedMetadata",
      { query },
    );
  }

  override async upsertSearchDocument(
    document: SearchDocumentRecord,
  ): Promise<void> {
    await this.ensureOpen();
    const preparedDocument = await this.invoke<SearchDocumentRecord>(
      "upsertSearchDocument",
      { document },
    );
    this.searchDocs.set(
      preparedDocument.path,
      structuredClone(preparedDocument),
    );
    this.updateSearchIndexStatsForDocument(
      preparedDocument.path,
      preparedDocument,
    );
  }

  override async deleteSearchDocument(path: string): Promise<void> {
    await this.ensureOpen();
    await this.invoke("deleteSearchDocument", { path });
    await super.deleteSearchDocument(path);
  }

  override async rebuildSearchIndex(): Promise<void> {
    await this.ensureOpen();
    await this.invoke("rebuildSearchIndex", {}, 60000);
  }

  override async searchDocuments(
    query: string,
    options: AppDatabaseSearchOptions = {},
  ): Promise<AppDatabaseSearchResult[]> {
    await this.ensureOpen();
    return this.invoke<AppDatabaseSearchResult[]>(
      "searchDocuments",
      { query, options },
      30000,
    );
  }

  private coreOptions(): SqliteWasmAppDatabaseOptions {
    return {
      filename: this.options.filename,
      vfsName: this.options.vfsName,
      directory: this.options.directory,
    };
  }

  private shouldUseWorker(): boolean {
    return this.options.useWorker !== false && typeof Worker !== "undefined";
  }

  private async ensureOpen(): Promise<void> {
    if (!this.opened) {
      await this.open();
    }
  }

  override async configureSearchEmbeddingProvider(
    provider: SearchEmbeddingProviderConfig | null,
  ): Promise<void> {
    await this.ensureOpen();
    await this.invoke("configureSearchEmbeddingProvider", { provider });
    await super.configureSearchEmbeddingProvider(provider);
  }

  override async getSearchEmbeddingProvider(): Promise<SearchEmbeddingProviderConfig | null> {
    await this.ensureOpen();
    return this.invoke<SearchEmbeddingProviderConfig | null>(
      "getSearchEmbeddingProvider",
      {},
    );
  }

  override async getSearchEmbeddingRuntimeStatus(): Promise<SearchEmbeddingRuntimeStatus | null> {
    await this.ensureOpen();
    return this.invoke<SearchEmbeddingRuntimeStatus | null>(
      "getSearchEmbeddingRuntimeStatus",
      {},
    );
  }

  override async getSearchIndexStats(): Promise<AppDatabaseSearchIndexStats> {
    await this.ensureOpen();
    return this.invoke<AppDatabaseSearchIndexStats>("getSearchIndexStats", {});
  }

  private getTransport(): PromiseWorker {
    if (!this.transport) {
      this.transport = new PromiseWorker(createSqliteAppDatabaseWorker());
    }
    return this.transport;
  }

  private async invoke<T>(
    type: string,
    data: Record<string, unknown>,
    timeout = this.options.workerTimeoutMs ?? 30000,
  ): Promise<T> {
    if (this.shouldUseWorker()) {
      return this.getTransport().postMessage<T>(type, data, timeout);
    }

    if (!this.core) {
      this.core = new SqliteWasmAppDatabaseCore(
        this.vaultId,
        this.coreOptions(),
      );
    }

    switch (type) {
      case "open": {
        await this.core.open();
        return this.core.snapshotState() as T;
      }
      case "close": {
        await this.core.close();
        this.core = null;
        return true as T;
      }
      case "setMeta": {
        await this.core.setMeta(data.key as string, data.value);
        return true as T;
      }
      case "beginSearchIndexingBatch": {
        await this.core.beginSearchIndexingBatch();
        return true as T;
      }
      case "endSearchIndexingBatch": {
        await this.core.endSearchIndexingBatch();
        return true as T;
      }
      case "configureSearchEmbeddingProvider": {
        await this.core.configureSearchEmbeddingProvider(
          (data.provider as SearchEmbeddingProviderConfig | null) ?? null,
        );
        return true as T;
      }
      case "getSearchEmbeddingProvider": {
        return this.core.getSearchEmbeddingProvider() as Promise<T>;
      }
      case "getSearchEmbeddingRuntimeStatus": {
        return this.core.getSearchEmbeddingRuntimeStatus() as Promise<T>;
      }
      case "getSearchIndexStats": {
        return this.core.getSearchIndexStats() as Promise<T>;
      }
      case "saveMetadataSnapshot": {
        await this.core.saveMetadataSnapshot(
          data.snapshot as MetadataCacheSnapshot,
        );
        return true as T;
      }
      case "getFileHistory": {
        return this.core.getFileHistory(data.path as string) as Promise<T>;
      }
      case "storeFileHistoryRevision": {
        return this.core.storeFileHistoryRevision(
          data.input as AppDatabaseStoreFileHistoryRevisionInput,
        ) as Promise<T>;
      }
      case "upsertIndexedFile": {
        await this.core.upsertIndexedFile(
          data.record as AppDatabaseIndexedFile,
        );
        return true as T;
      }
      case "deleteIndexedFile": {
        await this.core.deleteIndexedFile(data.path as string);
        return true as T;
      }
      case "renameIndexedFile": {
        await this.core.renameIndexedFile(
          data.oldPath as string,
          data.newPath as string,
        );
        return true as T;
      }
      case "upsertSearchDocument": {
        return this.core.prepareAndPersistSearchDocument(
          data.document as SearchDocumentRecord,
        ) as Promise<T>;
      }
      case "deleteSearchDocument": {
        await this.core.deleteSearchDocument(data.path as string);
        return true as T;
      }
      case "rebuildSearchIndex": {
        await this.core.rebuildSearchIndex();
        return true as T;
      }
      case "searchDocuments": {
        return this.core.searchDocuments(
          data.query as string,
          data.options as AppDatabaseSearchOptions | undefined,
        ) as Promise<T>;
      }
      default:
        throw new Error(`Unsupported sqlite app-database operation: ${type}`);
    }
  }
}
