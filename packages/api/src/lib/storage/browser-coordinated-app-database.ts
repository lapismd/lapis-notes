import type {
  AppDatabase,
  AppDatabaseDescriptor,
  AppDatabaseFileHistory,
  AppDatabaseIndexedFile,
  AppDatabaseIndexedMetadataQuery,
  AppDatabaseIndexedMetadataRow,
  AppDatabaseKind,
  AppDatabaseProvider,
  AppDatabaseNotificationRecord,
  AppDatabaseSearchIndexStats,
  AppDatabaseNotebookState,
  AppDatabaseSearchOptions,
  AppDatabaseSearchResult,
  AppDatabaseStoreFileHistoryRevisionInput,
  AppDatabaseStoreFileHistoryRevisionResult,
  MetadataCacheSnapshot,
  SearchDocumentRecord,
  SearchEmbeddingProviderConfig,
  SearchEmbeddingRuntimeStatus,
} from "./app-database";
import { BrowserAppDatabaseCoordinator } from "./browser-app-database-coordination";
import { TursoWasmAppDatabaseProvider } from "./turso-app-database";

type AppDatabaseMethod =
  | "migrate"
  | "beginSearchIndexingBatch"
  | "endSearchIndexingBatch"
  | "configureSearchEmbeddingProvider"
  | "getSearchEmbeddingProvider"
  | "getSearchEmbeddingRuntimeStatus"
  | "getSearchIndexStats"
  | "getMeta"
  | "setMeta"
  | "getNotebookState"
  | "setNotebookState"
  | "deleteNotebookState"
  | "loadMetadataSnapshot"
  | "saveMetadataSnapshot"
  | "getFileHistory"
  | "storeFileHistoryRevision"
  | "listNotifications"
  | "upsertNotification"
  | "markNotificationRead"
  | "clearNotification"
  | "clearAllNotifications"
  | "upsertIndexedFile"
  | "deleteIndexedFile"
  | "renameIndexedFile"
  | "queryIndexedMetadata"
  | "upsertSearchDocument"
  | "deleteSearchDocument"
  | "getSearchDocument"
  | "listSearchDocuments"
  | "rebuildSearchIndex"
  | "searchDocuments";

type AppDatabaseRpcMethod = AppDatabaseMethod | "describe";

type AppDatabaseRequestMessage = {
  type: "db-request";
  vaultId: string;
  ownerId?: string;
  requesterId: string;
  requestId: string;
  method: AppDatabaseRpcMethod;
  args: unknown[];
};

type AppDatabaseResponseMessage = {
  type: "db-response";
  vaultId: string;
  responderId: string;
  requesterId: string;
  requestId: string;
  success: boolean;
  result?: unknown;
  error?: string;
};

type AppDatabaseMessage =
  | AppDatabaseRequestMessage
  | AppDatabaseResponseMessage;

const REQUEST_TIMEOUT_MS = 15_000;
const LOCAL_RECOVERY_POLL_MS = 100;
const MAX_RPC_ARGUMENTS = 4;
const MAX_RPC_MESSAGE_BYTES = 32 * 1024 * 1024;
const MAX_RPC_IDENTIFIER_LENGTH = 512;
const APP_DATABASE_RPC_METHODS = new Set<AppDatabaseRpcMethod>([
  "describe",
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
  "deleteIndexedFile",
  "renameIndexedFile",
  "queryIndexedMetadata",
  "upsertSearchDocument",
  "deleteSearchDocument",
  "getSearchDocument",
  "listSearchDocuments",
  "rebuildSearchIndex",
  "searchDocuments",
]);

export type BrowserCoordinatedAppDatabaseMode = "turso-owner" | "turso-proxy";

function isBoundedIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_RPC_IDENTIFIER_LENGTH
  );
}

function isBoundedRpcMessage(message: unknown): boolean {
  try {
    const serialized = JSON.stringify(message);
    return (
      typeof serialized === "string" &&
      new TextEncoder().encode(serialized).byteLength <= MAX_RPC_MESSAGE_BYTES
    );
  } catch {
    return false;
  }
}

function isRequestMessage(
  message: unknown,
): message is AppDatabaseRequestMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as AppDatabaseRequestMessage).type === "db-request" &&
    isBoundedIdentifier((message as AppDatabaseRequestMessage).vaultId) &&
    isBoundedIdentifier((message as AppDatabaseRequestMessage).requesterId) &&
    isBoundedIdentifier((message as AppDatabaseRequestMessage).requestId) &&
    ((message as AppDatabaseRequestMessage).ownerId === undefined ||
      isBoundedIdentifier((message as AppDatabaseRequestMessage).ownerId)) &&
    typeof (message as AppDatabaseRequestMessage).method === "string" &&
    APP_DATABASE_RPC_METHODS.has(
      (message as AppDatabaseRequestMessage).method,
    ) &&
    Array.isArray((message as AppDatabaseRequestMessage).args) &&
    (message as AppDatabaseRequestMessage).args.length <= MAX_RPC_ARGUMENTS &&
    isBoundedRpcMessage(message)
  );
}

function isResponseMessage(
  message: unknown,
): message is AppDatabaseResponseMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as AppDatabaseResponseMessage).type === "db-response" &&
    isBoundedIdentifier((message as AppDatabaseResponseMessage).vaultId) &&
    isBoundedIdentifier((message as AppDatabaseResponseMessage).responderId) &&
    isBoundedIdentifier((message as AppDatabaseResponseMessage).requesterId) &&
    isBoundedIdentifier((message as AppDatabaseResponseMessage).requestId) &&
    typeof (message as AppDatabaseResponseMessage).success === "boolean" &&
    isBoundedRpcMessage(message)
  );
}

function createRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class BrowserCoordinatedAppDatabase implements AppDatabase {
  get kind(): AppDatabaseKind {
    return this.localDatabase?.kind ?? "turso-wasm";
  }

  get descriptor(): AppDatabaseDescriptor {
    if (this.localDatabase) return this.localDatabase.descriptor;
    if (this.remoteDescriptor) {
      return {
        ...this.remoteDescriptor,
        transport: "broadcast-proxy",
        role: "proxy",
        capabilities: {
          ...this.remoteDescriptor.capabilities,
          crossTabCoordination: true,
        },
      };
    }
    return {
      providerId: this.provider.id,
      engine: "turso",
      transport: "broadcast-proxy",
      role: "proxy",
      storageMode: "local",
      capabilities: {
        nativeFullTextSearch: false,
        vectorSearch: false,
        approximateNearestNeighbors: false,
        localEmbeddings: true,
        crossTabCoordination: true,
        sync: false,
      },
    };
  }

  private localDatabase: AppDatabase | null = null;
  private remoteDescriptor: AppDatabaseDescriptor | null = null;
  private rpcChannel: BroadcastChannel | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeoutId: ReturnType<typeof setTimeout>;
      expectedResponderId?: string;
    }
  >();
  private opened = false;
  private closed = false;
  private ownershipMonitorAbortController: AbortController | null = null;
  private promotionPromise: Promise<void> | null = null;
  private servingRequests = false;
  private coordinationModeListeners = new Set<
    (mode: BrowserCoordinatedAppDatabaseMode) => void
  >();

  constructor(
    readonly vaultId: string,
    private readonly coordinator: BrowserAppDatabaseCoordinator,
    private startsOwned: boolean,
    private readonly provider: AppDatabaseProvider = new TursoWasmAppDatabaseProvider(),
  ) {}

  get coordinationMode(): BrowserCoordinatedAppDatabaseMode {
    return this.startsOwned || this.localDatabase
      ? "turso-owner"
      : "turso-proxy";
  }

  onCoordinationModeChange(
    listener: (mode: BrowserCoordinatedAppDatabaseMode) => void,
  ): () => void {
    this.coordinationModeListeners.add(listener);
    return () => {
      this.coordinationModeListeners.delete(listener);
    };
  }

  async open(): Promise<void> {
    if (this.opened) {
      return;
    }

    this.opened = true;
    this.ensureRpcChannel();

    if (this.startsOwned) {
      await this.promoteToOwner();
      return;
    }

    this.startOwnershipMonitor();
    this.remoteDescriptor = await this.invokeRemote<AppDatabaseDescriptor>(
      "describe",
      [],
    );
  }

  async migrate(): Promise<void> {
    await this.invoke("migrate");
  }

  async close(): Promise<void> {
    this.closed = true;
    this.ownershipMonitorAbortController?.abort();
    this.ownershipMonitorAbortController = null;

    this.pendingRequests.forEach(({ reject, timeoutId }) => {
      clearTimeout(timeoutId);
      reject(new Error("Coordinated app database closed"));
    });
    this.pendingRequests.clear();

    try {
      await this.localDatabase?.close();
    } finally {
      this.localDatabase = null;
      this.rpcChannel?.close();
      this.rpcChannel = null;
      if (!this.startsOwned) {
        this.coordinator.close();
      }
    }
  }

  async beginSearchIndexingBatch(): Promise<void> {
    await this.invoke("beginSearchIndexingBatch");
  }

  async endSearchIndexingBatch(): Promise<void> {
    await this.invoke("endSearchIndexingBatch");
  }

  async configureSearchEmbeddingProvider(
    provider: SearchEmbeddingProviderConfig | null,
  ): Promise<void> {
    await this.invoke("configureSearchEmbeddingProvider", provider);
  }

  async getSearchEmbeddingProvider(): Promise<SearchEmbeddingProviderConfig | null> {
    return this.invoke<SearchEmbeddingProviderConfig | null>(
      "getSearchEmbeddingProvider",
    );
  }

  async getSearchEmbeddingRuntimeStatus(): Promise<SearchEmbeddingRuntimeStatus | null> {
    return this.invoke<SearchEmbeddingRuntimeStatus | null>(
      "getSearchEmbeddingRuntimeStatus",
    );
  }

  async getSearchIndexStats(): Promise<AppDatabaseSearchIndexStats> {
    return this.invoke<AppDatabaseSearchIndexStats>("getSearchIndexStats");
  }

  async getMeta<T = unknown>(key: string): Promise<T | undefined> {
    return this.invoke<T | undefined>("getMeta", key);
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    await this.invoke("setMeta", key, value);
  }

  async getNotebookState(
    sourcePath: string,
  ): Promise<AppDatabaseNotebookState | undefined> {
    return this.invoke<AppDatabaseNotebookState | undefined>(
      "getNotebookState",
      sourcePath,
    );
  }

  async setNotebookState(
    sourcePath: string,
    state: AppDatabaseNotebookState,
  ): Promise<void> {
    await this.invoke("setNotebookState", sourcePath, state);
  }

  async deleteNotebookState(sourcePath: string): Promise<void> {
    await this.invoke("deleteNotebookState", sourcePath);
  }

  async loadMetadataSnapshot(): Promise<MetadataCacheSnapshot | null> {
    return this.invoke<MetadataCacheSnapshot | null>("loadMetadataSnapshot");
  }

  async saveMetadataSnapshot(snapshot: MetadataCacheSnapshot): Promise<void> {
    await this.invoke("saveMetadataSnapshot", snapshot);
  }

  async getFileHistory(path: string): Promise<AppDatabaseFileHistory | null> {
    return this.invoke<AppDatabaseFileHistory | null>("getFileHistory", path);
  }

  async storeFileHistoryRevision(
    input: AppDatabaseStoreFileHistoryRevisionInput,
  ): Promise<AppDatabaseStoreFileHistoryRevisionResult> {
    return this.invoke<AppDatabaseStoreFileHistoryRevisionResult>(
      "storeFileHistoryRevision",
      input,
    );
  }

  async listNotifications(): Promise<AppDatabaseNotificationRecord[]> {
    return this.invoke<AppDatabaseNotificationRecord[]>("listNotifications");
  }

  async upsertNotification(
    record: AppDatabaseNotificationRecord,
  ): Promise<void> {
    await this.invoke("upsertNotification", record);
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.invoke("markNotificationRead", id);
  }

  async clearNotification(id: string): Promise<void> {
    await this.invoke("clearNotification", id);
  }

  async clearAllNotifications(): Promise<void> {
    await this.invoke("clearAllNotifications");
  }

  async upsertIndexedFile(record: AppDatabaseIndexedFile): Promise<void> {
    await this.invoke("upsertIndexedFile", record);
  }

  async deleteIndexedFile(path: string): Promise<void> {
    await this.invoke("deleteIndexedFile", path);
  }

  async renameIndexedFile(oldPath: string, newPath: string): Promise<void> {
    await this.invoke("renameIndexedFile", oldPath, newPath);
  }

  async queryIndexedMetadata(
    query: AppDatabaseIndexedMetadataQuery = {},
  ): Promise<AppDatabaseIndexedMetadataRow[]> {
    return this.invoke<AppDatabaseIndexedMetadataRow[]>(
      "queryIndexedMetadata",
      query,
    );
  }

  async upsertSearchDocument(document: SearchDocumentRecord): Promise<void> {
    await this.invoke("upsertSearchDocument", document);
  }

  async deleteSearchDocument(path: string): Promise<void> {
    await this.invoke("deleteSearchDocument", path);
  }

  async getSearchDocument(
    path: string,
  ): Promise<SearchDocumentRecord | undefined> {
    return this.invoke<SearchDocumentRecord | undefined>(
      "getSearchDocument",
      path,
    );
  }

  async listSearchDocuments(): Promise<SearchDocumentRecord[]> {
    return this.invoke<SearchDocumentRecord[]>("listSearchDocuments");
  }

  async rebuildSearchIndex(): Promise<void> {
    await this.invoke("rebuildSearchIndex");
  }

  async searchDocuments(
    query: string,
    options?: AppDatabaseSearchOptions,
  ): Promise<AppDatabaseSearchResult[]> {
    return this.invoke<AppDatabaseSearchResult[]>(
      "searchDocuments",
      query,
      options,
    );
  }

  private async invoke<T>(
    method: AppDatabaseMethod,
    ...args: unknown[]
  ): Promise<T> {
    if (!this.opened) {
      await this.open();
    }

    if (this.localDatabase) {
      return (
        this.localDatabase[method] as (...params: unknown[]) => Promise<T>
      )(...args);
    }

    return this.invokeRemote<T>(method, args);
  }

  private ensureRpcChannel(): void {
    if (this.rpcChannel || typeof BroadcastChannel === "undefined") {
      return;
    }

    this.rpcChannel = new BroadcastChannel(this.coordinator.rpcChannelName);
    this.rpcChannel.addEventListener("message", (event) => {
      const message = event.data as AppDatabaseMessage | undefined;
      if (
        !message ||
        (message as { vaultId?: string }).vaultId !== this.vaultId
      ) {
        return;
      }

      if (isResponseMessage(message)) {
        if (message.requesterId !== this.coordinator.tabId) {
          return;
        }
        const pending = this.pendingRequests.get(message.requestId);
        if (!pending) {
          return;
        }
        if (
          pending.expectedResponderId &&
          message.responderId !== pending.expectedResponderId
        ) {
          return;
        }
        clearTimeout(pending.timeoutId);
        this.pendingRequests.delete(message.requestId);
        if (message.success) {
          pending.resolve(message.result);
        } else {
          pending.reject(
            new Error(message.error ?? "Remote app database request failed"),
          );
        }
        return;
      }

      if (!isRequestMessage(message)) {
        return;
      }

      if (!this.localDatabase || !this.servingRequests) {
        return;
      }

      if (message.ownerId && message.ownerId !== this.coordinator.ownerId) {
        return;
      }

      void this.handleRemoteRequest(message);
    });
  }

  private async invokeRemote<T>(
    method: AppDatabaseRpcMethod,
    args: unknown[],
  ): Promise<T> {
    if (!this.rpcChannel) {
      throw new Error(
        "BroadcastChannel is unavailable for app database delegation",
      );
    }

    const requestId = createRequestId();
    const message: AppDatabaseRequestMessage = {
      type: "db-request",
      vaultId: this.vaultId,
      ownerId: this.coordinator.observedOwnerId ?? undefined,
      requesterId: this.coordinator.tabId,
      requestId,
      method,
      args,
    };

    return new Promise<T>((resolve, reject) => {
      let settled = false;
      let recovering = false;

      const settleResolve = (value: T) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        clearInterval(recoveryIntervalId);
        this.pendingRequests.delete(requestId);
        resolve(value);
      };

      const settleReject = (error: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        clearInterval(recoveryIntervalId);
        this.pendingRequests.delete(requestId);
        reject(error);
      };

      const timeoutId = setTimeout(() => {
        settleReject(
          new Error(`Remote app database request timed out: ${method}`),
        );
      }, REQUEST_TIMEOUT_MS);

      const tryRecoverLocally = async () => {
        if (settled || recovering || !this.localDatabase) {
          return;
        }

        recovering = true;
        try {
          const result =
            method === "describe"
              ? (this.localDatabase.descriptor as T)
              : await (
                  this.localDatabase[method] as (
                    ...params: unknown[]
                  ) => Promise<T>
                )(...args);
          settleResolve(result);
        } catch (error) {
          settleReject(
            error instanceof Error ? error : new Error(String(error)),
          );
        } finally {
          recovering = false;
        }
      };

      const recoveryIntervalId = setInterval(() => {
        void tryRecoverLocally();
      }, LOCAL_RECOVERY_POLL_MS);

      this.pendingRequests.set(requestId, {
        resolve: (value) => settleResolve(value as T),
        reject: settleReject,
        timeoutId,
        expectedResponderId: message.ownerId,
      });
      this.rpcChannel!.postMessage(message);
      void tryRecoverLocally();
    });
  }

  private async handleRemoteRequest(
    message: AppDatabaseRequestMessage,
  ): Promise<void> {
    let response: AppDatabaseResponseMessage;

    try {
      const result =
        message.method === "describe"
          ? this.localDatabase!.descriptor
          : await (
              this.localDatabase![message.method] as (
                ...args: unknown[]
              ) => Promise<unknown>
            )(...message.args);
      response = {
        type: "db-response",
        vaultId: this.vaultId,
        responderId: this.coordinator.ownerId,
        requesterId: message.requesterId,
        requestId: message.requestId,
        success: true,
        result,
      };
    } catch (error) {
      response = {
        type: "db-response",
        vaultId: this.vaultId,
        responderId: this.coordinator.ownerId,
        requesterId: message.requesterId,
        requestId: message.requestId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    if (!isBoundedRpcMessage(response)) {
      response = {
        type: "db-response",
        vaultId: this.vaultId,
        responderId: this.coordinator.ownerId,
        requesterId: message.requesterId,
        requestId: message.requestId,
        success: false,
        error: "App database response exceeded the cross-tab payload limit",
      };
    }

    this.rpcChannel?.postMessage(response);
  }

  private startOwnershipMonitor(): void {
    if (this.ownershipMonitorAbortController || this.closed) {
      return;
    }

    this.ownershipMonitorAbortController = new AbortController();
    void this.coordinator
      .waitForOwnership({ signal: this.ownershipMonitorAbortController.signal })
      .then((acquired) => {
        if (!acquired || this.closed) {
          return;
        }
        return this.promoteToOwner();
      })
      .catch(() => {
        // Request callers surface operational failures. The monitor only promotes ownership.
      });
  }

  private async promoteToOwner(): Promise<void> {
    if (this.localDatabase) {
      this.servingRequests = true;
      return;
    }

    if (this.promotionPromise) {
      await this.promotionPromise;
      return;
    }

    this.promotionPromise = (async () => {
      const previousMode = this.coordinationMode;
      const database = await this.openLocalDatabase();
      this.localDatabase = database;
      this.startsOwned = true;
      this.coordinator.startHeartbeat();
      this.servingRequests = true;
      if (previousMode !== this.coordinationMode) {
        this.notifyCoordinationModeChange();
      }
    })();

    try {
      await this.promotionPromise;
    } finally {
      this.promotionPromise = null;
    }
  }

  private async openLocalDatabase(): Promise<AppDatabase> {
    return this.provider.open({
      vaultId: this.vaultId,
      runtime: "web-pwa",
      role: "owner",
    });
  }

  private notifyCoordinationModeChange(): void {
    const mode = this.coordinationMode;
    for (const listener of this.coordinationModeListeners) {
      listener(mode);
    }
  }
}
