import type {
  DataAdapter,
  NativeWatchAdapter,
  ChangeEvent,
  WatchErrorEvent,
} from "./fs";
import { joinPath, normalizePath } from "./path";

/**
 * Installed plugin assets are not user content; direct adapter access is
 * unchanged.
 */
export function isVaultContent(
  path: string,
  configDir: string,
  scope: "discovery" | "watch" = "discovery",
): boolean {
  const relative = normalizePath(path).replace(/^\/+|\/+$/gu, "");
  const state = normalizePath(configDir).replace(/^\/+|\/+$/gu, "");
  const excluded = !state
    ? []
    : scope === "watch"
      ? [state]
      : [`${state}/plugins`, `${state}/plugin-registry-cache`];
  return excluded.every(
    (config) => relative !== config && !relative.startsWith(`${config}/`),
  );
}

/** Retain native capabilities while constraining fallback polling discovery. */
export function vaultContentAdapter(
  adapter: DataAdapter,
  configDir: () => string,
  scope: "discovery" | "watch" = "discovery",
): DataAdapter {
  return new Proxy(adapter, {
    get(target, property) {
      if (property === "watch" && scope === "watch") {
        const native = target as DataAdapter & Partial<NativeWatchAdapter>;
        if (!native.watch) return undefined;
        return (
          path: string | string[],
          options: Parameters<NativeWatchAdapter["watch"]>[1],
          accept: (event: ChangeEvent | WatchErrorEvent) => void,
        ) => {
          const roots = (Array.isArray(path) ? path : [path]).map((p) =>
            normalizePath(p).replace(/^\/+|\/+$/gu, ""),
          );
          const included = (p: string) =>
            isVaultContent(p, configDir(), scope) ||
            (!options.recursive &&
              roots.includes(normalizePath(p).replace(/^\/+|\/+$/gu, "")));
          return native.watch!(path, options, (event) => {
            if (event.type === "error") {
              accept(event);
              return;
            }
            const current = included(event.path);
            const previous =
              event.previousPath !== undefined && included(event.previousPath);
            if (current && (!event.previousPath || previous)) accept(event);
            else if (current) accept({ type: "create", path: event.path });
            else if (previous)
              accept({ type: "delete", path: event.previousPath! });
          });
        };
      }
      if (property === "list")
        return async (path: string) => {
          if (!isVaultContent(path, configDir(), scope))
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
            return isVaultContent(joinPath(path, entry), configDir(), scope);
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
