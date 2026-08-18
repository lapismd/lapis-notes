export const HIDDEN_FILE_TOOL_SEGMENTS = new Set([
  ".obsidian",
  ".lapis",
  ".trash",
]);

export const MAX_WRITE_BYTES = 256 * 1024;

export function isAllowedFileToolPath(path: string): boolean {
  return !path
    .split("/")
    .some((segment) => HIDDEN_FILE_TOOL_SEGMENTS.has(segment));
}

export function parentDirectory(path: string): string | null {
  const index = path.lastIndexOf("/");
  if (index <= 0) return null;
  return path.slice(0, index);
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function assertTextContent(content: string, path: string): void {
  if (content.includes("\0")) {
    throw new Error(`${path} is not a UTF-8 text file.`);
  }
}

export function assertPayloadSize(content: string, label: string): void {
  if (byteLength(content) > MAX_WRITE_BYTES) {
    throw new Error(`${label} exceeds the size limit.`);
  }
}

export function revisionFromStat(
  stat: { mtime: number; size: number } | null,
): { mtime: number; size: number } | null {
  return stat ? { mtime: stat.mtime, size: stat.size } : null;
}
