export const SYNC_LOCAL_CHUNK_BYTES = 256 * 1024;
export const SYNC_LOCAL_WIRE_CHARS = 512 * 1024;
export const SYNC_LOCAL_OPERATIONS = [
  "captureStart",
  "capturePage",
  "captureClose",
  "fileRead",
  "blobRead",
  "stateRead",
  "readChunk",
  "readClose",
  "blobHas",
  "uploadStart",
  "uploadChunk",
  "uploadFinish",
  "uploadClose",
  "mutate",
  "receipt",
] as const;
export type SyncLocalOperation = (typeof SYNC_LOCAL_OPERATIONS)[number];
export function isSyncLocalOperation(
  value: unknown,
): value is SyncLocalOperation {
  return (
    typeof value === "string" &&
    (SYNC_LOCAL_OPERATIONS as readonly string[]).includes(value)
  );
}
