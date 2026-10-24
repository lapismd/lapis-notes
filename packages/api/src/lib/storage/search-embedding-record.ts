import type { SearchDocumentRecord } from "./app-database";
import type { SearchEmbeddingProviderConfig } from "./search-embedding-provider";

export function rebindSearchDocument(
  document: SearchDocumentRecord,
  config: SearchEmbeddingProviderConfig | null,
): SearchDocumentRecord {
  const copy = JSON.parse(JSON.stringify(document)) as SearchDocumentRecord;
  if (!config || !copy.chunks?.length) return copy;
  copy.chunks = copy.chunks.map((chunk) =>
    chunk.text.trim().length
      ? {
          ...chunk,
          embedding: {
            status: "pending",
            modelId: config.modelId ?? "lapis/token-hash-v0",
            modelVersion: config.modelVersion,
            dimensions: config.dimensions,
            dirty: true,
          },
        }
      : chunk,
  );
  return copy;
}
