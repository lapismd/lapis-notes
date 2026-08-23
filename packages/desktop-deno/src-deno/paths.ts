export function makeFsError(
  code: string,
  target: string,
): Error & { code: string } {
  return Object.assign(new Error(`${code}: ${target}`), { code });
}

/** Match Electron: existing directories are a no-op; a file at the path is EEXIST. */
export function mkdirWhenPathExists(
  existing: { isDirectory: boolean } | null,
): "skip" | "eexist" | "create" {
  if (!existing) return "create";
  return existing.isDirectory ? "skip" : "eexist";
}

export function normalizeSeparators(value: string): string {
  return value.replace(/\\/g, "/");
}

export function normalizeRootPath(rootPath: string): string {
  return rootPath.replace(/[\\/]+$/, "");
}

export function normalizeVaultPath(vaultPath: string): string {
  const candidate = normalizeSeparators(vaultPath.trim());
  if (!candidate || candidate === "/") return "";
  if (candidate.startsWith("/")) throw makeFsError("EINVAL", vaultPath);
  const parts: string[] = [];
  for (const part of candidate.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") throw makeFsError("EINVAL", vaultPath);
    parts.push(part);
  }
  return parts.join("/");
}

export function resolveAbsolutePath(
  rootPath: string,
  normalizedPath: string,
): string {
  if (!rootPath.startsWith("/")) throw makeFsError("EINVAL", rootPath);
  const base = normalizeRootPath(rootPath);
  const relativePath = normalizeVaultPath(normalizedPath);
  if (!relativePath) return base;
  const absolutePath = `${base}/${relativePath}`;
  if (absolutePath !== base && !absolutePath.startsWith(`${base}/`)) {
    throw makeFsError("EINVAL", normalizedPath);
  }
  return absolutePath;
}

export function toVaultRelativePath(
  rootPath: string,
  absolutePath: string,
): string | null {
  const root = normalizeRootPath(rootPath);
  const target = normalizeRootPath(absolutePath);
  if (target === root) return "/";
  if (!target.startsWith(`${root}/`)) return null;
  return target.slice(root.length + 1);
}

export function basename(value: string): string {
  const normalized = normalizeSeparators(value).replace(/\/+$/, "");
  const index = normalized.lastIndexOf("/");
  return index === -1 ? normalized : normalized.slice(index + 1);
}
