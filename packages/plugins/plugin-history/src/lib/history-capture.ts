export function shouldReplaceLatestModify(
  eventType: string,
  latestEventType: string | undefined,
  lastModifyStoredAt: number | undefined,
  mergeWindowMs: number,
  now = Date.now(),
): boolean {
  return (
    eventType === "modify" &&
    latestEventType === "modify" &&
    lastModifyStoredAt != null &&
    now - lastModifyStoredAt < mergeWindowMs
  );
}

export function consumeSuppressedHash(
  suppressed: Map<string, string>,
  path: string,
  contentHash: string,
): boolean {
  if (suppressed.get(path) !== contentHash) return false;
  suppressed.delete(path);
  return true;
}

export function historyIdentityStoreInput(
  eventType: "rename" | "delete",
  path: string,
  previousPath?: string,
): {
  path: string;
  previousPath?: string;
  eventType: "rename" | "delete";
} {
  return {
    path,
    eventType,
    ...(eventType === "rename" && previousPath
      ? { previousPath }
      : {}),
  };
}
