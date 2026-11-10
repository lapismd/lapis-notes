import type { DataAdapter } from "./storage/fs";
import { dirname, joinPath, normalizePath } from "./storage/path";
import { scanPluginDependencySpecifiers } from "./plugin-dependency-scanner";

/** Startup diagnostics follow eager ESM imports without preloading lazy assets. */
export async function readPluginEntrySources(
  adapter: Pick<DataAdapter, "read">,
  pluginPath: string,
  entry: string,
): Promise<Map<string, string>> {
  const root = normalizePath(pluginPath).replace(/\/$/u, "");
  const sources = new Map<string, string>();
  const pending = [normalizePath(joinPath(root, entry))];
  let bytes = 0;
  while (pending.length) {
    const path = pending.pop()!;
    if (sources.has(path)) continue;
    if (!path.startsWith(`${root}/`))
      throw Error("Plugin import escapes its root");
    if (sources.size >= 256)
      throw Error("Plugin eager module graph exceeds limit");
    const source = await adapter.read(path);
    bytes += new TextEncoder().encode(source).byteLength;
    if (bytes > 16 * 1024 * 1024)
      throw Error("Plugin eager source bytes exceed limit");
    sources.set(path, source);
    for (const { kind, specifier } of scanPluginDependencySpecifiers(source)) {
      if (
        (kind === "static-import" || kind === "export") &&
        specifier.startsWith(".")
      )
        pending.push(
          normalizePath(joinPath(dirname(path), specifier.split(/[?#]/u)[0]!)),
        );
    }
  }
  return sources;
}
