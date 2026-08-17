import { extractMetadata } from "./extract-metadata";

export type MetadataWorkerRequest = {
  id: string;
  data: string;
};

export type MetadataWorkerResponse = {
  id: string;
  cache: ReturnType<typeof extractMetadata>;
};

export function handleMetadataWorkerMessage(
  payload: unknown,
): MetadataWorkerResponse | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const { id, data } = payload as Partial<MetadataWorkerRequest>;
  if (typeof id !== "string" || typeof data !== "string") {
    return null;
  }
  return {
    id,
    cache: extractMetadata(data),
  };
}
