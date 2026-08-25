export const DESKTOP_APP_DATABASE_METHODS = [
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
  "getChangeRevision",
  "upsertIndexedFile",
  "getIndexedFile",
  "listIndexedFileManifest",
  "queryIndexedMetadata",
  "queryIndexedMetadataPage",
  "queryMetadataFacets",
  "queryMetadataLinks",
  "deleteIndexedFile",
  "renameIndexedFile",
  "upsertSearchDocument",
  "deleteSearchDocument",
  "getSearchDocument",
  "listSearchDocumentManifest",
  "listSearchDocuments",
  "rebuildSearchIndex",
  "searchDocuments",
  "searchDocumentPaths",
  "upsertTaskProjection",
  "deleteTaskProjection",
  "queryTasks",
  "getTaskRow",
  "listChildLinks",
  "listTaskDescendants",
  "registerProjectionDefinition",
  "unregisterProjectionDefinition",
  "replaceProjectionSource",
  "markProjectionSourceError",
  "deleteProjectionSource",
  "queryProjection",
  "getProjectionRow",
  "queryRelated",
] as const;

export type DesktopAppDatabaseMethod =
  (typeof DESKTOP_APP_DATABASE_METHODS)[number];

const DESKTOP_APP_DATABASE_METHOD_SET = new Set<string>(
  DESKTOP_APP_DATABASE_METHODS,
);

export function isDesktopAppDatabaseMethod(
  value: unknown,
): value is DesktopAppDatabaseMethod {
  return (
    typeof value === "string" && DESKTOP_APP_DATABASE_METHOD_SET.has(value)
  );
}
