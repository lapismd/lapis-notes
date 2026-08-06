import type { WorkerMessage, WorkerResponse } from "../promise-worker";
import {
  SqliteWasmAppDatabaseCore,
  type SqliteWasmAppDatabaseOptions,
} from "./sqlite-wasm-app-database-core";
import type {
  AppDatabaseFileHistory,
  AppDatabaseIndexedFile,
  AppDatabaseIndexedMetadataQuery,
  AppDatabaseSearchIndexStats,
  AppDatabaseSearchOptions,
  AppDatabaseStoreFileHistoryRevisionInput,
  MetadataCacheSnapshot,
  SearchEmbeddingRuntimeStatus,
  SearchEmbeddingProviderConfig,
  SearchDocumentRecord,
} from "./app-database";

let database: SqliteWasmAppDatabaseCore | null = null;

async function getDatabase(): Promise<SqliteWasmAppDatabaseCore> {
  if (!database) {
    throw new Error("SQLite app database is not open");
  }
  return database;
}

async function handleMessage(type: string, data: any): Promise<unknown> {
  switch (type) {
    case "open": {
      const options = (data?.options ?? {}) as SqliteWasmAppDatabaseOptions;
      if (!database) {
        database = new SqliteWasmAppDatabaseCore(data.vaultId, options);
      }
      await database.open();
      return database.snapshotState();
    }
    case "close": {
      if (database) {
        await database.close();
        database = null;
      }
      return true;
    }
    case "setMeta": {
      await (await getDatabase()).setMeta(data.key, data.value);
      return true;
    }
    case "beginSearchIndexingBatch": {
      await (await getDatabase()).beginSearchIndexingBatch();
      return true;
    }
    case "endSearchIndexingBatch": {
      await (await getDatabase()).endSearchIndexingBatch();
      return true;
    }
    case "configureSearchEmbeddingProvider": {
      await (
        await getDatabase()
      ).configureSearchEmbeddingProvider(
        (data.provider as SearchEmbeddingProviderConfig | null) ?? null,
      );
      return true;
    }
    case "getSearchEmbeddingProvider": {
      return (await getDatabase()).getSearchEmbeddingProvider();
    }
    case "getSearchEmbeddingRuntimeStatus": {
      return (
        await getDatabase()
      ).getSearchEmbeddingRuntimeStatus() as Promise<SearchEmbeddingRuntimeStatus | null>;
    }
    case "getSearchIndexStats": {
      return (
        await getDatabase()
      ).getSearchIndexStats() as Promise<AppDatabaseSearchIndexStats>;
    }
    case "saveMetadataSnapshot": {
      await (
        await getDatabase()
      ).saveMetadataSnapshot(data.snapshot as MetadataCacheSnapshot);
      return true;
    }
    case "getFileHistory": {
      return (await getDatabase()).getFileHistory(
        data.path,
      ) as Promise<AppDatabaseFileHistory | null>;
    }
    case "storeFileHistoryRevision": {
      return (await getDatabase()).storeFileHistoryRevision(
        data.input as AppDatabaseStoreFileHistoryRevisionInput,
      );
    }
    case "upsertIndexedFile": {
      await (
        await getDatabase()
      ).upsertIndexedFile(data.record as AppDatabaseIndexedFile);
      return true;
    }
    case "deleteIndexedFile": {
      await (await getDatabase()).deleteIndexedFile(data.path);
      return true;
    }
    case "renameIndexedFile": {
      await (await getDatabase()).renameIndexedFile(data.oldPath, data.newPath);
      return true;
    }
    case "queryIndexedMetadata": {
      return (await getDatabase()).queryIndexedMetadata(
        data.query as AppDatabaseIndexedMetadataQuery | undefined,
      );
    }
    case "upsertSearchDocument": {
      return (await getDatabase()).prepareAndPersistSearchDocument(
        data.document as SearchDocumentRecord,
      );
    }
    case "deleteSearchDocument": {
      await (await getDatabase()).deleteSearchDocument(data.path);
      return true;
    }
    case "rebuildSearchIndex": {
      await (await getDatabase()).rebuildSearchIndex();
      return true;
    }
    case "searchDocuments": {
      return (await getDatabase()).searchDocuments(
        data.query,
        data.options as AppDatabaseSearchOptions | undefined,
      );
    }
    case "debugSeedVectorSearchFixture": {
      return (await getDatabase()).debugSeedVectorSearchFixture(data.fixture);
    }
    case "debugListSearchVectorRows": {
      return (await getDatabase()).debugListSearchVectorRows();
    }
    default:
      throw new Error(`Unsupported sqlite worker message: ${type}`);
  }
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const response: WorkerResponse = {
    id: event.data.id,
    success: true,
  };

  try {
    response.result = await handleMessage(event.data.type, event.data.data);
  } catch (error) {
    response.success = false;
    response.error = error instanceof Error ? error.message : String(error);
  }

  self.postMessage(response);
};

export default {};
