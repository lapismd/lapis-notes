import path from "node:path";

export function makeFsError(code: string, target: string): Error & { code: string } {
  return Object.assign(new Error(`${code}: ${target}`), { code });
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
  if (path.posix.isAbsolute(candidate)) throw makeFsError("EINVAL", vaultPath);
  const normalized = path.posix.normalize(candidate).replace(/\/+$/, "");
  if (normalized === ".." || normalized.startsWith("../")) {
    throw makeFsError("EINVAL", vaultPath);
  }
  return normalized;
}

export function resolveAbsolutePath(
  rootPath: string,
  normalizedPath: string,
): string {
  if (!path.isAbsolute(rootPath)) throw makeFsError("EINVAL", rootPath);
  const pathModule = rootPath.includes("\\") ? path.win32 : path;
  const base = pathModule.resolve(normalizeRootPath(rootPath));
  const relativePath = normalizeVaultPath(normalizedPath);
  if (!relativePath) return base;
  const absolutePath = pathModule.resolve(base, ...relativePath.split("/"));
  if (
    absolutePath !== base &&
    !absolutePath.startsWith(`${base}${pathModule.sep}`)
  ) {
    throw makeFsError("EINVAL", normalizedPath);
  }
  return absolutePath;
}
