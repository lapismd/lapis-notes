import type { DataAdapter } from "./fs";
import { joinPath, normalizePath } from "./path";

/**
 * Installed plugin assets are not user content; direct adapter access is
 * unchanged.
 */
export function isVaultContent(path: string, configDir: string): boolean {
  const relative = normalizePath(path).replace(/^\/+|\/+$/gu, "");
  const state = normalizePath(configDir).replace(/^\/+|\/+$/gu, "");
  const config = state ? `${state}/plugins` : "";
  return !config || (relative !== config && !relative.startsWith(`${config}/`));
}

/** Retain native capabilities while constraining fallback polling discovery. */
export function vaultContentAdapter(
  adapter: DataAdapter,
  configDir: () => string,
): DataAdapter {
  return new Proxy(adapter, {
    get(target, property) {
      if (property === "list")
        return async (path: string) => {
          if (!isVaultContent(path, configDir()))
            return { files: [], folders: [] };
          const listing = await target.list(path);
          const include = (entry: string) => {
            if (
              !entry ||
              entry === "." ||
              entry === ".." ||
              /[/\\\0]/u.test(entry)
            )
              throw Error("Invalid vault snapshot child path");
            return isVaultContent(joinPath(path, entry), configDir());
          };
          return {
            files: listing.files.filter(include),
            folders: listing.folders.filter(include),
          };
        };
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
