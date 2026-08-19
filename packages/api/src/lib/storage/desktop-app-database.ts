import type {
  AppDatabase,
  AppDatabaseDescriptor,
  AppDatabaseFileHistory,
  AppDatabaseIndexedFile,
  AppDatabaseIndexedMetadataQuery,
  AppDatabaseLinkRecord,
  AppDatabaseIndexedMetadataRow,
  AppDatabaseNotebookState,
  AppDatabaseNotificationRecord,
  AppDatabaseOpenContext,
  AppDatabaseProvider,
  AppDatabaseSearchIndexStats,
  AppDatabaseSearchOptions,
  AppDatabaseSearchResult,
  AppDatabaseStoreFileHistoryRevisionInput,
  AppDatabaseStoreFileHistoryRevisionResult,
  MetadataCacheSnapshot,
  SearchDocumentRecord,
  SearchEmbeddingProviderConfig,
  SearchEmbeddingRuntimeStatus,
} from "./app-database";
import type {
  AppDatabaseTaskChildQuery,
  AppDatabaseTaskQuery,
  AppDatabaseTaskRecord,
} from "./task-projection";
import {
  getNativeDesktopBridge,
  getNativeDesktopCapability,
  getNativeDesktopPlatform,
  type NativeDesktopBridge,
} from "./desktop-native";

export const DESKTOP_APP_DATABASE_RPC_METHODS = [
  "migrate",
  "beginSearchIndexingBatch",
  "endSearchIndexingBatch",
  "configureSearchEmbeddingProvider",
  "getSearchEmbeddingProvider",
  "getSearchEmbeddingRuntimeStatus",
  "getSearchIndexStats",
  "getMeta",
  "setMeta",
  "getNotebookState",
  "setNotebookState",
  "deleteNotebookState",
  "loadMetadataSnapshot",
  "saveMetadataSnapshot",
  "getFileHistory",
  "storeFileHistoryRevision",
  "listNotifications",
  "upsertNotification",
  "markNotificationRead",
  "clearNotification",
  "clearAllNotifications",
  "upsertIndexedFile",
  "queryIndexedMetadata",
  "deleteIndexedFile",
  "renameIndexedFile",
  "upsertSearchDocument",
  "deleteSearchDocument",
  "getSearchDocument",
  "listSearchDocuments",
  "rebuildSearchIndex",
  "searchDocuments",
  "upsertTaskProjection",
  "deleteTaskProjection",
  "queryTasks",
  "getTaskRow",
  "listChildLinks",
  "listTaskDescendants",
] as const;

export type DesktopAppDatabaseRpcMethod =
  (typeof DESKTOP_APP_DATABASE_RPC_METHODS)[number];

const DEFAULT_NATIVE_DESCRIPTOR: AppDatabaseDescriptor = {
  providerId: "electron-turso-native",
  engine: "turso",
  transport: "native",
  role: "direct",
  storageMode: "local",
  capabilities: {
    nativeFullTextSearch: false,
    vectorSearch: false,
    approximateNearestNeighbors: false,
    localEmbeddings: true,
    crossTabCoordination: false,
    sync: false,
  },
};

function requireNativeDatabaseBridge(): NativeDesktopBridge {
  const bridge = getNativeDesktopBridge();
  if (!bridge) throw new Error("Native desktop bridge is unavailable");
  return bridge;
}

export class NativeDesktopTursoAppDatabase implements AppDatabase {
  readonly kind = "turso-native" as const;
  private opened = false;
  private currentDescriptor: AppDatabaseDescriptor = DEFAULT_NATIVE_DESCRIPTOR;

  constructor(
    readonly vaultId: string,
    private readonly bridge: NativeDesktopBridge = requireNativeDatabaseBridge(),
  ) {}

  get descriptor(): AppDatabaseDescriptor {
    return this.currentDescriptor;
  }

  async open(): Promise<void> {
    if (this.opened) return;
    this.currentDescriptor = await this.bridge.invoke<AppDatabaseDescriptor>(
      "desktop_db_open",
      { vaultId: this.vaultId },
    );
    this.opened = true;
  }

  async close(): Promise<void> {
    if (!this.opened) return;
    this.opened = false;
    await this.bridge.invoke("desktop_db_close", { vaultId: this.vaultId });
  }

  migrate(): Promise<void> {
    return this.call("migrate");
  }

  beginSearchIndexingBatch(): Promise<void> {
    return this.call("beginSearchIndexingBatch");
  }

  endSearchIndexingBatch(): Promise<void> {
    return this.call("endSearchIndexingBatch");
  }

  configureSearchEmbeddingProvider(
    provider: SearchEmbeddingProviderConfig | null,
  ): Promise<void> {
    return this.call("configureSearchEmbeddingProvider", provider);
  }

  getSearchEmbeddingProvider(): Promise<SearchEmbeddingProviderConfig | null> {
    return this.call("getSearchEmbeddingProvider");
  }

  getSearchEmbeddingRuntimeStatus(): Promise<SearchEmbeddingRuntimeStatus | null> {
    return this.call("getSearchEmbeddingRuntimeStatus");
  }

  getSearchIndexStats(): Promise<AppDatabaseSearchIndexStats> {
    return this.call("getSearchIndexStats");
  }

  getMeta<T = unknown>(key: string): Promise<T | undefined> {
    return this.call("getMeta", key);
  }

  setMeta(key: string, value: unknown): Promise<void> {
    return this.call("setMeta", key, value);
  }

  getNotebookState(sourcePath: string): Promise<AppDatabaseNotebookState | undefined> {
    return this.call("getNotebookState", sourcePath);
  }

  setNotebookState(
    sourcePath: string,
    state: AppDatabaseNotebookState,
  ): Promise<void> {
    return this.call("setNotebookState", sourcePath, state);
  }

  deleteNotebookState(sourcePath: string): Promise<void> {
    return this.call("deleteNotebookState", sourcePath);
  }

  loadMetadataSnapshot(): Promise<MetadataCacheSnapshot | null> {
    return this.call("loadMetadataSnapshot");
  }

  saveMetadataSnapshot(snapshot: MetadataCacheSnapshot): Promise<void> {
    return this.call("saveMetadataSnapshot", snapshot);
  }

  getFileHistory(path: string): Promise<AppDatabaseFileHistory | null> {
    return this.call("getFileHistory", path);
  }

  storeFileHistoryRevision(
    input: AppDatabaseStoreFileHistoryRevisionInput,
  ): Promise<AppDatabaseStoreFileHistoryRevisionResult> {
    return this.call("storeFileHistoryRevision", input);
  }

  listNotifications(): Promise<AppDatabaseNotificationRecord[]> {
    return this.call("listNotifications");
  }

  upsertNotification(record: AppDatabaseNotificationRecord): Promise<void> {
    return this.call("upsertNotification", record);
  }

  markNotificationRead(id: string): Promise<void> {
    return this.call("markNotificationRead", id);
  }

  clearNotification(id: string): Promise<void> {
    return this.call("clearNotification", id);
  }

  clearAllNotifications(): Promise<void> {
    return this.call("clearAllNotifications");
  }

  upsertIndexedFile(record: AppDatabaseIndexedFile): Promise<void> {
    return this.call("upsertIndexedFile", record);
  }

  queryIndexedMetadata(
    query?: AppDatabaseIndexedMetadataQuery,
  ): Promise<AppDatabaseIndexedMetadataRow[]> {
    return this.call("queryIndexedMetadata", query);
  }

  deleteIndexedFile(path: string): Promise<void> {
    return this.call("deleteIndexedFile", path);
  }

  renameIndexedFile(oldPath: string, newPath: string): Promise<void> {
    return this.call("renameIndexedFile", oldPath, newPath);
  }

  upsertSearchDocument(document: SearchDocumentRecord): Promise<void> {
    return this.call("upsertSearchDocument", document);
  }

  deleteSearchDocument(path: string): Promise<void> {
    return this.call("deleteSearchDocument", path);
  }

  getSearchDocument(path: string): Promise<SearchDocumentRecord | undefined> {
    return this.call("getSearchDocument", path);
  }

  listSearchDocuments(): Promise<SearchDocumentRecord[]> {
    return this.call("listSearchDocuments");
  }

  rebuildSearchIndex(): Promise<void> {
    return this.call("rebuildSearchIndex");
  }

  searchDocuments(
    query: string,
    options?: AppDatabaseSearchOptions,
  ): Promise<AppDatabaseSearchResult[]> {
    return this.call("searchDocuments", query, options);
  }

  upsertTaskProjection(record: AppDatabaseTaskRecord): Promise<void> {
    return this.call("upsertTaskProjection", record);
  }

  deleteTaskProjection(path: string): Promise<void> {
    return this.call("deleteTaskProjection", path);
  }

  queryTasks(query?: AppDatabaseTaskQuery): Promise<AppDatabaseTaskRecord[]> {
    return this.call("queryTasks", query);
  }

  getTaskRow(
    lookup: { path?: string; id?: string },
  ): Promise<AppDatabaseTaskRecord | undefined> {
    return this.call("getTaskRow", lookup);
  }

  listChildLinks(
    query: AppDatabaseTaskChildQuery,
  ): Promise<AppDatabaseLinkRecord[]> {
    return this.call("listChildLinks", query);
  }

  listTaskDescendants(path: string): Promise<AppDatabaseTaskRecord[]> {
    return this.call("listTaskDescendants", path);
  }

  private call<T>(method: DesktopAppDatabaseRpcMethod, ...args: unknown[]): Promise<T> {
    if (!this.opened) {
      return Promise.reject(new Error("Native Turso app database is not open"));
    }
    return this.bridge.invoke<T>("desktop_db_call", {
      vaultId: this.vaultId,
      method,
      args,
    });
  }
}

export class NativeDesktopTursoAppDatabaseProvider
  implements AppDatabaseProvider
{
  readonly id = "electron-turso-native";

  canOpen(context: AppDatabaseOpenContext): boolean {
    if (context.runtime !== "electron-desktop") return false;
    const platform = getNativeDesktopPlatform();
    const supportedTarget =
      (platform?.os === "macos" && platform.arch === "arm64") ||
      (platform?.os === "linux" && ["x64", "arm64"].includes(platform.arch));
    return (
      supportedTarget &&
      getNativeDesktopCapability("database")?.status === "available"
    );
  }

  async open(context: AppDatabaseOpenContext): Promise<AppDatabase> {
    if (!this.canOpen(context)) {
      throw new Error("Native Turso is unavailable on this Electron target");
    }
    const database = new NativeDesktopTursoAppDatabase(context.vaultId);
    await database.open();
    return database;
  }
}
